// This file "photoecho.go" is created by Lincan Li at 5/6/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
)

// wrap response for photo echo
func maskRawPhotoQueryOptions(o *PhotoEchoOption) *mars.RawPhotoQueryOptions {
	op := mars.DefaultRawPhotoQueryOptions()
	op.PreloadUser = false
	op.MaskInPipeline = false

	if o == nil {
		return op
	}

	if !o.FetchNote {
		op.PreloadNote = false
	}

	if o.FetchUser {
		op.PreloadUser = true
	}

	if o.FetchBasePhoto {
		op.PreloadBasePhoto = true
	}

	return op
}

func (d *Dream) EchoPhotoByID(pID int64, o *PhotoEchoOption) (*Photo, error) {
	op := maskRawPhotoQueryOptions(o)
	rPhoto, err := mars.FirstRawPhotoByID(d.RDB, pID, op)
	if err != nil {
		return nil, err
	}
	if rPhoto == nil {
		return nil, nil
	}

	return photo2echo(rPhoto), nil
}

func (d *Dream) EchoPhotoByIDs(pIDs []int64, o *PhotoEchoOption) ([]*Photo, error) {
	op := maskRawPhotoQueryOptions(o)
	rPhotos, err := mars.FindRawPhotosByIDs(d.RDB, pIDs, op)
	if err != nil {
		return nil, err
	}
	if len(rPhotos) == 0 {
		return []*Photo{}, nil
	}

	return photos2echo(rPhotos), nil
}

func (d *Dream) EchoPhotoByUUID(UUID uuid.UUID, o *PhotoEchoOption) (*Photo, error) {
	op := maskRawPhotoQueryOptions(o)

	rPhoto, err := mars.FirstRawPhotoByUUID(d.RDB, UUID, op)
	if err != nil {
		return nil, err
	}
	if rPhoto == nil {
		return nil, nil
	}

	return photo2echo(rPhoto), nil
}

func (d *Dream) EchoPhotoByIDsByUUIDs(UUIDs []uuid.UUID, o *PhotoEchoOption) ([]*Photo, error) {
	op := maskRawPhotoQueryOptions(o)
	rPhotos, err := mars.FindRawPhotosByUUIDs(d.RDB, UUIDs, op)
	if err != nil {
		return nil, err
	}
	if len(rPhotos) == 0 {
		return []*Photo{}, nil
	}

	return photos2echo(rPhotos), nil
}

// NewPhoto 可以将其一个 PhotoEcho 对象持久化保存在数据库中, 同时将保存后的
// PhotoEcho 对象返回
// NewPhoto 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) NewPhoto(ctx context.Context, req *PhotoWithEchoOptionRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	p := echo2photo(req.Photo)
	// 如果已经有主键了, 那么就应当调用更新的方法, 而不是再次保存为新图片
	if p.ID != 0 {
		return IDExistOnSave
	}

	// 先预先设定 RawPhoto 的 UUID
	RawPhotoUUID := uuid.NewV4()

	p.UUID = RawPhotoUUID
	if p.BasePhoto != nil {
		p.BasePhoto.RawPhotoUUID = RawPhotoUUID
		p.BasePhoto.SetDisplayVersion(0)
		if _, err := p.BasePhoto.Save(d.RDB); err != nil {
			return err
		}
		p.BasePhotoUUID = p.BasePhoto.UUID
		p.DisplayPhotoUUID = p.BasePhoto.UUID
	}

	if p.DisplayPhoto != nil {
		p.DisplayPhoto.UserUUID = p.UserUUID
		p.DisplayPhoto.RawPhotoUUID = RawPhotoUUID
		p.DisplayPhoto.SetDisplayVersion(1)
		if _, err := p.DisplayPhoto.Save(d.RDB); err != nil {
			return err
		}
		p.DisplayPhotoUUID = p.DisplayPhoto.UUID
	}

	// 初始 DisplayVersion 为1
	p.SetDisplayVersion(1)

	if _, err := p.Save(d.RDB); err != nil {
		return err
	}

	u, err := mars.FirstUserByUUID(d.RDB, p.UserUUID)
	if err != nil {
		return err
	}
	if err := u.IncrementImages(d.RDB, 1); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Photo = photo2echo(p)
	return nil
}

