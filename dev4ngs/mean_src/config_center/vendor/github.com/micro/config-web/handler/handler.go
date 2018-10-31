package handler

import (
	"crypto/sha1"
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"path/filepath"
	"sort"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/yosssi/ace"
	"golang.org/x/net/context"

	config "github.com/micro/config-srv/proto/config"
	proto "github.com/micro/go-platform/config/proto"
)

var (
	opts         *ace.Options
	configClient config.ConfigClient
)

func Init(dir string, t config.ConfigClient) {
	configClient = t

	opts = ace.InitializeOptions(nil)
	opts.BaseDir = dir
	opts.DynamicReload = true
	opts.FuncMap = template.FuncMap{
		"JSON": func(d string) string {
			return prettyJSON(d)
		},
		"TimeAgo": func(t int64) string {
			return timeAgo(t)
		},
		"Timestamp": func(t int64) string {
			return time.Unix(t, 0).Format(time.RFC822)
		},
		"Colour": func(s string) string {
			return colour(s)
		},
	}
}

func render(w http.ResponseWriter, r *http.Request, tmpl string, data map[string]interface{}) {
	basePath := hostPath(r)

	opts.FuncMap["URL"] = func(path string) string {
		return filepath.Join(basePath, path)
	}

	tpl, err := ace.Load("layout", tmpl, opts)
	if err != nil {
		fmt.Println(err)
		http.Redirect(w, r, "/", 302)
		return
	}

	if data == nil {
		data = make(map[string]interface{})
	}

	data["Alert"] = getAlert(w, r)

	if err := tpl.Execute(w, data); err != nil {
		fmt.Println(err)
		http.Redirect(w, r, "/", 302)
	}
}

// The index page
func Index(w http.ResponseWriter, r *http.Request) {
	rsp, err := configClient.AuditLog(context.TODO(), &config.AuditLogRequest{
		Reverse: true,
	})
	if err != nil {
		http.Redirect(w, r, "/", 302)
		return
	}

	sort.Sort(sortedLogs{logs: rsp.Changes, reverse: false})

	render(w, r, "index", map[string]interface{}{
		"Latest": rsp.Changes,
	})
}

// The Audit Log
func AuditLog(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	limit := 25
	from, _ := strconv.Atoi(r.Form.Get("from"))
	to, _ := strconv.Atoi(r.Form.Get("to"))

	page, err := strconv.Atoi(r.Form.Get("p"))
	if err != nil {
		page = 1
	}

	if page < 1 {
		page = 1
	}

	offset := (page * limit) - limit

	rsp, err := configClient.AuditLog(context.TODO(), &config.AuditLogRequest{
		From:    int64(from),
		To:      int64(to),
		Limit:   int64(limit),
		Offset:  int64(offset),
		Reverse: true,
	})
	if err != nil {
		http.Redirect(w, r, "/", 302)
		return
	}

	sort.Sort(sortedLogs{logs: rsp.Changes, reverse: false})

	var less, more int

	if len(rsp.Changes) == limit {
		more = page + 1
	}

	if page > 1 {
		less = page - 1
	}

	render(w, r, "audit", map[string]interface{}{
		"Latest": rsp.Changes,
		"Less":   less,
		"More":   more,
	})
}

func Config(w http.ResponseWriter, r *http.Request) {
	render(w, r, "configForm", nil)
}

func Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		return
	}

	r.ParseForm()

	id := r.Form.Get("id")
	path := r.Form.Get("path")
	author := r.Form.Get("author")
	comment := r.Form.Get("comment")
	conf := r.Form.Get("config")

	if len(id) == 0 {
		setAlert(w, r, "Id is blank", "error")
		http.Redirect(w, r, r.Referer(), 302)
		return
	}

	sum := fmt.Sprintf("%x", sha1.Sum([]byte(conf)))

	_, err := configClient.Create(context.TODO(), &config.CreateRequest{
		Change: &config.Change{
			Id:        id,
			Path:      path,
			Author:    author,
			Comment:   comment,
			Timestamp: time.Now().Unix(),
			ChangeSet: &proto.ChangeSet{
				Timestamp: time.Now().Unix(),
				Checksum:  sum,
				Data:      conf,
				Source:    "web",
			},
		},
	})
	if err != nil {
		setAlert(w, r, err.Error(), "error")
		http.Redirect(w, r, r.Referer(), 302)
		return
	}

	http.Redirect(w, r, filepath.Join(hostPath(r), "read", id, url.QueryEscape(path)), 302)
}

