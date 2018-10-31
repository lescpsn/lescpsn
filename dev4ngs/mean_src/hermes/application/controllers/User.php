<?php
/**
 * Created by PhpStorm.
 * User: Jack
 * Date: 2016/5/18
 * Time: 10:54
 */
class UserController extends Yaf_Controller_Abstract {
    function init() {
        Yaf_Dispatcher::getInstance()->disableView();
    }
    public function infoAction() {
        $req = file_get_contents("php://input");
        if (empty($req))
            Resp::errEnd("Param empty");
        $req_arr = json_decode($req, true);
        if (!isset($req_arr['token']))
            Resp::errEnd("Param empty");
        $auth = new AuthCheck();
        $userinfo = $auth->getInfo($req_arr['token']);
        if (empty($userinfo))
            Resp::errEnd("user not found");
        $data['nickname'] = $userinfo['nickname'];
        $data['avatar'] = $userinfo['avatar'];
        $data['city'] = $userinfo['city'];
        $data['province'] = $userinfo['province'];
        $data['country'] = $userinfo['country'];
        $data['sex'] = $userinfo['sex'];
        $data['unionid'] = $userinfo['unionid'];
        $data['token'] = $userinfo['echo_user_token'];
        Resp::success($data);
    }
}