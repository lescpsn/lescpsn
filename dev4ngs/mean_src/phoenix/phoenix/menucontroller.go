// This file "menuController" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
)

//GetMenuList method:get menu list
func (bc *BaseController) GetMenuList() (error, []*dream.Menu) {

	result, err := dream.GetMenuList(bc.DB)
	if err != nil {
		return ServiceErr, nil
	}
	return nil, result
}

//AddMenu method : add a menu
func (bc *BaseController) AddMenu(menu *dream.Menu) (error, *dream.Menu) {

	result, err := dream.AddMenu(bc.DB, menu)

	if err != nil {
		return ServiceErr, nil
	}

	return nil, result
}

//GetMenuTree method :get menu tree
func (bc *BaseController) GetMenuTree() *ResultModel {

	err, result := bc.GetMenuList()
	if err != nil {

		return &ResultModel{PhoenixDefault: ServiceErr}
	}

	rootMenu := &dream.Menu{
		Model:    dream.Model{ID: 0},
		Name:     "root",
		ParentId: 0,
		Desc:     "",
		SortNum:  0,
	}

	for _, u := range result {

		rootMenu.AddToTree(u)
	}

	return &ResultModel{PhoenixDefault: &PhoenixDefault{ErrorCode: 0}, Data: rootMenu.Children}
}

//GetMenuById method: get a menu by Id
func (bc *BaseController) GetMenuById(uuid string) (*dream.Menu, error) {

	result, err := dream.GetMenuByUUID(bc.DB, uuid)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//UpateMenu method :update a menu by Id
func (bc *BaseController) UpateMenu(menu *dream.Menu) (*dream.Menu, error) {

	result, err := dream.UpdateMenu(bc.DB, menu)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//DeleteMenus method :delete menus by id array
func (bc *BaseController) DeleteMenus(ids []string) error {

	err := dream.DeleteMenuByIDs(bc.DB, ids)

	if err != nil {
		return ServiceErr
	}
	return nil
}
