#图说
图说信息是用于用户发布信息的模块。  

## 创建图说

```http
POST /tuso/ HTTP/1.1
Content-Type: application/json

{
"uuids":["585b0a3f-8460-4c51-aa51-a0f4d7342c24","78f82f90-6536-4614-9f69-600b8748a04f"],
"timestamp":"2016-10-02T23:00:00+08:00"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "comment_count": 0,
  "id": 20,
  "image": [
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 1920,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/44668de9-67a7-4ced-8799-9d2a80355807.jpg",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/44668de9-67a7-4ced-8799-9d2a80355807.jpg-thumbnail.outrange",
        "display_width": 1080,
        "edit_params": "{}"
      },
      "display_version": 0,
      "geo_location": "{}",
      "height": 1920,
      "id": 7,
      "in_pipeline": true,
      "lite_image": {
        "file_size": 85856,
        "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/eb9bd2c9-fe34-4f9c-8cc4-09c660a6f7ee.jpg"
      },
      "md5": "9c3d4751d965ed6f266c0483fc6c77e4",
      "primary_color": "c2d3e7ff",
      "privacy": "photo_privacy_public",
      "timestamp": "2016-03-18T13:15:58+08:00",
      "user": {
        "id": 2,
        "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
      },
      "uuid": "354934d3-f721-40e6-9eba-c1c706f396b1",
      "width": 1080
    },
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 600,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/cd7b2816-3a05-4dd7-bbe2-6733f8bccc3f.jpg",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/cd7b2816-3a05-4dd7-bbe2-6733f8bccc3f.jpg-thumbnail.outrange",
        "display_width": 428,
        "edit_params": "{}"
      },
      "display_version": 0,
      "geo_location": "{}",
      "height": 600,
      "id": 8,
      "in_pipeline": true,
      "lite_image": {
        "file_size": 20731,
        "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/85f8dada-8e0e-470e-9dde-32132a6ef337.jpg"
      },
      "md5": "62818c32807c4aad2fff5601c7401f69",
      "primary_color": "000000ff",
      "privacy": "photo_privacy_public",
      "timestamp": "2016-03-12T12:25:00+08:00",
      "user": {
        "id": 2,
        "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
      },
      "uuid": "414d9f13-ca04-4dee-a700-011da108c4c0",
      "width": 428
    }
  ],
  "photo_count": 2,
  "starred_count": 0,
  "timestamp": "2002-10-02T10:00:00-05:00",
  "user": {
    "id": 2,
    "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
  },
  "uuid": "4c612d78-d675-4bff-b6c1-8af99b995cdb"
}
```

本 API 用于新建图说,  并返回相关信息。

### HTTP Request

`POST /tuso/`

### Request Parameters

Parameter | Type | Description
--------- | ------- | -----------
uuids | array | 图片的uuid数组
timestamp|string｜时间戳

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 图说UUID
photo_count | int | 照片数量
comment_count | int | 评论数量
starred_count | int | 点赞的数量
timestamp | string | 时间戳
user| user | 返回用户名信息
image| int | 返回图片数据

## 拉取用户图说

