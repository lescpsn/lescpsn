// This file "image.go" is created by Lincan Li at 11/16/2015
// Copyright Negative Space Tech LLC. All rights reserved.
//
// Package models provides data model definition in Tuso project
package huston

import (
	"encoding/json"
	"git.ngs.tech/mean/houston/fileManager"
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"time"
	"unicode"
)

// Mark - MeanController
//
//
// 以下方法为 MeanController 子方法, 主要是完成业务逻辑层的相关内容. Photo 相关的业务逻辑主要由数据访问层拼接而成
// 加上根据业务逻辑而调整的权限控制系统.

// CreatePhoto 方法: 创建 Photo 并自增用户图片字段. bucket, key 和 etag 是 七牛 生成的三个关键值, 用于识别
// 图片储存的具体位置. p 为图片隐私级别. width 和 height 表示 图片精确的高和宽. MD5 指的是图片的 MD5, MD5 对于
// 同一用户的非删除照片应当是唯一的. pcv 为主色调, 由 R G B A 四个参数组成. glv 为地理位置 json. 同时 滤镜 和 裁剪
// 信息都需要传入.
func (m *MeanController) CreatePhoto(cu *User, rImage *RestImage) (Dungeons, error) {
	//TODO 根据需求临时注释掉这段代码
	//MD5Photo, err := FirstRawPhotoByMD5(m.RDB, cu, md5, &RawPhotoQueryOptions{NilIfErrRecordNotFound: true})
	//if err != nil {
	//	return nil, err
	//}
	//if MD5Photo != nil {
	//	return nil, PhotoExistErr
	//}

	// New File Manager
	/*
		fmt.Println("*********************insert photo:test")
		m.InsertDiaryMixPhoto(m.NewDiarymixphotoByPhoto("0", "0", "0", 0))
	*/

	fm := fileManager.NewFileManager()

	var oi *Photo
	// 原图 LitePhoto 生成器 Pipeline

	file := &File{
		UserUUID: cu.UUID,
		Bucket:   String(rImage.Bucket),
		Key:      String(rImage.Key),
		Size:     Integer(rImage.FileSize),
	}
	fRsp, err := Cl.NewFile(context.TODO(), &PostFileRequest{
		File: file,
	})
	bFile := fRsp.File
	if err != nil {
		return nil, err
	}
	photo := &Photo{
		UserUUID:     cu.UUID,
		InPipeline:   Boolean(true),
		Identifier:   String(rImage.MD5),
		PhotoPrivacy: Str2PhotoPrivacy(rImage.Privacy),
		PrimaryColor: String(rImage.PrimaryColorHex),
		GEOLocation:  String(rImage.GeoLocationValue),
		Exif:         String(rImage.Exif),
		Timestamp:    rImage.TimeStamp.Format(time.RFC3339),
		RawPhoto: &BasePhoto{
			Width:    Integer(rImage.Width),
			Height:   Integer(rImage.Height),
			FileUUID: bFile.UUID,
			FileSize: bFile.Size,
			FileURL:  String(fm.GetDownloadURL(bFile.Key.GetString())),
		},
	}
	pRsp, err := Cl.NewPhoto(context.TODO(), &PhotoWithEchoOptionRequest{
		Photo:           photo,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	oi = pRsp.Photo
	if err != nil {
		return nil, err
	}

	// DisplayPhoto 图片生成器 Pipeline
	ePLine := fm.NewPipeline(rImage.Key)
	ePLine, err = EditPipelineInUploadr(ePLine, rImage.Key, rImage.EditParams)
	if err != nil {
		return nil, err
	}
	ePLine.AppendPersistent(ePLine.LiteImageParameter())
	eNKey := ePLine.SaveAs()
	ePLine.GetPersistedOps()

	eFileUUID := uuid.NewV4()
	eFile := &File{
		UUID:           eFileUUID.String(),
		UserUUID:       cu.UUID,
		Bucket:         String(rImage.Bucket),
		Key:            String(eNKey),
		PersistentType: PersistentType_persistent_type_new_edited_photo,
	}

	dPhoto := &Photo{
		UserUUID:     cu.UUID,
		PrimaryColor: String(rImage.PrimaryColorHex),
		EditParam:    String(rImage.EditParams),
		Timestamp:    rImage.TimeStamp.Format(time.RFC3339),
		Width:        Integer(rImage.Width),
		Height:       Integer(rImage.Height),
		FileUUID:     eFileUUID.String(),
		FileURL:      String(fm.GetDownloadURL(eFile.Key.GetString())),
		InPipeline:   Boolean(true),
	}

	if rImage.EditParams != "" {
		var e EditParams

		err = json.Unmarshal([]byte(rImage.EditParams), &e)
		if err != nil {
			return nil, err
		}
		if e.Crop != nil {
			dPhoto.Width = Integer(e.Crop.Width)
			dPhoto.Height = Integer(e.Crop.Height)
		}
	}
	dRsp, err := Cl.UpgradePhotoByID(context.TODO(), &PhotoWithIDRequest{
		Id:              oi.ID,
		Photo:           dPhoto,
		PhotoEchoOption: &PhotoEchoOption{FetchBasePhoto: true, FetchUser: true},
	})
	dPhoto = dRsp.Photo
	if err != nil {
		return nil, err
	}
	pID, err := ePLine.Put()
	if err != nil {
		return nil, err
	}

	eFile.PersistentID = String(pID)
	_, err = Cl.NewFile(context.TODO(), &PostFileRequest{
		File: eFile,
	})
	if err != nil {
		return nil, err
	}

	if cu.FirstPhoto == "" {
		cu.FirstPhoto = time.Now().Format(time.RFC3339)
		_, err := Cl.UpdateUser(context.TODO(), &PutUserByUUIDRequest{
			UUID: cu.UUID,
			User: cu,
		})
		if err != nil {
			return nil, err
		}
	}

	d, err := PhotoToData(dPhoto, &PhotoDataOption{FillSensitive: true})
	if err != nil {
		return nil, err
	}

	m.InsertDiaryMixPhoto(m.NewDiarymixphotoByPhoto(cu.UUID, oi.UUID, oi.PhotoPrivacy.String(), oi.ID))

	return d, nil

}

func (m *MeanController) UpdatePhoto(cu *User, UUID uuid.UUID, eParams *EditParams) (Dungeons, error) {

	pRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            UUID.String(),
		PhotoEchoOption: &PhotoEchoOption{FetchBasePhoto: true},
	})
	if err != nil {
		return nil, err
	}
	if pRsp.Null {
		return nil, PhotoNotFound
	}
	photo := pRsp.Photo
	if cu.UUID != photo.UserUUID {
		return nil, InsufficientPermissionsErr
	}

	eJSON, err := json.Marshal(eParams)
	if err != nil {
		return nil, err
	}
	rFRsp, err := Cl.GetFileByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: photo.RawPhoto.FileUUID,
	})
	if err != nil {
		return nil, err
	}
	rFile := rFRsp.File

	// New File Manager
	fm := fileManager.NewFileManager()
	pLine := fm.NewPipeline(rFile.Key.GetString())
	pLine, err = EditPipelineInUploadrByEditParameter(pLine, eParams)
	if err != nil {
		return nil, err
	}
	pLine.AppendPersistent(pLine.LiteImageParameter())
	nKey := pLine.SaveAs()
	pLine.GetPersistedOps()
	pID, err := pLine.Put()
	if err != nil {
		return nil, err
	}
	file := &File{
		UserUUID:       cu.UUID,
		Bucket:         String(fm.GetBucketName()),
		Key:            String(nKey),
		PersistentID:   String(pID),
		PersistentType: PersistentType_persistent_type_edited_photo,
	}
	eFRsp, err := Cl.NewFile(context.TODO(), &PostFileRequest{
		File: file,
	})
	eFile := eFRsp.File
	if err != nil {
		return nil, err
	}

	dPhoto := &Photo{
		UserUUID:   cu.UUID,
		FileUUID:   eFile.UUID,
		FileSize:   eFile.Size,
		FileURL:    String(fm.GetDownloadURL(eFile.Key.GetString())),
		EditParam:  String(string(eJSON)),
		InPipeline: Boolean(true),
	}

	if eParams.Crop != nil {
		dPhoto.Width = Integer(eParams.Crop.Width)
		dPhoto.Height = Integer(eParams.Crop.Height)
	} else {
		dPhoto.Width = photo.Width
		dPhoto.Height = photo.Height
	}
	_, err = Cl.NewDisplayPhoto(context.TODO(), &PhotoWithUUIDRequest{
		UUID:            photo.UUID,
		Photo:           dPhoto,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}

	d, err := PhotoToData(photo, &PhotoDataOption{FillSensitive: true})
	if err != nil {
		return nil, err
	}
	d = ToDataWithPhoto(*photo, d, dPhoto)
	d[`display_version`] = 0

	return d, nil
}

