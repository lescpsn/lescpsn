package huston

import (
	. "git.ngs.tech/mean/houston/model"
	. "git.ngs.tech/mean/proto"
	"golang.org/x/net/context"
)

func (m *MeanController) PostFeedback(cu *User, Suggestion string, Type int) (Dungeons, error) {
	feedback := &Feedback{
		UserUUID:    cu.UUID,
		From:        1,
		Suggest:     Suggestion,
		Type:        int32(Type),
		ConnectInfo: cu.MobileNumber.GetString(),
	}
	rsp, err := Cl.AddFeedBack(context.TODO(), &PostFeedbackRequest{
		Feedback: feedback,
	})
	if err != nil {
		return nil, err
	}
	fbData, err := FeedbackToData(rsp)
	if err != nil {
		return nil, err
	}
	return fbData, nil
}
