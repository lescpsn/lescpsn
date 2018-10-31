package dream

import (
	"github.com/jinzhu/gorm"
	"strconv"
	"strings"
	"fmt"
)

type Admin struct {
	Model
	UserName    string `sql:"not null;unique"`
	Password    string `sql:"not null"`
	TrueName    string
	Email       string `sql:"not null"`
	PhoneNumber string
	State       int      `sql:"default:1"`
	Secrets     string   `sql:"" json:"omitempty"`
	Levels      string   `sql:"" json:"omitempty"`
	LevelMap    []string `sql:"-" json:"omitempty"`
	Roles       []Role   `sql:"-" json:"omitempty"`
}

//  用于储存管理员和角色的关系
type AdminRoleRelation struct {
	Model
	AdminID int64
	Admin   *Admin `gorm:"ForeignKey:AdminID"`

	RoleID  int64
	Role    *Role `gorm:"ForeignKey:RoleID"`
}

// add admin
func NewAdmin(db *gorm.DB, adm *Admin) (*Admin, error) {

	if err := db.Save(adm).Error; err != nil {
		return nil, NewXFailError(err)
	}
	return adm, nil
}

//GetAdminList method:  获取admin的列表信息
func GetAdminList(db *gorm.DB) ([]*Admin, error) {
	var admins []*Admin
	if err := db.Where(&Role{}).Find(&admins).Error; err != nil {
		return nil, err
	}
	return admins, nil
}

// GetAdminByName 通过用户名获取admin struct
func GetAdminByName(db *gorm.DB, name string) (*Admin, error) {
	var admin Admin
	if err := db.Where("user_name = ?", name).First(&admin).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	admin.toLevelMap()
	return &admin, nil
}

//GetAdminByUUID  method : Get admin by uuid
func GetAdminByUUID(db *gorm.DB, uuid string) (*Admin, error) {
	//admin.UserName = uuid
	var admin Admin

	if err := db.Where("uuid = ?", uuid).First(&admin).Error; err != nil {
		fmt.Println(err)
		return nil, err
	}
	admin.toLevelMap()
	roles, err := GetRoles(db, admin.ID)
	if err == nil {
		admin.Roles = roles
	}
	return &admin, nil
}
//GetAdminByID  method : Get admin by id
func GetAdminByID(db *gorm.DB, id int64) (*Admin, error) {
	//admin.UserName = uuid
	var admin Admin

	if err := db.Where("id = ?", id).First(&admin).Error; err != nil {
		return nil, err
	}
	admin.toLevelMap()
	roles, err := GetRoles(db, admin.ID)

	if err != nil {
		admin.Roles = roles
	}
	return &admin, nil
}

//GetAdminByIDs merhod: Get a list for admin by id array
func GetAdminByIDs(db *gorm.DB, id []string) ([]Admin, error) {
	var admin []Admin

	if err := db.Where("id in (?)", id).Find(&admin).Error; err != nil {
		return nil, err
	}

	return admin, nil
}

//分割字符串成为字符串数组
func (admin *Admin) toLevelMap() {
	if len(admin.Levels) == 0 {
		return
	}
	admin.LevelMap = strings.Split(admin.Levels, ",")
}

//字符串数组to string
func (admin *Admin) toLevels() {
	if len(admin.LevelMap) == 0 {
		return
	}
	admin.Levels = strings.Join(admin.LevelMap, ",")
}

//SetRoles method :to set roles by role id array
func SetRoles(db *gorm.DB, adminId int64, rids []string) (*Admin, error) {

	err:=DeleteAdminRolesByAdminIDs(db,[]string{strconv.FormatInt(adminId,10)})

	if err!=nil {
		return  nil,err
	}

	for _, rid := range rids {

		id, err := strconv.ParseInt(rid, 10, 64)
		if err != nil {

			return nil, NewXFailError(err)
		}

		arr := AdminRoleRelation{AdminID:adminId, RoleID:id}

		if err = db.Create(&arr).Error; err != nil {

			return nil, NewXFailError(err)
		}

	}
	return GetAdminByID(db, adminId)
}

//GetRoles method: Get this admin all roles,and return Role array
func GetRoles(db *gorm.DB, ID int64) ([]Role, error) {

	var roles []Role
	err := db.Table("roles").Select("roles.id,roles.role_desc,roles.role_name,roles.uuid").Joins("JOIN admin_role_relations ON admin_role_relations.role_id = roles.id AND admin_role_relations.deleted_at ISNULL").Joins("JOIN admins ON admin_role_relations.admin_id = admins.id AND admin_role_relations.admin_id = ?", ID).Find(&roles).Error

	if err != nil {
		return nil, err
	}

	return roles, nil
}



//DeleteAdminRolesByAdminIDs method:  delete action by admin ids
func DeleteAdminRolesByAdminIDs(db *gorm.DB, adminIds []string) error {

	if err := db.Unscoped().Where("admin_id in(?)", adminIds).Delete(&AdminRoleRelation{}).Error; err != nil {
		return NewXFailError(err)
	}
	return nil
}

//DeleteAdmin method:  delete action by id
func DeleteAdminsByIDs(db *gorm.DB, ids []string) error {

	if err :=DeleteAdminRolesByAdminIDs(db,ids); err != nil {
		return NewXFailError(err)
	}
	if err := db.Where("id in (?)", ids).Delete(&Admin{}).Error; err != nil {
		return err
	}
	return nil
}

//UpdateAdmin method: Update this model to db
func UpdateAdmin(db *gorm.DB, admin *Admin) (*Admin, error) {
	if err := db.Model(admin).Update(admin).Error; err != nil {
		return nil, err
	}
	return admin, nil
}
