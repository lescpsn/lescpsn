// This file "user.go" is created by Lincan Li at 11/15/2015
// Copyright Negative Space Tech LLC. All rights reserved.

// Package models provides data model definition in Tuso project
package huston

import (
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

// NewDiary 方法: 创建日记
func (m *MeanController) NewDiary(d *Diary) (Dungeons, error) {
	//fmt.Println("*********************insert diary:test")
	//dyt := Diary{}
	//m.InsertDiaryMixPhoto(m.NewDiarymixphotoByDiary(&dyt))
	//dy, err := DCenter.NewDiary(d)

	rsp, err := Cl.NewDiary(context.TODO(), &PostDiaryRequest{
		Diary: d,
	})
	dy := rsp.Diary
	if err != nil {
		return nil, err
	}
	dData, err := DiaryToData(dy, false)
	if err != nil {
		return nil, err
	}

	m.InsertDiaryMixPhoto(m.NewDiarymixphotoByDiary(dy))
	return dData, nil
}

// UpdateDiaryByID 方法: 根据id更新日记
func (m *MeanController) UpdateDiaryByID(ID int64, d *Diary) (Dungeons, error) {

	drsp, err := Cl.GetDiaryByID(context.TODO(), &GetByIDRequest{
		Id: ID,
	})

	if drsp.Null {
		return nil, DiaryNotFoundErr
	}

	if m.User.UUID != drsp.Diary.UserUUID {
		return nil, InsufficientPermissionsErr
	}
	d.UUID = drsp.Diary.UUID
	d.UserUUID = drsp.Diary.UserUUID
	d.DiaryStatus = drsp.Diary.DiaryStatus
	d.Content = drsp.Diary.Content

	rsp, err := Cl.UpdateDiaryByID(context.TODO(), &DiaryByIDRequest{
		Id:    ID,
		Diary: d,
	})
	dy := rsp.Diary
	if err != nil {
		return nil, err
	}
	dData, err := DiaryToData(dy, false)
	if err != nil {
		return nil, err
	}

	//添加修改日志隐私状态
	m.UpdateDiaryMixPhoto4Diary(ID, dy)
	return dData, nil
}

// PatchDiaryByID 方法: 根据id更新日记的部分信息
func (m *MeanController) PatchDiaryByID(ID int64, d *Diary) (Dungeons, error) {

	drsp, err := Cl.GetDiaryByID(context.TODO(), &GetByIDRequest{
		Id: ID,
	})

	if drsp.Null {
		return nil, DiaryNotFoundErr
	}

	if m.User.UUID != drsp.Diary.UserUUID {
		return nil, InsufficientPermissionsErr

	}
	d.UUID = drsp.Diary.UUID
	d.UserUUID = drsp.Diary.UserUUID
	d.DiaryStatus = drsp.Diary.DiaryStatus
	d.Content = drsp.Diary.Content

	rsp, err := Cl.PatchDiaryByID(context.TODO(), &DiaryByIDRequest{
		Id:    ID,
		Diary: d,
	})
	dy := rsp.Diary
	if err != nil {
		return nil, err
	}
	dData, err := DiaryToData(dy, false)
	if err != nil {
		return nil, err
	}

	//添加修改日志隐私状态
	m.UpdateDiaryMixPhoto4Diary(ID, dy)
	return dData, nil
}

// DeleteDiaryByID 方法: 根据id删除日记
func (m *MeanController) DeleteDiaryByID(ID int64) (Dungeons, error) {

	rsp, err := Cl.DeleteDiaryByID(context.TODO(), &GetByIDRequest{
		Id: ID,
	})
	dy := rsp.Diary
	if err != nil {
		return nil, err
	}
	dData, err := DiaryToData(dy, false)
	if err != nil {
		return nil, err
	}
	m.DelDiaryMixPhotoByID(ID, DataTypeDiary)

	return dData, nil
}

// DeleteDiaryByUUID 方法: 根据uuid删除日记
func (m *MeanController) DeleteDiaryByUUID(UUID string) (Dungeons, error) {

	rsp, err := Cl.DeleteDiaryByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID,
	})
	dy := rsp.Diary
	if err != nil {
		return nil, err
	}
	dData, err := DiaryToData(dy, false)
	if err != nil {
		return nil, err
	}

	m.DelDiaryMixPhotoByUUID(UUID, DataTypeDiary)
	return dData, nil
}