// GetPhotoDataByUUID 方法: 通过 UUID 返回图片数据. 本方法中会验证用户的权限, 如果传入的 UUID 所代表的
// 图片的所有者 和 资源请求者 不是一个人或不是好友关系, 则会返回权限不足错误
func (m *MeanController) GetPhotoDataByUUID(cu *User, UUID uuid.UUID) (Dungeons, error) {

	pRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            UUID.String(),
		PhotoEchoOption: &PhotoEchoOption{FetchNote: true, FetchUser: true},
	})
	if err != nil {
		return nil, err
	}
	if pRsp.Null {
		return nil, PhotoNotFound
	}
	p := pRsp.Photo
	if cu.UUID != p.UserUUID {
		if p.PhotoPrivacy != PhotoPrivacy_photo_privacy_public {
			return nil, InsufficientPermissionsErr
		}
		rTRsp, err := Cl.GetRelationType(context.TODO(), &GetRelationRequest{
			FromID: p.User.ID,
			ToID:   cu.ID,
		})
		t := rTRsp.UserRelatedType
		if err != nil {
			return nil, err
		}
		if t < UserRelatedType_related_type_friend {
			return nil, InsufficientPermissionsErr
		}
	}

	d, err := PhotoToData(p, &PhotoDataOption{FillSensitive: cu.UUID == p.UserUUID})
	if err != nil {
		return nil, err
	}

	return d, nil
}

