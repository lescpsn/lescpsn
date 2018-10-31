// This file "logger.go" is created by Lincan Li at 12/3/15.
// Copyright © 2015 - Lincan Li. All rights reserved

package log

import (
	log "github.com/Sirupsen/logrus"
	//	"github.com/weekface/mgorus"
	"database/sql/driver"
	"fmt"
	"github.com/satori/go.uuid"
	"reflect"
	"regexp"
	"time"
)

type MeanLogger struct {
	RequestID uuid.UUID
}

type LogEntry struct {
	*log.Entry
}

func NewMeanLogger() *MeanLogger {
	return &MeanLogger{
		RequestID: uuid.NewV4(),
	}
}

var sqlRegexp = regexp.MustCompile(`(\$\d+)|\?`)

func (l *MeanLogger) Print(values ...interface{}) {
	level := values[0]
	currentTime := "\n\033[33m[" + time.Now().Format("2006-01-02 15:04:05") + "]\033[0m"
	source := fmt.Sprintf("\033[35m(%v)\033[0m", values[1])
	messages := []interface{}{source, currentTime}

	if level == "sql" {
		// duration
		messages = append(messages, fmt.Sprintf(" \033[36;1m[%.2fms]\033[0m ", float64(values[2].(time.Duration).Nanoseconds()/1e4)/100.0))
		// sql
		var formatedValues []interface{}
		for _, value := range values[4].([]interface{}) {
			indirectValue := reflect.Indirect(reflect.ValueOf(value))
			if indirectValue.IsValid() {
				value = indirectValue.Interface()
				if t, ok := value.(time.Time); ok {
					formatedValues = append(formatedValues, fmt.Sprintf("'%v'", t.Format(time.RFC3339)))
				} else if b, ok := value.([]byte); ok {
					formatedValues = append(formatedValues, fmt.Sprintf("'%v'", string(b)))
				} else if r, ok := value.(driver.Valuer); ok {
					if value, err := r.Value(); err == nil && value != nil {
						formatedValues = append(formatedValues, fmt.Sprintf("'%v'", value))
					} else {
						formatedValues = append(formatedValues, "NULL")
					}
				} else {
					formatedValues = append(formatedValues, fmt.Sprintf("'%v'", value))
				}
			} else {
				formatedValues = append(formatedValues, fmt.Sprintf("'%v'", value))
			}
		}
		messages = append(messages, fmt.Sprintf(sqlRegexp.ReplaceAllString(values[3].(string), "%v"), formatedValues...))
	} else {
		messages = append(messages, "\033[31;1m")
		messages = append(messages, values[2:]...)
		messages = append(messages, "\033[0m")
	}

	logType := values[0]

	entry := l.WithFields(log.Fields{
		"module": "gorm",
		"type":   logType,
	})

	entry.Println(messages)
}

func (l *MeanLogger) Println(v ...interface{}) {

}

func (l *MeanLogger) WithFields(fields log.Fields) *LogEntry {
	fields["request-id"] = l.RequestID
	entry := log.WithFields(fields)
	return &LogEntry{entry}
}

func NewLogger() *MeanLogger {
	//	hooker, err := mgorus.NewHooker("localhost:27017", "db", "collection")
	//
	//	if err != nil {
	//		return nil, err
	//	}
	//
	//	log.AddHook(hooker)

	return NewMeanLogger()
}
