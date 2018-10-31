// This note "noteecho.go" is created by Lincan Li at 5/6/16.
// Copyright © 2016 - Lincan Li. All rights reserved

package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

func (d Dream) NewNote(ctx context.Context, req *PostNoteRequest, rsp *NoteResponse) error {
	d.Context(ctx)
	note := echo2Note(req.Note)

	if _, err := note.Save(d.RDB); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Note = note2Echo(note)
	return nil
}

func (d Dream) UpdateNoteByID(ctx context.Context, req *NoteByIDRequest, rsp *NoteResponse) error {
	d.Context(ctx)
	nNote := echo2Note(req.Note)
	note := &mars.DB_Note{Model: mars.Model{ID: req.Id}}

	if err := d.RDB.Model(&note).Updates(nNote).Error; err != nil {
		return err
	}
	rsp.Null = false
	rsp.Note = note2Echo(note)
	return nil
}

func (d Dream) PatchNoteByID(ctx context.Context, req *NoteByIDRequest, rsp *NoteResponse) error {
	d.Context(ctx)
	nNote := echo2Note(req.Note)
	note := &mars.DB_Note{Model: mars.Model{ID: req.Id}}

	if err := d.RDB.Model(&note).Updates(nNote).Error; err != nil {
		return err
	}
	rsp.Null = false
	rsp.Note = note2Echo(note)
	return nil
}

func (d Dream) DeleteNoteByID(ctx context.Context, req *GetByIDRequest, rsp *NoteResponse) error {
	d.Context(ctx)
	note := &mars.DB_Note{Model: mars.Model{ID: req.Id}}
	if err := note.Delete(d.RDB); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Note = note2Echo(note)
	return nil
}

func (d Dream) DeleteNoteByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *NoteResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	note := &mars.DB_Note{Model: mars.Model{UUID: UUID}}

	if err := note.Delete(d.RDB); err != nil {
		return err
	}
	rsp.Null = false
	rsp.Note = note2Echo(note)
	return nil
}

func (d Dream) GetNoteByID(ctx context.Context, req *GetByIDRequest, rsp *NoteResponse) error {
	d.Context(ctx)
	note, err := mars.FirstNoteByID(d.RDB, req.Id)
	if err != nil {
		return err
	}
	if note == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Note = note2Echo(note)
	return nil
}

func (d Dream) GetNoteByUUID(ctx context.Context, req *GetByUUIDRequest, rsp *NoteResponse) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	note, err := mars.FirstNoteByUUID(d.RDB, UUID)
	if err != nil {
		return err
	}
	if note == nil {
		rsp.Null = true
		return nil
	}
	rsp.Null = false
	rsp.Note = note2Echo(note)
	return nil
}

func (d Dream) GetNoteByIDs(ctx context.Context, req *GetByIDsRequest, rsp *Notes) error {
	d.Context(ctx)
	notes, err := mars.FindNotesByIDs(d.RDB, req.Ids)
	if err != nil {
		return err
	}
	rsp.Note = notes2Echo(notes)
	return nil
}

func (d Dream) GetNoteByUUIDs(ctx context.Context, req *GetByUUIDsRequest, rsp *Notes) error {
	d.Context(ctx)
	UUIDs := Strs2UUIDs(req.UUIDs)
	notes, err := mars.FindNotesByUUIDs(d.RDB, UUIDs)
	if err != nil {
		return err
	}
	rsp.Note = notes2Echo(notes)
	return nil
}

func (d Dream) FindNoteByUserUUID(ctx context.Context, req *FindByUUIDWithQPRequest, rsp *Notes) error {
	d.Context(ctx)
	UUID := Str2UUID(req.UUID)
	notes, err := mars.FindNotesByUserUUID(d.RDB, UUID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.Note = notes2Echo(notes)
	return nil
}

func (d Dream) FindNoteByUserID(ctx context.Context, req *FindByIDWithQPRequest, rsp *Notes) error {
	d.Context(ctx)
	u, err := mars.FirstUserByID(d.RDB, req.ID)
	if err != nil {
		return err
	}

	notes, err := mars.FindNotesByUserUUID(d.RDB, u.UUID, req.QueryParameter)
	if err != nil {
		return err
	}
	rsp.Note = notes2Echo(notes)
	return nil
}