// PhotoMD5Duplication 方法: 返回 MD5 是否在系统内对于本用户的 非删除 照片是否是唯一的.
func (m *MeanController) PhotoMD5Duplication(cu *User, MD5 string) (Dungeons, error) {

	iRsp, err := Cl.FirstPhotoByUserIdentifier(context.TODO(), &UUIDWithIdentifierRequest{
		UUID:            cu.UUID,
		Identifier:      MD5,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	image := iRsp.Photo
	d := make(Dungeons)
	d[`validation`] = image == nil

	if image != nil {
		d[`photo_uuid`] = image.UUID
	}

	return d, nil
}

// PublicPhoto 方法: 将指定照片设为公开.
func (m *MeanController) PublicPhoto(cu *User, iUUIDString string) (Dungeons, error) {

	pRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            iUUIDString,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	if pRsp.Null {
		return nil, PhotoNotFound
	}
	p := pRsp.Photo
	if cu.UUID != p.UserUUID {
		return nil, InsufficientPermissionsErr
	}

	UUIDStrings := []string{p.UUID}
	psRsp, err := Cl.PublicPhotosByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           UUIDStrings,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	ps := psRsp.Photos
	d, err := PhotoToData(ps[0], &PhotoDataOption{FillSensitive: ps[0].UserUUID == cu.UUID})
	if err != nil {
		return nil, err
	}

	m.UpdateDiaryMixPhoto4Photo(UUIDStrings, PhotoPrivacy_photo_privacy_public.String())

	return d, nil
}

// PublicPhotos 方法: 将指定照片数组设为公开.
func (m *MeanController) PublicPhotos(cu *User, iUUIDStrings []string) ([]Dungeons, error) {

	psRsp, err := Cl.FindPhotoByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           iUUIDStrings,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	ps := psRsp.Photos
	if ps == nil || len(ps) == 0 {
		return nil, PhotoNotFound
	}
	for _, p := range ps {
		if cu.UUID != p.UserUUID {
			return nil, InsufficientPermissionsErr
		}
	}

	pUUIDs := make([]string, len(ps))
	for k, v := range ps {
		pUUIDs[k] = v.UUID
	}
	psRsp, err = Cl.PublicPhotosByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           pUUIDs,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	ps = psRsp.Photos
	ds := make([]Dungeons, len(ps))
	for k, v := range ps {
		ds[k], err = PhotoToData(v, &PhotoDataOption{FillSensitive: v.UserUUID == cu.UUID})
		if err != nil {
			return nil, err
		}
	}
	m.UpdateDiaryMixPhoto4Photo(pUUIDs, PhotoPrivacy_photo_privacy_public.String())
	return ds, nil
}

// PrivatePhoto 方法: 将指定照片设为隐私.
func (m *MeanController) PrivatePhoto(cu *User, iUUIDStrings string) (Dungeons, error) {

	pRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            iUUIDStrings,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	if pRsp.Null {
		return nil, PhotoNotFound
	}
	p := pRsp.Photo
	if cu.UUID != p.UserUUID {
		return nil, InsufficientPermissionsErr
	}

	UUIDStrings := []string{p.UUID}
	psRsp, err := Cl.PrivatePhotosByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           UUIDStrings,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	ps := psRsp.Photos
	d, err := PhotoToData(ps[0], &PhotoDataOption{FillSensitive: ps[0].UserUUID == cu.UUID})
	if err != nil {
		return nil, err
	}

	m.UpdateDiaryMixPhoto4Photo(UUIDStrings, PhotoPrivacy_photo_privacy_private.String())
	return d, nil
}

// PrivatePhotos 方法: 将指定照片数组设为隐私.
func (m *MeanController) PrivatePhotos(cu *User, iUUIDStrings []string) ([]Dungeons, error) {

	psRsp, err := Cl.FindPhotoByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           iUUIDStrings,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	ps := psRsp.Photos
	if ps == nil || len(ps) == 0 {
		return nil, PhotoNotFound
	}
	for _, p := range ps {
		if cu.UUID != p.UserUUID {
			return nil, InsufficientPermissionsErr
		}
	}
	pUUIDs := make([]string, len(ps))
	for k, v := range ps {
		pUUIDs[k] = v.UUID
	}
	psRsp, err = Cl.PrivatePhotosByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           pUUIDs,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	ps = psRsp.Photos
	if err != nil {
		return nil, err
	}
	ds := make([]Dungeons, len(ps))
	for k, v := range ps {
		ds[k], err = PhotoToData(v, &PhotoDataOption{FillSensitive: v.UserUUID == cu.UUID})
		if err != nil {
			return nil, err
		}
	}

	m.UpdateDiaryMixPhoto4Photo(pUUIDs, PhotoPrivacy_photo_privacy_private.String())

	return ds, nil
}

// DeletePhoto 方法: 删除指定的 照片
func (m *MeanController) DeletePhoto(cu *User, iUUIDString string) (Dungeons, error) {
	m.DelDiaryMixPhotoByUUID(iUUIDString, DataTypePhoto)

	pRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            iUUIDString,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	if pRsp.Null {
		return nil, PhotoNotFound
	}
	p := pRsp.Photo
	if cu.UUID != p.UserUUID {
		return nil, InsufficientPermissionsErr
	}

	UUIDStrings := []string{p.UUID}
	psRsp, err := Cl.DeletePhotosByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           UUIDStrings,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	ps := psRsp.Photos
	d, err := PhotoToData(ps[0], &PhotoDataOption{FillSensitive: ps[0].UserUUID == cu.UUID})
	if err != nil {
		return nil, err
	}

	return d, nil
}

// DeletePhoto 方法: 删除指定的 照片数组
func (m *MeanController) DeletePhotos(cu *User, iUUIDStrings []string) ([]Dungeons, error) {

	psRsp, err := Cl.FindPhotoByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           iUUIDStrings,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	ps := psRsp.Photos
	if ps == nil || len(ps) == 0 {
		return nil, PhotoNotFound
	}
	for _, p := range ps {
		if cu.UUID != p.UserUUID {
			return nil, InsufficientPermissionsErr
		}
	}

	pUUIDs := make([]string, len(ps))
	for k, v := range ps {
		pUUIDs[k] = v.UUID
	}
	psRsp, err = Cl.DeletePhotosByUUIDs(context.TODO(), &UUIDsWithEchoOptionRequest{
		UUIDs:           pUUIDs,
		PhotoEchoOption: &PhotoEchoOption{},
	})
	if err != nil {
		return nil, err
	}
	ps = psRsp.Photos
	ds := make([]Dungeons, len(ps))
	for k, v := range ps {
		ds[k], err = PhotoToData(v, &PhotoDataOption{FillSensitive: v.UserUUID == cu.UUID})
		if err != nil {
			return nil, err
		}
	}

	return ds, nil
}

// FindPhotos 方法: 通过 QueryParameter 协议查询某个用户的照片. 动作发送者和照片所有者之间必须是好友关系或是一个人
// 否则权限会不够
func (m *MeanController) FindPhotos(cu *User, tUUID uuid.UUID, o *QueryParameter) ([]Dungeons, error) {

	tuRsp, err := Cl.GetUserByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: tUUID.String(),
	})
	if err != nil {
		return nil, err
	}
	if tuRsp.Null {
		return nil, UserNotFoundErr
	}
	tu := tuRsp.User
	uTRsp, err := Cl.GetRelationType(context.TODO(), &GetRelationRequest{
		FromID: cu.ID,
		ToID:   tu.ID,
	})
	if err != nil {
		return nil, err
	}
	uType := uTRsp.UserRelatedType
	eo := &PhotoEchoOption{FetchNote: true, FetchUser: true, FetchBasePhoto: true}
	var is []*Photo
	if cu.UUID != tu.UUID {
		if uType < UserRelatedType_related_type_friend {
			return nil, InsufficientPermissionsErr
		}
		isRsp, err := Cl.FindPublicPhotosByUserUUID(context.TODO(), &UUIDWithOptionRequest{
			UUID:            tu.UUID,
			QueryParameter:  o,
			PhotoEchoOption: eo,
		})
		if err != nil {
			return nil, err
		}
		is = isRsp.Photos
	} else {
		isRsp, err := Cl.FindPhotosByUserUUID(context.TODO(), &UUIDWithOptionRequest{
			UUID:            tu.UUID,
			QueryParameter:  o,
			PhotoEchoOption: eo,
		})
		if err != nil {
			return nil, err
		}
		is = isRsp.Photos
	}

	ds := []Dungeons{}
	for _, i := range is {
		d, err := PhotoToData(i, &PhotoDataOption{FillSensitive: cu.UUID == i.UserUUID})
		if err != nil {
			return ds, err
		}
		d[`exif`] = i.Exif.GetString()
		ds = append(ds, d)
	}

	return ds, nil
}

