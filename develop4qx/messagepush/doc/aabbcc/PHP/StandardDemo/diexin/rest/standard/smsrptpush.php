<?php
/**
 * 上行状态报告推送  DEMO
 */
set_time_limit ( 0 );
header ( "Connection: Keep-Alive" );
header ( "Proxy-Connection: Keep-Alive" );

$data = file_get_contents ( 'php://input' ); // 接收 post

chmod ( dirname ( __FILE__ ), 0777 );
// a模式就是一种追加模式，如果是w模式则会删除之前的内容再添加
$file = fopen ( '../../demo/log.html', 'a+' );
// 获取需要写入的内容
// fwrite($data, $file);
fwrite ( $file, $data . '<br>' );

// 关闭b.php文件
fclose ( $file );
// 销毁文件资源句柄变量
unset ( $file );

$obj = json_decode ( $data );
if ($obj != null 
		&& property_exists($obj,'Msg_Id') 
		&& property_exists($obj,'Dest_Id') 
		&& property_exists($obj,'Src_terminal_Id') 
		&& property_exists($obj,'Stat') ) {
	echo json_encode ( array (
			'Rspcode' => 0 
	) );
} else {
	echo json_encode ( array (
			'Rspcode' => 1 
	) );
}