func Edit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	path, _ := url.QueryUnescape(vars["path"])

	if r.Method == "POST" {
		r.ParseForm()

		id := r.Form.Get("id")
		path := r.Form.Get("path")
		author := r.Form.Get("author")
		comment := r.Form.Get("comment")
		conf := r.Form.Get("config")

		if len(id) == 0 {
			setAlert(w, r, "Id is blank", "error")
			http.Redirect(w, r, r.Referer(), 302)
			return
		}

		sum := fmt.Sprintf("%x", sha1.Sum([]byte(conf)))

		_, err := configClient.Update(context.TODO(), &config.UpdateRequest{
			Change: &config.Change{
				Id:        id,
				Path:      path,
				Author:    author,
				Comment:   comment,
				Timestamp: time.Now().Unix(),
				ChangeSet: &proto.ChangeSet{
					Timestamp: time.Now().Unix(),
					Checksum:  sum,
					Data:      conf,
					Source:    "web",
				},
			},
		})
		if err != nil {
			setAlert(w, r, err.Error(), "error")
			http.Redirect(w, r, r.Referer(), 302)
			return
		}

		http.Redirect(w, r, filepath.Join(hostPath(r), "read", id, url.QueryEscape(path)), 302)
		return
	}

	// load edit form
	if len(id) == 0 {
		setAlert(w, r, "Id is blank", "error")
		http.Redirect(w, r, r.Referer(), 302)
		return
	}

	rsp, err := configClient.Read(context.TODO(), &config.ReadRequest{
		Id:   id,
		Path: path,
	})

	if err != nil {
		setAlert(w, r, err.Error(), "error")
		http.Redirect(w, r, "/", 302)
		return
	}

	render(w, r, "editForm", map[string]interface{}{
		"Id":     id,
		"Path":   path,
		"Config": rsp.Change,
	})
}

func Read(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	path, _ := url.QueryUnescape(vars["path"])

	if r.Method == "POST" {
		r.ParseForm()
		// /config load request
		if len(id) == 0 {
			id := r.Form.Get("id")
			path := r.Form.Get("path")

			// no id
			if len(id) == 0 {
				http.Redirect(w, r, r.Referer(), 302)
				return
			}

			http.Redirect(w, r, filepath.Join(hostPath(r), "read", id, url.QueryEscape(path)), 302)
		}

		// /config/{id} update

		return
	}

	// no id, render form
	if len(id) == 0 {
		setAlert(w, r, "Id is blank", "error")
		http.Redirect(w, r, r.Referer(), 302)
		return
	}

	rsp, err := configClient.Read(context.TODO(), &config.ReadRequest{
		Id:   id,
		Path: path,
	})

	if err != nil {
		http.Redirect(w, r, "/", 302)
		return
	}

	render(w, r, "config", map[string]interface{}{
		"Id":     id,
		"Path":   path,
		"Config": rsp.Change,
	})
}

func Search(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		r.ParseForm()
		limit := 25
		id := r.Form.Get("id")
		author := r.Form.Get("author")

		page, err := strconv.Atoi(r.Form.Get("p"))
		if err != nil {
			page = 1
		}

		if page < 1 {
			page = 1
		}

		offset := (page * limit) - limit

		rsp, err := configClient.Search(context.TODO(), &config.SearchRequest{
			Id:     id,
			Author: author,
			Limit:  int64(limit),
			Offset: int64(offset),
		})
		if err != nil {
			http.Redirect(w, r, filepath.Join(hostPath(r), "search"), 302)
			return
		}

		q := ""

		if len(id) > 0 {
			q += "id: " + id + ", "
		}

		if len(author) > 0 {
			q += "author: " + author
		}

		var less, more int

		if len(rsp.Configs) == limit {
			more = page + 1
		}

		if page > 1 {
			less = page - 1
		}

		sort.Sort(sortedConfigs{configs: rsp.Configs})

		render(w, r, "results", map[string]interface{}{
			"Name":    q,
			"Results": rsp.Configs,
			"Less":    less,
			"More":    more,
		})

		return
	}
	render(w, r, "search", map[string]interface{}{})
}
