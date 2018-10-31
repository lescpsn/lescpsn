package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
	"github.com/satori/go.uuid"
	"golang.org/x/net/context"
)

func (d *Dream) echoCommentByID(cID int64) (*Comment, error) {
	rComment, err := mars.FirstCommentByID(d.RDB, cID)
	if err != nil {
		return nil, err
	}
	if rComment == nil {
		return nil, nil
	}
	return comment2echo(rComment), nil
}

func (d *Dream) echoCommentByUUID(UUID uuid.UUID) (*Comment, error) {
	//op := maskRawPhotoQueryOptions(o)
	rComment, err := mars.FirstCommentByUUID(d.RDB, UUID)
	if err != nil {
		return nil, err
	}
	if rComment == nil {
		return nil, nil
	}

	return comment2echo(rComment), nil
}

// NewComment 可以将其一个 CommentEcho 对象持久化保存在数据库中, 同时将保存后的
// CommentEcho 对象返回
func (d Dream) NewComment(ctx context.Context, req *PostCommentRequest, rsp *CommentResponse) error {
	d.Context(ctx)

	c := echo2comment(req.Comment)
	// 如果已经有主键了, 那么就应当调用更新的方法, 而不是再次保存为新评论
	if c.ID != 0 {
		return IDExistOnSave
	}

	// 先预先设定 Comment 的 UUID
	CommentUUID := uuid.NewV4()
	c.UUID = CommentUUID

	comment, err := c.Save(d.RDB)
	if err != nil {
		return err
	}
	rsp.Null = false
	rsp.Comment = comment2echo(comment)
	return nil
}

// FirstCommentByID 可以通过 ID 查询指定的 Comment 对象, 如果相关 ID 不存在于数据库中
// 则返回空值
// FirstPhotoByID 包含一个 Option 对象, 可以用来指定返回某些额外的数据
func (d Dream) FirstCommentByID(ctx context.Context, req *GetByIDRequest, rsp *CommentResponse) error {
	d.Context(ctx)

	rComment, err := mars.FirstCommentByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	if rComment == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Comment = comment2echo(rComment)
	return nil
}

// FirstCommentByUUID 可以通过 UUID 查询指定的 Comment 对象, 如果相关 UUID 不存在于数据库中
// 则返回空值
func (d Dream) FirstCommentByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *CommentResponse) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)
	rComment, err := mars.FirstCommentByUUID(d.RDB, UUID)
	if err != nil {
		return err
	}
	if rComment == nil {
		rsp.Null = true
		return nil
	}

	rsp.Null = false
	rsp.Comment = comment2echo(rComment)

	return nil
}

// FindNewsCommentsByID 可以通过 newsID 列表查询指定的 Comment 对象, 如果相关 ID 不存在于数据库中
// 则返回空值, 需要注意的是, 本方法不保证顺序
func (d Dream) FindNewsCommentsByID(ctx context.Context, req *FindByIDWithQPRequest, rsp *Comments) error {
	d.Context(ctx)

	rComments, err := mars.FindNewsComment(d.RDB, req.ID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.Comments = comments2echo(rComments)
	return nil
}

// FindPhotoCommentsByID 可以通过 photoID 列表查询指定的 Comment 对象, 如果相关 ID 不存在于数据库中
// 则返回空值, 需要注意的是, 本方法不保证顺序
func (d Dream) FindPCWithoutOwner(ctx context.Context, req *FindPCWithoutOwnerRequest, rsp *Comments) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)
	rComments, err := mars.FindPhotoComment(d.RDB, req.Id, UUID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.Comments = comments2echo(rComments)
	return nil
}

// FindPhotoReply 可以通过 photoID 列表查询指定的 Comment 对象, 如果相关 ID 不存在于数据库中
// 则返回空值, 需要注意的是, 本方法不保证顺序
func (d Dream) FindPhotoReply(ctx context.Context, req *FindPhotoReplyRequest, rsp *Comments) error {
	d.Context(ctx)

	UUIDs := Strs2UUIDs(req.UUIDs)
	rComments, err := mars.FindPhotoReply(d.RDB, req.Id, UUIDs)
	if err != nil {
		return err
	}
	rsp.Comments = comments2echo(rComments)
	return nil
}

// FirstCommentByUser 可以通过用户的UUID 和 sourceID 查看用户是否评论过, 如果相关 ID 不存在于数据库中
// 则返回空值, 需要注意的是, 本方法不保证顺序
func (d Dream) FirstCommentByUser(ctx context.Context, req *FirstCommentRequest, rsp *CommentResponse) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)

	comment, err := mars.FirstCommentByUser(d.RDB, UUID, req.Id)
	if err != nil {
		return err
	}
	if comment == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Comment = comment2echo(comment)
	return nil
}

// FirstRepliedComment 通过ReplyUUID 查询主人是否回复过这个评论, 如果相关 UUID 不存在于数据库中
// 则返回空值
func (d Dream) FirstRepliedComment(ctx context.Context, req *FirstCommentRequest, rsp *CommentResponse) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)

	comment, err := mars.FirstRepliedComment(d.RDB, UUID, req.Id)
	if err != nil {
		return err
	}
	if comment == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Comment = comment2echo(comment)
	return nil
}

// DeleteCommentByUUID 方法可以通过 UUID 删除指定照片
func (d Dream) DeleteCommentByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *Bool) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)
	comment := &mars.DB_Comment{Model: mars.Model{UUID: UUID}}

	if err := comment.Delete(d.RDB); err != nil {
		return err
	}
	rsp.Bool = true
	return nil
}

// DeleteCommentByID 方法可以通过 ID 删除指定照片
func (d Dream) DeleteCommentByID(ctx context.Context, req *GetByIDRequest, rsp *Bool) error {
	d.Context(ctx)

	comment := &mars.DB_Comment{Model: mars.Model{ID: req.Id}}

	if err := comment.Delete(d.RDB); err != nil {
		return err
	}
	rsp.Bool = true
	return nil
}
