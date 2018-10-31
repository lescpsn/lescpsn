# 账号


## 验证用户名

```http
GET /account/verify_username/:username HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "validate": true
}
```

本 API 用于验证传入用户名是否存在于系统中

传入的 username 为邮箱或者手机号码，不合法则返回：

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
{
  "code": 1003,
  "message": "Invalid User name"
}
```

本方法用于验证用户传入的 username 是否合法和唯一, 如**`合法且唯一`**则返回{"validate":true}

### HTTP Request

`GET /account/verify_username/:username`

### Query Parameters

Parameter | Default | Description
--------- | ------- | -----------
username | None | 需要被验证的用户名

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
validate | boolean | 返回用户名是否**不在**系统中


##  注册

```http
POST /account/register HTTP/1.1
Content-Type: application/json
X-Tuso-Device-Token: Device-Token

{
  "username": "jiayu@ngs.tech",
  "password": "123456"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "followees": 0,
  "followers": 0,
  "friends": 0,
  "gender": "user_gender_male",
  "id": 108,
  "images": 0,
  "nickname": "RapForTest@qq.com",
  "nuclear_key": "pnlUtXjsx1pkIPteCJ6tKlbmWHKUdkUT",
  "token": "cU3BKwYbP0J421v6MSG2m8h9eme3LTZk",
  "tuso_create_at": "2016-07-22T10:53:42.798828496+08:00",
  "tuso_id": "550261",
  "tusos": 0,
  "user_create_at": "2016-07-22T10:53:42+08:00",
  "uuid": "cc44b89a-83d7-411d-9ca4-ad98d86933e8"
}
```

登陆 API 用户在系统内创建一个普通用户。普通用户，顾名思义，可以理解为没有管理权限的用户，一个常规用户。注册过程需要两个要素, *username* 和 *password*; 当用户创建后，系统会返回 *token*，用于后续操作的验证.

注： 此API的 *username* 只能为邮箱，传入其他不符合邮箱正则的均会报错:

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
{
  "code": 1001,
  "message": "Invalid Email"
}
```

### HTTP Request

`POST /account/register`

### Request Parameters

Parameter | Type | Description
----------|------|------------
username | string | 用户用于注册的用户名，本用户名只能由邮箱组成
password | string | 密码

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 用户 ID
uuid | string | 用户 UUID， UUID 是用于所有用户相关操作的唯一识别号
nickname | string | 用户昵称（默认为用户名）
tuso_id | string | 用户的图说ID
followees | int | 用户关注数
followers | int | 用户粉丝数
friends | int | 用户好友数
tusos | int | 用户图说数
images | int | 用户图片数
gender | string | 用户性别（默认为男性）
token | string | Token
nuclear_key | string | Unclear Key
user_create_at | string | 用户创建时间
tuso_create_at | string | 用户第一个图说时间


## 手机验证码注册（三个步骤）

### 1.发送验证码

```http
POST /account/mobile/sms HTTP/1.1
{
  "mobile": "18012344321",
}
```

```http
HTTP/1.1 204 No Content
Content-Type: application/json

```

手机验证码注册，如果发生了错误，则不会返回204.
（具体错误还未能细分，做好之后会正常返回给客户端）


### HTTP Request

`POST /account/mobile/sms`

### Request Parameters

Parameter | Type | Description
----------|------|------------
mobile|string|手机号码

### 2.验证码验证
```http
POST /account/mobile/validate HTTP/1.1
{
  "mobile": "18012344321",
  "code": "123456"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "secret": "1234"
}
```

验证码验证接口，输入验证码，返回登录的secret

### HTTP Request

`POST /account/mobile/validate `

### Request Parameters

Parameter | Type | Description
----------|------|------------
mobile|string|手机号码
code|string|验证码

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
secret | string | 用于注册的secret

### 3.用户手机注册
```http
POST /account/mobile/validate HTTP/1.1
{
  "username": "18012344321",
  "password": "12345678",
  "secret": "1234"
}
```
```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "token": "Ocx1AoGBAOcaHC75131ax1AoGBA1amMBGJAoGBAOc34f131amMqIzm5",
    "nuclear_key": "Ocx1AoGBAOcaHC7oGBAOc34f131amMqIzm5"
}
```

### Request Parameters

Parameter | Type | Description
----------|------|------------
username |string|手机号码
password |string|注册密码
secret|string|通过验证获得的secret

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
token | string | Token
nuclear_key | string | Unclear Key

## 忘记密码（两个步骤）

###1.忘记密码

```http
POST /account/forgetpass HTTP/1.1
{
  "username": "18012344321"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

```


