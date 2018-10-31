// This file "image.go" is created by Lincan Li at 12/23/15.
// Copyright © 2015 - Lincan Li. All rights reserved

package huston

import (
	"bytes"
	//"encoding/json"
	"fmt"
	. "git.ngs.tech/mean/houston/model"
	dream "git.ngs.tech/mean/proto"
	"github.com/gin-gonic/gin"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
	"gopkg.in/mgo.v2/bson"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

func WrapUploadrRoutes(g *gin.RouterGroup) {
	FakeQiNiuHandler(g)
	ImageUploadrHandler(g)
	PhotoPipelineHandler(g)
	AvatarUploadrHandler(g)
}

type RestImage struct {
	Bucket           string `form:"bucket" json:"bucket" binding:"required"`
	Key              string `form:"key" json:"key" binding:"required"`
	FileSize         int64  `form:"fsize" json:"fsize" binding:"required"`
	Privacy          string `form:"privacy" json:"privacy" binding:"required"`
	Width            int64  `form:"width" json:"width" binding:"required"`
	Height           int64  `form:"height" json:"height" binding:"required"`
	MD5              string `form:"md5" json:"md5" binding:"required"`
	PrimaryColorHex  string `form:"primary_color" json:"primary_color" binding:"required"`
	GeoLocationValue string `form:"geolocation" json:"geolocation" binding:"required"`
	EditParams       string `form:"edit_params" json:"edit_params" binding:"required"`
	Exif             string `form:"exif" json:"exif" binding:"required"`
	TimestampString  string `form:"timestamp" json:"timestamp" binding:"required"`
	TimeStamp        time.Time
}

func ImageUploadrHandler(g *gin.RouterGroup) {
	ImageUploadrEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		userToken := c.PostForm("ut")
		uID, err := GetUserIDByToken(userToken)
		if uID == 0 && err == nil {
			panic(AuthErr)
		}
		uRsp, err := Cl.GetUserByID(context.TODO(), &dream.GetByIDRequest{
			Id: uID,
		})
		if err != nil || uRsp.Null {
			panic(AuthErr)
		}
		user := uRsp.User
		var ip RestImage
		if err := c.Bind(&ip); err != nil {
			log.Print(err)
			if err != nil {
				log.Print(err)
			}
			panic(RequestParamsErr)
		}
		iType := Str2PhotoPrivacy(ip.Privacy)

		if iType == 0 {
			panic(RequestParamsErr)
		}

		timestamp, _ := time.Parse(time.RFC3339, ip.TimestampString)
		ip.TimeStamp = timestamp

		data, err := m.CreatePhoto(user, &ip)
		if err != nil {
			panic(err)
		}

		result := BodyError{
			Success: true,
			Data:    data,
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.POST(ImageUploadrRoute, ImageUploadrEndPoint)
}

func PhotoPipelineHandler(g *gin.RouterGroup) {
	PhotoPipelineEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var pcb PersistentCallBack
		if err := c.BindJSON(&pcb); err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.PhotoPipelineCallback(pcb)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.POST(PhotoPipelineRoute, PhotoPipelineEndPoint)
}

////////////////////////////////////////////////////

func WrapImageRoutes(g *gin.RouterGroup) {
	RequestAvatarTokenHandler(g)
	GetHistoryAvatarsHandler(g)
	RequestTokenHandler(g)
	UpdatePhotoHandler(g)
	PhotoPipelineHandler(g)

	UploadAvatarHandler(g)
	ImageDataHandler(g)
	ImageUniqueHandler(g)

	PublicImageHandler(g)
	PublicImagesHandler(g)
	PrivateImageHandler(g)
	PrivateImagesHandler(g)
	DeleteImageHandler(g)
	DeleteImagesHandler(g)

	CommentOnImageHandler(g)
	DeleteImageCommentHandler(g)

	GetImageCommentHandler(g)
	GetImagesHandler(g)
	CreateNoteHandler(g)
	UpdateNoteHandler(g)
}

func RequestTokenHandler(g *gin.RouterGroup) {
	RequestTokenEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		curlType := c.Param("curl")

		result, err := m.NewUpToken(curlType)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(RequestTokenRoute, RequestTokenEndPoint)
	g.GET(RequestTokenNonTrailRoute, RequestTokenEndPoint)
}

func UpdatePhotoHandler(g *gin.RouterGroup) {
	UpdatePhotoEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			log.Println("UUID Fail")
			panic(RequestParamsErr)
		}

		var ep EditParams
		if err := c.BindJSON(&ep); err != nil {
			log.Println(err)
			panic(RequestParamsErr)
		}

		result, err := m.UpdatePhoto(m.User, UUID, &ep)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.POST(UpdatePhotoRoute, UpdatePhotoEndPoint)
}

type RestAvatar struct {
	Bucket          string `form:"bucket" json:"bucket" binding:"required"`
	Key             string `form:"key" json:"key" binding:"required"`
	FileSize        int64  `form:"fsize" json:"fsize" binding:"required"`
	TimestampString string `form:"timestamp" json:"timestamp" binding:"required"`
	TimeStamp       time.Time
}

func AvatarUploadrHandler(g *gin.RouterGroup) {
	ImageUploadrEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		userToken := c.PostForm("ut")
		log.Print("userToken:", userToken)
		uID, err := GetUserIDByToken(userToken)
		if uID == 0 && err == nil {
			panic(AuthErr)
		}
		rsp, err := Cl.GetUserByID(context.TODO(), &dream.GetByIDRequest{
			Id: uID,
		})
		if err != nil || rsp.Null {
			panic(AuthErr)
		}
		user := rsp.User
		var ip RestAvatar
		if err := c.Bind(&ip); err != nil {
			log.Print(err)
			if err != nil {
				log.Print(err)
			}
			panic(RequestParamsErr)
		}
		timestamp, _ := time.Parse(time.RFC3339, ip.TimestampString)
		ip.TimeStamp = timestamp

		data, err := m.UploadAvatar(user, &ip)
		if err != nil {
			panic(err)
		}

		result := BodyError{
			Success: true,
			Data:    data,
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.POST(AvatarUploadrRoute, ImageUploadrEndPoint)
}

func RequestAvatarTokenHandler(g *gin.RouterGroup) {
	RequestTokenEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		result, err := m.AvatarUpToken()
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(RequestAvatarTokenRoute, RequestTokenEndPoint)
}

func GetHistoryAvatarsHandler(g *gin.RouterGroup) {
	EndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)
		result, err := m.GetHistoricalAvatar(m.User)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(GetAvatarsRoute, EndPoint)
}

type Avatar struct {
	ObjectId        string `form:"object_id" json:"object_id"`
	PhotoUUID       string `form:"photo_uuid" json:"photo_uuid"`
	TimestampString string `form:"timestamp" json:"timestamp" binding:"required"`
	TimeStamp       time.Time
}

func UploadAvatarHandler(g *gin.RouterGroup) {
	RequestTokenEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var avatar Avatar
		if err := c.BindJSON(&avatar); err != nil {
			panic(RequestParamsErr)
		}

		if avatar.ObjectId == "" && avatar.PhotoUUID == "" {
			panic(RequestParamsErr)
		}

		if avatar.ObjectId != "" {
			if !bson.IsObjectIdHex(avatar.ObjectId) {
				panic(RequestParamsErr)
			}

			ObjectId := bson.ObjectIdHex(avatar.ObjectId)
			timestamp, _ := time.Parse(time.RFC3339, avatar.TimestampString)
			avatar.TimeStamp = timestamp

			result, err := m.SetAvatar(m.User, ObjectId, uuid.Nil, avatar.TimeStamp)
			if err != nil {
				panic(err)
			}
			c.JSON(GenericsSuccessCode, result)
		}
		if avatar.PhotoUUID != "" {
			var err error
			oUUID := uuid.FromStringOrNil(avatar.PhotoUUID)
			timestamp, _ := time.Parse(time.RFC3339, avatar.TimestampString)
			avatar.TimeStamp = timestamp
			result, err := m.SetAvatar(m.User, "", oUUID, avatar.TimeStamp)
			if err != nil {
				panic(err)
			}

			if err != nil {
				panic(err)
			}

			c.JSON(GenericsSuccessCode, result)
		}
	}

	g.POST(UploadAvatarRoute, RequestTokenEndPoint)
}