```http
GET /user/:UUID/tusos?since_id=12&max_id=45&page=1&count=20 HTTP/1.1
Content-Type: application/json

```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[{
  "comment_count": 0,
  "id": 20,
  "image": [
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 1920,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/44668de9-67a7-4ced-8799-9d2a80355807.jpg",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/44668de9-67a7-4ced-8799-9d2a80355807.jpg-thumbnail.outrange",
        "display_width": 1080,
        "edit_params": "{}"
      },
      "display_version": 0,
      "geo_location": "{}",
      "height": 1920,
      "id": 7,
      "in_pipeline": true,
      "lite_image": {
        "file_size": 85856,
        "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/eb9bd2c9-fe34-4f9c-8cc4-09c660a6f7ee.jpg"
      },
      "md5": "9c3d4751d965ed6f266c0483fc6c77e4",
      "primary_color": "c2d3e7ff",
      "privacy": "photo_privacy_public",
      "timestamp": "2016-03-18T13:15:58+08:00",
      "user": {
        "id": 2,
        "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
      },
      "uuid": "354934d3-f721-40e6-9eba-c1c706f396b1",
      "width": 1080
    },
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 600,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/cd7b2816-3a05-4dd7-bbe2-6733f8bccc3f.jpg",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/cd7b2816-3a05-4dd7-bbe2-6733f8bccc3f.jpg-thumbnail.outrange",
        "display_width": 428,
        "edit_params": "{}"
      },
      "display_version": 0,
      "geo_location": "{}",
      "height": 600,
      "id": 8,
      "in_pipeline": true,
      "lite_image": {
        "file_size": 20731,
        "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/85f8dada-8e0e-470e-9dde-32132a6ef337.jpg"
      },
      "md5": "62818c32807c4aad2fff5601c7401f69",
      "primary_color": "000000ff",
      "privacy": "photo_privacy_public",
      "timestamp": "2016-03-12T12:25:00+08:00",
      "user": {
        "id": 2,
        "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
      },
      "uuid": "414d9f13-ca04-4dee-a700-011da108c4c0",
      "width": 428
    }
  ],
  "photo_count": 2,
  "starred_count": 0,
  "timestamp": "2002-10-02T10:00:00-05:00",
  "user": {
    "id": 2,
    "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
  },
  "uuid": "4c612d78-d675-4bff-b6c1-8af99b995cdb"
}]
```

本 API 用于拉取去用户图说列表。

### HTTP Request

`GET user/2c580cae-87c5-4d42-b54b-cfadc2462429/tusos?since_id=12&max_id=45&page=1&count=20`

### Request Parameters

Parameter | Type | Description
--------- | ------- | -----------
since_id | int | 图说 ID 最小编号
max_id | int | 图说 ID 最大编号
page | int | 页数
count | int | 每页 图说 数

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 图说UUID
photo_count | int | 照片数量
comment_count | int | 评论数量
starred_count | int | 点赞的数量
timestamp | string | 时间戳
user| user | 返回用户名信息
image| int | 返回图片数据

## 获取图说详情

```http
GET /tuso/f99b006b-7890-4775-bcc4-0804331b9282 HTTP/1.1
Content-Type: application/json

