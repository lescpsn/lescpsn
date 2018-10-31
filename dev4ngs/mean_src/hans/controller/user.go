// This file "user.go" is created by Lincan Li at 11/15/2015
// Copyright Negative Space Tech LLC. All rights reserved.

// Package models provides data model definition in Tuso project
package controller

import (
	"git.ngs.tech/mean/daniel/utils"
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"gopkg.in/olivere/elastic.v3"
	"reflect"
)

//SearchDataForUsers method : 搜索用户的相关信息
func SearchDataForUsers(DB *gorm.DB, docIndex string, keywords string, pageIndex, pageSize int32) (userPageList *PageModel, err error) {

	query := elastic.NewBoolQuery()
	n := User{}
	query.
		Should(elastic.NewMatchQuery("PhoneNumber", keywords)).
		Should(elastic.NewMatchQuery("RealName", keywords)).
		Should(elastic.NewMatchQuery("Nickname", keywords)).
		Should(elastic.NewMatchQuery("TusoId", keywords)).
		Should(elastic.NewMatchQuery("Email", keywords))

	sResult, err := utils.SearchData(docIndex, reflect.TypeOf(n).Name(), query, pageIndex, pageSize)

	if err != nil {
		return nil, err
	}

	if sResult == nil {
		return nil, nil
	}

	if sResult.Hits.TotalHits > 0 {

		uuids := []uuid.UUID{}
		// Iterate through results
		for _, hit := range sResult.Hits.Hits {

			uuids = append(uuids, uuid.FromStringOrNil(hit.Id))

		}

		pd := PageModel{}
		//_, err := FindUserByUUIDs(DB, uuids)

		//pd.Data = us
		pd.TotalCount = sResult.Hits.TotalHits
		pd.PageSize = pageSize
		pd.PageIndex = pageIndex

		if err != nil {

			return nil, err
		}

		return &pd, nil

	}
	return nil, nil

}

//TODO SearchDataForUsers 需要补完
func (m *MeanController) SearchDataForUsers(keywords string, pageIndex, pageSize int) (userPageList *PageModel, err error) {

	//tuRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
	//	UUID: UUID.GetString(),
	//})
	//uData, err := DCenter.SearchDataForUsers(keywords, pageIndex, pageSize)
	//if err != nil {
	//	return nil, err
	//}
	//if uData == nil || uData.Data == nil {
	//	return nil, UserNotFoundErr
	//}
	//
	//usersData := []Dungeons{}
	//ulist := (uData.Data).(*[]interface{})
	//
	//for _, userGetInt()erface := range *ulist {
	//	user := userGetInt()erface.(*User)
	//	uData, err := user.ToData(&UserDataOption{FillSensitive: false})
	//	if err != nil {
	//		return nil, err
	//	}
	//	usersData = append(usersData, uData)
	//}
	//upd := PageModel{}
	//upd.PageSize = uData.PageSize
	//upd.PageIndex = uData.PageIndex
	//upd.TotalCount = uData.TotalCount
	//upd.Data = uData
	//return &upd, nil

	return nil, nil
}
