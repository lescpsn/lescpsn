// This file "roleController" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
)

//AddRole method : add a role
func (bc *BaseController) AddRole(role *dream.Role) (*dream.Role, error) {

	result, err := dream.AddRole(bc.DB, role)

	if err != nil {
		return nil, ServiceErr
	}
	return result, nil
}

//GetRoleList method:get role list
func (bc *BaseController) GetRoleList() ([]dream.Role, error) {

	result, err := dream.GetRoleList(bc.DB)
	if err != nil {
		return nil, ServiceErr
	}
	return result, nil
}

//DeleteRoles method :delete roles by id array
func (bc *BaseController) DeleteRoles(ids []string) error {

	err := dream.DeleteRole(bc.DB, ids)

	if err != nil {
		return ServiceErr
	}
	return nil
}

//getRoleById method: get a role by Id
func (bc *BaseController) GetRoleById(uuid string) (*dream.Role, error) {

	result, err := dream.GetRoleByID(bc.DB, uuid)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//UpdateRole method: Update role info
func (bc *BaseController) UpdateRole(role *dream.Role) (*dream.Role, error) {

	result, err := dream.UpdateRole(bc.DB, role)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//GetRoleById method: get a role by Id
func (bc *BaseController) GetRoleByID(ID string) (*dream.Role, error) {

	result, err := dream.GetRoleByID(bc.DB, ID)

	if err != nil {
		return nil, err
	}

	return result, nil
}

//SetAdminsForRoel method: Set admins for role
func (bc *BaseController) SetAdminsForRoel(ID string, admID []string) (*dream.RoleAdmins, error) {
	result, err := dream.GetRoleByID(bc.DB, ID)
	adms, admErr := dream.GetAdminByIDs(bc.DB, admID)

	if err != nil {
		return nil, err
	}

	if admErr != nil {
		return nil, admErr
	}

	result, err = result.SetAdminsForRole(bc.DB, admID)

	if err != nil {
		return nil, err
	}

	roleAdmin := dream.RoleAdmins{}
	roleAdmin.Admins = adms
	roleAdmin.Role = result
	return &roleAdmin, nil
}

//GetAdminsByRoleId method:get admin list by role id
func (bc *BaseController) GetAdminsByRoleId(rID int64) ([]*dream.Admin, error) {

	result, err := dream.GetAdminsByRoleID(bc.DB, rID)
	if err != nil {
		return nil, ServiceErr
	}
	return result, nil
}

//SetPermissionsForRole method: Set permission for role
func (bc *BaseController) SetPermissionsForRole(ID string, prID []string) (*dream.RolePermissions, error) {
	result, err := dream.GetRoleByID(bc.DB, ID)
	pms, admErr := dream.GetPermissionByIDs(bc.DB, prID)
	if err != nil {
		return nil, err
	}

	if admErr != nil {
		return nil, admErr
	}

	result, err = result.SetPermissionsForRole(bc.DB, prID)

	if err != nil {
		return nil, err
	}

	roleAdmin := dream.RolePermissions{}
	roleAdmin.Permissions = pms
	roleAdmin.Role = result
	return &roleAdmin, nil
}

//GetPermissionsByRoleID method:get admin list
func (bc *BaseController) GetPermissionsByRoleID(rID int64) ([]*dream.Permission, error) {

	result, err := dream.GetPermissionsByRoleID(bc.DB, rID)
	if err != nil {
		return nil, ServiceErr
	}
	return result, nil
}
