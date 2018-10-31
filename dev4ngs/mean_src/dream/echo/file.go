// This file "photoresponse" is created by Lincan Li at 5/6/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"errors"
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
	"github.com/jinzhu/gorm"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"qiniupkg.com/api.v7/kodo"
)

func (d Dream) NewFile(ctx context.Context, req *PostFileRequest, rsp *FileResponse) error {
	d.Context(ctx)
	file := echo2file(req.File)

	if file.ID != 0 {
		return IDExistOnSave
	}
	if file.UUID == uuid.Nil {
		file.UUID = uuid.NewV4()
	}

	if _, err := file.Save(d.RDB); err != nil {
		return err
	}
	rsp.File = file2echo(file)
	return nil
}

func (d Dream) UpdateFileByID(ctx context.Context, req *FileWithIDRequest, rsp *FileResponse) error {
	d.Context(ctx)
	nFile := echo2file(req.File)
	file := &mars.DB_File{Model: mars.Model{ID: req.Id}}

	if err := d.RDB.Model(&file).Updates(nFile).Error; err != nil {
		return err
	}
	rsp.File = file2echo(file)
	return nil
}

func (d Dream) UpdateFileByUUID(ctx context.Context, req *FileWithUUIDRequest, rsp *FileResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	nFile := echo2file(req.File)

	file, err := mars.FirstFileByUUID(d.RDB, UUID)
	if err != nil {
		return err
	}
	if file == nil {
		return EntityNotFound
	}

	if err := d.RDB.Model(&file).Updates(nFile).Error; err != nil {
		return err
	}
	file2echo(file)
	return nil
}

func (d Dream) PatchFileByID(ctx context.Context, req *FileWithIDRequest, rsp *FileResponse) error {
	d.Context(ctx)
	nFile := echo2file(req.File)
	file := &mars.DB_File{Model: mars.Model{ID: req.Id}}

	if err := d.RDB.Model(&file).Updates(nFile).Error; err != nil {
		return err
	}
	file2echo(file)
	return nil
}

func (d Dream) DeleteFileByID(ctx context.Context, req *GetByIDRequest, rsp *FileResponse) error {
	d.Context(ctx)
	file := &mars.DB_File{Model: mars.Model{ID: req.Id}}

	if err := file.Delete(d.RDB); err != nil {
		return err
	}
	rsp.File = file2echo(file)
	return nil
}

func (d Dream) DeleteFileByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *FileResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	file := &mars.DB_File{Model: mars.Model{UUID: UUID}}

	if err := file.Delete(d.RDB); err != nil {
		return err
	}
	rsp.File = file2echo(file)
	return nil
}

func (d Dream) GetFileByPersistentID(ctx context.Context, req *FileWithPIDRequest, rsp *FileResponse) error {
	d.Context(ctx)
	photo, err := mars.FirstFileByPersistentID(d.RDB, req.PID)
	if err != nil {
		return err
	}
	rsp.File = file2echo(photo)
	return nil
}

func (d Dream) GetFileByID(ctx context.Context, req *GetByIDRequest, rsp *FileResponse) error {
	d.Context(ctx)
	photo, err := mars.FirstFileByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	rsp.File = file2echo(photo)
	return nil
}

func (d Dream) GetFileByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *FileResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	photo, err := mars.FirstFileByUUID(d.RDB, UUID)
	if err != nil {
		return err
	}
	rsp.File = file2echo(photo)
	return nil
}

func (d Dream) FindFileByIDs(ctx context.Context, req *GetByIDsRequest, rsp *Files) error {
	d.Context(ctx)
	photo, err := mars.FindFilesByIDs(d.RDB, req.Ids)
	if err != nil {
		return err
	}
	rsp.Files = files2echo(photo)
	return nil
}

func (d Dream) FindFileByUUIDs(ctx context.Context, req *GetByUUIDsRequest, rsp *Files) error {
	d.Context(ctx)
	UUIDs := Strs2UUIDs(req.UUIDs)
	photo, err := mars.FindFilesByUUIDs(d.RDB, UUIDs)
	if err != nil {
		return err
	}
	rsp.Files = files2echo(photo)
	return nil
}

