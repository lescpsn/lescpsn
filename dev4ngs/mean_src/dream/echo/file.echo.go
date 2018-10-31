// This file "file.echo.go" is created by Lincan Li at 6/16/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
)

func echo2file(eFile *File) *mars.DB_File {
	return &mars.DB_File{
		Model: mars.Model{
			ID:   eFile.ID,
			UUID: Str2UUID(eFile.UUID),
		},
		UserUUID:       Str2UUID(eFile.UserUUID),
		Bucket:         eFile.Bucket,
		Key:            eFile.Key,
		Size:           eFile.Size,
		PersistentID:   eFile.PersistentID,
		PersistentType: eFile.PersistentType,
	}
}

func file2echo(file *mars.DB_File) *File {
	return &File{
		ID:             file.ID,
		UUID:           file.UUID.String(),
		CreatedAt:      Time2Str(file.CreatedAt),
		UserUUID:       file.UserUUID.String(),
		Bucket:         file.Bucket,
		Key:            file.Key,
		Size:           file.Size,
		PersistentID:   file.PersistentID,
		PersistentType: file.PersistentType,
	}
}

func files2echo(files []*mars.DB_File) []*File {
	var fEchos []*File
	for _, file := range files {
		fEchos = append(fEchos, file2echo(file))
	}
	return fEchos
}
