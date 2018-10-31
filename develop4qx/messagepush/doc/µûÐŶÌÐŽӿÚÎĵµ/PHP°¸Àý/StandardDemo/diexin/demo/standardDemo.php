<?php
/**
 * 标准HTTP接口DEMO
 */
session_start ();
header ( "Content-type:text/html; charset=UTF-8" );

$sms = new Sms ();
$time = date ( 'YmdHis' );
$token = md5 ( $sms->_userId . $time . $sms->_password );

$m = empty ( $_GET ['m'] ) ? 'mt' : $_GET ['m'];
if ($m == 'mt') {
	echo $sms->postMt ();
} elseif ($m == 'queryamtf') {
	echo $sms->postQueryamtf ();
} elseif ($m == 'mourlverify') {
	echo $sms->postMourlverify ();
} elseif ($m == 'smsmopush') {
	echo $sms->postSmsmopush ();
} elseif ($m == 'smsrptpush') {
	echo $sms->postSmsrptpush ();
}
class Sms {
	// 平台Base URL
	// 由平台提供 http://{IP}:{port}/{version}
	// $baseUrlString =
	// "http://121.41.85.249:28080/HIF12";
	public $_baseUrl = "http://211.149.232.213:28080/chif10";
	public $_enterpriseUrl = "http://localhost/yuecheng/rest/standard";
	// 用户ID
	public $_userId = "http05";
	// 帐号密码
	public $_password = "http05";
	// 短信接收端手机号码集合，用半角逗号（英文逗号）分开，每批发 送的手机号数量不得超过不能超过客户设置带宽。
	// 通常以20个号码做为上限。
	// 手机号建议不重复，不强制限制
	public $_mobile = "13466566405";
	// 短信内容，UTF-8 编码字符串，单条通常为 65 汉字以内（根据签 名规则不同），超过限制字数会被分拆，
	// 同时计费条数会根据最终拆 分条数计算，具体由平台拆分结果确定。
	public $_content = "确定";
	
	/**
	 * 上行状态报告推送
	 */
	public function postSmsrptpush() {
		$url = $this->_enterpriseUrl . '/smsrptpush';
		$data = json_encode ( array (
				'Msg_Id' => uniqid (), // 信息标识
				'Dest_Id' => '10086', // 用户上行服务号
				'Src_terminal_Id' => $this->_mobile, // 用户手机号
				'Stat' => 'DELIVRD' // 发送短信的应答结果 
		) );
		$return_content = $this->http_post_data ( $url, $data );
		return $return_content;
	}
	
	/**
	 * 上行短信推送
	 */
	public function postSmsmopush() {
		$url = $this->_enterpriseUrl . '/smsmopush';
		$data = json_encode ( array (
				'Msg_Id' => uniqid (), // 信息标识
				'Dest_Id' => '10086', // 用户上行服务号
				'TP_pId' => 0, // GSM协议类型。详细是解释请参考 GSM03.40中的9.2.3.9 默认
				'TP_udhi' => 0, // GSM协议类型。详细是解释请参考 GSM03.40中的9.2.3.23,仅使用1 位，右对齐 默认0
				'Msg_Fmt' => 15, // 短信内容编码： 0：ASCII串 3：短信写卡操作 4：二进制信息 8：UCS2编码 15：含GB汉字 默认为15
				'Src_terminal_Id' => $this->_mobile, // 用户手机号
				'Msg_Content' => $this->getBytes ( iconv ( "UTF-8", "gbk", $this->_content ) ) 
		) ); // 短信内容，使用 Msg_Fmt 编码编 码为Byte[]
		$return_content = $this->http_post_data ( $url, $data );
		return $return_content;
	}
	/**
	 * 上行URL验证
	 */
	public function postMourlverify() {
		$url = $this->_enterpriseUrl;
		$data = json_encode ( array (
				'Cmd' => 'Test' 
		) );
		$return_content = $this->http_post_data ( $url, $data );
		return $return_content;
	}
	/**
	 * 查询当前预付费用户余额
	 */
	public function postQueryamtf() {
		$url = $this->_baseUrl . "/queryamtf/" . $this->_userId . "/" . md5 ( $this->_userId . date ( 'YmdHis' ) . $this->_password );
		$data = json_encode ( array () );
		
		$return_content = $this->http_post_data ( $url, $data );
		return $return_content;
	}
	
