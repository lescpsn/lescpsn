// This file "permission" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine hu . All rights reserved

package dream

import (
	"github.com/jinzhu/gorm"
	"strconv"
)

// 权限模型
type Permission struct {
	Model
	PermissionName string //permission Type ,this filed is difference tag

}

//AddPermission method:增加权限
func AddPermission(db *gorm.DB, permission *Permission) (*Permission, error) {

	obj := permission
	if err := db.Save(permission).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return obj, nil
}

//GetPermissionList method: 获取permission的列表信息
func GetPermissionList(db *gorm.DB) ([]*Permission, error) {
	var permission []*Permission
	if err := db.Where(&Permission{}).Find(&permission).Error; err != nil {
		return nil, err
	}
	return permission, nil
}


//DeleteRolePermissionsByPermissionIDs method:  delete action by permission ids
func DeleteRolePermissionsByPermissionIDs(db *gorm.DB, ids []string) error {
	if err := db.Unscoped().Where("permission_id in (?)", ids).Delete(RolePermissionRelation{}).Error; err != nil {
		return err
	}
	return nil
}

//DeleteAdmin method:  delete action by id
func DeletePermissionByIDs(db *gorm.DB, ids []string) error {

	if err := DeleteRolePermissionsByPermissionIDs(db,ids); err != nil {
		return err
	}
	if err := db.Where("id in (?)", ids).Delete(&Permission{}).Error; err != nil {
		return err
	}
	return nil
}


//UpdatePermission method: Update this model to db
func UpdatePermission(db *gorm.DB, pr *Permission) (*Permission, error) {
	if err := db.Model(pr).Update(pr).Error; err != nil {
		return nil, err
	}
	return pr, nil
}

//GetPermissionById method: Update this model to db
func GetPermissionByID(db *gorm.DB, uuid string) (*Permission, error) {

	var pr Permission
	if err := db.Where("id=?", uuid).First(&pr).Error; err != nil {
		return nil, err
	}
	return &pr, nil
}


//GetPermissionByIDs method: get permission list by is array
func GetPermissionByIDs(db *gorm.DB, ids []string) ([]*Permission, error) {

	var prs []*Permission
	if err := db.Where("id in (?)", ids).Find(&prs).Error; err != nil {
		return nil, err
	}
	return prs, nil
}

//SetMenusForPermission method :to set menus by menu id array for permission
func (prm *Permission) SetMenusForPermission(db *gorm.DB, rids []string) (*Permission, error) {

	err:=DeleteMenuPermissionByMenuIDs(db,rids)

	if err!=nil {
		return  nil,err
	}

	for _, rid := range rids {

		id, err := strconv.ParseInt(rid, 10, 64)
		if err != nil {

			return nil, err
		}

		arr := MenuPermissionRelation{MenuID: id, PermissionID: prm.ID}

		if err = db.Create(&arr).Error; err != nil {

			return nil, err
		}

	}

	return prm, nil
}


//GetMenusByPermissionID method: Get this permission all menu,and return Menu array
func GetMenusByPermissionID(db *gorm.DB,ID int64) ([]*Menu, error) {

	var menus []*Menu
	err := db.Table("menus").Select("menus.id,menus.name,menus.icon,menus.url,menus.desc,menus.uuid,menus.parent_id,menus.sort_num").Joins("JOIN menu_permission_relations ON menu_permission_relations.menu_id = menus.id AND menu_permission_relations.deleted_at ISNULL").Joins("JOIN permissions ON menu_permission_relations.permission_id = permissions.id AND menu_permission_relations.permission_id = ?", ID).Find(&menus).Error
	if err != nil {
		return nil, err
	}

	return menus, nil
}


//SetOperationsForPermission method :to set operations by permission id array for permission
func (prm *Permission) SetOperationsForPermission(db *gorm.DB, rids []string) (*Permission, error) {

	err:=DeleteOperationPermissionsByOperationIDs(db,rids)

	if err!=nil {
		return  nil,err
	}
	for _, rid := range rids {

		id, err := strconv.ParseInt(rid,10,64)
		if err != nil {

			return nil,err
		}
		arr := OperationPermissionRelation{PermissionID:prm.ID,OperationID:id}

		if err = db.Create(&arr).Error; err != nil {

			return nil, err
		}

	}

	return prm, nil
}

//GetOperationsByPermissionID method: Get this Role all admins,and return Role array
func GetOperationsByPermissionID(db *gorm.DB,ID int64) ([]*Operation, error) {

	var op []*Operation
	err := db.Table("operations").Select("operations.operation_name,permissions.operation_code,permissions.operation_desc,permissions.operation_parent_id,permissions.operation_method,permissions.uuid").Joins("JOIN operation_permission_relations ON operation_permission_relations.permission_id = permissions.id AND operation_permission_relations.deleted_at ISNULL").Joins("JOIN permissions ON operation_permission_relations.permission_id = permissions.id AND operation_permission_relations.permission_id = ?", ID).Find(&op).Error

	if  err != nil {
		return nil, err
	}
	return op, nil
}

