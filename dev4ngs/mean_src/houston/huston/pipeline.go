// This file "pipeline.go" is created by Lincan Li at 1/28/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package huston

import (
	"git.ngs.tech/mean/houston/fileManager"
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

type PersistentCallBack struct {
	PersistentID string                    `json:"id"`
	Code         int                       `json:"code"`
	Description  string                    `json:"desc"`
	InputKey     string                    `json:"inputKey"`
	InputBucket  string                    `json:"inputBucket"`
	Items        []*PersistentActionResult `json:"items"`
}

type PersistentActionResult struct {
	CMD         string `json:"cmd"`
	Code        int    `json:"code"`
	Description string `json:"desc"`
	Error       string `json:"error"`
	Hash        string `json:"hash"`
	Key         string `json:"key"`
	ReturnOld   int    `json:"returnOld"`
}

func (m *MeanController) PhotoPipelineCallback(pcb PersistentCallBack) (Dungeons, error) {

	fRsp, err := Cl.GetFileByPersistentID(context.TODO(), &FileWithPIDRequest{
		PID: pcb.PersistentID,
	})
	if err != nil {
		return nil, err
	}
	f := fRsp.File
	if f == nil {
		panic("没有图片啊!!!")
	}

	fm := fileManager.NewFileManager()
	fSize, err := fm.FileStat(f.Key.GetString())
	if err != nil {
		return nil, err
	}

	_, err = Cl.UpdateFileByID(context.TODO(), &FileWithIDRequest{
		Id:   f.ID,
		File: &File{Size: Integer(fSize)},
	})
	if err != nil {
		return nil, err
	}
	f.Size = Integer(fSize)

	_, err = Cl.UpgradePhotoByFileID(context.TODO(), &GetByIDRequest{
		Id: f.ID,
	})
	if err != nil {
		return nil, err
	}

	return nil, nil
}
