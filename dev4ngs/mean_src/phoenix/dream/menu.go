// This file "mennu" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package dream

import (
	"github.com/jinzhu/gorm"
)

//menu model
type Menu struct {
	Model
	Name     string  `json:"name"`
	Icon     string  `json:"icon"`
	Url      string  `json:"url"`
	Desc     string  `json:"desc"`
	ParentId int64   `json:"parent_id"`
	SortNum  float32 `json:"sort_num"`
	Children []*Menu `json:"children"`
}

//MenuPermissionRelation,  Relation of Menu & Permission
type MenuPermissionRelation struct {
	Model
	MenuID       int64
	Menu         *Menu `gorm:"ForeignKey:MenuID"`
	PermissionID int64
	Permission   *Permission `gorm:"ForeignKey:PermissionID"`
}

type MenuPermissions struct{
	*Permission
	Menus []*Menu

}

//AddMenu method:add a Menu to db
func AddMenu(db *gorm.DB, menu *Menu) (*Menu, error) {

	obj := menu
	if err := db.Save(menu).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return obj, nil
}

//GetMenuList method:get menu list infomation
func GetMenuList(db *gorm.DB) ([]*Menu, error) {
	var menu []*Menu
	if err := db.Where(&Menu{}).Order("created_at asc").Find(&menu).Error; err != nil {
		return nil, err
	}
	return menu, nil
}

//AddToTree method:bulid a tree
func (menu *Menu) AddToTree(menuNode *Menu) {

	if menuNode.ParentId == 0 {

		menu.Children = append(menu.Children, menuNode)
	} else if menuNode.ParentId == menu.ID {

		menu.Children = append(menu.Children, menuNode)

	} else {

		for _, u := range menu.Children {

			u.AddToTree(menuNode)
		}

	}

}

//DeleteMenuByIDs method : delete a Menu by ids
func DeleteMenuByIDs(db *gorm.DB, ids []string) error {

	if err := DeleteMenuPermissionByMenuIDs(db,ids); err != nil {
		return err
	}

	if err := db.Where("id in (?)", ids).Delete(&Menu{}).Error; err != nil {
		return err
	}
	return nil
}


//DeleteMenuPermissionByMenuIDs method:  delete action by menu ids
func DeleteMenuPermissionByMenuIDs(db *gorm.DB, ids []string) error {
	if err := db.Unscoped().Where("menu_id in (?)", ids).Delete(MenuPermissionRelation{}).Error; err != nil {
		return err
	}
	return nil
}

//UpdateMenu mehtod: Update a Menu to db
func UpdateMenu(db *gorm.DB, menu *Menu) (*Menu, error) {
	if err := db.Model(menu).Update(menu).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return menu, nil
}

//GetMenuByUUID method : get a Menu from db by id
func GetMenuByUUID(db *gorm.DB, uuid string) (*Menu, error) {

	var menu Menu
	if err := db.Where("uuid=?", uuid).Find(&menu).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return &menu, nil
}

//GetMenuByIDs method: get menus by id array
func GetMenuByIDs(db *gorm.DB, ids []string) ([]*Menu, error) {

	var menus []*Menu
	if err := db.Where("id in (?)", ids).Find(&menus).Error; err != nil {
		return nil, err
	}
	return menus, nil
}