// NewDisplayPhoto 可以将其一个 Display Photo 对象持久化保存在数据库中, 同时将保存后的
// PhotoEcho 对象返回
// NewDisplayPhoto 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) NewDisplayPhoto(ctx context.Context, req *PhotoWithUUIDRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	p := echo2photo(req.Photo)

	if p.DisplayPhoto != nil {
		p.DisplayPhoto.RawPhotoUUID = UUID
		if _, err := p.DisplayPhoto.Save(d.RDB); err != nil {
			return err
		}
	}
	photo, err := d.EchoPhotoByUUID(UUID, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if photo == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = photo
	return nil
}

// UpgradePhotoByID 可以新建 Photo 中的 Display Photo, 并自增 DisplayVersion
// UpgradePhotoByID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) UpgradePhotoByID(ctx context.Context, req *PhotoWithIDRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	p := echo2photo(req.Photo)

	photo, err := mars.FirstRawPhotoByID(d.RDB, req.Id, &mars.RawPhotoQueryOptions{})
	if err != nil {
		return err
	}
	if photo == nil {
		return EntityNotFound
	}

	photo.IncrementDisplayVersion(d.RDB, 1)
	if p.DisplayPhoto != nil {
		p.DisplayPhoto.UserUUID = photo.UserUUID
		p.DisplayPhoto.RawPhotoUUID = photo.UUID

		//TODO DisplayVersion is IntegerType
		p.DisplayPhoto.SetDisplayVersion(photo.DisplayVersion.Int)
		if _, err := p.DisplayPhoto.Save(d.RDB); err != nil {
			return err
		}
	}

	photo.DisplayPhotoUUID = p.DisplayPhoto.UUID
	if _, err := photo.Save(d.RDB); err != nil {
		return err
	}

	EchoPhoto, err := d.EchoPhotoByID(photo.ID, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if EchoPhoto == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = EchoPhoto
	return nil
}

// UpgradePhotoToUUID 可以指定 Photo 中的 Display Photo, 并自增 DisplayVersion
// UpgradePhotoToUUID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) UpgradePhotoToUUID(ctx context.Context, req *IDAndUUIDWithEchoOptionRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)

	photo, err := mars.FirstRawPhotoByID(d.RDB, req.Id, &mars.RawPhotoQueryOptions{})
	if err != nil {
		return err
	}
	if photo == nil {
		return EntityNotFound
	}

	dPhoto, err := mars.FirstPhotoByUUID(d.RDB, UUID)
	if err != nil {
		return err
	}
	if dPhoto == nil {
		return EntityNotFound
	}

	photo.IncrementDisplayVersion(d.RDB, 1)
	photo.DisplayPhotoUUID = UUID
	if _, err := photo.Save(d.RDB); err != nil {
		return err
	}

	dPhoto.DisplayVersion = photo.DisplayVersion
	if _, err := dPhoto.Save(d.RDB); err != nil {
		return err
	}

	p, err := d.EchoPhotoByID(photo.ID, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if p == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = p
	return nil
}

func stripDisplayPhoto(rP *mars.DB_RawPhoto) *mars.DB_RawPhoto {
	rP.DisplayPhoto = nil
	rP.DisplayPhotoUUID = uuid.Nil
	return rP
}

// PatchDisplayPhotoByUUID 可以根据 UUID 和 DisplayVersion 修改制定 DisplayPhoto 中的内容
// PatchDisplayPhotoByUUID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) PatchDisplayPhotoByUUID(ctx context.Context, req *UUIDAndVersionWithPhotoRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	p := echo2photo(req.Photo)

	dPhoto, err := mars.FirstPhotoByRPUUIDAndDVer(d.RDB, UUID, req.DVersion)
	if err != nil {
		return err
	}
	if dPhoto == nil {
		return EntityNotFound
	}

	if err := d.RDB.Model(&dPhoto).Updates(p.DisplayPhoto).Error; err != nil {
		return err
	}

	photo, err := d.EchoPhotoByUUID(UUID, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if photo == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = photo
	return nil
}

