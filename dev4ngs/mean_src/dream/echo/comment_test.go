package echo_test

import (
	"git.ngs.tech/mean/dream/dream"
	"git.ngs.tech/mean/dream/echo"
	"github.com/satori/go.uuid"
	. "github.com/smartystreets/goconvey/convey"
	"log"
	"testing"
	"time"
)

func UUIDs2Strs(us []uuid.UUID) []string {
	ss := make([]string, len(us))

	for k, v := range us {
		ss[k] = v.String()
	}
	return ss
}

func (d *DreamTest) newCommentEcho() *echo.CommentEcho {
	return &echo.CommentEcho{
		UserUUID:  uuid.NewV4().String(),
		Type:      dream.KCommentTypeImage,
		SourceId:  1,
		Content:   "test",
		Timestamp: time.Now().Format(time.RFC3339),
	}
}

func (d *DreamTest) newCommentWithSource(p *echo.PhotoEcho) *echo.CommentEcho {
	return &echo.CommentEcho{
		UserUUID:  uuid.NewV4().String(),
		SourceId:  p.ID,
		Type:      dream.KCommentTypeImage,
		Content:   "test",
		Timestamp: time.Now().Format(time.RFC3339),
	}
}

func (d *DreamTest) newPhotoEcho() *echo.PhotoEcho {
	user, err := d.D.NewEmailUser("dfa@1.com", "12331231312", nil)
	So(err, ShouldBeNil)

	p := &echo.PhotoEcho{
		UserUUID: user.UUID,
		RawPhoto: &echo.BasePhotoEcho{
			Width:        dream.NewValidNullInt(100),
			Height:       dream.NewValidNullInt(100),
			FileURL:      dream.NewValidNullString("http://werrwer"),
			FileUUID:     uuid.NewV4().String(),
			FileSize:     dream.NewValidNullInt(100),
			PrimaryColor: dream.NewValidNullString("http://werrwer"),
		},
		PhotoPrivacy: dream.PhotoPrivacyPrivate,
		Width:        dream.NewValidNullInt(100),
		Height:       dream.NewValidNullInt(30),
		FileUUID:     uuid.NewV4().String(),
		FileSize:     dream.NewValidNullInt(23),
		FileURL:      dream.NewValidNullString("http://werrwer"),
		Identifier:   dream.NewValidNullString("asdfjoiaejfq"),
		PrimaryColor: dream.NewValidNullString("FFFFFF"),
	}
	p, _ = d.D.NewPhoto(p, &echo.PhotoEchoOption{FetchBasePhoto: true}, nil)

	return p
}

func TestEcho2Comment(t *testing.T) {
	Convey("生成一个 CommentEcho struct", t, func() {
		c := &echo.CommentEcho{
			ID:          1,
			UUID:        uuid.NewV4().String(),
			UserUUID:    uuid.NewV4().String(),
			ReplyToUUID: uuid.NewV4().String(),
			Type:        dream.KCommentTypeImage,
			SourceId:    1,
			Content:     "test",
			Timestamp:   time.Now().Format(time.RFC3339),
		}
		Convey("验证转换是否成功", func() {
			comment := echo.echo2comment(c)
			So(comment.ID, ShouldEqual, c.ID)
			So(comment.UUID, ShouldEqual, echo.Str2UUID(c.UUID))
			So(comment.UserUUID, ShouldEqual, echo.Str2UUID(c.UserUUID))
			So(comment.ReplyToUUID, ShouldEqual, echo.Str2UUID(c.ReplyToUUID))
			So(comment.Type, ShouldEqual, c.Type)
			So(comment.Content, ShouldEqual, c.Content)
			So(comment.Timestamp, ShouldNotBeNil)
			log.Print("Timestamp:", c.Timestamp)
		})
	})
}

func TestComment2Echo(t *testing.T) {
	Convey("生成一个 Comment struct", t, func() {
		reply := &dream.Comment{
			UserUUID:  uuid.NewV4(),
			Type:      dream.KCommentTypeImage,
			SourceId:  1,
			Content:   "test reply",
			Timestamp: time.Now(),
		}
		c := &dream.Comment{
			UserUUID:    uuid.NewV4(),
			ReplyToUUID: reply.UUID,
			Type:        dream.KCommentTypeImage,
			SourceId:    1,
			Content:     "test",
			ReplyTo:     reply,
			Timestamp:   time.Now(),
		}
		Convey("验证转换是否成功", func() {
			comment := echo.comment2echo(c)
			So(comment.ID, ShouldEqual, c.ID)
			So(comment.UUID, ShouldEqual, c.UUID.String())
			So(comment.UserUUID, ShouldEqual, c.UserUUID.String())
			So(comment.ReplyToUUID, ShouldEqual, c.ReplyToUUID.String())
			So(comment.ReplyTo, ShouldNotBeNil)
			So(comment.Type, ShouldEqual, c.Type)
			So(comment.Content, ShouldEqual, c.Content)
			So(comment.Timestamp, ShouldNotBeNil)
			log.Print("Timestamp:", c.Timestamp)
		})
	})
}

func TestNewComment(t *testing.T) {
	d := SetupTest()
	Convey("新建一个Comment", t, func() {

		Convey("新建评论成功", func() {
			commentEcho := d.newCommentEcho()
			comment, err := d.D.NewComment(commentEcho, nil)
			So(err, ShouldBeNil)
			So(comment, ShouldNotBeNil)
			So(comment.Content, ShouldEqual, commentEcho.Content)
		})
	})
	TearDownTest(d)
}

