// This file "photo.echo.go" is created by Lincan Li at 6/15/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
	"time"
)

func echo2photo(ePhoto *Photo) *mars.DB_RawPhoto {
	photo := &mars.DB_RawPhoto{
		Model: mars.Model{
			ID:   ePhoto.ID,
			UUID: Str2UUID(ePhoto.UUID),
		},
		UserUUID:      Str2UUID(ePhoto.UserUUID),
		InPipeline:    ePhoto.InPipeline,
		Identifier:    ePhoto.Identifier,
		PhotoPrivacy:  ePhoto.PhotoPrivacy,
		GeoLocation:   ePhoto.GEOLocation,
		Exif:          ePhoto.Exif,
		CommentsCount: ePhoto.CommentsCount,
		NoteUUID:      Str2UUID(ePhoto.NoteUUID),
		Timestamp:     Str2Time(ePhoto.Timestamp),
	}

	if ePhoto.RawPhoto != nil {
		bPhoto := &mars.DB_Photo{
			UserUUID:     Str2UUID(ePhoto.UserUUID),
			RawPhotoUUID: Str2UUID(ePhoto.UUID),
			PrimaryColor: ePhoto.RawPhoto.PrimaryColor,
			ImageUUID:    Str2UUID(ePhoto.RawPhoto.FileUUID),
			ImageURL:     ePhoto.RawPhoto.FileURL,
			ImageSize:    ePhoto.RawPhoto.FileSize,
			Width:        ePhoto.RawPhoto.Width,
			Height:       ePhoto.RawPhoto.Height,
		}

		photo.BasePhoto = bPhoto
	}

	dPhoto := mars.DB_Photo{
		DisplayVersion: ePhoto.DisplayVersion,
		Type:           ePhoto.PhotoType,
		ImageUUID:      Str2UUID(ePhoto.FileUUID),
		ImageURL:       ePhoto.FileURL,
		ImageSize:      ePhoto.FileSize,
		Width:          ePhoto.Width,
		Height:         ePhoto.Height,
		EditParams:     ePhoto.EditParam,
		Avatar:         ePhoto.IsAvatar,
		Tuso:           ePhoto.IsTuso,
		RawPhotoUUID:   Str2UUID(ePhoto.UUID),
	}

	if dPhoto == (mars.DB_Photo{}) {
		photo.DisplayPhoto = nil

	} else {
		dPhoto.UserUUID = Str2UUID(ePhoto.UserUUID)
		dPhoto.PrimaryColor = ePhoto.PrimaryColor
		photo.DisplayPhoto = &dPhoto

	}

	return photo
}

func echos2photos(pEchos []*Photo) []*mars.DB_RawPhoto {
	var photos []*mars.DB_RawPhoto
	for _, pEcho := range pEchos {
		photos = append(photos, echo2photo(pEcho))
	}
	return photos
}

func photo2echo(photo *mars.DB_RawPhoto) *Photo {
	if photo == nil || *photo == (mars.DB_RawPhoto{}) {
		return nil
	}
	pEcho := &Photo{
		ID:             photo.ID,
		UUID:           photo.UUID.String(),
		UserUUID:       photo.UserUUID.String(),
		InPipeline:     photo.InPipeline,
		Identifier:     photo.Identifier,
		PhotoPrivacy:   photo.PhotoPrivacy,
		GEOLocation:    photo.GeoLocation,
		Exif:           photo.Exif,
		NoteUUID:       photo.NoteUUID.String(),
		CommentsCount:  photo.CommentsCount,
		DisplayVersion: photo.DisplayVersion,
		Timestamp:      Time2Str(photo.Timestamp),
		CreatedAt:      Time2Str(photo.CreatedAt),
	}

	if dPhoto := photo.DisplayPhoto; dPhoto != nil {
		pEcho.UserUUID = dPhoto.UserUUID.String()
		pEcho.PhotoType = dPhoto.Type
		pEcho.FileUUID = dPhoto.ImageUUID.String()
		pEcho.FileURL = dPhoto.ImageURL
		pEcho.FileSize = dPhoto.ImageSize
		pEcho.Width = dPhoto.Width
		pEcho.Height = dPhoto.Height
		pEcho.PrimaryColor = dPhoto.PrimaryColor
		pEcho.EditParam = dPhoto.EditParams
		pEcho.IsAvatar = dPhoto.Avatar
		pEcho.IsTuso = dPhoto.Tuso
		pEcho.UUID = dPhoto.RawPhotoUUID.String()
	}

	if bPhoto := photo.BasePhoto; bPhoto != nil {
		pEcho.RawPhoto = &BasePhoto{
			ID:           bPhoto.ID,
			UUID:         bPhoto.UUID.String(),
			PrimaryColor: bPhoto.PrimaryColor,
			FileUUID:     bPhoto.ImageUUID.String(),
			FileURL:      bPhoto.ImageURL,
			FileSize:     bPhoto.ImageSize,
			Width:        bPhoto.Width,
			Height:       bPhoto.Height,
		}
	}

	if eNote := photo.Note; eNote != nil {
		pEcho.Note = &Note{
			ID:        eNote.ID,
			UUID:      eNote.UUID.String(),
			Title:     eNote.Title,
			Content:   eNote.Content,
			Style:     eNote.Style,
			Timestamp: eNote.Timestamp.Format(time.RFC3339),
		}
	}

	if usr := photo.User; usr != nil {
		pEcho.User = user2echo(usr)
	}

	return pEcho
}

func photos2echo(photos []*mars.DB_RawPhoto) []*Photo {
	var pEchos []*Photo
	for _, photo := range photos {
		pEchos = append(pEchos, photo2echo(photo))
	}
	return pEchos
}
