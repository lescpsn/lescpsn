// This file "photoresponse" is created by Lincan Li at 5/6/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"crypto/sha1"
	"errors"
	"fmt"
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

//NewMobileUser method:创建手机账户
func (d Dream) NewMobileUser(ctx context.Context, req *PostAccountRequest, rsp *UserResponse) error {
	d.Context(ctx)

	salt := mars.RandomString(32)

	h := sha1.New()
	h.Write([]byte(salt + req.Password))
	bs := fmt.Sprintf("%x", h.Sum(nil))

	user, err := mars.NewMobileUser(d.RDB, req.Username, bs, salt, req.Status)
	if err != nil {
		return err
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//NewEmailUser method:创建email账户
func (d Dream) NewEmailUser(ctx context.Context, req *PostAccountRequest, rsp *UserResponse) error {
	d.Context(ctx)

	salt := mars.RandomString(32)

	h := sha1.New()
	h.Write([]byte(salt + req.Password))
	bs := fmt.Sprintf("%x", h.Sum(nil))

	user, err := mars.NewEmailUser(d.RDB, req.Username, bs, salt, req.Status)
	if err != nil {
		return err
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//NewAnonmyousUser method : 创建匿名用户
func (d Dream) NewAnonymousUser(ctx context.Context, req *Empty, rsp *UserResponse) error {
	d.Context(ctx)

	user, err := mars.NewAnonymousUser(d.RDB)
	if err != nil {
		return err
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//UpdateUser method :修改用户信息
func (d Dream) UpdateUser(ctx context.Context, req *PutUserByUUIDRequest, rsp *UserResponse) error {
	d.Context(ctx)

	us := echo2user(req.User)
	user := &mars.DB_User{Model: mars.Model{UUID: Str2UUID(req.UUID)}}

	if err := d.RDB.Model(&user).Updates(us).Error; err != nil {
		return err
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//PatchUser method :修改用户基本信息
func (d Dream) PatchUser(ctx context.Context, req *PostUserRequest, rsp *UserResponse) error {
	d.Context(ctx)

	if req.User.UUID == "" {
		return errors.New("UUID IS NEEDED !")
	}

	us := echo2user(req.User)
	user := &mars.DB_User{Model: mars.Model{UUID: Str2UUID(req.User.UUID)}}

	if err := d.RDB.Model(&user).Updates(us).Error; err != nil {
		return err
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//PatchUser method :修改用户基本信息
func (d Dream) PatchUserByID(ctx context.Context, req *PutUserByIDRequest, rsp *UserResponse) error {
	d.Context(ctx)

	user := echo2user(req.User)
	user.Salt = String("")

	IDUser := &mars.DB_User{Model: mars.Model{ID: req.Id}}

	if err := d.RDB.Model(&IDUser).Updates(req.User).Error; err != nil {
		return err
	}

	user, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//PatchUserPassword method : 修改用户密码
func (d Dream) PatchUserPassword(ctx context.Context, req *PutUserPasswordRequest, rsp *UserResponse) error {
	d.Context(ctx)

	u, err := mars.FirstUserByUUID(d.RDB, Str2UUID(req.UUID))
	if err != nil {
		return err
	}
	//设置密码
	salt := mars.RandomString(32)
	saltPassword := append([]byte(salt), req.Password...)
	h := sha1.New()
	h.Write([]byte(saltPassword))
	ps := fmt.Sprintf("%x", h.Sum(nil))

	//修改之前保证数据的基本信息正确
	u.Salt = String(salt)
	u.Password = String(ps)

	user, err := u.Save(d.RDB)

	if err != nil {
		return err
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//GetUserByID method :根据用户的id 获取用户信息
func (d Dream) GetUserByID(ctx context.Context, req *GetByIDRequest, rsp *UserResponse) error {
	d.Context(ctx)

	user, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	if user == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//GetUserByTusoID method :根据图说的id 获取用户信息
func (d Dream) GetUserByTusoID(ctx context.Context, req *GetUserByTusoIDRequest, rsp *UserResponse) error {
	d.Context(ctx)

	user, err := mars.FirstUserByTusoID(d.RDB, req.TusoID)
	if err != nil {
		return err
	}
	if user == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//GetUserByUUID method :根据用户的UUID获取用户信息
func (d Dream) GetUserByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *UserResponse) error {
	d.Context(ctx)

	user, err := mars.FirstUserByUUID(d.RDB, Str2UUID(req.UUID))

	if err != nil {
		return err
	}
	if user == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//GetUserByMobileNumber method :根据用户的手机号获取用户信息
func (d Dream) GetUserByMobileNumber(ctx context.Context, req *GetUserByMobileRequest, rsp *UserResponse) error {
	d.Context(ctx)

	user, err := mars.FirstUserByPhoneNumber(d.RDB, req.Mobile)
	if err != nil {
		return err
	}
	if user == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//GetUserByMobileNumber method :根据用户的手机号获取用户信息
func (d Dream) GetUserByEmail(ctx context.Context, req *GetUserByEmailRequest, rsp *UserResponse) error {
	d.Context(ctx)

	user, err := mars.FirstUserByEmail(d.RDB, req.Email)
	if err != nil {
		return err
	}
	if user == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.User = user2echo(user)
	return nil
}

//GetUserByIDs method :根据用户的ids获取多个用户信息
func (d Dream) GetUserByIDs(ctx context.Context, req *GetByIDsRequest, rsp *Users) error {
	d.Context(ctx)

	user, err := mars.FindUserByIDs(d.RDB, req.Ids)
	if err != nil {
		return err
	}
	rsp.User = users2echo(user)
	return nil
}

//GetUserByUUIDs method :根据用户的uuids获取多个用户信息
func (d Dream) GetUserByUUIDs(ctx context.Context, req *GetByUUIDsRequest, rsp *Users) error {
	d.Context(ctx)

	user, err := mars.FindUserByUUIDs(d.RDB, Strs2UUIDs(req.UUIDs))
	if err != nil {
		return err
	}
	rsp.User = users2echo(user)
	return nil
}

//GetUserByMobileNumbers method :根据多个手机号码获取多个用户信息
func (d Dream) GetUserByMobileNumbers(ctx context.Context, req *GetUserByMobilesRequest, rsp *Users) error {
	d.Context(ctx)

	user, err := mars.FindUserByPhoneNumbers(d.RDB, req.Mobiles)
	if err != nil {
		return err
	}
	rsp.User = users2echo(user)
	return nil
}

//FindUsers method :根据用户id 获取用户的分页信息
func (d Dream) FindUsers(ctx context.Context, req *FindUserRequest, rsp *Users) error {
	d.Context(ctx)

	var us []*mars.DB_User
	if err := mars.BuildQuery(d.RDB, req.QueryParameter).Find(us).Error; err != nil {

		return err
	}
	rsp.User = users2echo(us)
	return nil
}

//DeleteUserByUUID method :根据用户的uuid删除用户
func (d Dream) DeleteUserByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *Bool) error {
	d.Context(ctx)

	u := mars.DB_User{Model: mars.Model{UUID: Str2UUID(req.UUID)}}
	err := u.Delete(d.RDB)
	if err != nil {
		return err
	}
	rsp.Bool = true
	return nil
}

//DeleteUserByID method :根据用户的id删除用户
func (d Dream) DeleteUserByID(ctx context.Context, req *GetByIDRequest, rsp *Bool) error {
	d.Context(ctx)

	u := mars.DB_User{Model: mars.Model{ID: req.Id}}
	err := u.Delete(d.RDB)
	if err != nil {
		return err
	}
	rsp.Bool = true
	return nil
}

//UpsertRelation method :新建用户的关系
func (d Dream) UpsertRelation(ctx context.Context, req *PostRelationRequest, rsp *RelationResponse) error {
	d.Context(ctx)

	ur := echo2userRelation(req.UserRelation)
	if ur.ID != 0 {
		if err := d.RDB.Model(ur).Updates(ur).Error; err != nil {
			return err
		}
	} else {
		var err error
		ur, err = mars.FirstOrCreateRelation(d.RDB, ur)
		if err != nil {
			return err
		}
	}
	rsp.Null = false
	rsp.UserRelation = userRelation2echo(ur)
	return nil
}

//FindUserFollowees method :获取用户的关注账户的分页列表
func (d Dream) FindUserFollowees(ctx context.Context, req *FindByIDWithQPRequest, rsp *UserRelations) error {
	d.Context(ctx)

	urs, err := mars.GetFollowee(d.RDB, req.ID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.UserRelations = userRelations2echo(urs)
	return nil
}

//FindUserFollows method :根据用户信息获取粉丝的分页列表信息
func (d Dream) FindUserFollows(ctx context.Context, req *FindByIDWithQPRequest, rsp *UserRelations) error {
	d.Context(ctx)

	urs, err := mars.GetFollows(d.RDB, req.ID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.UserRelations = userRelations2echo(urs)
	return nil
}

//FindUserFriends method : 根据用户信息查找该账户的朋友分页列表
func (d Dream) FindUserFriends(ctx context.Context, req *FindByIDWithQPRequest, rsp *UserRelations) error {
	d.Context(ctx)

	urs, err := mars.GetFriends(d.RDB, req.ID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.UserRelations = userRelations2echo(urs)
	return nil
}

//GetRelation method : 根据两个用户查询用户的关系
func (d Dream) GetRelation(ctx context.Context, req *GetRelationRequest, rsp *RelationResponse) error {
	d.Context(ctx)

	ur, err := mars.GetRelationByUsersID(d.RDB, req.FromID, req.ToID)
	if err != nil {
		return err
	}
	if ur == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.UserRelation = userRelation2echo(ur)
	return nil
}

//GetRelationType method :根据两个用户 获取用户关系类型
func (d Dream) GetRelationType(ctx context.Context, req *GetRelationRequest, rsp *UserRelationTypeResponse) error {
	d.Context(ctx)

	ur, err := mars.GetRelationTypeByUsersID(d.RDB, req.FromID, req.ToID)
	if err != nil {
		return err
	}
	rsp.UserRelatedType = ur
	return nil
}

// IncrementFollowees 方法: 在用户粉丝数上自增指定 数值
func (d Dream) IncrementFollowees(ctx context.Context, req *IncrementRequest, rsp *Empty) error {
	d.Context(ctx)

	urs, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	urs.IncrementFollowees(d.RDB, req.Value)
	return nil
}

// IncrementFollowers 方法: 在用户关注数上自增指定 数值
func (d Dream) IncrementFollowers(ctx context.Context, req *IncrementRequest, rsp *Empty) error {
	d.Context(ctx)

	urs, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	urs.IncrementFollowers(d.RDB, req.Value)
	return nil
}

// IncrementFriends 方法: 在用户好友数上自增指定 数值
func (d Dream) IncrementFriends(ctx context.Context, req *IncrementRequest, rsp *Empty) error {
	d.Context(ctx)

	urs, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	urs.IncrementFriends(d.RDB, req.Value)
	return nil
}

// IncrementImages 方法: 在用户图片数上自增指定 数值
func (d Dream) IncrementImages(ctx context.Context, req *IncrementRequest, rsp *Empty) error {
	d.Context(ctx)

	urs, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	urs.IncrementFollowees(d.RDB, req.Value)
	return nil
}

// IncrementTusos 方法: 在用户图说数上自增指定 数值
func (d Dream) IncrementTusos(ctx context.Context, req *IncrementRequest, rsp *Empty) error {
	d.Context(ctx)

	urs, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	urs.IncrementFollowees(d.RDB, req.Value)
	return nil
}

//TODO
////SearchDataForUsers method : 搜索用户的相关信息
//func (d Dream) SearchDataForUsers(keywords string, pageIndex, pageSize int, context *hprose.HttpContext) (userPageList *mars.PageModel, err error) {
//	d.Context(context)
//	upd, err := mars.SearchDataForUsers(d.RDB, d.DIndex, keywords, pageIndex, pageSize)
//	if err != nil {
//		return nil, err
//	}
//	if upd == nil {
//		return nil, nil
//	}
//
//	upd.Data = users2echo((upd.Data).([]*mars.User))
//
//	return upd, nil
//}

//DeleteUser method : 根据用户手机号删除用户.
func (d Dream) DeleteUserByPhone(ctx context.Context, req *PhoneRequest, rsp *Empty) error {
	d.Context(ctx)

	user, err := mars.FirstUserByPhoneNumber(d.RDB, req.Phone)
	if err != nil {
		return err
	}
	err = user.Delete(d.RDB)
	if err != nil {
		return err
	}

	return nil
}

// 批量删除马甲号：支持一个或者多个或者全部
// users 表中 status 为user_status_sockpuppet（2）的是马甲号
func (d Dream) BatchDeleteSockpuppet(ctx context.Context, req *SockpuppetRequest, rsp *Empty) error {
	d.Context(ctx)
	spu, err := mars.FindSockpuppetUser(d.RDB, req.UUIDs)
	if err != nil {
		return err
	}
	for _, v := range spu {
		err = v.Delete(d.RDB)
		if err != nil {
			return err
		}
	}
	return nil
}

// 批量取回所有马甲号
// users 表中 status 为user_status_sockpuppet（2）的是马甲号
func (d Dream) BatchGetSockpuppet(ctx context.Context, req *SockpuppetRequest, rsp *Users) error {
	d.Context(ctx)
	spu, err := mars.FindSockpuppetUser(d.RDB, req.UUIDs)
	if err != nil {
		return err
	}
	rsp.User = users2echo(spu)
	return nil
}

// 查看系统中所有用户
func (d Dream) GetAllUserAllRelation(ctx context.Context, req *AllUserAllRelationRequest, rsp *AllUserAllRelationResponse) error {
	d.Context(ctx)
	totalNum, urs , err := mars.AllUserAllRelationGet(d.RDB, req)
	if err != nil {
		return err
	}
	rsp.User = users2echo(urs)
	rsp.Count = totalNum
	return nil
}
