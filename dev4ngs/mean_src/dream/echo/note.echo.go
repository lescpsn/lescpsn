package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
)

func echo2Note(eNote *Note) *mars.DB_Note {
	return &mars.DB_Note{
		Model: mars.Model{
			ID:   eNote.ID,
			UUID: Str2UUID(eNote.UUID),
		},
		UserUUID:  Str2UUID(eNote.UserUUID),
		Title:     eNote.Title,
		Content:   eNote.Content,
		Style:     eNote.Style,
		Timestamp: Str2Time(eNote.Timestamp),
	}
}

func note2Echo(note *mars.DB_Note) *Note {
	return &Note{
		ID:        note.ID,
		UUID:      note.UUID.String(),
		CreatedAt: Time2Str(note.CreatedAt),
		UserUUID:  note.UserUUID.String(),
		Title:     note.Title,
		Content:   note.Content,
		Style:     note.Style,
		Timestamp: Time2Str(note.Timestamp),
	}
}

func notes2Echo(notes []*mars.DB_Note) []*Note {
	var fEchos []*Note
	for _, note := range notes {
		fEchos = append(fEchos, note2Echo(note))
	}
	return fEchos
}