// PatchPhotoByUUID 可以根据 UUID 更新 Photo 对象和 BasePhoto 对象的值.
// 本方法接受一个 pEcho 类型为 PhotoEcho 的参数, 只需将需要修改的值传入 pEcho 中即可更新
// PatchPhotoByUUID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) PatchPhotoByUUID(ctx context.Context, req *PhotoWithUUIDRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	p := echo2photo(req.Photo)
	stripDisplayPhoto(p)

	photo, err := mars.FirstRawPhotoByUUID(d.RDB, UUID, &mars.RawPhotoQueryOptions{})
	if err != nil {
		return err
	}
	if photo == nil {
		return EntityNotFound
	}

	if p.BasePhoto != nil {
		bPhoto, err := mars.FirstPhotoByUUID(d.RDB, photo.BasePhotoUUID)
		if err != nil {
			return err
		}
		if err := d.RDB.Model(&bPhoto).Updates(p.BasePhoto).Error; err != nil {
			return err
		}
	}

	if err := d.RDB.Model(&photo).Updates(p).Error; err != nil {
		return err
	}

	if p.PhotoPrivacy != 0 {
		if _, err := mars.PhotoPrivacySwitch(d.RDB, photo, p.PhotoPrivacy); err != nil {
			return err
		}
	}

	EchoPhoto, err := d.EchoPhotoByID(photo.ID, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if EchoPhoto == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = EchoPhoto
	return nil
}

// PatchPhotoByID 是 PatchPhotoByUUID 的 ID 形式
func (d Dream) PatchPhotoByID(ctx context.Context, req *PhotoWithIDRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	p := echo2photo(req.Photo)
	stripDisplayPhoto(p)

	photo := &mars.DB_RawPhoto{Model: mars.Model{ID: req.Id}}

	if p.BasePhoto != nil {
		var err error
		photo, err = mars.FirstRawPhotoByID(d.RDB, req.Id, &mars.RawPhotoQueryOptions{})
		if err != nil {
			return err
		}
		if photo == nil {
			return EntityNotFound
		}

		bPhoto, err := mars.FirstPhotoByUUID(d.RDB, photo.BasePhotoUUID)
		if err != nil {
			return err
		}
		if err := d.RDB.Model(&bPhoto).Updates(p.BasePhoto).Error; err != nil {
			return err
		}
	}

	if err := d.RDB.Model(&photo).Updates(p).Error; err != nil {
		return err
	}

	if p.PhotoPrivacy != 0 {
		if _, err := mars.PhotoPrivacySwitch(d.RDB, photo, p.PhotoPrivacy); err != nil {
			return err
		}
	}

	EchoPhoto, err := d.EchoPhotoByID(photo.ID, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if EchoPhoto == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = EchoPhoto
	return nil
}

// PublicPhotosByUUIDs 可以讲指定 UUID 列表的 Photo 设为公开
// PublicPhotosByUUIDs 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) PublicPhotosByUUIDs(ctx context.Context, req *UUIDsWithEchoOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	UUIDs := Strs2UUIDs(req.UUIDs)
	ps, err := mars.FindRawPhotosByUUIDs(d.RDB, UUIDs, maskRawPhotoQueryOptions(req.PhotoEchoOption))
	if err != nil {
		return err
	}

	ps, err = mars.PublicHandler(d.RDB, ps)
	if err != nil {
		return err
	}
	rsp.Photos = photos2echo(ps)
	return nil
}

// PrivatePhotosByUUIDs 可以讲指定 UUID 列表的 Photo 设为隐私
// PrivatePhotosByUUIDs 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) PrivatePhotosByUUIDs(ctx context.Context, req *UUIDsWithEchoOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	UUIDs := Strs2UUIDs(req.UUIDs)
	ps, err := mars.FindRawPhotosByUUIDs(d.RDB, UUIDs, maskRawPhotoQueryOptions(req.PhotoEchoOption))
	if err != nil {
		return err
	}

	ps, err = mars.PrivateHandler(d.RDB, ps)
	if err != nil {
		return err
	}

	rsp.Photos = photos2echo(ps)
	return nil
}

// DeletePhotosByUUIDs 可以讲指定 UUID 列表的 Photo 删除
// DeletePhotosByUUIDs 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) DeletePhotosByUUIDs(ctx context.Context, req *UUIDsWithEchoOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	UUIDs := Strs2UUIDs(req.UUIDs)
	ps, err := mars.FindRawPhotosByUUIDs(d.RDB, UUIDs, maskRawPhotoQueryOptions(req.PhotoEchoOption))
	if err != nil {
		return err
	}

	photoUUIDs := make([]uuid.UUID, len(ps))
	for k, v := range ps {
		photoUUIDs[k] = v.UUID
	}

	dQuery := d.RDB.Where("uuid IN (?)", photoUUIDs).Delete(mars.DB_RawPhoto{})
	if err := dQuery.Error; err != nil {
		return err
	}

	cu, err := mars.FirstUserByUUID(d.RDB, ps[0].UserUUID)
	if err != nil {
		return err
	}

	if err := cu.IncrementImages(d.RDB, -int32(dQuery.RowsAffected)); err != nil {
		return err
	}

	rsp.Photos = photos2echo(ps)
	return nil
}

