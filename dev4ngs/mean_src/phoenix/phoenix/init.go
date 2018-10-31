package phoenix

import "git.ngs.tech/mean/phoenix/dream"

//creatUser method : 创建用户测试数据

/*
func creatUser(bc BaseController) error {

	user := UserAdd{Email: "huxu@qq.com", Password: "123456"}
	err := bc.AddUser(&user)
	if err != nil {
		panic(err)
	}
	return nil
}
*/

//creatAdmin method : 创建管理员测试数据
func creatAdmin(bc BaseController) error {

	adm := dream.Admin{UserName: "admin", Password: "123456", TrueName: "NGS 管理员", Email: "admin@ngs.tech", PhoneNumber: "110110110", Levels: "*"}
	err, _ := bc.NewAdmin(&adm)
	if err != nil {
		panic(err)
	}
	return nil
}