//ImageDataHandler 获取图片详细信息接口, 可以获得图片的详细数据,
//若是访问用户是图片主人 可以查看所有图片的所有信息
//若访问用户是图片主人的好友, 可以查看 图片类型为 公开的图片的所有信息
//其他人均返回权限错误.
func ImageDataHandler(g *gin.RouterGroup) {
	ImageDataEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		result, err := m.GetPhotoDataByUUID(m.User, UUID)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(GetImageDataRoute, ImageDataEndPoint)
}

//ImageUniqueHandler 验证图片MD5的唯一性, 每个用户下的图片MD5均不一样,
//通过这个接口来获得某个用户的MD5唯一性, 正常返回为false
//其他一切不正常情况 返回均为 true
func ImageUniqueHandler(g *gin.RouterGroup) {
	ImageUniqueEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		uniqueString := c.Query("md5")
		result, err := m.PhotoMD5Duplication(m.User, uniqueString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(ImageUniqueRoute, ImageUniqueEndPoint)
}

type BatchImageUUID struct {
	UUIDsString []string `form:"uuids" json:"uuids" binding:"required"`
}

//PublicImageHandler 将 隐私的图片设置成公开 的接口
//若是传入的图片UUID已经是 公开的, 则返回错误.
//非图片主人操作则会返回权限不足错误
func PublicImageHandler(g *gin.RouterGroup) {
	PublicImageEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		r, err := m.PublicPhoto(m.User, UUIDString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, r)
	}

	g.PUT(PublicImageRoute, PublicImageEndPoint)
}

