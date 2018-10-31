package utils

import (
	"time"

	"github.com/satori/go.uuid"
)

func Str2UUID(a string) uuid.UUID {
	return uuid.FromStringOrNil(a)
}

func Strs2UUIDs(as []string) []uuid.UUID {
	us := make([]uuid.UUID, len(as))

	for k, v := range as {
		us[k] = uuid.FromStringOrNil(v)
	}
	return us
}

func UUIDs2Strs(us []uuid.UUID) []string {
	ss := make([]string, len(us))

	for k, v := range us {
		ss[k] = v.String()
	}
	return ss
}

func Str2Time(ts string) time.Time {
	t, err := time.Parse(time.RFC3339, ts)
	if err != nil {
		return time.Time{}
	}
	return t
}

func Time2Str(t time.Time) string {
	if t == (time.Time{}) || t.IsZero() {
		return ""
	}

	ts := t.Format(time.RFC3339)
	return ts
}
