#通用

##提交反馈

```http
POST /feedback HTTP/1.1
```

### Query Parameters

Parameter | Default | Description
--------- | ------- | -----------
suggestion\_text | None | 需要被验证的用户名

### Resp Struct

```http
HTTP/1.1 200 ok
Content-Type: application/json
```

本API用于提交用户意见反馈

##获取微信
```http
GET /wechat/js_ticket/:urlBase64 HTTP/1.1
```
### Resp Struct

```http
HTTP/1.1 200 ok
Content-Type: application/json
{
      "nonceStr": "R6iCv2Q2Hi",
            "signature": "5fd6f5b84866393444dd64fc733b0a3e1a1318b8",
              "ticket": "sM4AOVdWfPE4DxkXGEs8VLbch0FyJ3xhgN7r_IclCjUgQ_8kYDtFD_YMUGSf1ad7SbobbiTHc9PC5gKUOMQW4Q",
                "timestamp": "1462342796"

}
```