//PublicImagesHandler 批量 将 隐私的图片设置成公开 的接口
//若是传入的图片UUIDs中 只要有公开的图片, 则返回错误.
//非图片主人操作则会返回权限不足错误
func PublicImagesHandler(g *gin.RouterGroup) {
	PublicImagesEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var UUIDs BatchImageUUID
		if err := c.BindJSON(&UUIDs); err != nil {
			panic(RequestParamsErr)
		}

		r, err := m.PublicPhotos(m.User, UUIDs.UUIDsString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, r)
	}

	g.PUT(PublicImagesRoute, PublicImagesEndPoint)
}

//PublicImagesHandler 将 公开的图片设置成隐私 的接口
//若是传入的图片UUIDs中 只要有的图片, 则返回错误.
//非图片主人操作则会返回权限不足错误
func PrivateImageHandler(g *gin.RouterGroup) {
	PrivateImageEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")

		r, err := m.PrivatePhoto(m.User, UUIDString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, r)
	}

	g.PUT(PrivateImageRoute, PrivateImageEndPoint)
}

//PublicImagesHandler 批量 将 公开的图片设置成隐私 的接口
//若是传入的图片UUIDs中 只要有隐私的图片, 则返回错误.
//非图片主人操作则会返回权限不足错误
func PrivateImagesHandler(g *gin.RouterGroup) {
	PrivateImagesEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var UUIDs BatchImageUUID
		if err := c.BindJSON(&UUIDs); err != nil {
			panic(RequestParamsErr)
		}

		r, err := m.PrivatePhotos(m.User, UUIDs.UUIDsString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, r)
	}

	g.PUT(PrivateImagesRoute, PrivateImagesEndPoint)
}

//DeleteImageHandler 删除图片 的接口
//非图片主人操作则会返回权限不足错误
func DeleteImageHandler(g *gin.RouterGroup) {
	DeleteImageEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		r, err := m.DeletePhoto(m.User, UUIDString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, r)
	}

	g.DELETE(DeleteImageRoute, DeleteImageEndPoint)
}

//DeleteImageHandler 批量 删除图片 的接口
//非图片主人操作则会返回权限不足错误
func DeleteImagesHandler(g *gin.RouterGroup) {
	DeleteImagesEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		var UUIDs BatchImageUUID
		if err := c.BindJSON(&UUIDs); err != nil {
			panic(RequestParamsErr)
		}

		r, err := m.DeletePhotos(m.User, UUIDs.UUIDsString)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, r)
	}

	g.DELETE(DeleteImagesRoute, DeleteImagesEndPoint)
}