	/**
	 * 提交短信
	 */
	public function postMt() {
		$url = $this->_baseUrl . "/mtsms/" . $this->_userId . "/" . md5 ( $this->_userId . date ( 'YmdHis' ) . $this->_password );
		$data = json_encode ( array (
				'Cli_Msg_Id' => uniqid (), // 客户流水号，可在响应中携带返回，最长24位，数 字、字母
				'Pk_total' => 1, // 相同信息总条数，从1开始 默认为1
				'Pk_number' => 1, // 相同信息序号，从1开始 默认为1
				'Registered_Delivery' => 1, // 是否要求返回状态确认报告： 0：不需要 1：需要 默认为0-不要状态报告
				'Msg_level' => 0, // 信息级别 （0-9）数字越大，级别越高 默认为0
				'Service_Id' => '', // 业务类型，是数字、字母和符号的组合 默认为空
				'TP_pId' => 0, // GSM 协议类型。详细是解释请参考 GSM03.40 中 的9.2.3.9 默认0
				'TP_udhi' => 0, // GSM 协议类型。详细是解释请参考 GSM03.40 中 的9.2.3.23,仅使用1位 默认0
				'Msg_Fmt' => 15, // 短信内容编码： 0：ASCII串 3：短信写卡操作 4：二进制信息 8：UCS2编码 15：含GB汉字 默认为15
				'Msg_src' => '', // 信息内容来源(数字、英文) 默认为空
				'Src_Id' => '', // 源号码，子扩展号，如可扩展，则扩展在短信平台 分配的扩展号后，但总号码不超过21位 默认为空-不扩展、使用短信平台分配的父扩展号
				'Dest_terminal_Id' => array (
						'13466566405' 
				), // 手机号码（最大21位），集合表示。 单次提交最多不能超过客户带宽。 手机号建议不重复，不强制限制。
				'Msg_Content' => $this->getBytes ( iconv ( "UTF-8", "gbk", $this->_content ) ) 
		) ); // 短信内容，使用Msg_Fmt编码编码为Byte[]
		
		$return_content = $this->http_post_data ( $url, $data );
		return $return_content;
	}
	
	/**
	 * 发送post数据
	 *
	 * @param unknown $url        	
	 * @param unknown $header        	
	 * @param unknown $data        	
	 * @param number $timeout        	
	 * @return unknown
	 */
	function http_post_data($url, $data_string) {
		$ch = curl_init ();
		
		curl_setopt ( $ch, CURLOPT_POST, 1 );
		curl_setopt ( $ch, CURLOPT_URL, $url );
		curl_setopt ( $ch, CURLOPT_POSTFIELDS, $data_string );
		curl_setopt ( $ch, CURLOPT_HTTPHEADER, array (
				'Accept: application/json',
				'Content-Type: application/json; charset=utf-8',
				'Authorization:' . base64_encode ( $this->_userId . ":" . date ( 'YmdHis' ) ) 
		) );
		ob_start ();
		curl_exec ( $ch );
		$return_content = ob_get_contents ();
		ob_end_clean ();
		
		$return_code = curl_getinfo ( $ch, CURLINFO_HTTP_CODE );
		return $return_content;
	}
	public function getBytes($string) {
		$bytes = array ();
		for($i = 0; $i < strlen ( $string ); $i ++) {
			if (ord ( $string [$i] ) < 128) {
				$bytes [] = ord ( $string [$i] );
			} else {
				$bytes [] = $this->phpbin2javabin ( ord ( $string [$i] ) );
			}
		}
		return $bytes;
	}
	// byte的取值范围
	// http://bbs.itheima.com/thread-19018-1-1.html
	// ord转java
	private function phpbin2javabin($ord) {
		$bin = decbin ( $ord ); // 转成二进制
		$fan = $this->bin2fan ( $bin ); // 按位取反
		$plus = $this->binplus ( $fan, 1 ); // 二进制加1
		$dec = bindec ( $plus ); // 转成ASCII值
		return - 1 * $dec;
	}
	// 二进制加法
	// binplus(101111,1)等于101111+1
	private function binplus($arg1, $arg2) {
		if ($arg1 == '' || $arg2 == '') {
			return false;
		}
		$tmpsum = bindec ( $arg1 ) + bindec ( $arg2 );
		return decbin ( $tmpsum );
	}
	
	// 按位取反
	private function bin2fan($arg) {
		$arr = str_split ( $arg );
		foreach ( $arr as $val ) {
			$bin_arr [] = ! empty ( $val ) ? 0 : 1;
		}
		return intval ( implode ( '', $bin_arr ) );
	}
}