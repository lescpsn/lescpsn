# 帐户动态
用于图说用户查看账户动态消息的功能。

## 根据用户uuid、状态、分页信息获取数据列表

```http
  GET /account_dyms/usruuid/c7821747-35eb-4e01-816a-d873df920f0e?since_id=576258247b389a12d3ca7525&count=100&status=2 HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
[
  {
    "dyms_status": 2,
    "id": "57626f3d7b389a22e39656dd",
    "timestamp": "2016-06-16T17:19:57+08:00",
    "user_uuid": "c7821747-35eb-4e01-816a-d873df920f0e",
    "user_rel": {
      "id": 1,
      "is_applying_friend": true,
      "relation_type": "related_type_none",
      "target_user": {
        "id": 2,
        "uuid": "863848c3-563d-4c36-ba71-173624c35c7a"
      },
      "uuid": "1d8e2641-12b7-441e-ba71-556437d00454"
    }
  }
]
```

### HTTP Request

`GET /account_dyms/usruuid/c7821747-35eb-4e01-816a-d873df920f0e?since_id=576258247b389a12d3ca7525&count=100&status=2`

### Request Parameters

Parameter | Type | Description
----------|------|------------
user_uuid | string | 用户 uuid
since_id | string | 动态的起始id（该id为数据的唯一标识，为字符串的uuid）
max_id | string | 动态的最大id（该id为数据的唯一标识，为字符串的uuid）
count | int | 指定要获取多少条信息
status | int | 阅读状态（1：已经阅读，2：未阅读） 
  备注：数据按照时间倒序排列） 


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | string | 动态信息的id
dyms_status | int | 阅读状态（1：已经阅读，2：未阅读） 
user_uuid | string | 用户 uuid
user_rel | UserRelation | 账户关系描述 参照UserRelation对象
timestamp | string | 时间戳

## 将消息设置为已读

```http
PUT account_dyms/read/57626f3d7b389a22e39656dd HTTP/1.1
```

```http
HTTP/1.1 200 OK
true
```

### HTTP Request

`PUT account_dyms/read/:ID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
id | string | 动态信息的id

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
－| bool | true 代表状态已修改 false代表修改失败


## 查看消息动态

```http
GET account_dyms/item/57626f3d7b389a22e39656dd HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "dyms_status": 2,
  "id": "57626f3d7b389a22e39656dd",
  "timestamp": "2016-06-16T17:19:57+08:00",
  "user_uuid": "c7821747-35eb-4e01-816a-d873df920f0e",
  "user_rel": {
    "id": 1,
    "is_applying_friend": true,
    "relation_type": "related_type_none",
    "target_user": {
      "id": 2,
      "uuid": "863848c3-563d-4c36-ba71-173624c35c7a"
    },
    "uuid": "1d8e2641-12b7-441e-ba71-556437d00454"
  }
}
```

### HTTP Request

`GET account_dyms/item/:ID `

### Request Parameters

Parameter | Type | Description
----------|------|------------
id | string | 动态信息的id



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | string | 动态信息的id
dyms_status | int | 阅读状态（1：已经阅读，2：未阅读） 
user_uuid | string | 用户 uuid
user_rel | UserRelation | 账户关系描述 参照UserRelation对象
timestamp | string | 时间戳


## 根据id删除动态消息

```http
DELETE account_dyms/:ID HTTP/1.1
```

```http
HTTP/1.1 200 OK
true
```

### HTTP Request

`DELETE account_dyms/:ID`

### Request Parameters

Parameter | Type | Description
----------|------|------------
id | string | 动态信息的id



### Attribute Parameters

Attribute | Type | Description
----------|------|------------
－| bool | true 代表删除成功 false代表删除失败
