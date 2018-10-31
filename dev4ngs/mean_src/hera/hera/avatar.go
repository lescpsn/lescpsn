package hera

import (
	"git.ngs.tech/mean/hera/config"
)

func GetRandomAvatarUrl(avatar *config.TomlConfig, rd int) string {
	avatarurl := avatar.AvatarUrl[rd]
	return avatarurl
}

func GetRandomNikeName(avatar *config.TomlConfig, rd int) string {
	nikename := avatar.NickName[rd]
	return nikename
}
