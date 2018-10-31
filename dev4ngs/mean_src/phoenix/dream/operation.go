// This file "operation" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine hu . All rights reserved

package dream

import (
	"github.com/jinzhu/gorm"
)

//Operation model
type Operation struct {
	Model
	OperationName     string `json:"name"`
	OperationCode     string `json:"code"`
	OperationPerfix   string `json:"perfix"`
	OperationMethod   string `json:"method"`
	OperationDesc     string `json:"desc"`
	OperationParentId int
}

//  Relation of Operation & Permission
type OperationPermissionRelation struct {
	Model
	OperationID  int64
	Operation    *Operation `gorm:"ForeignKey:OperationID"`
	PermissionID int64
	Permission   *Permission `gorm:"ForeignKey:PermissionID"`
}

type OperationPermissions struct{
	*Permission
	Operations []*Operation

}

//AddOperation method :  Add a Operation action to db
func AddOperation(db *gorm.DB, operation *Operation) (*Operation, error) {

	obj := operation
	if err := db.Save(operation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return obj, nil
}

//GetOperationList method: get Operation action list infomation
func GetOperationList(db *gorm.DB) ([]*Operation, error) {
	var operation []*Operation
	if err := db.Where(&Operation{}).Find(&operation).Error; err != nil {
		return nil, err
	}
	return operation, nil
}

//DeleteOperationByIDs method:  delete action by id
func DeleteOperationByIDs(db *gorm.DB, ids []string) error {
	if err := DeleteOperationPermissionsByOperationIDs(db,ids); err != nil {
		return err
	}

	if err := db.Where("id in (?)", ids).Delete(&Operation{}).Error; err != nil {
		return err
	}
	return nil
}

//DeleteOperationPermissionsByOperationIDs method:  delete action by permission ids
func DeleteOperationPermissionsByOperationIDs(db *gorm.DB, ids []string) error {
	if err := db.Unscoped().Where("permission_id in (?)", ids).Delete(RolePermissionRelation{}).Error; err != nil {
		return err
	}
	return nil
}


//UpdatePermission method: Update this model to db
func UpdateOperation(db *gorm.DB, operation *Operation) (*Operation, error) {
	if err := db.Model(operation).Update(operation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return operation, nil
}

//GetOperationByUUID method: Update this model to db
func GetOperationByUUID(db *gorm.DB, uuid string) (*Operation, error) {

	var operation Operation
	if err := db.Where("uuid=?", uuid).Find(&operation).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return &operation, nil
}

//GetOperationByIDs method: get operations by id array
func GetOperationByIDs(db *gorm.DB, ids []string) ([]*Operation, error) {

	var ops []*Operation
	if err := db.Where("id in (?)", ids).Find(&ops).Error; err != nil {
		return nil, err
	}
	return ops, nil
}

