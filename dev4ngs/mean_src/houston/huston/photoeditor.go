// This file "photoeditor.go" is created by Lincan Li at 5/10/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package huston

import (
	"encoding/json"
	"git.ngs.tech/mean/houston/fileManager"
)

func EditPipelineInUploadr(pLine *fileManager.ImagePipeline, key, eString string) (*fileManager.ImagePipeline, error) {
	p, b, err := EditParameterStringToPupaAndButterfly(key, eString)
	if err != nil {
		return nil, err
	}
	if p == nil && b == nil {
		return pLine, nil
	}
	pLine.AppendPersistent(pLine.EditImageParameter(p, b))

	return pLine, nil
}

func EditPipelineInUploadrByEditParameter(pLine *fileManager.ImagePipeline, ep *EditParams) (*fileManager.ImagePipeline, error) {
	if ep.Filter == nil && ep.Crop == nil {
		return pLine, nil
	}

	p, b, err := EditParameterToBAndP(ep)
	if err != nil {
		return nil, err
	}
	pLine.AppendPersistent(pLine.EditImageParameter(p, b))

	return pLine, nil
}

func EditParameterStringToPupaAndButterfly(key, eString string) (fileManager.Pupa, fileManager.Butterfly, error) {
	if eString == "" || eString == "{}" {
		return nil, nil, nil
	}

	var e EditParams

	err := json.Unmarshal([]byte(eString), &e)
	if err != nil {
		return nil, nil, err
	}

	if e.Crop == nil && e.Filter == nil {
		return nil, nil, nil
	}

	return EditParameterToBAndP(&e)
}

func EditParameterToBAndP(ep *EditParams) (fileManager.Pupa, fileManager.Butterfly, error) {
	b, err := mapButterfly(ep)
	if err != nil {
		return nil, nil, err
	}

	p, err := mapPupa(ep)
	if err != nil {
		return nil, nil, err
	}

	return p, b, nil
}

type EditParams struct {
	Crop     *CropParams `json:"crop,omitempty"`
	Filter   *Filter     `json:"filter,omitempty"`
	Metadata string      `json:"metadata,omitempty"`
}

type CropParams struct {
	Angle  float32 `json:"angle"`
	Width  int64   `json:"width"`
	Height int64   `json:"height"`
	Anchor Point   `json:"anchor"`
}

type Filter struct {
	Version         string          `json:"version"`
	FilterID        string          `json:"filter_id"`
	LookupIntensity int             `json:"lookup_intensity"`
	Params          []*FilterParams `json:"params"`
}

type FilterParams struct {
	FirstParam   float32 `json:"0"`
	SecondParams float32 `json:"1"`
}

type Point struct {
	X int `json:"x"`
	Y int `json:"y"`
}

func (p *Point) IsZero() bool {
	return p.X == 0 && p.Y == 0
}

func mapButterfly(e *EditParams) (fileManager.Butterfly, error) {
	filter := e.Filter

	if filter == nil {
		return nil, nil
	}

	if filter.FilterID == "" {
		return nil, nil
	}

	f := make(fileManager.Butterfly)

	f[`v`] = filter.Version
	f[`id`] = filter.FilterID
	f[`gi`] = filter.LookupIntensity
	f[`p`] = filter.Params

	return f, nil
}

func mapPupa(e *EditParams) (fileManager.Pupa, error) {
	crop := e.Crop
	if crop == nil {
		return nil, nil
	}

	if crop.Width == 0 && crop.Height == 0 && crop.Angle == 0 {
		return nil, nil
	}

	c := make(fileManager.Pupa)

	if crop.Angle != 0 {
		c[`a`] = crop.Angle
	}

	if (crop.Width != 0 || crop.Height != 0) && (crop.Width == 0 || crop.Height == 0) {
		return nil, InvalidPhotoEditParams
	}

	if crop.Width != 0 && crop.Height != 0 && !crop.Anchor.IsZero() {
		c[`w`] = crop.Width
		c[`h`] = crop.Height
		c[`ap`] = crop.Anchor
	}

	return c, nil
}
