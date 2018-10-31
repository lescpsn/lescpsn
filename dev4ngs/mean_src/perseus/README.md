# ELK Stack说明
### 简介：
ELK Stack 是 Elasticsearch、Logstash、Kibana 三个开源软件的组合。在实时数据检索和分析场合，三者通常是配合共用，而且又都先后归于 Elastic.co 公司名下，故有此简称。
### ELK Stack 具有如下几个优点：
**处理方式灵活:** Elasticsearch 是实时全文索引，不需要像 storm 那样预先编程才能使用；

**配置简易上手:** Elasticsearch 全部采用 JSON 接口，Logstash 是 Ruby DSL 设计，都是目前业界最通用的配置语法设计；


**检索性能高效:** 虽然每次查询都是实时计算，但是优秀的设计和实现基本可以达到全天数据查询的秒级响应；


**集群线性扩展:** 不管是 Elasticsearch 集群还是 Logstash 集群都是可以线性扩展的；


**前端操作炫丽:** Kibana 界面上，只需要点击鼠标，就可以完成搜索、聚合功能，生成炫丽的仪表板。

### 安装使用：

在命令行里执行命令：`sudo docker pull sebp/elk` 获取最新的elk环境镜像。镜像获取成功后可以采用：`$ sudo docker run -p 5601:5601 -p 9200:9200 -p 5044:5044 -p 5000:5000 -it --name elk sebp/elk`命令启动一个容器。然后通过主机的ip和映射出来的端口进行访问。`5601` 、`9200` 、`5044`、 `5000`分别代表：kibana、Elasticsearch、Logstash的Beats监听端口，用于从filebeat收集的信息传输、Logstash Lumberjack端口，用于logstash的转发。

### Docker compose安装使用：
创建`docker-compose.yml`文件内容如下：

	elk:
	  image: sebp/elk
	  ports:
	    - "5601:5601"
	    - "9200:9200"
	    - "5044:5044"
	    - "5000:5000"

然后执行命令：`$ sudo docker-compose up elk` , 等待创建成功后，访问相应的服务即可。

### 目录说明：

`kibana和logstash的安装目录为：/opt`

`elasticsearch的安装目录：/usr/share/elasticsearch`

`配置文件目录：etc/{组件名称}`

### 收集系统日志
采用filebeat来收集需要监听的机器日志，然后转发给logstash，logstash 经过input、filter、output后将数据存到elasticsearch里面。执行以下命令收集当前机器的系统信息：

`./filebeat -e -c filebeat.yml -d "publish"` (mac)

`sudo /etc/init.d/filebeat start` (deb)

`sudo /etc/init.d/filebeat start` (rpm)

`.PS C:\Program Files\Filebeat> Start-Service filebeat` (win)

#### 将日志输出到logstash的filebeat.yml 配置如下：

	output:
 		logstash:
 		 	# The Logstash hosts
 			hosts:["192.168.99.100:5044"]

### logstash的conf文件配置如下：

	input {
	  beats {
	    port => 5044
	  }
	}
	
	output {
	  elasticsearch {
	    hosts => ["http://localhost:9200"]
	    user=>"es_admin"
	    password=>"123456"
	  }
	}

以上的配置描述为：监听5044端口，并将捕获的信息直接输出给logstash。其他参数可以参照input、output的配置参数进行配置。

### 运行logstash的命令如下：
`./logstash -f logstash-filebeats.conf ` 从配置文件启动logstash，`-f`指定配置文件的目录。

### 运行elasticsearch的命令如下：
`sudo bin/elasticsearch` 如有特殊配置可以修改，config文件夹下的 ＊.yml文件，config文件夹下也包含了所有plugin的配置，如shield等。

### 运行kibana的命令如下：
`sudo bin/kibana` 如有特殊配置可以修改kibana.yml ,重启即可

# 以下是 Elasticsearch, Logstash, Kibana (ELK) Docker image 的描述信息

[![](https://badge.imagelayers.io/sebp/elk:latest.svg)](https://imagelayers.io/?images=sebp/elk:latest 'Get your own badge on imagelayers.io')

This Docker image provides a convenient centralised log server and log management web interface, by packaging Elasticsearch, Logstash, and Kibana, collectively known as ELK.

The following tags are available:

- `es233_l232_k451`, `latest`: Elasticsearch 2.3.3, Logstash 2.3.2, and Kibana 4.5.1.

- `es232_l232_k450`: Elasticsearch 2.3.2, Logstash 2.3.2, and Kibana 4.5.0.

- `es231_l231_k450`: Elasticsearch 2.3.1, Logstash 2.3.1, and Kibana 4.5.0.
 
- `es230_l230_k450`: Elasticsearch 2.3.0, Logstash 2.3.0, and Kibana 4.5.0.

- `es221_l222_k442`: Elasticsearch 2.2.1, Logstash 2.2.2, and Kibana 4.4.2.

- `es220_l222_k441`: Elasticsearch 2.2.0, Logstash 2.2.2, and Kibana 4.4.1.

- `es220_l220_k440`: Elasticsearch 2.2.0, Logstash 2.2.0, and Kibana 4.4.0.

- `E1L1K4`: Elasticsearch 1.7.3, Logstash 1.5.5, and Kibana 4.1.2.

**Note** – See the documentation page for more information on pulling specific combinations of versions of Elasticsearch, Logstash and Kibana.

### Documentation

See the [ELK Docker image documentation web page](http://elk-docker.readthedocs.io/) for complete instructions on how to use this image.

### Docker Hub

This image is hosted on Docker Hub at [https://hub.docker.com/r/sebp/elk/](https://hub.docker.com/r/sebp/elk/).

### About

Written by [Sébastien Pujadas](https://pujadas.net), released under the [Apache 2 license](https://www.apache.org/licenses/LICENSE-2.0).

