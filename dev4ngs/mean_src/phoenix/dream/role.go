// This file "role" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine hu . All rights reserved

package dream

import (
	"github.com/jinzhu/gorm"
	"strconv"
)

//角色模型
type Role struct {
	Model
	RoleName string `json:"roleName"`
	RoleDesc string `json:"roleDesc"`
}

//Role admin
type RoleAdmins struct {
	*Role
	Admins []Admin
}

//Role Permission
type RolePermissions struct {
	*Role
	Permissions []*Permission

}

//  用于储存角色和权限的关系
type RolePermissionRelation struct {
	Model
	PermissionID int64
	Permission   *Permission `gorm:"ForeignKey:PermissionID"`

	RoleID int64
	Role   *Role `gorm:"ForeignKey:RoleID"`
}

//AddRole method:  增加角色
func AddRole(db *gorm.DB, role *Role) (*Role, error) {

	obj := role
	if err := db.Save(role).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return obj, nil
}

//GetRoleList method:  获取role的列表信息
func GetRoleList(db *gorm.DB) ([]Role, error) {
	var roles []Role
	if err := db.Where(&Role{}).Find(&roles).Error; err != nil {
		return nil, err
	}
	return roles, nil
}

//DeleteRole method:  delete action by id
func DeleteRole(db *gorm.DB, ids []string) error {

	if err := db.Where("id in (?)", ids).Delete(&Role{}).Error; err != nil {
		return NewXFailError(err)
	}
	return nil
}

//UpdateRole method: Update this model to db
func UpdateRole(db *gorm.DB, role *Role) (*Role, error) {
	if err := db.Model(role).Update(role).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return role, nil
}

//GetRoleById method: get role by id
func GetRoleByID(db *gorm.DB, ID string) (*Role, error) {

	var role Role
	if err := db.Where("id=?", ID).Find(&role).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

//SetAdmins method :to set admins by admin id array
func (role *Role) SetAdminsForRole(db *gorm.DB, rids []string) (*Role, error) {

	err:=DeleteAdminRolesByAdminIDs(db,rids)

	if err!=nil {
		return  nil,err
	}

	for _, rid := range rids {

		id, err := strconv.ParseInt(rid, 10, 64)
		if err != nil {

			return nil, err
		}

		arr := AdminRoleRelation{AdminID: id, RoleID: role.ID}

		if err = db.Create(&arr).Error; err != nil {

			return nil, err
		}

	}

	return role, nil
}


//GetAdminsByRoleID method: Get this Role all admins,and return Role array
func GetAdminsByRoleID(db *gorm.DB,ID int64) ([]*Admin, error) {

	var admin []*Admin
	err := db.Table("admins").Select("admins.id,admins.user_name,admins.true_name,admins.email,admins.phone_number,admins.uuid").Joins("JOIN admin_role_relations ON admin_role_relations.admin_id = admins.id AND admin_role_relations.deleted_at ISNULL").Joins("JOIN roles ON admin_role_relations.role_id = roles.id AND admin_role_relations.role_id = ?", ID).Find(&admin).Error
	if err != nil {
		return nil, err
	}

	return admin, nil
}


//SetPermissionsForRole method :to set permission by permission id array for role
func (role *Role) SetPermissionsForRole(db *gorm.DB, rids []string) (*Role, error) {

	err:=DeleteRolePermissionsByPermissionIDs(db,rids)

	if err!=nil {
		return  nil,err
	}
	for _, rid := range rids {

		id, err := strconv.ParseInt(rid,10,64)
		if err != nil {

			return nil,err
		}

		arr := RolePermissionRelation{PermissionID:id, RoleID:role.ID}

		if err = db.Create(&arr).Error; err != nil {

			return nil, err
		}

	}

	return role, nil
}

//GetPermissionsByRoleID method: Get this Role all admins,and return Role array
func GetPermissionsByRoleID(db *gorm.DB,ID int64) ([]*Permission, error) {

	var pr []*Permission
	err := db.Table("permissions").Select("permissions.id,permissions.permission_name,permissions.uuid").Joins("JOIN role_permission_relations ON role_permission_relations.permission_id = permissions.id AND role_permission_relations.deleted_at ISNULL").Joins("JOIN roles ON role_permission_relations.role_id = roles.id AND role_permission_relations.role_id = ?", ID).Find(&pr).Error

	if  err != nil {
		return nil, err
	}

	return pr, nil
}