func (d *Dream) rawPhotoByIDIfNecessary(ID int64, o *PhotoEchoOption) (*mars.DB_RawPhoto, error) {
	var photo *mars.DB_RawPhoto
	var err error
	if o != nil {
		op := maskRawPhotoQueryOptions(o)
		photo, err = mars.FirstRawPhotoByID(d.RDB, ID, op)
		if err != nil {
			return nil, err
		}
	} else {
		photo = &mars.DB_RawPhoto{Model: mars.Model{ID: ID}}
	}

	return photo, nil
}

func (d *Dream) rawPhotoByUUIDIfNecessary(UUID uuid.UUID, o *PhotoEchoOption) (*mars.DB_RawPhoto, error) {
	var photo *mars.DB_RawPhoto
	var err error
	if o != nil {
		op := maskRawPhotoQueryOptions(o)
		photo, err = mars.FirstRawPhotoByUUID(d.RDB, UUID, op)
		if err != nil {
			return nil, err
		}
	} else {
		photo = &mars.DB_RawPhoto{Model: mars.Model{UUID: UUID}}
	}

	return photo, nil
}

// DeletePhotoByID 方法可以通过 ID 删除指定照片
// DeletePhotoByID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) DeletePhotoByID(ctx context.Context, req *IDWithEchoOptionRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	// 通过返回判断是否需要额外查询 Photo
	photo, err := d.rawPhotoByIDIfNecessary(req.Id, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if photo == nil {
		return EntityNotFound
	}

	if err := photo.Delete(d.RDB); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Photo = photo2echo(photo)
	return nil
}

// DeletePhotoByUUID 是 DeletePhotoByID 的 UUID 形式
func (d Dream) DeletePhotoByUUID(ctx context.Context, req *UUIDWithEchoOptionRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)

	photo, err := d.rawPhotoByUUIDIfNecessary(UUID, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if photo == nil {
		return EntityNotFound
	}

	if err := photo.Delete(d.RDB); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Photo = photo2echo(photo)
	return nil
}

// FirstPhotoByID 可以通过 ID 查询指定的 Photo 对象, 如果相关 ID 不存在于数据库中
// 则返回空值
// FirstPhotoByID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) FirstPhotoByID(ctx context.Context, req *IDWithEchoOptionRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	EchoPhoto, err := d.EchoPhotoByID(req.Id, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if EchoPhoto == nil {
		rsp.Null = true
		return nil
	}

	rsp.Null = false
	rsp.Photo = EchoPhoto
	return nil
}

// FirstPhotoByIdentifier 可以通过 Identifier 查询指定的 Photo 对象,
// 如果相关 Identifier 不存在于数据库中,则返回空值
// FirstPhotoByIdentifier 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) FirstPhotoByUserIdentifier(ctx context.Context, req *UUIDWithIdentifierRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)

	op := maskRawPhotoQueryOptions(req.PhotoEchoOption)
	p, err := mars.FirstRawPhotoByUserIdentifier(d.RDB, UUID, req.Identifier, op)
	if err != nil {
		return err
	}
	if p == nil {
		rsp.Null = true
		return nil
	}

	rsp.Null = false
	rsp.Photo = photo2echo(p)
	return nil
}

// FirstPhotoByFileUUID 可以通过 FileUUID 查询指定的 Photo 对象,
// 如果相关 FileUUID 不存在于数据库中,则返回空值
// FirstPhotoByFileUUID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) FirstPhotoByFileUUID(ctx context.Context, req *UUIDWithEchoOptionRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	op := maskRawPhotoQueryOptions(req.PhotoEchoOption)
	p, err := mars.FirstPhotoByFileUUID(d.RDB, UUID)
	//TODO 这里要不要加 if p == nil ?
	if err != nil {
		return err
	}

	rp, err := mars.FirstRawPhotoByUUID(d.RDB, p.RawPhotoUUID, op)
	if err != nil {
		return err
	}
	if rp == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = photo2echo(rp)
	return nil
}

// FirstPhotoByUUID 可以通过 UUID 查询指定的 Photo 对象, 如果相关 UUID 不存在于数据库中
// 则返回空值
// FirstPhotoByUUID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) FirstPhotoByUUID(ctx context.Context, req *UUIDWithEchoOptionRequest, rsp *PhotoResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)

	photo, err := d.EchoPhotoByUUID(UUID, req.PhotoEchoOption)
	if err != nil {
		return err
	}
	if photo == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = photo
	return nil
}

