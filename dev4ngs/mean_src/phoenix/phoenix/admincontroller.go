// This file "admincontroller" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"crypto/md5"
	"encoding/hex"
	"git.ngs.tech/mean/phoenix/dream"
	"strconv"
)

//初始化数据库数据
func (bc *BaseController) InitDataToDB() error {

	//err := creatUser(*bc)
	err := creatAdmin(*bc)

	if err != nil {
		return ServiceErr
	}
	return nil
}

//初始化数据库数据表结构
func (bc *BaseController) CreateSchema() error {

	err := creatAdmin(*bc)
	if err != nil {
		return ServiceErr
	}
	return nil
}

//创建管理员
func (bc *BaseController) NewAdmin(admin *dream.Admin) (*dream.Admin, error) {

	//md5 the login pass
	md5Ctx := md5.New()
	md5Ctx.Write([]byte(admin.Password))
	pass := hex.EncodeToString(md5Ctx.Sum(nil))
	admin.Password = pass
	result, err := dream.NewAdmin(bc.DB, admin)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//GetAdminByName  method:  Get admin by user name
func (bc *BaseController) GetAdminByName(name string) (*dream.Admin, error) {

	result, err := dream.GetAdminByName(bc.DB, name)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//GetAdminByUUID  method:  Get admin by UUID
func (bc *BaseController) GetAdminByUUID(uuid string) (*dream.Admin, error) {

	result, err := dream.GetAdminByUUID(bc.DB, uuid)
	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//SetRoles  method: To set roles for admin ,admin has one to many relation
func (bc *BaseController) SetRoles(adminID string, ids []string) (*dream.Admin, error) {

	admid, err := strconv.ParseInt(adminID, 10, 64)
	if err != nil {
		return nil, err
	} else {
		result, err := dream.SetRoles(bc.DB, admid, ids)
		if err != nil {
			return nil, ServiceErr
		}

		return result, nil

	}

}

//GetRolesByAdminID  method:  Get roles by admin id
func (bc *BaseController) GetRolesByAdminID(ID int64) ([]dream.Role, error) {

	result, err := dream.GetRoles(bc.DB, ID)
	if err != nil {
		return nil, ServiceErr
	}

	return result, nil

}

//DeleteAdminByIDs  method:  Delete admins by admin id
func (bc *BaseController) DeleteAdminByIDs(IDs []string) error {

	err := dream.DeleteAdminsByIDs(bc.DB, IDs)

	if err != nil {
		return ServiceErr
	}

	return nil

}

//UpdateAdmin  method: To update this model
func (bc *BaseController) UpdateAdmin(admin *dream.Admin) (*dream.Admin, error) {

	result, err := dream.UpdateAdmin(bc.DB, admin)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}

//GetAdminList method:get admin list
func (bc *BaseController) GetAdminList() ([]*dream.Admin, error) {

	result, err := dream.GetAdminList(bc.DB)

	if err != nil {
		return nil, ServiceErr
	}

	return result, nil
}
