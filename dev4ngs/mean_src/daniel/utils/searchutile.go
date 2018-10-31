package utils

import (
	"fmt"
	. "git.ngs.tech/mean/proto"
	"gopkg.in/olivere/elastic.v3"
	"qiniupkg.com/x/errors.v7"
	"reflect"
	"strings"
	"time"
)

type ModelIndex interface {
	SetIndexForSearch() *string
}

var searchClient *elastic.Client
var searchUrl string

func getSearchClient() *elastic.Client {

	if searchClient == nil {

		if len(strings.TrimSpace(searchUrl)) == 0 {
			panic(errors.New("The Elastic server address is requied ,pls check it !"))
		}

		host := searchUrl

		// Create a client
		c, err := elastic.NewClient(elastic.SetURL(host))
		if err != nil {
			panic(err)
		}
		searchClient = c
	}

	return searchClient
}

func SetSearchUrl(sUrl string) {

	searchUrl = sUrl

}

/*
usr:=dream.User{
	TusoId:dream.String("123456"),
	Email:dream.String("hu@123.com"),
	Gender:dream.UserGenderMale,
	Status:dream.UserStatusDeactivated,
	Nickname:dream.String("Jermine"),
	RealName:dream.String("Jermine Hu"),
	PhoneNumber:dream.String("18994099688"),
	Birthday:time.Now(),
}
 err:=dream.UpsertIndex("mean1","users","3",usr,[]string{"TusoId","Email","Gender","Status","Nickname","RealName","PhoneNumber","Birthday"})
*/
//UpsertIndex 修改或者插入文档到索引的方法
func UpsertIndex(docIndex string, docType string, docId string, obj interface{}, fileds []string) error {

	// Add a document to the index
	result := make(map[string]interface{})
	immutable := reflect.ValueOf(obj)

	fmt.Println(docIndex, docType, docId)

	if fileds == nil || len(fileds) == 0 {

		t := reflect.TypeOf(obj)

		for i := 0; i < t.NumField(); i++ {

			fileds = append(fileds, t.Field(i).Name)

		}

	}

	for _, filed := range fileds {
		valueType := reflect.TypeOf(immutable.FieldByName(filed).Interface())
		switch valueType {
		case reflect.TypeOf(StringType{}):
			result[filed] = immutable.FieldByName(filed).Field(0).Field(0).String()
			break
		case reflect.TypeOf(IntegerType{}):
			result[filed] = immutable.FieldByName(filed).Field(0).Field(0).Int()
			break
		case reflect.TypeOf(BooleanType{}):
			result[filed] = immutable.FieldByName(filed).Field(0).Field(0).Bool()
			break
		case reflect.TypeOf(Gender_user_gender_female), reflect.TypeOf(Status_user_status_activated):
			result[filed] = immutable.FieldByName(filed).Int()
			break
		case reflect.TypeOf(time.Time{}):
			t := time.Now()
			reflect.ValueOf(&t).Elem().Set(immutable.FieldByName(filed))
			result[filed] = t.Format(time.RFC3339)
			break
		default:
			result[filed] = immutable.FieldByName(filed)
			break
		}

	}

	_, err := getSearchClient().Index().
		Index(docIndex).
		Type(docType).
		Id(docId).BodyJson(result).
		Do()

	if err != nil {

		return err
	}

	return nil

}

//DeleteDocumentByID
func DeleteDocumentByID(docIndex string, docType string, docID string) error {
	_, err := getSearchClient().Delete().Index(docIndex).Type(docType).Id(docID).Do()
	if err != nil {
		return err
	}
	return nil
}

//DeleteIndex
func DeleteIndex(docIndex string) error {
	_, err := getSearchClient().DeleteIndex(docIndex).Do()
	if err != nil {
		// Handle error
		return err
	}

	return nil
}

//SearchData pageIndex 从1开始
func SearchData(docIndex string, docType string, query elastic.Query, pageIndex, pageSize int32) (*elastic.SearchResult, error) {
	if pageIndex <= 0 {
		pageIndex = 1
	}

	searchResult, err := getSearchClient().Search().
		Index(docIndex). // search in index "docIndex"
		Type(docType).
		Query(query). // specify the query
		//Sort("email", true).// sort by "email" field, ascending
		From(int(pageIndex - 1)).Size(int(pageSize)). // take documents 0-9 因为索引从0开始,所以要减掉1
		//Pretty(true).// pretty print request and response JSON
		Do() // execute

	if err != nil {
		// Handle error
		return nil, err
	}
	// searchResult is of type SearchResult and returns hits, suggestions,
	// and all kinds of other information from Elasticsearch.
	fmt.Printf("Query took %d milliseconds\n", searchResult.TookInMillis)

	fmt.Println(docIndex, docType, pageIndex, pageSize)

	return searchResult, nil

}