const (
	iosCallBack    = "vbr/photo_callback"
	avatarCallBack = "vbr/avatar_callback"
)

// NewUpToken 方法: 返回一个新的七牛上传 Token.
func (m *MeanController) NewUpToken(curlType string) (*SingleEntity, error) {
	f := fileManager.NewFileManager()
	var callbackURL string
	switch curlType {
	default:
		callbackURL = iosCallBack
	}
	k, t := f.UpToken(callbackURL)

	se := &SingleEntity{
		QNToken: k,
		Expires: &t,
	}

	return se, nil
}

// CreateNote 方法: 创建一个新的 Note, Note 由 title 和 content 组成
// 同时, 由于 Note 是依附在 Photo 上的, 所以要传入相应的 UUID 数组
func (m *MeanController) CreateNote(cu *User, iUUID uuid.UUID, title, content, style string, timestamp time.Time) (Dungeons, error) {

	count := 0

	for _, r := range title {
		if unicode.Is(unicode.Scripts["Han"], r) {
			count = count + 2
		} else {
			count = count + 1
		}
		if count > 36 {
			return nil, NoteCharacterErr
		}
	}
	pRsp, err := Cl.FirstPhotoByUUID(context.TODO(), &UUIDWithEchoOptionRequest{
		UUID:            iUUID.String(),
		PhotoEchoOption: &PhotoEchoOption{FetchUser: true, FetchNote: true, FetchBasePhoto: true},
	})

	if err != nil {
		return nil, err
	}
	if pRsp.Null {
		return nil, PhotoNotFound
	}
	p := pRsp.Photo
	if cu.UUID != p.UserUUID {
		return nil, InsufficientPermissionsErr
	}

	// TODO the return of the err
	if title == "" {
		return nil, PhotoNoteMustHaveTitleErr
	}
	if timestamp == (time.Time{}) {
		return nil, RequestParamsErr
	}

	if p.Note != nil {
		return nil, NoteExistErr
	}

	//TODO 如果英文随记? 我现在把这一段给注释掉了,内容不超过110个汉字不做限制 这个细节需要讨论
	//if strings.Count(content, "") > 110 {
	//	return nil, NoteCharacterErr
	//}
	nRsp, err := Cl.NewNote(context.TODO(), &PostNoteRequest{
		Note: &Note{
			Title:     String(title),
			Content:   String(content),
			Style:     String(style),
			Timestamp: timestamp.Format(time.RFC3339),
		},
	})
	if err != nil {
		return nil, err
	}
	note := nRsp.Note
	_, err = Cl.PatchPhotoByID(context.TODO(), &PhotoWithIDRequest{
		Id:              p.ID,
		Photo:           &Photo{NoteUUID: note.UUID},
		PhotoEchoOption: &PhotoEchoOption{},
	})

	if err != nil {
		return nil, err
	}
	p.Note = note
	p.NoteUUID = note.UUID

	d, err := PhotoToData(p, &PhotoDataOption{FillSensitive: cu.UUID == p.UserUUID})
	if err != nil {
		return nil, err
	}

	return d, nil
}

