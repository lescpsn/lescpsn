// This file "photo.go" is created by Lincan Li at 5/12/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package model

import (
	dream "git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"strconv"
)

type PhotoDataOption struct {
	FillSensitive bool
}

func PhotoToData(p *dream.Photo, o *PhotoDataOption) (Dungeons, error) {
	d := make(Dungeons)
	d[`id`] = p.ID
	d[`uuid`] = p.UUID

	d[`comment_sum`] = p.CommentsCount

	if p.Timestamp == "" {
		d[`timestamp`] = p.CreatedAt
	} else {
		d[`timestamp`] = p.Timestamp
	}

	d[`primary_color`] = p.PrimaryColor.GetString()
	d[`geo_location`] = p.GEOLocation.GetString()
	d[`display_version`] = p.DisplayVersion.GetInt()

	pD := make(Dungeons)
	if Str2UUID(p.FileUUID) == uuid.Nil || p.FileSize.GetInt() == 0 {
		if p.RawPhoto != nil {
			URL := p.RawPhoto.FileURL.GetString()
			pD[`display_url`] = URL
			pD[`edit_params`] = `{}`
			pD[`display_url_thumbnail`] = composeThumbnailURLV2(URL, p.RawPhoto.Width.GetInt(), p.RawPhoto.Height.GetInt())
			pD[`display_url_waterfall`] = composeWaterFallURL(URL, p.RawPhoto.Width.GetInt(), p.RawPhoto.Height.GetInt())
			pD[`display_url_square`] = composeSquareURL(URL, p.RawPhoto.Width.GetInt(), p.RawPhoto.Height.GetInt())
			pD[`display_width`] = p.RawPhoto.Width.GetInt()
			pD[`display_height`] = p.RawPhoto.Height.GetInt()
			if s := p.RawPhoto.FileSize.GetInt(); s != 0 {
				pD[`file_size`] = s
			}

			d[`width`] = p.RawPhoto.Width.GetInt()
			d[`height`] = p.RawPhoto.Height.GetInt()
		}

	} else {
		URL := p.FileURL.GetString()
		pD[`display_url`] = URL
		pD[`edit_params`] = p.EditParam.GetString()
		pD[`display_url_thumbnail`] = composeThumbnailURLV2(URL, p.Width.GetInt(), p.Height.GetInt())
		pD[`display_url_waterfall`] = composeWaterFallURL(URL, p.Width.GetInt(), p.Height.GetInt())
		pD[`display_url_square`] = composeSquareURL(URL, p.Width.GetInt(), p.Height.GetInt())
		pD[`display_width`] = p.Width.GetInt()
		pD[`display_height`] = p.Height.GetInt()
		if p.FileSize.GetInt() != 0 {
			pD[`file_size`] = p.FileSize.GetInt()
		}
		if o.FillSensitive {
			d[`in_pipeline`] = p.InPipeline.GetBool()
		}

		d[`width`] = p.Width.GetInt()
		d[`height`] = p.Height.GetInt()
	}

	d[`display_image`] = pD
	if o.FillSensitive {
		d[`md5`] = p.Identifier.GetString()
		d[`privacy`] = p.PhotoPrivacy.String()

		{
			if p.RawPhoto != nil {
				lD := make(Dungeons)
				lD[`url`] = p.RawPhoto.FileURL.GetString()
				if s := p.RawPhoto.FileSize.GetInt(); s != 0 {
					pD[`file_size`] = s
				}
				d[`lite_image`] = lD
			}
		}
	}

	if p.User != nil {
		uData, err := UserToData(p.User, &UserDataOption{FillSensitive: o.FillSensitive})
		if err != nil {
			return nil, err
		}

		d[`user`] = uData
	}

	if p.Note != nil {
		d[`note`] = NoteToData(p.Note)
	}

	return d, nil
}

func ToDataWithPhoto(p dream.Photo, d Dungeons, tPhoto *dream.Photo) Dungeons {
	pD := d[`display_image`].(Dungeons)

	URL := tPhoto.FileURL.GetString()
	pD[`display_url`] = URL
	pD[`edit_params`] = tPhoto.EditParam.GetString()
	pD[`display_url_thumbnail`] = composeThumbnailURLV2(URL, tPhoto.Width.GetInt(), tPhoto.Height.GetInt())
	pD[`display_url_waterfall`] = composeWaterFallURL(URL, tPhoto.Width.GetInt(), tPhoto.Height.GetInt())
	pD[`display_url_square`] = composeSquareURL(URL, tPhoto.Width.GetInt(), tPhoto.Height.GetInt())
	pD[`display_width`] = tPhoto.Width.GetInt()
	pD[`display_height`] = tPhoto.Height.GetInt()
	if tPhoto.FileSize.GetInt() != 0 {
		pD[`file_size`] = tPhoto.FileSize.GetInt()
	}

	d[`display_image`] = pD
	return d
}

