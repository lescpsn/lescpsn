<?php

use MongoDB\Client;
use Qiniu\Auth;
use Qiniu\Storage\BucketManager;

class AuthCheck {
    private $model;
    private $qiniu;
    private $dream;
    public function __construct()
    {
        //$client = new Client('mongodb://' . Yaf_Application::app()->getConfig()->mongo->db_user . ':' .Yaf_Application::app()->getConfig()->mongo->db_pass . '@' .  Yaf_Application::app()->getConfig()->mongo->host . ":" . Yaf_Application::app()->getConfig()->mongo->port,[] ,['typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array']]);
        $client = new Client('mongodb://' . Yaf_Application::app()->getConfig()->mongo->db_user . ':' .Yaf_Application::app()->getConfig()->mongo->db_pass . '@' . Yaf_Application::app()->getConfig()->mongo->host . ":" . Yaf_Application::app()->getConfig()->mongo->port . '/' . Yaf_Application::app()->getConfig()->mongo->db_name ,[] ,['typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array']]);
        $this->model =  $client->selectCollection(Yaf_Application::app()->getConfig()->mongo->db_name,'user');
        $this->dream =  Dream::regist(Yaf_Application::app()->getConfig()->soa->dream);
        $auth = new Auth(Yaf_Application::app()->getConfig()->qiniu->accessKey, Yaf_Application::app()->getConfig()->qiniu->secretKey);
        $this->qiniu = new BucketManager($auth);
    }
    const field = [
        'unionid',
        'openid',
        'nickname',
        'email',
        'sex',
        'city',
        'province',
        'country',
        'avatar',
        'echo_user_uuid',
        'echo_user_token',
    ];
    const field_empty = [  null, null,null,null,null,null,null,null,null,null,null ];
    public function Check(array $data) {
        if (isset($_SESSION['user']) && !empty($_SESSION['user']))
            return $_SESSION['user'];
        $user = $this->model->findOne([
            'unionid' => $data['original']['unionid']
        ]);
        if (empty($user)){
            $echouser_ob = $this->dream->NewAnonmyousUser();
            $user = self::NewUserFromEchoUser(ob2ar($echouser_ob));
            foreach ($user as $key => $val) {
                if (array_key_exists($key, $data['original'])){
                    $user[$key] = $data['original'][$key];
                }
            }
            $logo = time() . '.jpg';
            //更新用户头像
            $this->qiniu->fetch($data['original']['headimgurl'], Yaf_Application::app()->getConfig()->qiniu->bucket_name, $logo);
            $user['avatar'] =   Yaf_Application::app()->getConfig()->qiniu->bucket_url . '/' . $logo;
            $this->model->insertOne($user);
        }
        $_SESSION['user'] = $user;
        return $user;
    }
    public function getInfo(string $token) {
        if (isset($_SESSION['user']) && !empty($_SESSION['user']))
            return $_SESSION['user'];
        $user = $this->model->findOne([
            'echo_user_token' => $token
        ]);
        if (empty($user)){
            return false;
        }
        $_SESSION['user'] = $user;
        return $user;
    }
    static public function NewUserFromEchoUser(array $data) {
        $user = array_combine(self::field, self::field_empty);
        //$user['echo_user_id'] = $data['id'];
        $user['echo_user_uuid'] = $data['uUID'];
        $user['echo_user_token'] = $data['token']['string'];
        return $user;
    }
}