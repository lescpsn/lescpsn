# 日记
用于图说用户写日记的功能。

## 创建日记

```http
POST /diary HTTP/1.1
Content-Type: application/json
{
"user_uuid":"71db1dfb-43a2-4533-8ad5-601d9619214e",
"diary_privacy":4,
"title":"这是标题",
"content":"这是内容",
"style" :"这是样式" 
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}
```

### HTTP Request

`POST /diary`

### Request Parameters

Parameter | Type | Description
----------|------|------------
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 修改日记

```http
PUT diary/item/:ID HTTP/1.1
Content-Type: application/json
{
"diary_privacy":4,
"title":"这是标题",
"content":"这是内容",
"style" :"这是样式"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}
```

### HTTP Request

`PUT diary/item/:ID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 修改日记的部分信息

```http
PUT diary/patch/:ID HTTP/1.1
Content-Type: application/json
{
"title":"这是标题",
"style" :"这是样式",
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}
```

### HTTP Request

`PUT diary/patch/:ID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
title | string | 标题 
style | string | 样式



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 修改日记的隐私状态

```http
PUT diary/patch/:ID/:DiaryPrivacy HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}
```

### HTTP Request

`PUT diary/patch/1/2`

### Request Parameters

Parameter | Type | Description
----------|------|------------
- |  | 


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳




## 根据id删除日记

```http
DELETE diary/id/:ID HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}
```

### HTTP Request

`DELETE diary/id/:ID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
id|int|日记的id



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 根据uuid删除日记

```http
DELETE diary/uuid/:UUID HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}
```

### HTTP Request

`DELETE diary/uuid/:UUID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
uuid|string|日记的uuid



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 根据用户的id和分页参数获取数据列表

```http
GET diary/usrid/:ID?since_id=12&max_id=45&page=1&count=20 HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[{
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
},
{
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}]
```

### HTTP Request

`GET diary/usrid/:ID?since_id=12&max_id=45&page=1&count=20`

### Request Parameters

Parameter | Type | Description
----------|------|------------
since_id | int | Star 最小编号
max_id | int | Star 最大编号
page | int | 页数
count | int | 每页 Star 数



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 根据用户的uuid和分页参数获取数据列表

```http
GET diary/usruuid/:UUID?since_id=12&max_id=45&page=1&count=20 HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[{
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
},
{
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}]
```

### HTTP Request

`GET diary/usruuid/:UUID?since_id=12&max_id=45&page=1&count=20`

### Request Parameters

Parameter | Type | Description
----------|------|------------
since_id | int | Star 最小编号
max_id | int | Star 最大编号
page | int | 页数
count | int | 每页 Star 数



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布）  
style | string | 样式
timestamp | string | 时间戳

## 根据用户的id获取所有日记列表

```http
GET diary/all/usrid/:ID HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[{
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
},
{
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}]
```

### HTTP Request

`GET diary/all/usrid/1`

### Request Parameters

Parameter | Type | Description
----------|------|------------
-|



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 根据用户的uuid获取所有日记列表

```http
GET diary/all/usruuid/:UUID HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[{
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
},
{ 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}]
```

### HTTP Request

`GET diary/all/usruuid/fcc35700-a446-42f9-9fa4-5566bd382bc4`

### Request Parameters

Parameter | Type | Description
----------|------|------------
-|



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布）  
style | string | 样式
timestamp | string | 时间戳




## 根据日记id获取日记信息

```http
GET diary/id/:ID HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}
```

### HTTP Request

`GET diary/id/:ID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
id|int|日记的id



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳



## 根据多个日记id获取多条日记信息

```http
GET diary/ids/:IDs HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 12, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
},{
    "content": "这是内容", 
    "diary_privacy": 23, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
},{
    "content": "这是内容", 
    "diary_privacy": 14, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}]
```

### HTTP Request

`GET diary/ids/12,23,14`

### Request Parameters

Parameter | Type | Description
----------|------|------------
id|int|日记的id



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 根据日记uuid获取日记的信息

```http
GET diary/uuid/:UUID HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}
```

### HTTP Request

`GET diary/uuid/:UUID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
uuid|string|日记的uuid



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳

## 根据多个日记uuid获取多条日记信息

```http
GET diary/uuids/:IDs HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[{
    "content": "这是内容", 
    "diary_privacy": 2, 
    "id": 12, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
},{
    "content": "这是内容", 
    "diary_privacy": 23, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "21db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
},{
    "content": "这是内容", 
    "diary_privacy": 14, 
    "id": 1, 
    "style": "这是样式", 
    "timestamp": "2016-05-28T13:24:29+08:00", 
    "title": "这是标题", 
    "user_uuid": "31db1dfb-43a2-4533-8ad5-601d9619214e", 
    "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
}]
```

### HTTP Request

`GET diary/uuids/71db1dfb-43a2-4533-8ad5-601d9619214e,21db1dfb-43a2-4533-8ad5-601d9619214e,31db1dfb-43a2-4533-8ad5-601d9619214e`

### Request Parameters

Parameter | Type | Description
----------|------|------------
uuid|string|日记的uuid



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 日记的id
uuid | string | 日记的 UUID
user_uuid | string | 用户 UUID
title | string | 标题
content | string | 内容
diary_privacy | int | 开放类型 （1：public，2：private） 
diary_status | int | 日记状态 （1：留空，2：保存，3：发布） 
style | string | 样式
timestamp | string | 时间戳