func TestFirstCommentByUUID(t *testing.T) {
	d := SetupTest()
	Convey("根据UUID查询Comment", t, func() {
		commentEcho := d.newCommentEcho()
		comment, _ := d.D.NewComment(commentEcho, nil)
		Convey("查询成功", func() {
			c, err := d.D.FirstCommentByUUID(comment.UUID, nil)
			So(err, ShouldBeNil)
			So(c, ShouldNotBeNil)
			So(c.Content, ShouldEqual, comment.Content)
		})
	})
	TearDownTest(d)
}

func TestFirstCommentByID(t *testing.T) {
	d := SetupTest()
	Convey("根据ID查询Comment", t, func() {
		commentEcho := d.newCommentEcho()
		comment, _ := d.D.NewComment(commentEcho, nil)
		Convey("查询成功", func() {
			c, err := d.D.FirstCommentByID(comment.ID, nil)
			So(err, ShouldBeNil)
			So(c, ShouldNotBeNil)
			So(c.Content, ShouldEqual, comment.Content)
		})
	})
	TearDownTest(d)
}

func TestDeleteCommentByUUID(t *testing.T) {
	d := SetupTest()
	Convey("根据 UUID 删除 Comment ", t, func() {
		commentEcho := d.newCommentEcho()
		comment, _ := d.D.NewComment(commentEcho, nil)
		Convey("删除成功", func() {
			c, err := d.D.DeleteCommentByUUID(comment.UUID, nil)
			So(err, ShouldBeNil)
			So(c, ShouldNotBeNil)
			//So(len(c), ShouldEqual, 1)
			//So(c[0].Content, ShouldEqual, comment.Content)
		})
	})
	TearDownTest(d)
}

func TestDeleteCommentByID(t *testing.T) {
	d := SetupTest()
	Convey("根据 ID 删除 Comment ", t, func() {
		commentEcho := d.newCommentEcho()
		comment, _ := d.D.NewComment(commentEcho, nil)
		Convey("删除成功", func() {
			c, err := d.D.DeleteCommentByID(comment.ID, nil)
			So(err, ShouldBeNil)
			So(c, ShouldNotBeNil)
			//So(len(c), ShouldEqual, 1)
			//So(c[0].Content, ShouldEqual, comment.Content)
		})
	})
	TearDownTest(d)
}

func TestFindCommentBySourceID(t *testing.T) {
	d := SetupTest()
	Convey("查询图片非主人的评论", t, func() {
		p := d.newPhotoEcho()
		commentEcho := d.newCommentWithSource(p)

		replyEcho := &echo.CommentEcho{
			UserUUID:    p.UserUUID,
			Type:        dream.KCommentTypeImage,
			SourceId:    p.ID,
			Content:     "test",
			ReplyToUUID: commentEcho.UUID,
			Timestamp:   time.Now().Format(time.RFC3339),
		}

		comment, err := d.D.NewComment(commentEcho, nil)
		So(err, ShouldBeNil)
		So(comment, ShouldNotBeNil)

		reply, err := d.D.NewComment(replyEcho, nil)
		So(err, ShouldBeNil)
		So(reply, ShouldNotBeNil)

		Convey("查询成功", func() {
			qp := &dream.QueryParameter{
				SinceID: 0,
				MaxID:   0,
				Page:    0,
				Count:   0,
			}
			c, err := d.D.FindPCWithoutOwner(p.ID, p.UserUUID, qp, nil)
			So(err, ShouldBeNil)
			So(c, ShouldNotBeNil)
			So(len(c), ShouldEqual, 1)
			So(c[0].UUID, ShouldEqual, comment.UUID)
		})
	})
	TearDownTest(d)
}

//TODO 评论存储的
func TestFindPhotoReply(t *testing.T) {
	d := SetupTest()
	Convey("查询主人回复的评论", t, func() {
		p := d.newPhotoEcho()
		commentEcho := d.newCommentWithSource(p)
		replyEcho := &echo.CommentEcho{
			UserUUID:    p.UserUUID,
			Type:        dream.KCommentTypeImage,
			SourceId:    p.ID,
			Content:     "test",
			ReplyToUUID: commentEcho.UUID,
			Timestamp:   time.Now().Format(time.RFC3339),
		}
		comment, err := d.D.NewComment(commentEcho, nil)
		So(err, ShouldBeNil)
		So(comment, ShouldNotBeNil)

		reply, err := d.D.NewComment(replyEcho, nil)
		So(err, ShouldBeNil)
		So(reply, ShouldNotBeNil)

		Convey("查询成功", func() {
			qp := &dream.QueryParameter{
				SinceID: 0,
				MaxID:   0,
				Page:    0,
				Count:   0,
			}
			comments, err := d.D.FindPCWithoutOwner(p.ID, p.UserUUID, qp, nil)
			So(err, ShouldBeNil)
			So(comments, ShouldNotBeNil)

			var cUUIDs []string
			for i := 0; i < len(comments); i++ {
				cUUIDs = append(cUUIDs, comments[i].UUID)
				log.Print("comments[].UUID", comments[i].UUID)
			}
			log.Print("cUUIDs", cUUIDs)
			c, err := d.D.FindPhotoReply(p.ID, cUUIDs, nil)
			log.Print("C", c)
			So(err, ShouldBeNil)
			So(c, ShouldNotBeNil)
			So(len(c), ShouldEqual, 1)
			So(c[0].UUID, ShouldEqual, reply.UUID)
		})
	})
	TearDownTest(d)
}