```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "comment_count": 0,
  "id": 270,
  "images": [
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 200,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/183e8b87-7324-46f8-859a-2d51478bbf59.jpg",
        "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/183e8b87-7324-46f8-859a-2d51478bbf59.jpg?imageMogr2/thumbnail/!200x200r/gravity/center/crop/200x200",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/183e8b87-7324-46f8-859a-2d51478bbf59.jpg",
        "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/183e8b87-7324-46f8-859a-2d51478bbf59.jpg?imageMogr2/crop/500x",
        "display_width": 225,
        "edit_params": "{}",
        "file_size": 8372
      },
      "display_version": 2,
      "geo_location": "{}",
      "height": 200,
      "id": 4197,
      "primary_color": "cda685ff",
      "timestamp": "2016-06-01T16:12:35+08:00",
      "uuid": "dd8de4e6-245e-4a0c-a667-a89c13c9e769",
      "width": 225
    },
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 3264,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/73f87553-d66a-49aa-98f8-ebb5e8860b7e.jpg",
        "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/73f87553-d66a-49aa-98f8-ebb5e8860b7e.jpg?imageMogr2/thumbnail/!200x200r/gravity/center/crop/200x200",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/73f87553-d66a-49aa-98f8-ebb5e8860b7e.jpg?imageMogr2/thumbnail/720x",
        "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/73f87553-d66a-49aa-98f8-ebb5e8860b7e.jpg?imageMogr2/thumbnail/720x1800",
        "display_width": 2448,
        "edit_params": "{}",
        "file_size": 647081
      },
      "display_version": 2,
      "geo_location": "{\n  \"speed\" : 0,\n  \"latitude\" : 32.01993616666667,\n  \"longitude\" : 119.1020888333333,\n  \"course\" : 127.5980392156863,\n  \"altitude\" : 50.88232421875\n}",
      "height": 3264,
      "id": 4599,
      "primary_color": "0d0c11ff",
      "timestamp": "2016-07-10T14:12:29+08:00",
      "uuid": "5c3efcaa-19e1-4785-992e-42718d7dec7b",
      "width": 2448
    },
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 3264,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/e53fda65-1b86-404a-9a50-9f99d2f35362.jpg",
        "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/e53fda65-1b86-404a-9a50-9f99d2f35362.jpg?imageMogr2/thumbnail/!200x200r/gravity/center/crop/200x200",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/e53fda65-1b86-404a-9a50-9f99d2f35362.jpg?imageMogr2/thumbnail/720x",
        "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/e53fda65-1b86-404a-9a50-9f99d2f35362.jpg?imageMogr2/thumbnail/720x1800",
        "display_width": 2448,
        "edit_params": "{}",
        "file_size": 594785
      },
      "display_version": 2,
      "geo_location": "{\n  \"speed\" : 0,\n  \"latitude\" : 32.01993616666667,\n  \"longitude\" : 119.1020888333333,\n  \"course\" : 124.8676470588235,\n  \"altitude\" : 49.31738035264484\n}",
      "height": 3264,
      "id": 4601,
      "primary_color": "0a090eff",
      "timestamp": "2016-07-10T14:12:26+08:00",
      "uuid": "d9cb86cb-677d-4a93-aabd-f4f0d00d6d74",
      "width": 2448
    }
  ],
  "photo_count": 3,
  "starred_count": 0,
  "timestamp": "2016-07-30T16:49:19+08:00",
  "user": {
    "birthday": "2000-01-01T00:00:00+08:00",
    "followees": 1,
    "followers": 1,
    "friends": 59,
    "id": 7,
    "images": 15,
    "nickname": "O了",
    "photo_create_at": "2016-07-11T11:26:26+08:00",
    "tuso_create_at": "2016-08-01T16:12:37.584908138+08:00",
    "tuso_id": "315543",
    "tusos": 0,
    "user_create_at": "2016-05-23T10:55:44+08:00",
    "uuid": "7c6412e1-29fb-4f7d-ac14-192c6fd6cb99"
  },
  "uuid": "f99b006b-7890-4775-bcc4-0804331b9282"
}
```

本 API 用于获取图说详情。

### HTTP Request

`GET /tuso/:TusoUUID`


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 图说UUID
photo_count | int | 照片数量
comment_count | int | 评论数量
starred_count | int | 点赞的数量
timestamp | string | 时间戳
user| user | 返回用户名信息
## image| int | 返回图片数据

## 转发图说

```http
PUT tuso/:UUID/forward HTTP/1.1 
Content-Type: application/json

```

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

本 API 用于转发图说

### HTTP Request

`PUT tuso/4c612d78-d675-4bff-b6c1-8af99b995cdb/forward`

### Request Parameters

Parameter | Type | Description
--------- | ------- | -----------
- |  -  | - 

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
- |  -  | - 


## 图说点赞

```http
PUT tuso/585b0a3f-8460-4c51-aa51-a0f4d7342c24/star HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{  
   "id":123,
   "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
   "star_user":{  
      "id":345,
      "uuid":"66486289-8460-4c51-aa51-a0f4d7342c24",
      "nickname":"Vivi",
      "followees":"12",
      "followers":"32",
      "tuso_id":"243353",
      "real_name":"刘德华",
      "birthday":"2016-10-02T23:00:00+08:00",
      "gender":"0",
      "friends":45,
      "images":65,
      "tusos":70,
   },
   "news_uuid":"78f82f90-6536-4614-9f69-600b8748a04f"
}
```

本 API 用于图说的点赞操作

### HTTP Request

`PUT tuso/:UUID/star`

### Request Parameters

Parameter | Type | Description
--------- | ------- | -----------
- |  -  | - 


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 点赞的id
uuid | int | 点赞的id
star_user | User | 返回点赞的用户信息
news_uuid|string|图说的 UUID

## 图说取消点赞