func NoteToData(n *dream.Note) Dungeons {
	d := make(Dungeons)

	d[`id`] = n.ID
	d[`uuid`] = n.UUID
	d[`title`] = n.Title.GetString()
	d[`content`] = n.Content.GetString()
	d[`style`] = n.Style.GetString()
	d[`timestamp`] = n.Timestamp

	return d
}

type tsEdgeType int

const (
	tsEdgeTypeWidth tsEdgeType = 1 + iota
	tsEdgeTypeHeight
)

func composeThumbnailURLV2(url string, width, height int64) string {
	tsEdgeMode := tsEdgeTypeWidth
	if width > height {
		tsEdgeMode = tsEdgeTypeHeight
	}

	if tsEdgeMode == tsEdgeTypeWidth {
		if ratio := float32(height) / float32(width); ratio < 16.0/9.0 {
			if width > 720 {
				url = url + "?imageMogr2/thumbnail/720x"
			}
		} else {
			if height > 1280 {
				url = url + "?imageMogr2/thumbnail/x1280"
			}
		}
	}

	if tsEdgeMode == tsEdgeTypeHeight {
		if ratio := float32(width) / float32(height); ratio < 16.0/9.0 {
			if height > 720 {
				url = url + "?imageMogr2/thumbnail/x720"
			}
		} else {
			if width > 1280 {
				url = url + "?imageMogr2/thumbnail/1280x"
			}
		}
	}

	return url
}

func composeWaterFallURL(url string, width, height int64) string {
	tsEdgeMode := tsEdgeTypeWidth
	if width > height {
		tsEdgeMode = tsEdgeTypeHeight
	}

	fileRatio := float32(width) / float32(height)

	if fileRatio < 0.5 || fileRatio > 2.5 {
		if tsEdgeMode == tsEdgeTypeWidth {
			if width > 720 {
				url = url + "?imageMogr2/thumbnail/720x"
			}
			if width < 50 {
				url = url + "?imageMogr2/thumbnail/50x"
			}
		}

		if tsEdgeMode == tsEdgeTypeHeight {
			if height > 720 {
				url = url + "?imageMogr2/thumbnail/x720"
			}
			if height < 50 {
				url = url + "?imageMogr2/thumbnail/x50"
			}
		}

	} else {
		if tsEdgeMode == tsEdgeTypeWidth {
			if width > 720 {
				url = url + "?imageMogr2/thumbnail/720x1800"
			}
			if width > 50 && width < 720 {
				url = url + "?imageMogr2/crop/x" + strconv.Itoa(int(float32(width)*2.5))
			}
			if height < 50 {
				url = url + "?imageMogr2/thumbnail/50x150"
			}
		}

		if tsEdgeMode == tsEdgeTypeHeight {
			if height > 720 {
				url = url + "?imageMogr2/thumbnail/1800x720"
			}
			if height > 50 && width < 720 {
				url = url + "?imageMogr2/crop/" + strconv.Itoa(int(float32(height)*2.5)) + "x"
			}
			if height < 50 {
				url = url + "?imageMogr2/thumbnail/150x50"
			}
		}
	}

	return url
}

func composeSquareURL(url string, width, height int64) string {
	tsEdgeMode := tsEdgeTypeWidth
	if width > height {
		tsEdgeMode = tsEdgeTypeHeight
	}

	if tsEdgeMode == tsEdgeTypeWidth {
		if width > 200 {
			url = url + "?imageMogr2/thumbnail/!200x200r/gravity/center/crop/200x200"
		} else {
			wxh := strconv.Itoa(int(width)) + "x" + strconv.Itoa(int(width))
			url = url + "?imageMogr2/thumbnail/!" + wxh + "r/gravity/center/crop/" + wxh
		}
	}

	if tsEdgeMode == tsEdgeTypeHeight {
		if height > 200 {
			url = url + "?imageMogr2/thumbnail/!200x200r/gravity/center/crop/200x200"
		} else {
			wxh := strconv.Itoa(int(height)) + "x" + strconv.Itoa(int(height))
			url = url + "?imageMogr2/thumbnail/!" + wxh + "r/gravity/center/crop/" + wxh
		}
	}

	return url
}