func (d Dream) FindFileByUserUUID(ctx context.Context, req *FindByUUIDWithQPRequest, rsp *Files) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	files, err := mars.FindFileByUserUUID(d.RDB, UUID, req.QueryParameter)
	if err != nil {
		return err
	}

	rsp.Files = files2echo(files)
	return nil
}

func (d Dream) FindFileByUserID(ctx context.Context, req *FindByIDWithQPRequest, rsp *Files) error {
	d.Context(ctx)
	u, err := mars.FirstUserByID(d.RDB, req.ID)
	if err != nil {
		return err
	}

	files, err := mars.FindFileByUserUUID(d.RDB, u.UUID, req.QueryParameter)
	if err != nil {
		return err
	}

	rsp.Files = files2echo(files)
	return nil
}

// MARK - Photo Pipeline Operations

// UpgradePhotoByFileUUID 可以指定 Photo 中的 Display Photo, 并根据 File 中的 Persistent type 来判断
// 具体操作的类型
func (d Dream) UpgradePhotoByFileID(ctx context.Context, req *GetByIDRequest, rsp *Empty) error {
	d.Context(ctx)
	file, err := mars.FirstFileByID(d.RDB, req.Id)

	if err != nil {
		return err
	}
	if file == nil {
		return EntityNotFound
	}

	switch file.PersistentType {
	case PersistentType_persistent_type_new_photo:
		err = persistentHandlerNewPhoto(d.RDB, file)
	case PersistentType_persistent_type_new_edited_photo:
		err = persistentHandlerNewEditedPhoto(d.RDB, file)
	case PersistentType_persistent_type_edited_photo:
		err = persistentHandlerEditedPhoto(d.RDB, file)
	}

	if err != nil {
		panic(err)
	}

	return nil
}

var (
	//QNBucketURL string
	QNBucketURL = "7xodxr.com2.z0.glb.qiniucdn.com"
)

func persistentHandlerNewPhoto(RDB *gorm.DB, f *mars.DB_File) error {
	p, err := mars.FirstPhotoByFileUUID(RDB, f.UUID)
	if err != nil {
		return err
	}
	if p == nil {
		return EntityNotFound
	}

	p.ImageSize = f.Size
	p.InPipeline = Boolean(false)
	if _, err := p.Save(RDB); err != nil {
		return err
	}

	return nil
}

func persistentHandlerNewEditedPhoto(RDB *gorm.DB, f *mars.DB_File) error {
	p, err := mars.FirstPhotoByFileUUID(RDB, f.UUID)
	if err != nil {
		return err
	}
	if p == nil {
		return EntityNotFound
	}

	rP, err := p.GetRawPhoto(RDB)

	if err != nil {
		return err
	}
	if rP == nil {
		return errors.New("find the row photo by file but not found")
	}
	rP.SetDisplayPhoto(p).InPipeline = Boolean(false)
	if _, err := rP.Save(RDB); err != nil {
		return err
	}

	p.InPipeline = Boolean(false)
	p.ImageSize = f.Size
	p.ImageURL = String(kodo.MakeBaseUrl(QNBucketURL, f.Key.GetString()))
	if _, err := p.Save(RDB); err != nil {
		return err
	}

	return nil
}

func persistentHandlerEditedPhoto(RDB *gorm.DB, f *mars.DB_File) error {
	p, err := mars.FirstPhotoByFileUUID(RDB, f.UUID)
	if err != nil {
		return err
	}
	if p == nil {
		return EntityNotFound
	}

	rP, err := p.GetRawPhoto(RDB)
	if err != nil {
		return err
	}

	err = rP.IncrementDisplayVersion(RDB, 1)
	if err != nil {
		return err
	}

	p.DisplayVersion = rP.DisplayVersion
	p.InPipeline = Boolean(false)
	p.ImageSize = f.Size
	p.ImageURL = String(kodo.MakeBaseUrl(QNBucketURL, f.Key.GetString()))
	if _, err := p.Save(RDB); err != nil {
		return err
	}

	rP.SetDisplayPhoto(p).InPipeline = Boolean(false)
	if _, err := rP.Save(RDB); err != nil {
		return err
	}

	return nil
}