```http
PUT tuso/585b0a3f-8460-4c51-aa51-a0f4d7342c24/unstar HTTP/1.1

```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{  
   "id":123,
   "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
   "star_user":{  
      "id":345,
      "uuid":"66486289-8460-4c51-aa51-a0f4d7342c24",
      "nickname":"Vivi",
      "followees":"12",
      "followers":"32",
      "tuso_id":"243353",
      "real_name":"刘德华",
      "birthday":"2016-10-02T23:00:00+08:00",
      "gender":"0",
      "friends":45,
      "images":65,
      "tusos":70,
   },
   "news_uuid":"78f82f90-6536-4614-9f69-600b8748a04f"
}
```

本 API 用于新建图说

### HTTP Request

`PUT tuso/:UUID/unstar`

### Request Parameters

Parameter | Type | Description
--------- | ------- |-----------
- |  -  | - 


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 星级的id
uuid | int | 星级的id
star_user | User | 返回用户的信息
news_uuid|string|图说的uuid

## 拉取图说点赞列表

```http
GET tuso/585b0a3f-8460-4c51-aa51-a0f4d7342c24/star HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[{
  "comment_count": 0,
  "id": 20,
  "image": [
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 1920,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/44668de9-67a7-4ced-8799-9d2a80355807.jpg",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/44668de9-67a7-4ced-8799-9d2a80355807.jpg-thumbnail.outrange",
        "display_width": 1080,
        "edit_params": "{}"
      },
      "display_version": 0,
      "geo_location": "{}",
      "height": 1920,
      "id": 7,
      "in_pipeline": true,
      "lite_image": {
        "file_size": 85856,
        "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/eb9bd2c9-fe34-4f9c-8cc4-09c660a6f7ee.jpg"
      },
      "md5": "9c3d4751d965ed6f266c0483fc6c77e4",
      "primary_color": "c2d3e7ff",
      "privacy": "photo_privacy_public",
      "timestamp": "2016-03-18T13:15:58+08:00",
      "user": {
        "id": 2,
        "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
      },
      "uuid": "354934d3-f721-40e6-9eba-c1c706f396b1",
      "width": 1080
    },
    {
      "comment_sum": 0,
      "display_image": {
        "display_height": 600,
        "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/cd7b2816-3a05-4dd7-bbe2-6733f8bccc3f.jpg",
        "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/cd7b2816-3a05-4dd7-bbe2-6733f8bccc3f.jpg-thumbnail.outrange",
        "display_width": 428,
        "edit_params": "{}"
      },
      "display_version": 0,
      "geo_location": "{}",
      "height": 600,
      "id": 8,
      "in_pipeline": true,
      "lite_image": {
        "file_size": 20731,
        "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/85f8dada-8e0e-470e-9dde-32132a6ef337.jpg"
      },
      "md5": "62818c32807c4aad2fff5601c7401f69",
      "primary_color": "000000ff",
      "privacy": "photo_privacy_public",
      "timestamp": "2016-03-12T12:25:00+08:00",
      "user": {
        "id": 2,
        "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
      },
      "uuid": "414d9f13-ca04-4dee-a700-011da108c4c0",
      "width": 428
    }
  ],
  "photo_count": 2,
  "starred_count": 0,
  "timestamp": "2002-10-02T10:00:00-05:00",
  "user": {
    "id": 2,
    "uuid": "2c580cae-87c5-4d42-b54b-cfadc2462429"
  },
  "uuid": "4c612d78-d675-4bff-b6c1-8af99b995cdb"
}]
```

本 API 用于拉取图说点赞列表

### HTTP Request

`GET tuso/:UUID/star?since_id=12&max_id=45&page=1&count=20`

### Request Parameters

Parameter | Type | Description
--------- | ------- | -----------
since_id | int | Star 最小编号
max_id | int | Star 最大编号
page | int | 页数
count | int | 每页 Star 数

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | Star 的id
uuid | int | Star 的id
star_user | User | 返回 Star 的用户信息
news_uuid | string| 图说的uuid

## 图说评论

```http
POST tuso/:UUID/comment HTTP/1.1 
Content-Type: application/json

