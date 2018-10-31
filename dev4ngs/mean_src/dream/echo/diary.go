package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

func (d Dream) NewDiary(ctx context.Context, req *PostDiaryRequest, rsp *DiaryResponse) error {
	d.Context(ctx)

	diary := echo2diary(req.Diary)

	if _, err := diary.Save(d.RDB); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Diary = diary2echo(diary)
	return nil
}
func (d Dream) UpdateDiaryByID(ctx context.Context, req *DiaryByIDRequest, rsp *DiaryResponse) error {
	d.Context(ctx)

	ndiary := echo2diary(req.Diary)
	diary := &mars.DB_Diary{Model: mars.Model{ID: req.Id}}
	if err := d.RDB.Model(&diary).Updates(ndiary).Error; err != nil {
		return err
	}

	rsp.Null = false
	rsp.Diary = diary2echo(diary)
	return nil
}

func (d Dream) PatchDiaryByID(ctx context.Context, req *DiaryByIDRequest, rsp *DiaryResponse) error {
	d.Context(ctx)

	ndiary := echo2diary(req.Diary)
	diary := &mars.DB_Diary{Model: mars.Model{ID: req.Id}}

	if err := d.RDB.Model(&diary).Updates(ndiary).Error; err != nil {
		return err
	}
	rsp.Null = false
	rsp.Diary = diary2echo(diary)
	return nil
}

func (d Dream) DeleteDiaryByID(ctx context.Context, req *GetByIDRequest, rsp *DiaryResponse) error {
	d.Context(ctx)

	diary := &mars.DB_Diary{Model: mars.Model{ID: req.Id}}

	if err := diary.Delete(d.RDB); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Diary = diary2echo(diary)
	return nil
}

func (d Dream) DeleteDiaryByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *DiaryResponse) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)
	diary := &mars.DB_Diary{Model: mars.Model{UUID: UUID}}

	if err := diary.Delete(d.RDB); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Diary = diary2echo(diary)
	return nil
}

func (d Dream) GetDiaryByID(ctx context.Context, req *GetByIDRequest, rsp *DiaryResponse) error {
	d.Context(ctx)

	diary, err := mars.FirstDiaryByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	if diary == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Diary = diary2echo(diary)
	return nil
}

func (d Dream) GetDiaryByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *DiaryResponse) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)
	diary, err := mars.FirstDiaryByUUID(d.RDB, UUID)
	if err != nil {
		return err
	}
	if diary == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Diary = diary2echo(diary)
	return nil
}

func (d Dream) GetDiaryByIDs(ctx context.Context, req *GetByIDsRequest, rsp *Diaries) error {
	d.Context(ctx)

	diary, err := mars.FindDiarysByIDs(d.RDB, req.Ids)
	if err != nil {
		return err
	}
	rsp.Diaries = diaries2echo(diary)
	return nil
}

func (d Dream) GetDiaryByUUIDs(ctx context.Context, req *GetByUUIDsRequest, rsp *Diaries) error {
	d.Context(ctx)

	UUIDs := Strs2UUIDs(req.UUIDs)
	diary, err := mars.FindDiarysByUUIDs(d.RDB, UUIDs)
	if err != nil {
		return err
	}
	rsp.Diaries = diaries2echo(diary)
	return nil
}

func (d Dream) FindDiaryByUserUUID(ctx context.Context, req *FindByUUIDWithQPRequest, rsp *Diaries) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)

	diary, err := mars.FindDiarysByUserUUID(d.RDB, UUID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.Diaries = diaries2echo(diary)
	return nil
}

func (d Dream) FindDiaryByUserID(ctx context.Context, req *FindByIDWithQPRequest, rsp *Diaries) error {
	d.Context(ctx)

	u, err := mars.FirstUserByID(d.RDB, req.ID)
	if err != nil {
		return err
	}
	//TODO 这里应该放到Houston中去吧。
	//if u == nil {
	//	return nil, nil
	//}

	diary, err := mars.FindDiarysByUserUUID(d.RDB, u.UUID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.Diaries = diaries2echo(diary)
	return nil
}

func (d Dream) FindAllDiaryByUserUUID(ctx context.Context, req *GetByUUIDRequest, rsp *Diaries) error {
	d.Context(ctx)

	UUID := Str2UUID(req.UUID)

	diary, err := mars.FindDiarysByUserUUID(d.RDB, UUID, nil)
	if err != nil {
		return err
	}
	rsp.Diaries = diaries2echo(diary)
	return nil
}

func (d Dream) FindAllDiaryByUserID(ctx context.Context, req *GetByIDRequest, rsp *Diaries) error {
	d.Context(ctx)

	u, err := mars.FirstUserByID(d.RDB, req.Id)
	if err != nil {
		return err
	}

	//TODO 这里应该放到Houston中去吧。
	//if u == nil {
	//	return nil, nil
	//}

	diary, err := mars.FindDiarysByUserUUID(d.RDB, u.UUID, nil)
	if err != nil {
		return err
	}

	rsp.Diaries = diaries2echo(diary)
	return nil
}
