接口测试命令集：

post请求：
1、远程执行命令[ApiExeCommandHandler]
curl -d "host_id=200001&command=cat /etc/passwd" -v  "http://192.168.1.104:9999/api/command"

get请求：
1、主机列表[ApiServerlisHandler]
   curl -v "http://192.168.1.104:9999/api/overview/list"