由于忘记邮箱账号密码现在还未做，所以目前的username只可能是手机.
忘记密码，如果发生了错误，则不会返回200.


### HTTP Request

`POST /account/forgetpass`

### Request Parameters

Parameter | Type | Description
----------|------|------------
mobile|string|手机号码

###2.更新密码
```http
PUT /account/updatepass/code HTTP/1.1
{
  "username": "18012344321",
  "password": "7654321",
  "code": "123456"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "id": 19,
    "uuid": "585b0a3f-8460-4c51-aa51-a0f4d7342c24",
    "nickname": "我的天",
    "followees": 12,
    "followers": 12,
    "avatar": {
        "id": 18,
        "uuid": "585b0a3f-8460-4c51-aa51-a0f4d7342c24",
        "image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i?e=2904303578&token=X0W-1LWpcdD0eOQr0MUwOz1hQvuAPYxR9XAzbzHf:SbzluirCI6PMHW-ak_6UQLZTcfE"
    },
    "token": "Ocx1AoGBAOcaHC75131ax1AoGBA1amMBGJAoGBAOc34f131amMqIzm5",
    "nuclear_key": "Ocx1AoGBAOcaHC7oGBAOc34f131amMqIzm5"
}
```
```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "id": 19,
    "uuid": "585b0a3f-8460-4c51-aa51-a0f4d7342c24",
    "nickname": "我的天",
    "followees": 12,
    "followers": 12,
    "avatar": {
	    "active": true,
	    "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FnTUdg2u7rhK8EgQtH_aCSIaJRsc",
	    "id": "5790319f3c1fa67699525154",
	    "photo_uuid": "",
	    "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FnTUdg2u7rhK8EgQtH_aCSIaJRsc?imageView2/1/w/200/h/200",
	    "timestamp": "2016-09-01T11:12:46+08:00",
	    "type": 3,
	    "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
  },
    "token": "Ocx1AoGBAOcaHC75131ax1AoGBA1amMBGJAoGBAOc34f131amMqIzm5",
    "nuclear_key": "Ocx1AoGBAOcaHC7oGBAOc34f131amMqIzm5"
}
```

更新用户密码，更新之后返回用户数据以及token和nuclear_key

### Request Parameters

Parameter | Type | Description
----------|------|------------
username |string|用户名（手机号码）
password |string|新的密码
code|string|短信验证码

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 用户 ID
uuid | string | 用户 UUID， UUID 是用于所有用户相关操作的唯一识别号
nickname | string | 用户昵称
followees | string | 用户关注数
followers | string | 用户粉丝数
avatar | Photo | 详见 Photo
token | Type | Token
nuclear_key | string | Unclear Key

## 登陆

```http
POST /account/login HTTP/1.1
Content-Type: application/json
X-Tuso-Device-Token: Device-Token

{
  "username": "lincan@ngs.tech",
  "password": "fwVvkaHC7We3rbPgUneF"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "avatar": {
    "active": true,
    "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FnTUdg2u7rhK8EgQtH_aCSIaJRsc",
    "id": "5790319f3c1fa67699525154",
    "photo_uuid": "",
    "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FnTUdg2u7rhK8EgQtH_aCSIaJRsc?imageView2/1/w/200/h/200",
    "timestamp": "2016-09-01T11:12:46+08:00",
    "type": 3,
    "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
  },
  "birthday": "1994-06-04T23:00:00+08:00",
  "followees": 0,
  "followers": 12,
  "friends": 53,
  "gender": "user_gender_male",
  "id": 32,
  "images": 36,
  "location": {
    "country": "中国",
    "state": "湖南省",
    "city": "长沙市",
    "district": "芙蓉区"
  },
  "nickname": "我勒个去",
  "nuclear_key": "Y8APINrp6956Vpa6Ah2XeIiBM4ZKgfAS",
  "photo_create_at": "2016-07-08T12:30:35+08:00",
  "real_name": "天了噜",
  "token": "0crNlLbbHYTVHA2B0R5rO30VL1cbv503",
  "tuso_create_at": "2016-07-22T11:06:00.017701438+08:00",
  "tuso_id": "709163",
  "tusos": 0,
  "user_create_at": "2016-05-30T13:13:08+08:00",
  "uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
}
```

登陆 API 主要用于验证用户名和密码，并且将用户带至登陆状态。

本接口中传入的 *username* 邮箱和手机号均可。

*username* 或 *password* 不正确均无法登陆。

### HTTP Request

`POST /account/login`

### Request Parameters

