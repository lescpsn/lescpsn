#图说的账户动态微服务

##此微服务主要功能有： 查看动态列表、标记动态消息为已读消息、删除消息、创建动态、查看单条动态的详情

#接口url如下:
## 查询用户自己动态
``` url
GET users/notice
```
## 更新动态(为设置成已读状态)
```url
PUT notice/read/:ID
```
## 删除某条动态
```url
DELETE notice/:ID
```
## 根据id获取莫条动态的详情
```
GET notice/item/:ID
```

#图说动态的结构
```json
{
    "id":"string",
    "user_id":"发送用户的id",
    "status_string":"图说的状态string",
    "status":"图说的状态int",
    "from_user":{
        "发送用户的结构(可能携带,看是否需要)"//参考user结构
    }
    "to_user":{
        "该用户的结构(可能携带,看是否需要)"
    }
    "type":"动态的类型",
    "message":"动态的附带信息stirng可以序列化成json object"
    "timestamp":"动态的发生时间"
}
```