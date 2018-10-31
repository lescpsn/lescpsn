package dream_test

import (
	"bitbucket.org/ngspace/mean/dream"
	"github.com/henrylee2cn/thinkgo/core/log"
	. "github.com/smartystreets/goconvey/convey"
	"testing"
	"time"
)

func TestToData(t *testing.T) {
	Convey("Setup", t, func() {
		suit := NewSuit()
		user := suit.NewOneMobileUser()
		photo := suit.AddOnephoto(user)
		var photos []*dream.RawPhoto
		photos = append(photos, photo)
		Convey("build a normai news", func() {
			news := suit.AddOneNews(user, photos)
			Convey("a news to Dungeons struct", func() {
				RespMap, err := news.ToData(suit.X, nil, true)
				log.Println(RespMap)
				So(err, ShouldBeNil)
				So(RespMap[`user`], ShouldNotBeEmpty)
			})
		})
		Convey("build a empty news", func() {
			news := &dream.News{}
			Convey("a news to Dungeons struct", func() {
				_, err := news.ToData(suit.X, nil, true)
				So(err, ShouldNotBeNil)
			})
		})
		Reset(func() {
			suit.TearDown()
		})
	})
}
func TestNewNews(t *testing.T) {
	SkipConvey("Setup", t, func() {
		suit := NewSuit()
		Convey("Set the user and photos", func() {
			user := suit.NewOneMobileUser()
			photo := suit.AddOnephoto(user)
			var photos []*dream.RawPhoto
			photos = append(photos, photo)
			Convey("use normal data to create a news", func() {
				news, err := dream.NewNews(suit.X, user, photos, time.Now())
				So(err, ShouldBeNil)
				So(news.User, ShouldAlmostEqual, user)
				So(news.Photos, ShouldEqual, photos)
				So(news.UUID, ShouldImplement, user.UUID)
				So(news.ID, ShouldBeGreaterThan, 0)
			})
		})
	})
}