// FindDiaryByUserID 方法: 根据用户id获取分页的日记列表
func (m *MeanController) FindDiaryByUserID(ID int64, qp *QueryParameter) ([]Dungeons, error) {

	rsp, err := Cl.FindDiaryByUserID(context.TODO(), &FindByIDWithQPRequest{
		ID:             ID,
		QueryParameter: qp,
	})
	if err != nil {
		return nil, err
	}

	ds := []Dungeons{}
	for _, dy := range rsp.Diaries {
		dData, _ := DiaryToData(dy, true)
		ds = append(ds, dData)
	}
	return ds, nil
}

// FindDiaryByUserUUID 方法:  根据用户uuid获取分页的日记列表
func (m *MeanController) FindDiaryByUserUUID(UUID string, qp *QueryParameter) ([]Dungeons, error) {

	rsp, err := Cl.FindDiaryByUserUUID(context.TODO(), &FindByUUIDWithQPRequest{
		UUID:           UUID,
		QueryParameter: qp,
	})
	if err != nil {
		return nil, err
	}
	ds := []Dungeons{}
	for _, dy := range rsp.Diaries {
		dData, _ := DiaryToData(dy, true)
		ds = append(ds, dData)
	}
	return ds, nil
}

// FindAllDiaryByUserID 方法: 根据用户id获取所有日记列表
func (m *MeanController) FindAllDiaryByUserID(ID int64) ([]Dungeons, error) {

	rsp, err := Cl.FindAllDiaryByUserID(context.TODO(), &GetByIDRequest{
		Id: ID,
	})
	if err != nil {
		return nil, err
	}

	ds := []Dungeons{}
	for _, dy := range rsp.Diaries {
		dData, _ := DiaryToData(dy, true)
		ds = append(ds, dData)
	}
	return ds, nil
}

// FindAllDiaryByUserUUID 方法:  根据用户uuid获取所有日记列表
func (m *MeanController) FindAllDiaryByUserUUID(UUID string) ([]Dungeons, error) {

	rsp, err := Cl.FindAllDiaryByUserUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID,
	})
	if err != nil {
		return nil, err
	}
	ds := []Dungeons{}
	for _, dy := range rsp.Diaries {
		dData, _ := DiaryToData(dy, true)
		ds = append(ds, dData)
	}
	return ds, nil
}

// GetDiaryByID 方法: 根据日记id获取日记信息
func (m *MeanController) GetDiaryByID(ID int64) (Dungeons, error) {

	rsp, err := Cl.GetDiaryByID(context.TODO(), &GetByIDRequest{
		Id: ID,
	})
	if rsp.Null {
		return nil, DiaryNotFoundErr
	}
	dy := rsp.Diary
	if err != nil {
		return nil, err
	}
	dData, err := DiaryToData(dy, false)
	if err != nil {
		return nil, err
	}
	return dData, nil
}

// GetDiaryByIDs 方法: 根据日记的id数组获取多条日记信息
func (m *MeanController) GetDiaryByIDs(IDs []int64) ([]Dungeons, error) {

	rsp, err := Cl.GetDiaryByIDs(context.TODO(), &GetByIDsRequest{
		Ids: IDs,
	})
	if err != nil {
		return nil, err
	}
	ds := []Dungeons{}
	for _, dy := range rsp.Diaries {
		dData, _ := DiaryToData(dy, true)
		ds = append(ds, dData)
	}
	return ds, nil
}

// GetDiaryByUUID 方法: 根据日记的uuid获取日记信息
func (m *MeanController) GetDiaryByUUID(UUID string) (Dungeons, error) {

	rsp, err := Cl.GetDiaryByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID,
	})
	if err != nil {
		return nil, err
	}
	if rsp.Null {
		return nil, DiaryNotFoundErr
	}
	dy := rsp.Diary
	dData, err := DiaryToData(dy, false)
	if err != nil {
		return nil, err
	}
	return dData, nil
}

// GetDiaryByUUIDs 方法: 根据日记的uuid数组获取日记信息
func (m *MeanController) GetDiaryByUUIDs(UUIDs []string) ([]Dungeons, error) {

	rsp, err := Cl.GetDiaryByUUIDs(context.TODO(), &GetByUUIDsRequest{
		UUIDs: UUIDs,
	})
	if err != nil {
		return nil, err
	}
	ds := []Dungeons{}

	for _, dy := range rsp.Diaries {
		dData, _ := DiaryToData(dy, true)
		ds = append(ds, dData)
	}
	return ds, nil
}
