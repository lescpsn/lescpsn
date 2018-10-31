<?php
/**
 * 简版HTTP接口DEMO
 */
session_start ();
header ( "Content-type:text/html; charset=UTF-8" );

// 平台Base URL
// 由平台提供 http://{IP}:{port}/{version}
// $baseUrlString =
// "http://123.57.48.46:28080/HIF12";
$baseUrl = "http://123.57.48.46:28080/HIF12";
$enterpriseUrl = "http://localhost/yuecheng/rest/simple";
// 用户ID
$userId = "http06";
// 帐号密码
$password = "http06";
// 短信接收端手机号码集合，用半角逗号（英文逗号）分开，每批发 送的手机号数量不得超过不能超过客户设置带宽。
// 通常以20个号码做为上限。
// 手机号建议不重复，不强制限制
$mobile = "13466566405";
// 短信内容，UTF-8 编码字符串，单条通常为 65 汉字以内（根据签 名规则不同），超过限制字数会被分拆，
// 同时计费条数会根据最终拆 分条数计算，具体由平台拆分结果确定。
$content = "确定";

$m = $_GET ['m'];
if ($m == 'mt') {
	echo postMt ();
} elseif ($m == 'queryamtf') {
	echo postQueryamtf ();
} elseif ($m == 'mourlverify') {
	echo postMourlverify ();
} elseif ($m == 'smsmopush') {
	echo postSmsmopush ();
} elseif ($m == 'smsrptpush') {
	echo postSmsrptpush ();
}

/**
 * 上行状态报告推送  
 */
function postSmsrptpush() {
	global $enterpriseUrl;
	global $userId;
	global $password;
	global $mobile;
	global $content;
	
	$url = $enterpriseUrl . "/smsrptpush";
	$data = json_encode ( array (
			'Msg_Id' => uniqid (),
			'Dest_Id' => '106901110001',
			'Mobile' => $mobile,
			'Status' => 'DELIVRD' 
	) );
	
	$return_content = http_post_data ( $url, $data );
	return $return_content;
}

/**
 * 上行短信推送
 */
function postSmsmopush() {
	global $enterpriseUrl;
	global $userId;
	global $password;
	global $mobile;
	global $content;
	
	$url = $enterpriseUrl . "/smsmopush";
	$data = json_encode ( array (
			'Msg_Id' => uniqid (),
			'Dest_Id' => '106901110001',
			'Mobile' => $mobile,
			'Content' => $content 
	) );
	
	$return_content = http_post_data ( $url, $data );
	return $return_content;
}
/**
 * 上行URL验证
 */
function postMourlverify() {
	global $enterpriseUrl;
	global $userId;
	global $password;
	global $mobile;
	global $content;
	
	$url = $enterpriseUrl;
	$data = json_encode ( array (
			'Cmd' => 'Test' 
	) );
	
	$return_content = http_post_data ( $url, $data );
	return $return_content;
}
/**
 * 查询当前预付费用户余额
 */
function postQueryamtf() {
	global $baseUrl;
	global $userId;
	
	$url = $baseUrl . "/queryamtf/" . $userId;
	$data = json_encode ( array () );
	
	$return_content = http_post_data ( $url, $data );
	return $return_content;
}

/**
 * 提交短信
 */
function postMt() {
	global $baseUrl;
	global $userId;
	global $password;
	global $mobile;
	global $content;
	
	$url = $baseUrl . "/mt";
	$data = json_encode ( array (
			'Userid' => $userId,
			'Passwd' => $password,
			'Cli_Msg_Id' => uniqid (),
			'Mobile' => $mobile,
			'Content' => $content 
	) );
	
	$return_content = http_post_data ( $url, $data );
	return $return_content;
}

/**
 * 发送post数据
 *
 * @param
 *        	$url
 * @param
 *        	$data_string
 */
function http_post_data($url, $data_string) {
	$ch = curl_init ();
	curl_setopt ( $ch, CURLOPT_POST, 1 );
	curl_setopt ( $ch, CURLOPT_URL, $url );
	curl_setopt ( $ch, CURLOPT_POSTFIELDS, $data_string );
	curl_setopt ( $ch, CURLOPT_HTTPHEADER, array (
			'Accept: application/json',
			'Content-Type: application/json; charset=utf-8',
			'Content-Length: ' . strlen ( $data_string ) 
	) );
	ob_start ();
	curl_exec ( $ch );
	$return_content = ob_get_contents ();
	ob_end_clean ();
	
	$return_code = curl_getinfo ( $ch, CURLINFO_HTTP_CODE );
	return $return_content;
}