type ImageComment struct {
	ReplyTo   string    `form:"reply_to" json:"reply_to"`
	Content   string    `form:"content" json:"content" binding:"required"`
	Timestamp time.Time `form:"timestamp" json:"timestamp" binding:"required"`
}

//CommentOnImageHandler 图片留言 的接口
//图片留言板的接口, 业务逻辑比较复杂 详情请看wiki
func CommentOnImageHandler(g *gin.RouterGroup) {
	ImageCommentEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		iUUID := c.Param("UUIDString")

		var ic ImageComment
		if err := c.BindJSON(&ic); err != nil {
			panic(RequestParamsErr)
		}

		rUUID := ic.ReplyTo

		result, err := m.CommentOnPhoto(m.User, iUUID, rUUID, ic.Content, ic.Timestamp)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.POST(CommentOnImageRoute, ImageCommentEndPoint)
}

//DeleteImageCommentHandler 删除图片留言 的接口
//留言者24小时之内可以删除自己的留言, 若是留言删除 前被回复, 回复一并删除
func DeleteImageCommentHandler(g *gin.RouterGroup) {
	ImageCommentEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		iUUID := c.Param("UUIDString")

		cUUID := c.Param("CUUIDString")

		result, err := m.DeleteImageComment(m.User, iUUID, cUUID)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}
	g.DELETE(DeleteImageCommentRoute, ImageCommentEndPoint)
}

//GetImageCommentHandler 拉取图片留言 的接口
//非好友 非主人访问, 返回权限错误
func GetImageCommentHandler(g *gin.RouterGroup) {
	GetImageCommentEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		iUUID := c.Param("UUIDString")

		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.FindPhotoComments(m.User, iUUID, qp)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(GetImageCommentRoute, GetImageCommentEndPoint)
}

//GetImagesHandler 图片瀑布流 的接口
//非好友 非主人访问, 返回权限错误
func GetImagesHandler(g *gin.RouterGroup) {
	GetImagesEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UserUUIDString := c.Param("UUIDString")
		tUUID := uuid.FromStringOrNil(UserUUIDString)
		if tUUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		qp, err := ParseQueryParameter(c)
		if err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.FindPhotos(m.User, tUUID, qp)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.GET(GetImagesRoute, GetImagesEndPoint)
}

type NoteStruct struct {
	Title     string    `form:"title" json:"title" binding:"required"`
	Content   string    `form:"content" json:"content"`
	Style     string    `form:"style" json:"style"`
	Timestamp time.Time `form:"timestamp" json:"timestamp" binding:"required"`
}

//CreateNoteHandler 创建图片随记 接口
func CreateNoteHandler(g *gin.RouterGroup) {
	CreateNoteEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		var ns NoteStruct
		if err := c.BindJSON(&ns); err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.CreateNote(m.User, UUID, ns.Title, ns.Content, ns.Style, ns.Timestamp)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.POST(UploadNoteRoute, CreateNoteEndPoint)
}

type UpdateNoteStruct struct {
	Title     string     `form:"title" json:"title" binding:"required"`
	Content   string     `form:"content" json:"content"`
	Style     string     `form:"style" json:"style"`
	Timestamp *time.Time `form:"timestamp" json:"timestamp"`
}

func UpdateNoteHandler(g *gin.RouterGroup) {
	UpdateNoteEndPoint := func(c *gin.Context) {
		m := c.MustGet(MeanControllerKey).(*MeanController)

		UUIDString := c.Param("UUIDString")
		UUID := uuid.FromStringOrNil(UUIDString)
		if UUID == uuid.Nil {
			panic(RequestParamsErr)
		}

		var ns UpdateNoteStruct
		if err := c.BindJSON(&ns); err != nil {
			panic(RequestParamsErr)
		}

		result, err := m.UpdateNote(m.User, UUID, ns.Title, ns.Content, ns.Style)
		if err != nil {
			panic(err)
		}

		c.JSON(GenericsSuccessCode, result)
	}

	g.PUT(UpdateNoteRoute, UpdateNoteEndPoint)
}