Parameter | Type | Description
----------|------|------------
username | string | 用户的用户名，在本接口中，用户名可以由邮箱或手机号组成
password | string | 用户的密码

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 用户 ID
uuid | string | 用户 UUID， UUID 是用于所有用户相关操作的唯一识别号
nickname | string | 用户昵称（默认为用户名）
tuso_id | string | 用户的图说ID
followees | int | 用户关注数
followers | int | 用户粉丝数
friends | int | 用户好友数
tusos | int | 用户图说数
images | int | 用户图片数
gender | string | 用户性别（默认为男性）
token | string | Token
nuclear_key | string | Unclear Key
birthday | string | 用户生日信息
user_create_at | string | 用户创建时间
tuso_create_at | string | 用户第一个图说时间
avatar | Avatar | 详见 Avatar
location | Location | 用户地理位置



## 发送验证码

```http
POST /account/mobile/sms HTTP/1.1
Content-Type: application/json
{
  "phone_number": "13912345678",
}
```

```http
HTTP/1.1 204 OK
Content-Type: application/json
```

本 API 用于向传入手机号发送 6 位数字的验证码。在多数情况下，本验证码用于新用户注册、忘记密码和修改密码前的用户验证操作。本 API 不会返回其他内容亦或不会对用户资料进行任何实质性的修改。

### HTTP Request

`POST /account/mobile/sms`

### Request Parameters

Parameter | Type | Description
----------|------|------------
mobile | string | 需要发送验证码的手机号


### Attribute Parameters

Attribute | Type | Description
----------|------|------------


## 校验验证码

```http
POST /account/mobile/validate HTTP/1.1
Content-Type: application/json
{
  "mobile": "13912345678",
  "code": "124567"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
	"secret": "FYu^&(Rfr%rGyf&*TIOIOPhj"
}
```

本 API 用于校验用户传入的验证码的真实性，如验证码是真实的，则会返回一个 secret，secret 相当于一个钥匙牌，用户后续操作的验证。

### HTTP Request

`POST /account/mobile/validate`

### Request Parameters

Parameter | Type | Description
----------|------|------------
mobile | string | requesting phone number
code | string | 手机验证码

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
secret | string | 用户 Secret


## 手机号注册

```http
POST /account/mobile/register HTTP/1.1
Content-Type: application/json
{
  "phone_number": "13912345678",
  "secret": "C75aamMBramaJMMmwMCJD%OdfCMqIzm5",
  "password": "fwVvkaHC7We3rbPgUneF"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  'secret': 'C75aamMBramaJMMmwMCJD%OdfCMqIzm5'
}
```

本 API 用于通过使用手机号的方式创建用户，在调用本接口前需要先使用 [发送验证码](#发送验证码) 和 [校验验证码](#校验验证码)

### HTTP Request

`POST /account/mobile/register`

### Request Parameters

Parameter | Type | Description
----------|------|------------
mobile | string | 用户手机号
secret | string | 用户手机号验证后所得到的 secret，用户判断是否完成了手机号验证
password | string | 用户密码

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
secret | string | 


## 邀请码

```http
GET /account/invite/:invite_code HTTP/1.1
Content-Type: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
  "validate": true
}
```

本 API 用于邀请码，返回合法为*true*， 非法为*false*

### HTTP Request

`GET /account/invite/:invite_code`

### Request Parameters

Parameter | Type | Description
----------|------|------------
invite | string | 邀请码

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
validate | boolean | 是否合法

##（临时）邀请码绑定五个用户（两步）

###1.绑定用户和邀请码
```http
PUT /account/code/bind HTTP/1.1
Content-Type: application/json
{
  "username": "jiayu@ngs.tech"，
  "invite_code": "123456"
}
```

```http
HTTP/1.1 204 No Content
Content-Type: application/json
```

本 API 用于邀请码用户绑定，用户邀请码注册之后，调用这个接口，会将用户和邀请码绑定存入数据库。 用户名手机邮箱均可。
成功则返回204，若返回其他则是不成功。

### HTTP Request

`PUT /account/code/bind`

### Request Parameters

Parameter | Type | Description
----------|------|------------
username | string | 用户名
invite_code | string | 邀请码

###2.将邀请码相同的用户相互关注
```http
PUT /account/code/follow HTTP/1.1
Content-Type: application/json
{
  "uuid": "6a26e9ac-da06-40db-a4a9-cb059341bf65"，
}
```

```http
HTTP/1.1 204 No Content
Content-Type: application/json
```

本 API 用于相同邀请码的用户相互关注，uuid为注册用户的uuid。完成之后，新用户会与之前邀请码相同的用户相互关注。
成功则返回204，若返回其他则是不成功。

### HTTP Request

`PUT /account/code/follow`

### Request Parameters

Parameter | Type | Description
----------|------|------------
uuid | string | 用户 UUID， UUID 是用于所有用户相关操作的唯一识别号




