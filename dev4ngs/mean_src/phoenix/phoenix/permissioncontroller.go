// This file "permissionController" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
)

//GetPermissionList method:get permission list
func (bc *BaseController) GetPermissionList() (error, []*dream.Permission) {

	result, err := dream.GetPermissionList(bc.DB)
	if err != nil {
		return ServiceErr, nil
	}
	return nil, result
}

//AddPermission method : add a permission
func (bc *BaseController) AddPermission(permission *dream.Permission) (error, *dream.Permission) {

	result, err := dream.AddPermission(bc.DB, permission)

	if err != nil {
		return ServiceErr, nil
	}

	return nil, result
}

//GetPermissionById method: get a permission by Id
func (bc *BaseController) GetPermissionById(uuid string) (*dream.Permission, error) {

	result, err := dream.GetPermissionByID(bc.DB, uuid)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//UpatePermission method :update a permission by Id
func (bc *BaseController) UpatePermission(permission *dream.Permission) (*dream.Permission, error) {

	result, err := dream.UpdatePermission(bc.DB, permission)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//DeletePermissions method :delete permissions by id array
func (bc *BaseController) DeletePermissions(ids []string) error {

	err := dream.DeletePermissionByIDs(bc.DB, ids)

	if err != nil {
		return ServiceErr
	}
	return nil
}

//SetMenuForPermisson method: Set menu for permission
func (bc *BaseController) SetMenuForPermisson(ID string, menuID []string) (*dream.MenuPermissions, error) {
	result, err := dream.GetPermissionByID(bc.DB, ID)
	menus, admErr := dream.GetMenuByIDs(bc.DB, menuID)
	if err != nil {
		return nil, err
	}

	if admErr != nil {
		return nil, admErr
	}

	result, err = result.SetMenusForPermission(bc.DB, menuID)

	if err != nil {
		return nil, err
	}

	roleAdmin := dream.MenuPermissions{}
	roleAdmin.Menus = menus
	roleAdmin.Permission = result
	return &roleAdmin, nil
}

//GetMenusByPermissionID method:get menu list by permission id
func (bc *BaseController) GetMenusByPermissionID(rID int64) ([]*dream.Menu, error) {

	result, err := dream.GetMenusByPermissionID(bc.DB, rID)
	if err != nil {
		return nil, err
	}
	return result, nil
}

//SetOperationForPermisson method: Set menu for permission
func (bc *BaseController) SetOperationForPermisson(ID string, menuID []string) (*dream.OperationPermissions, error) {
	result, err := dream.GetPermissionByID(bc.DB, ID)
	ops, admErr := dream.GetOperationByIDs(bc.DB, menuID)
	if err != nil {
		return nil, err
	}
	if admErr != nil {
		return nil, admErr
	}
	result, err = result.SetMenusForPermission(bc.DB, menuID)

	if err != nil {
		return nil, err
	}
	roleAdmin := dream.OperationPermissions{}
	roleAdmin.Operations = ops
	roleAdmin.Permission = result
	return &roleAdmin, nil
}

//GetOperationsByPermissionID method:get menu list by permission id
func (bc *BaseController) GetOperationsByPermissionID(rID int64) ([]*dream.Operation, error) {

	result, err := dream.GetOperationsByPermissionID(bc.DB, rID)
	if err != nil {
		return nil, err
	}
	return result, nil
}