// UpdateNote 方法: 更新 Note, 注意 Note 只能在创建后 24 内 添加标题或正文并修改
// 在 24 以外, 如果没有添加 标题, 则不能添加正文
func (m *MeanController) UpdateNote(cu *User, UUID uuid.UUID, title, content, style string) (Dungeons, error) {

	count := 0
	for _, r := range title {
		if unicode.Is(unicode.Scripts["Han"], r) {
			count = count + 2
		} else {
			count = count + 1
		}
		if count > 36 {
			return nil, NoteCharacterErr
		}
	}
	nRsp, err := Cl.GetNoteByUUID(context.TODO(), &GetByUUIDRequest{
		UUID: UUID.String(),
	})
	if err != nil {
		return nil, err
	}
	if nRsp.Null {
		return nil, NoteNotFoundErr
	}
	n := nRsp.Note
	if cu.UUID == n.UserUUID {
		return nil, InsufficientPermissionsErr
	}

	aDayBefore := time.Now().AddDate(0, 0, -1)
	outTimePhoto := Str2Time(n.CreatedAt).Before(aDayBefore)

	if n.Title.GetString() == "" && outTimePhoto {
		return nil, NoteUpdateTimeOutErr
	}

	if outTimePhoto && n.Title.GetString() != "" && n.Content.GetString() != "" {
		return nil, NoteUpdateTimeOutErr
	}
	nRsp, err = Cl.UpdateNoteByID(context.TODO(), &NoteByIDRequest{
		Id: n.ID,
		Note: &Note{
			Title:   String(title),
			Content: String(content),
			Style:   String(style),
		},
	})
	if err != nil {
		return nil, err
	}
	n = nRsp.Note
	return NoteToData(n), nil
}
