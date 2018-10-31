# 日记、图片瀑布流
用于图说用户查看日记和图片混排的功能。

## 根据用户uuid、分页信息获取数据列表

```http
  GET /diarymixphoto/576258247b389a12d3ca7525?since_id=5764d866364a34733b2c9cc4&count=1&drop_refresh=true" HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[
  {
    "data_type": "DataTypeDiary",
    "id": "5764eef6364a34733b2c9cd8",
    "timestamp": "2016-06-18T14:49:26+08:00",
    "user_uuid": "10008",
    "data": {
      "content": "这是内容",
      "diary_privacy": 2,
      "id": 1,
      "style": "这是样式",
      "timestamp": "2016-05-28T13:24:29+08:00",
      "title": "这是标题",
      "user_uuid": "71db1dfb-43a2-4533-8ad5-601d9619214e",
      "uuid": "bcc35700-a446-42f9-9fa4-5566bd382bc4"
    }
  },
  {
    "data_type": "DataTypePhoto",
    "id": "5764eef6364a34733b2c9cd7",
    "timestamp": "2016-06-18T14:49:26+08:00",
    "user_uuid": "10008",
    "data": {
      "id": 19,
      "uuid": "585b0a3f-8460-4c51-aa51-a0f4d7342c24",
      "primary_color": "#FFFFFF",
      "user": {
        "id": 1,
        "uuid": "78f82f90-6536-4614-9f69-600b8748a04f",
        "avatar": {
          "id": 18,
          "uuid": "585b0a3f-8460-4c51-aa51-a0f4d7342c24",
          "image_url": {
            "lite_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i",
            "thumbnail_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i"
          }
        }
      },
      "height": 200,
      "width": 200,
      "md5": "biyuw3rgbvrgn32l4",
      "privacy": "photo_privacy_public",
      "image_url": {
        "lite_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i",
        "thumbnail_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i"
      },
      "file_size": 2139178,
      "timestamp": "2002-10-02T23:00:00+08:00"
    }
  }
]
```

### HTTP Request

`GET /diarymixphoto/576258247b389a12d3ca7525?since_id= 5764d866364a34733b2c9cc4&count=100&drop_refresh=true`

### Request Parameters

Parameter | Type | Description
----------|------|------------
user_uuid | string | 用户 	uuid
since_id | string | 数据的起始id（该id为数据的唯一标识，为字符串的uuid）
count | int | 指定要获取多少条信息
drop_refresh | bool | 是否为下拉刷新 （true：下拉刷新，获取最新数据，false：上拉刷新，获取历史数据   备注：数据按照时间倒序排列） 


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | string | 动态信息的id
data_type | string | 数据类型（DataTypePhoto：图片，DataTypeDiary：日记） 
user_uuid | string | 用户 uuid
data | photo或者diary | 参照Photo和dairy的字段，根据当前数据的类型取数据。
timestamp | string | 时间戳

