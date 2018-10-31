# banner活动
用于对banner活动的管理操作。

## 创建banner活动

```http
POST /activity HTTP/1.1
Content-Type: application/json
{
 "title":"标题",
 "mark":"备注",
 "img_url":"htt://img.baidu.com",
 "to_url":"http://baidu.com"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "id": "577235767b389a269d51b7ee",
  "img_url": "htt://img.baidu.com",
  "mark": "备注",
  "timestamp": "2016-06-28T16:29:42+08:00",
  "title": "标题",
  "to_url": "http://baidu.com"
}
```

### HTTP Request

`POST /activity`

### Request Parameters

Parameter | Type | Description
----------|------|------------
title | string | 标题
mark | string | 备注
img_url | string | 图片url
to_url | string | 跳转的web url
 


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | string | 信息的id
title | string | 标题
mark | string | 备注
img_url | string | 图片url
to_url | string | 跳转的web url
timestamp | string | 时间戳

## 分页数据列表

```http
  GET /activity?since_id=576258247b389a12d3ca7525&count=100&max_id=776258247b389a12d3ca7525 HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[
  {
    "id": "57722d1f7b389a25f676ce36",
    "img_url": "htt://img.baidu.com123",
    "mark": "备注1",
    "timestamp": "2016-06-28T15:54:07+08:00",
    "title": "标题2",
    "to_url": "http://baidu.com444"
  },
  {
    "id": "57722d1f7b389a25f676ce37",
    "img_url": "htt://img.baidu.com",
    "mark": "备注",
    "timestamp": "2016-06-28T15:54:07+08:00",
    "title": "标题",
    "to_url": "http://baidu.com"
  },
  {
    "id": "57722d1f7b389a25f676ce38",
    "img_url": "htt://img.baidu.com",
    "mark": "备注",
    "timestamp": "2016-06-28T15:54:07+08:00",
    "title": "标题",
    "to_url": "http://baidu.com"
  },
  {
    "id": "57722d1f7b389a25f676ce39",
    "img_url": "htt://img.baidu.com",
    "mark": "备注",
    "timestamp": "2016-06-28T15:54:07+08:00",
    "title": "标题",
    "to_url": "http://baidu.com"
  },
  {
    "id": "57722d207b389a25f676ce3a",
    "img_url": "htt://img.baidu.com",
    "mark": "备注",
    "timestamp": "2016-06-28T15:54:08+08:00",
    "title": "标题",
    "to_url": "http://baidu.com"
  },
  {
    "id": "57722d207b389a25f676ce3b",
    "img_url": "htt://img.baidu.com",
    "mark": "备注",
    "timestamp": "2016-06-28T15:54:08+08:00",
    "title": "标题",
    "to_url": "http://baidu.com"
  },
  {
    "id": "577235767b389a269d51b7ee",
    "img_url": "htt://img.baidu.com",
    "mark": "备注",
    "timestamp": "2016-06-28T16:29:42+08:00",
    "title": "标题",
    "to_url": "http://baidu.com"
  }
]
```

### HTTP Request

`GET /activity?since_id=576258247b389a12d3ca7525&count=100&max_id=776258247b389a12d3ca7525`

### Request Parameters

Parameter | Type | Description
----------|------|------------
since_id | string | 起始id（该id为数据的唯一标识，为字符串的uuid）
max_id | string | 最大id（该id为数据的唯一标识，为字符串的uuid）
count | int | 指定要获取多少条信息
  (备注：数据按照时间倒序排列） 


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | string | 信息的id
title | string | 标题
mark | string | 备注
img_url | string | 图片url
to_url | string | 跳转的web url
timestamp | string | 时间戳

## 修改活动信息

```http
PUT activity/57722d1f7b389a25f676ce36 HTTP/1.1
Content-Type: application/json
{
 "title":"标题1",
 "mark":"备注2",
 "img_url":"htt://img.baidu.com",
 "to_url":"http://baidu.com"
}
```

```http
HTTP/1.1 200 OK
true
```

### HTTP Request

`PUT activity/:ID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
id | string | 信息的id
title | string | 标题
mark | string | 备注
img_url | string | 图片url
to_url | string | 跳转的web url
timestamp | string | 时间戳

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
－| bool | true 代表状态已修改 false代表修改失败


## 查看活动详情

```http
GET activity/57722d1f7b389a25f676ce36 HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "id": "57722d1f7b389a25f676ce36",
  "img_url": "htt://img.baidu.com123",
  "mark": "备注1",
  "timestamp": "2016-06-28T15:54:07+08:00",
  "title": "标题2",
  "to_url": "http://baidu.com444"
}
```

### HTTP Request

`GET activity/:ID `

### Request Parameters

Parameter | Type | Description
----------|------|------------
id | string | 动态信息的id



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | string | 信息的id
title | string | 标题
mark | string | 备注
img_url | string | 图片url
to_url | string | 跳转的web url
timestamp | string | 时间戳


## 根据id删除动态消息

```http
DELETE activity/:ID HTTP/1.1
```

```http
HTTP/1.1 200 OK
true
```

### HTTP Request

`DELETE activity/:ID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
id | string | 信息的id



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
－| bool | true 代表删除成功 false代表删除失败