{  
   "reply_to":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
   "content":"很好！",
   "timestamp":"2016-10-02T23:00:00+08:00"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{  
   "id":123,
   "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
   "content":"This pic is very nice!",
   "timestap":"2016-10-02T23:00:00+08:00",
   "reply":{  
      "id":123,
      "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
      "content":"This pic is very nice!",
      "timestap":"2016-10-02T23:00:00+08:00"
   },
   "user":{  
      "id":345,
      "uuid":"66486289-8460-4c51-aa51-a0f4d7342c24",
      "nickname":"Vivi",
      "followees":"12",
      "followers":"32",
      "tuso_id":"243353",
      "real_name":"刘德华",
      "birthday":"2016-10-02T23:00:00+08:00",
      "gender":"0",
      "friends":45,
      "images":65,
      "tusos":70,
   }
}
```

本 API 用于发布评论操作

### HTTP Request

`post tuso/:UUID/comment`

### Request Parameters

Parameter | Type | Description
--------- | ------- | -----------
reply_to | string | 回复的uuid
content | string|评论
timestamp | string |时间戳


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
uuid | string | uuid
content | string|评论
reply | Dungeons | 回复的内容
user | user | 用户信息

## 图说评论列表

```http 
get tuso/:UUID/comments HTTP/1.1 
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[  
   {  
      "id":123,
      "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
      "content":"This pic is very nice!",
      "timestap":"2016-10-02T23:00:00+08:00",
      "reply":{  
         "id":123,
         "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
         "content":"This pic is very nice!",
         "timestap":"2016-10-02T23:00:00+08:00"
      },
      "user":{  
         "id":345,
         "uuid":"66486289-8460-4c51-aa51-a0f4d7342c24",
         "nickname":"Vivi",
         "followees":"12",
         "followers":"32",
         "tuso_id":"243353",
         "real_name":"刘德华",
         "birthday":"2016-10-02T23:00:00+08:00",
         "gender":"0",
         "friends":45,
         "images":65,
         "tusos":70,
      }
   },
   {  
      "id":123,
      "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
      "content":"This pic is very nice!",
      "timestap":"2016-10-02T23:00:00+08:00",
      "reply":{  
         "id":123,
         "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
         "content":"This pic is very nice!",
         "timestap":"2016-10-02T23:00:00+08:00"
      },
      "user":{  
         "id":345,
         "uuid":"66486289-8460-4c51-aa51-a0f4d7342c24",
         "nickname":"Vivi",
         "followees":"12",
         "followers":"32",
         "tuso_id":"243353",
         "real_name":"刘德华",
         "birthday":"2016-10-02T23:00:00+08:00",
         "gender":"0",
         "friends":45,
         "images":65,
         "tusos":70,
      }
   }
]
```

本 API 根据uuid获取评论列表

### HTTP Request

`get tuso/:UUID/comments?since_id=12&max_id=45&page=1&count=20`

### Request Parameters

Parameter | Type | Description
--------- | ------- | -----------
since_id | int | 图片最小编号
max_id | int | 图片最大编号
page | int | 页数
count | int | 每页照片数

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
uuid | string | uuid
content | string|评论
reply | Dungeons | 回复的内容
user | user | 用户信息

## 删除图说评论

```http
DELETE tuso/585b0a3f-8460-4c51-aa51-a0f4d7342c24/comment/66486289-8460-4c51-aa51-a0f4d7342c24 HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{  
   "id":123,
   "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
   "content":"This pic is very nice!",
   "timestap":"2016-10-02T23:00:00+08:00",
   "reply":{  
      "id":123,
      "uuid":"585b0a3f-8460-4c51-aa51-a0f4d7342c24",
      "content":"This pic is very nice!",
      "timestap":"2016-10-02T23:00:00+08:00"
   },
   "user":{  
      "id":345,
      "uuid":"66486289-8460-4c51-aa51-a0f4d7342c24",
      "nickname":"Vivi",
      "followees":"12",
      "followers":"32",
      "tuso_id":"243353",
      "real_name":"刘德华",
      "birthday":"2016-10-02T23:00:00+08:00",
      "gender":"0",
      "friends":45,
      "images":65,
      "tusos":70,
   }
}
```

本 API 用于删除图说评论

### HTTP Request

`DELETE tuso/:uuid/comment/cuuid`

### Request Parameters

Parameter | Type | Description
--------- | ------- | -----------
－ | － | －

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
uuid | string | uuid
content | string|评论
reply | Dungeons | 回复的内容
user | user | 用户信息