type UploadPhoto struct {
	//File         string `form:"file" json:"file" binding:"required"`
	Token           string `form:"token" json:"token" binding:"required"`
	MD5             string `form:"x:md5" json:"x:md5" binding:"required"`
	Privacy         string `form:"x:privacy" json:"x:privacy" binding:"required"`
	PrimaryColor    string `form:"x:primary_color" json:"x:primary_color" binding:"required"`
	Geolocation     string `form:"x:geolocation" json:"x:geolocation" binding:"required"`
	EditParams      string `form:"x:edit_params" json:"x:edit_params" binding:"required"`
	TimestampString string `form:"x:timestamp" json:"x:timestamp" binding:"required"`
	UserToken       string `form:"x:ut" json:"x:ut" binding:"required"`
	Height          string `form:"x:height" json:"x:height" binding:"required"`
	Width           string `form:"x:width" json:"x:width" binding:"required"`
	Exif            string `form:"x:exif" json:"x:exif" binding:"required"`
}

//LocalHostCallBack 接口, 模仿七牛的回调方式,进行七牛的回调
func FakeQiNiuHandler(g *gin.RouterGroup) {
	FakeQiNiuEndPoint := func(c *gin.Context) {
		var up UploadPhoto
		if err := c.Bind(&up); err != nil {
			panic(RequestParamsErr)
		}
		//body := make(DCenter.Dungeons)
		//body[`bucket`] = "tuso"
		//body[`key`] = "FoCs9S82U1PYy6gcZxfwLypQk-vl"
		//body[`fsize`] = 22987
		//body[`privacy`] = up.Privacy
		//body[`width`] = up.Width
		//body[`height`] = up.Height
		//body[`md5`] = up.MD5
		//body[`primary_color`] = up.PrimaryColor
		//body[`geolocation`] = up.Geolocation
		//body[`edit_params`] = up.EditParams
		//body[`exif`] = up.Exif
		//body[`timestamp`] = up.TimestampString
		//body[`ut`] = up.UserToken
		//b, err := json.Marshal(body)
		//eBody := bytes.NewBuffer([]byte(b))
		resp, err := http.PostForm("http://localhost:8080/vbr/photo_callback",
			url.Values{
				"bucket":        {"tuso"},
				"key":           {"FkgAFGlsMQ26atretyeryteryMoBt0EEl0nJRS3K"},
				"fsize":         {"5763567"},
				"privacy":       {up.Privacy},
				"width":         {up.Width},
				"height":        {up.Height},
				"md5":           {up.MD5},
				"primary_color": {up.PrimaryColor},
				"geolocation":   {up.Geolocation},
				"edit_params":   {up.EditParams},
				"exif":          {up.Exif},
				"timestamp":     {up.TimestampString},
				"ut":            {up.UserToken}})
		//result, err := http.Post("http://localhost:8080/vbr/photo_callback",
		//	"application/json", eBody)
		if err != nil {
			log.Print(err)
			c.JSON(GenericsErrorCode, err)
		}

		c.JSON(GenericsSuccessCode, resp)
	}
	g.POST(FakeQiNiuRoute, FakeQiNiuEndPoint)
}

func httpPost() {
	resp, err := http.Post("http://localhost:8080/vbr/photo_callback",
		"application/json",
		strings.NewReader("name=cjb"))
	if err != nil {
		fmt.Println(err)
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		// handle error
	}

	fmt.Println(string(body))
}

type ErrorCallBack struct {
	code  int    `form:"code" json:"code" binding:"required"`
	error string `form:"error" json:"error" binding:"required"`
}

func ErrorMessageHandler(msg *bytes.Buffer) error {
	_, err := http.Post("http://localhost:8080/v1/errmsg/send_msg",
		"application/json", msg)
	if err != nil {
		log.Print(err)
		return err
	}
	return nil
}

//var errMsg *DCenter.ErrorMessage
//errMsg.Title = "RequestParamsErr"
//errMsg.Content = "upload photo params error"
//errMsg.Mark = "1"
//errMsg.ErrorType = 2
//errMsg.UserId = user.ID
//b, err := json.Marshal(errMsg)
//if err != nil {
//log.Print(err)
//}
//msg := bytes.NewBuffer([]byte(b))
//err = ErrorMessageHandler(msg)
