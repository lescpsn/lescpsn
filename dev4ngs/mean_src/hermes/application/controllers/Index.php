<?php
/**
 * 默认的控制器
 * 当然, 默认的控制器, 动作, 模块都是可用通过配置修改的
 * 也可以通过$dispater->setDefault*Name来修改
 */
use EasyWeChat\Foundation\Application;

class IndexController extends Yaf_Controller_Abstract {
	public function init() {
		Yaf_Dispatcher::getInstance()->disableView();
	}

	public function indexAction() {
		Resp::success( "hello Hermes!");
	}
	public function dreamAction() {
		$c = Dream::regist(Yaf_Application::app()->getConfig()->soa->dream);
		$state = $c->Ping(); 
		$state = json_decode(json_encode($state),TRUE);
		$state['memUse'] = round( $state['memUse'] / 1048576, 4);
		Resp::success($state);
	}
	public function gatewayAction() {
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
		$oauth = $app->oauth;
		$oauth->stateless();
		if (empty($_SESSION['wechat_user']) && (!isset($_GET['code']) || empty($_GET['code']))) {
			exit($oauth->redirect());
		} else {
			$user = $oauth->user();
			$user_arr = $user->toArray();
			$auth = new \AuthCheck();
			$user = $auth->Check($user_arr);
			header("Location: http://childhood.tusoapp.com?token=" . $user['echo_user_token']);
			exit;
		}
	}
}