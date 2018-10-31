<?php
use Qiniu\Auth;
use Symfony\Component\HttpFoundation;
use EasyWeChat\Foundation\Application;

class ToolController extends Yaf_Controller_Abstract {
    function init() {
        Yaf_Dispatcher::getInstance()->disableView();
    }
    // qiniuAction 获取七牛token
    public function qiniuAction() {
        $auth = new Auth(Yaf_Application::app()->getConfig()->qiniu->accessKey, Yaf_Application::app()->getConfig()->qiniu->secretKey);
        $policy = [
            'callbackUrl' => Yaf_Application::app()->getConfig()->qiniu->callback_domain . 'tool/qiniu_callback',
            'callbackBody' => 'bucket=$(bucket)&key=$(key)&hash=$(etag)&fsize=$(fsize)&width=$(imageInfo:width)&height=$(imageInfo:height)',
            'callbackBodyType' => 'application/x-www-form-urlencoded',
        ];
        $token = $auth->uploadToken(Yaf_Application::app()->getConfig()->qiniu->bucket_name, null, 3600, $policy);
        Resp::success(['token' => $token]);
    }
    private static $qiniuCallbackFields = [
        'bucket',
        'key',
        'fsize',
        'privacy',
        'width',
        'height',
        'exif',
        'timestamp'
    ];
    // qiniu 的回调
    public function qiniu_callbackAction() {
        $callbackFields = [];
        // 过滤参数
        foreach($_POST as $key => $item) {
            if (in_array($key, self::$qiniuCallbackFields)) {
                $callbackFields[$key] = $item;
            }
        }

        // 创建file

    }

    public function wechatAction() {
        $req = file_get_contents("php://input");
        if (empty($req))
            Resp::errEnd("Param empty");
        $req_arr = json_decode($req, true);
        if (empty($req_arr) || !isset($req_arr['url']))
            Resp::errEnd("Param empty");
        $url = rawurldecode($req_arr['url']);
        $option = [
            'oauth' => [
                'scopes'   => ['snsapi_userinfo'],
                'callback' => '/index/gateway',
            ],
            'log' => [
                'level' => 'debug',
                'file'  => '/tmp/easywechat.log',
            ],
            'app_id' => Yaf_Application::app()->getConfig()->Wechat->app_id,
            'secret' => Yaf_Application::app()->getConfig()->Wechat->secret,
            'token' => Yaf_Application::app()->getConfig()->Wechat->token,
            'aes_key' => Yaf_Application::app()->getConfig()->Wechat->ase_key
        ];
        $app = new Application($option);
        $js = $app->js;
        $js->setUrl($url);
        $sdk = $js->config(array('onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone', 'onMenuShareTimeline', 'onMenuShareAppMessage'), false, false, false);
        Resp::success($sdk);
    }
}