// FindPhotoByIDs 可以通过 ID 列表查询指定的 Photo 对象, 如果相关 ID 不存在于数据库中
// 则返回空值, 需要注意的是, 本方法不保证顺序
// FindPhotoByIDs 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) FindPhotoByIDs(ctx context.Context, req *IDsWithEchoOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	op := maskRawPhotoQueryOptions(req.PhotoEchoOption)

	rPhotos, err := mars.FindRawPhotosByIDs(d.RDB, req.Ids, op)
	if err != nil {
		return err
	}

	rsp.Photos = photos2echo(rPhotos)
	return nil
}

// FindPhotoByUUIDs 是 FindPhotoByIDs 的 ID 列表形式
func (d Dream) FindPhotoByUUIDs(ctx context.Context, req *UUIDsWithEchoOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	UUIDs := Strs2UUIDs(req.UUIDs)

	op := maskRawPhotoQueryOptions(req.PhotoEchoOption)
	rPhotos, err := mars.FindRawPhotosByUUIDs(d.RDB, UUIDs, op)
	if err != nil {
		return err
	}

	rsp.Photos = photos2echo(rPhotos)
	return nil
}

// FindPhotosByUserUUID 可以通过 UserUUID 的方式查询相关 Photo, 本方法接受 3 个参数
// 第一个为 UserUUID, 即用户的 UUID
// 第二个为 QueryParameter, 即查询的选项, 可以通过本参数达到分页的效果
// 第三个为 PhotoEchoOption, 可以指定返回数据, 返回数据越少函数处理时间越快
func (d Dream) FindPhotosByUserUUID(ctx context.Context, req *UUIDWithOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)

	oqp := maskRawPhotoQueryOptions(req.PhotoEchoOption)
	photos, err := mars.FindRawPhotosByUserID(d.RDB, UUID, oqp, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.Photos = photos2echo(photos)
	return nil
}

// FindPhotosByUserID 是 FindPhotosByUserUUID 的 ID 列表模式
func (d Dream) FindPhotosByUserID(ctx context.Context, req *IDWithOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	oqp := maskRawPhotoQueryOptions(req.PhotoEchoOption)
	u, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}

	photos, err := mars.FindRawPhotosByUserID(d.RDB, u.UUID, oqp, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.Photos = photos2echo(photos)
	return nil
}

// FindPublicPhotosByUserUUID 可以通过 UserUUID 的方式查询相关 Public 的 Photo, 本方法接受 3 个参数
// 第一个为 UserUUID, 即用户的 UUID
// 第二个为 QueryParameter, 即查询的选项, 可以通过本参数达到分页的效果
// 第三个为 PhotoEchoOption, 可以指定返回数据, 返回数据越少函数处理时间越快
func (d Dream) FindPublicPhotosByUserUUID(ctx context.Context, req *UUIDWithOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)

	oqp := maskRawPhotoQueryOptions(req.PhotoEchoOption)
	photos, err := mars.FindPublicRawPhotosByUserID(d.RDB, UUID, oqp, req.QueryParameter)
	if err != nil {
		return err
	}

	rsp.Photos = photos2echo(photos)
	return nil
}

// FindPublicPhotosByUserID 是 FindPublicPhotosByUserUUID 的 ID 列表模式
func (d Dream) FindPublicPhotosByUserID(ctx context.Context, req *IDWithOptionRequest, rsp *Photos) error {
	d.Context(ctx)
	oqp := maskRawPhotoQueryOptions(req.PhotoEchoOption)
	u, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}

	photos, err := mars.FindRawPhotosByUserID(d.RDB, u.UUID, oqp, req.QueryParameter)
	if err != nil {
		return err
	}

	rsp.Photos = photos2echo(photos)
	return nil
}

// FirstPhotosWithDeleted 是 根据user查询最早的 photo 包括已经删除的
func (d Dream) FirstPhotosWithDeleted(ctx context.Context, req *GetByUUIDRequest, rsp *PhotoResponse) error {
	d.Context(ctx)

	userUUID := Str2UUID(req.UUID)
	photo, err := mars.FirstPhotosWithDeleted(d.RDB, userUUID)
	if err != nil {
		return err
	}
	if photo == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Photo = photo2echo(photo)
	return nil
}
