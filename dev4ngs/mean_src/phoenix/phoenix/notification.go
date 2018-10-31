// This file "error_message_controller" is created by Lincan Li at 4/13/16.
// Copyright © 2016 - Jermine Hu . All rights reserved

package phoenix

import (
	"git.ngs.tech/mean/phoenix/dream"
)

//获取消息列表
func (bc *BaseController) getMessageList() (error, []*dream.Notification) {

	result, err := dream.GetMsgList(bc.DB)
	if err != nil {
		return ServiceErr, nil
	}
	return nil, result
}

//发送消息
func (bc *BaseController) sendMsg(msg *dream.Notification) (error, *dream.Notification) {

	result, err := dream.SendMsg(bc.DB, msg)

	if err != nil {
		return ServiceErr, nil
	}

	return nil, result
}
