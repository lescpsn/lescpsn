*充值WEB接口文档*

# 概述

* 接口基于HTTP协议，提交方式为POST。
* 接口签名方式为MD5，KEY值由平台提供，可以更换。
* 接口以XML形式返回充值请求后的信息。
* 当充值成功后，本平台将以异步或者同步的方式通知商户。
* 通知URL地址由代理商提供给本平台。

# 接口定义

## 话费充值接口

### 地址
http://ip:port/order.do

### 入参
|参数名         |类型  |长度   |备注                             |
|---------------|------|-------|---------------------------------|
|userid         |string|1-20   |商代理商编号                     |
|price          |string|1-20   |充值金额（面值）整数，如：50,100 |
|num            |int   |1-10   |订单商品数量（只能为1）          |
|mobile         |string|1-11   |充值手机号                       |
|spordertime    |time  |1-14   |代理商订单时间(yyyyMMddHHmmss)   |
|sporderid      |string|1-30   |代理商系统订单号（流水号）[2]    |
|sign           |string|1-32   |验证摘要串 [1]                   |
|back_url       |string|1-80   |回调URL，不参与验证              |

### 说明
* [1] sign=MD5(userid=xxxx&price=xxxx&num=xxx&mobile=xxxxx&spordertime=xxxxxxx&sporderid=xxxxx&key=xxxxxxx)
* [2] 要求不可重复，每笔只可同时提交一次

###返回说明
```xml
<?xml version="1.0" ?> 
<order>
    <!-- 直充平台订单号 -->
    <orderid>XS090428000003</orderid> 
    <num>1</num>
    <!-- 订单金额 -->
    <ordercash>98.5</ordercash>
    <!-- 商户平台订单号 -->
    <sporderid>2009042800001</sporderid> 
    <!-- 充值手机号 -->
    <mobile>13590101510</mobile >
    <!-- 订单处理时间 -->
    <merchantsubmittime></merchantsubmittime>
    <!-- 直充结果编码  详见备注描述 -->
    <resultno>0</resultno>
</order>
```

## 账户余额查询接口

### 地址:
http:///ip:port/balance.do 

### 入参
|参数名 |类型  |长度|备注      |
|-------|------|----|----------|
|userid |string|1-20|商户编号  |
|sign   |string|32  |验证摘要串|

### 说明
sign=MD5(userid=xxxx&key=xxxxxxx)

### 返回说明
```xml
<?xml version="1.0" ?> 
<user>
    <!-- 直充平台商户号 -->
    <userid>1000028</userid>
    <!-- 商户余额 -->
    <balance>3312</balance>
    <resultno>1</resultno>
</user>
```

## 商户订单回调接口

平台将以POST方式把回调参数发送给商户

### 地址:
由充值接口back_url定义

### 入参
|参数名             |类型  |长度 |备注                     |
|-------------------|------|-----|-------------------------|
|userid             |string|1-20 |商户编号                 |
|orderid            |string|1-20 |直充平台订单号           |
|sporderid          |string|1-30 |代理商订单号             |
|merchantsubmittime |string|1-30 |处理时间(yyyyMMddHHmmss) |
|resultno           |String|1-10 |直充结果编码             |
|sign               |String|32   |验证摘要串[1]            |

### 说明
* [1] sign=MD5(userid=xxxx&orderid=xxxxxxx&sporderid=xxxxx&merchantsubmittime=xxxxx &resultno=xxxxx&key=xxxxxxx


## 订单查询接口

### 地址
http://ip:port/query.do

### 入参
|参数名    |类型  |长度|备注         |
|----------|------|----|-------------|
|userid    |string|1-20|商户编号     |
|sporderid |string|1-30|代理商订单号 |

### 返回说明
```xml
<?xml version="1.0" encoding="GB2312" ?> 
<order>
    <!-- 直充平台订单号 -->
    <orderid>XS090428000003</orderid>
    <!-- 数量 -->
    <num>1</num> 
    <!-- 订单金额 -->
    <ordercash>98.5</ordercash>
    <!-- 商户平台订单号 -->
    <sporderid>2009042800001</sporderid> 
    <!-- 充值账号 -->
    <account>13590101510</account>
    <!-- 直充结果编码  详见备注描述 -->
    <resultno>1</resultno>
</order>
```

# 返回值定义

|结果码 | 含义                          |
|-------|-------------------------------|
|      0| 等待充值                      |
|      1| 充值成功                      |
|      2| 充值中                        |
|      9| 充值失败已退款                |
|   5001| 代理商不存在                  |
|   5002| 代理商余额不足                |
|   5003| 此商品暂时不可购买            |
|   5004| 充值号码与所选商品不符        |
|   5005| 充值请求验证错误              |
|   5006| 代理商订单号重复              |
|   5007| 所查询的订单不存在            |
|   5008| 交易亏损不能充值              |
|   5009| IP不符                        |
|   5010| 商品编号与充值金额不符        |
|   5011| 商品数量不支持                |
|   5012| 缺少必要参数或参数值不合法    |
|   9999| 未知错误,需进入平台查询核实   |
