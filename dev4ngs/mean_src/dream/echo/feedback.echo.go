package echo

import (
	"git.ngs.tech/mean/dream/mars"
	. "git.ngs.tech/mean/proto"
)

func echo2Feedback(eFeedBack *Feedback) *mars.DB_Feedback {
	return &mars.DB_Feedback{
		Model: mars.Model{
			ID:   eFeedBack.ID,
			UUID: Str2UUID(eFeedBack.UUID),
		},
		UserUUID:    Str2UUID(eFeedBack.UserUUID),
		Suggest:     eFeedBack.Suggest,
		ConnectInfo: eFeedBack.ConnectInfo,
		From:        eFeedBack.From,
		Type:        eFeedBack.Type,
	}
}

func feedback2Echo(feedback *mars.DB_Feedback) *Feedback {
	if feedback == nil || *feedback == (mars.DB_Feedback{}) {
		return nil
	}
	fEcho := &Feedback{
		ID:          feedback.ID,
		UUID:        feedback.UUID.String(),
		CreatedAt:   Time2Str(feedback.CreatedAt),
		UserUUID:    feedback.UserUUID.String(),
		Suggest:     feedback.Suggest,
		ConnectInfo: feedback.ConnectInfo,
		From:        feedback.From,
		Type:        feedback.Type,
	}

	if usr := feedback.User; usr != nil {
		fEcho.User = user2echo(usr)
	}

	return fEcho
}
