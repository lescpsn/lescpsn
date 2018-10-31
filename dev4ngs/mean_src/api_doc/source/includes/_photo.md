# 照片

照片是本应用中至关重要的部分。我们图说项目使用 七牛云服务 作为图片储存的分发和处理的中心。故，在整个照片数据处理环节，客户端需要与图说服务器和七牛服务器双方进行数据交接。

为了方便客户端映射数据，所有图片操作都会返回以以下 Json 为基准的数据

```json
{
  "data": {
    "comment_sum": 0,
    "display_image": {
      "display_height": 775,
      "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC",
      "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC?imageMogr2/auto-orient/thumbnail/!200x200r/gravity/center/crop/200x200",
      "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC?imageMogr2/auto-orient/thumbnail/1280x",
      "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC?imageMogr2/auto-orient/thumbnail/1800x720",
      "display_width": 1538,
      "edit_params": "{}",
      "file_size": 97917
    },
    "display_version": 2,
    "geo_location": "{}",
    "height": 775,
    "id": 9224,
    "lite_image": {
      "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC"
    },
    "md5": "32b20902c92e700c68d959314e803b05",
    "primary_color": "#ffffff",
    "privacy": "photo_privacy_public",
    "timestamp": "2016-02-01T11:12:46+08:00",
    "uuid": "2876b2c5-6393-4343-a5b3-5f6daf9ac8c0",
    "width": 1538
  },
  "success": true
}
```

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | string | 照片主色调
height | string | 照片高
width | string | 照片宽
md5 | string | 照片 MD5
privacy | string | 照片隐私类型
display_url | string | 照片 URL
timestamp | string | 时间戳

<aside class="notice">
display_image 是一个对象
</aside>

```json 
"display_image": {
      "display_height": 775,
      "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC",
      "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC?imageMogr2/auto-orient/thumbnail/!200x200r/gravity/center/crop/200x200",
      "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC?imageMogr2/auto-orient/thumbnail/1280x",
      "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC?imageMogr2/auto-orient/thumbnail/1800x720",
      "display_width": 1538,
      "edit_params": "{}",
      "file_size": 97917
    }
```
Attribute | Type | Description
----------|------|------------
lite_url | string | 照片低质量原尺寸图片
display\_url_thumbnail | string | 照片低质量缩略图

<aside class="notice">
注意，一下字段是只有当图片所有者请求时才会返回：
</aside>

```json
{
    "edit_params": "{}",
    "geo_location": "{}"
}
```

Attribute | Type | Description
----------|------|------------
edit_params | string | 照片裁剪滤镜参数
geo_location" | string | 照片地理位置信息

<aside class="notice">
以下文档在描述返回数据时会以非照片所有者访问数据时的返回数据作为范例
</aside>

上文中提到，我们的照片（如果客户端要求）都会在云端进行处理，以减少客户端压力。为了统一照片处理格式，现对照片上传时或更新照片时的照片处理请求参数进行定义：

```json
{
    "edit_params": {
        "crop": {
            "angle": 20,
            "width": 100,
            "height": 200,
            "anchor": {
                "x": 102,
                "y": 201          
            }
        },
        "filter": {
            "version": 1.0,
            "filter_id": "f12",
            "lookup_intensity": 0.5,
            "params": [
                {
                    "0": 1,
                    "1": 0.2
                }
            ]
        }
    }
}
```

当然，这些参数看起来毫无意义，我将通过下图详细解释裁剪参数中的各参数的意义：

![裁剪参数](images/crop.png "裁剪参数")

裁剪参数：

Attribute | Type | Description
----------|------|------------
angel | int | 围绕着图片中心点，所旋转的角度，顺时针为负数
width | int | 裁剪框的宽
height | int | 裁剪框的高
anchor | Point | 以图片最左和最下边建立坐标轴，裁剪框的中心店

Point:

Attribute | Type | Description
----------|------|------------
x | int | x 坐标
y | int | y 坐标

相比之下，滤镜参数可能更为抽象一点，在现有系统中，我们所定义的滤镜由多个图片处理通道组成，这些图片通道包括但不限于：
基于 Lookup Table 的色彩转换通道，Salutation 调整通道等。每个滤镜由不同的通道组成，同时在每个滤镜中，具体通道
参数的调整范围是不一样的，所以传入参数的时候需要说明具体每个通道的调整数值

滤镜参数：

Attribute | Type | Description
----------|------|------------
version | boolean | 滤镜版本
filter_id | boolean | 滤镜编号
lookup_intensity | int | lookup intensity
params | List(FilterParams) | 通道参数数组

FilterParams:

Attribute | Type | Description
----------|------|------------
0 | int | 参数 1 的值
1 | int | 参数 2 的值
...|

如果上传时服务器要求的 Content 为 form，则以上内容以序列化的形式发送

## 滤镜

<aside class="notice">
以下文档将详细描述各个滤镜的参数
</aside>

### BlackAndWhite

#### Filter ID

`BlackAndWhite`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness


### ColdPress

#### Filter ID

`ColdPress`

#### Filter 序列

1. brightness 
    - 所需参数：brightness


### ColorBoost

#### Filter ID

`ColorBoost`

#### Filter 序列

1. contrast 
    - 所需参数：contrast
    
    
### Fade

#### Filter ID

`Fade`

#### Filter 序列

1. brightness 
    - 所需参数：brightness
    
2. sharpen 
    - 所需参数：sharpeness
    
3. hue 
    - 所需参数：shift
    
    
### FujiFilm

#### Filter ID

`FujiFilm`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness
    
2. gamma 
    - 所需参数：gamma
    
    
### GreyFlat

#### Filter ID

`GreyFlat`

#### Filter 序列

1. gamma 
    - 所需参数：gamma
    
2. brightness 
    - 所需参数：brightness
    
     
### KodakFilm

#### Filter ID

`KodakFilm`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness
    
2. gamma 
    - 所需参数：gamma
    

### LeicaFilm

#### Filter ID

`LeicaFilm`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness
    
2. gamma 
    - 所需参数：gamma
    
    
### LightRoom

#### Filter ID

`LightRoom`

#### Filter 序列

1. exposure 
    - 所需参数：exposure
    
2. white_balance 
    - 所需参数：temperature, tint
    
2. sharpen 
    - 所需参数：sharpeness
    
### Plain

#### Filter ID

`Plain`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness
    
    
### Skin

#### Filter ID

`Skin`

#### Filter 序列

1. high_light_shadow 
    - 所需参数：shadow, highlights
    
    
### TusoFilm

#### Filter ID

`TusoFilm`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness
     
2. saturation 
    - 所需参数：percentage
    
     
### Beryl

#### Filter ID

`Beryl`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness
    
2. contrast 
    - 所需参数：contrast
    
    
### OrangeAndCyan

#### Filter ID

`OrangeAndCyan`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness  
    
    
### RedAndBlue

#### Filter ID

`RedAndBlue`

#### Filter 序列

1. sharpen 
    - 所需参数：sharpeness
    
    
### Cream

#### Filter ID

`Cream`

#### Filter 序列

1. exposure 
    - 所需参数：exposure
    
2. sharpen 
    - 所需参数：sharpeness
   
      
### Lark

#### Filter ID

`Lark`

#### Filter 序列

1. brightness 
    - 所需参数：brightness
    
2. sharpen 
    - 所需参数：sharpeness
    
    
### Sundown

#### Filter ID

`Sundown`

#### Filter 序列

1. exposure 
    - 所需参数：exposure
    
2. contrast 
    - 所需参数：contrast
    
    
### Viola

#### Filter ID

`Viola`

#### Filter 序列

1. white_balance 
    - 所需参数：temperature, tint
    
2. sharpen 
    - 所需参数：sharpeness
    
      
    
## 获取上传 Token

```http
GET /photo_token HTTP/1.1
Content-Type: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "uptoken": "Ocx1AoGBAOcaHC75131ax1AoGBA1amMBGJAoGBAOc34f131amMqIzm5"
}
```

获取上传 Token API，用于获取上传文件所需要的 UpToken。就目前而言，上传图片所使用的 UpToken 不需要传入额外的参数。

### HTTP Request

`POST /photo_token`

### Request Parameters

Parameter | Type | Description
----------|------|------------


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
UpToken | string | 上传图片所需要的 UpToken


## 获取头像上传 Token

```http
GET /avatar_token HTTP/1.1
Content-Type: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
{
    "uptoken": "Ocx1AoGBAOcaHC75131ax1AoGBA1amMBGJAoGBAOc34f131amMqIzm5"
}
```

获取上传 Token API，用于获取上传文件所需要的 UpToken。就目前而言，上传图片所使用的 UpToken 不需要传入额外的参数。

### HTTP Request

`POST /avatar_token`

### Request Parameters

Parameter | Type | Description
----------|------|------------


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
UpToken | string | 上传头像所需要的 UpToken


## 获取照片唯一性

```http
GET /photo_unique?md5=0a22b0336e9bbdc434e8f3b1c0d8c1bb HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "validation": true，
}
```


```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "validation": false，
    "photo_uuid": 6ccb7c7d-a263-4730-bd43-9398f55dced5
}
```

获取照片唯一性 API，获取所传入的 MD5 是否存在于数据库中，如果没有则返回 true
若有，则返回 false 并返回那张图片的 uuid

### HTTP Request

`GET /photo_unique`

### Request Parameters

Parameter | Type | Description
----------|------|------------
md5 | string | 图片 MD5

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
validation | boolean | 图片是否未存在于系统中
photo_uuid | string | 如果存在，则返回图片uuid


## 上传照片

```http
POST https://up.qbox.me HTTP/1.1
Content-Type: multipart/form-data

{
    "file": "File",
    "token": "asdfny89we1ru3497rynv9fdyvn 7adft78qrn49qgrfqe78ftnq89wfy347rfb74f9yf8aduf8ayfadifyinft34978fyirufgvtna98fweqf7134-f",
    "x:privacy": "photo_privacy_public",
    "x:md5": "bhsadfguifh234uytf934fy9",
    "x:primary_color": {"R": 1,"G": 0.2,"B": 1,"A": 1},
    "x:geolocation": {},
    "x:edit_params": {},
    "x:timestamp": "2002-10-02T10:00:00-05:00",
    "x:width": "1538",
    "x:height": "775",
    "x:exif": {}
}
```

```http
HTTP/1.1 200 ok
Content-Type: application/json

{
  "data": {
    "comment_sum": 0,
    "display_image": {
      "display_height": 775,
      "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhEFaSrVPSd-jBreW2FsNZNav_jD",
      "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhEFaSrVPSd-jBreW2FsNZNav_jD?imageMogr2/auto-orient/thumbnail/!200x200r/gravity/center/crop/200x200",
      "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhEFaSrVPSd-jBreW2FsNZNav_jD?imageMogr2/auto-orient/thumbnail/1280x",
      "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhEFaSrVPSd-jBreW2FsNZNav_jD?imageMogr2/auto-orient/thumbnail/1800x720",
      "display_width": 1538,
      "edit_params": "{}",
      "file_size": 279080
    },
    "display_version": 2,
    "geo_location": "{}",
    "height": 775,
    "id": 9243,
    "lite_image": {
      "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhEFaSrVPSd-jBreW2FsNZNav_jD"
    },
    "md5": "32b20902c92e700c68d959314e803b05",
    "primary_color": "#ffffff",
    "privacy": "photo_privacy_public",
    "timestamp": "2016-02-01T11:12:46+08:00",
    "user": {
      "avatar": {
        "active": true,
        "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI",
        "id": "579318f03c1fa6146d8adf23",
        "photo_uuid": "",
        "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI?imageView2/1/w/200/h/200",
        "timestamp": "2016-09-01T11:12:46+08:00",
        "type": 2,
        "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
      },
      "birthday": "1994-06-04T23:00:00+08:00",
      "followees": 1,
      "followers": 14,
      "friends": 53,
      "gender": "user_gender_male",
      "id": 32,
      "images": 38,
      "location": {
        "city": "长沙市",
        "country": "中国",
        "district": "芙蓉区",
        "state": "湖南省"
      },
      "nickname": "我勒个去",
      "photo_create_at": "2016-07-08T12:30:35+08:00",
      "real_name": "天了噜",
      "tuso_create_at": "2016-07-23T16:33:41.905720594+08:00",
      "tuso_id": "709163",
      "tusos": 0,
      "user_create_at": "2016-05-30T13:13:08+08:00",
      "uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
    },
    "uuid": "6cee2f17-38b1-4714-a72b-b7ec69e5fdca",
    "width": 1538
  },
  "success": true
}
```

获取上传 Token API，用于获取上传文件所需要的 UpToken。就目前而言，上传图片所使用的 UpToken 不需要传入额外的参数。
注意，本接口上传的为原图，即是未经过裁剪和滤镜处理过的图片，服务器会根据传入的各种参数自动处理图片

### HTTP Request

`POST https://up.qbox.me`

### Request Parameters

Parameter | Type | Description
----------|------|------------
file | File |  需要上传的照片
token | string | [获取上传 Token](#获取上传 Token) 所获取的 UpToken
x:privacy | string | 照片隐私级别，具体见照片大类
x:md5 | string | MD5，照片所计算出来的 MD5
x:primary_color | string | 照片的主色调
x:geolocation | string | 拍摄照片的地理位置信息
x:edit_params | EditParams | 照片的滤镜裁剪参数
x:timestamp | string | 照片拍摄时的时间
x:ut | string | 用户 Token
x:width | int64 | 图片宽度
x:height | int64 | 图片高度
x:exif | string | 照片 EXIF 信息
照片 EXIF 信息·
### Attribute Parameters

用户上传照片时所返回的数据和其他接口不一致，其它接口在发生错误时，HTTP Code 会使用 400 - 600 的状态码，同时在 Body 处会用 json 表示错误原因。而本接口会在无论发生错误与否都返回 200 状态码， 同时在 Body 处使用一个包含 success 字段的 json，用来表示是否发生错误。

Attribute | Type | Description
----------|------|------------
success | string | 是否操作成功
error | Object | 错误对象
data | Object | 对象

如操作成功，则会在 data 字段中包含如下内容：

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | Color | 照片主色调
height | string | 照片高
width | string | 照片宽
privacy | string | 照片隐私类型
display_image | display_image | 照片 display_image 信息
display_version | int | 图片版本
geo_location | string | 图片位置信息
lite_image | string | 图片url
md5 | string | 图片MD5
timestamp | string | 时间戳
user | User | User 对象



## 上传头像

```http
POST https://up.qbox.me HTTP/1.1
Content-Type: multipart/form-data

{
    "file": "File",
    "token": "X0W-1LWpcdD0eOQr0MUwOz1hQvuAPYxR9XAzbzHf:D3bjD5_427z2oxmZJtWi5GgM7ok=:eyJzY29wZSI6InR1c28iLCJkZWFkbGluZSI6MjkzNjU5MDE0MCwiY2FsbGJhY2tVcmwiOiJodHRwOi8vYXBpLmRldi50dXNvYXBwLmNvbTo4MDgwL3Zici9hdmF0YXJfY2FsbGJhY2siLCJjYWxsYmFja0JvZHkiOiJidWNrZXQ9JChidWNrZXQpXHUwMDI2a2V5PSQoa2V5KVx1MDAyNmhhc2g9JChldGFnKVx1MDAyNmZzaXplPSQoZnNpemUpXHUwMDI2d2lkdGg9JCh4OndpZHRoKVx1MDAyNmhlaWdodD0kKHg6aGVpZ2h0KVx1MDAyNmV4aWY9JCh4OmV4aWYpXHUwMDI2cHJpdmFjeT0kKHg6cHJpdmFjeSlcdTAwMjZtZDU9JCh4Om1kNSlcdTAwMjZwcmltYXJ5X2NvbG9yPSQoeDpwcmltYXJ5X2NvbG9yKVx1MDAyNmdlb2xvY2F0aW9uPSQoeDpnZW9sb2NhdGlvbilcdTAwMjZlZGl0X3BhcmFtcz0kKHg6ZWRpdF9wYXJhbXMpXHUwMDI2dGltZXN0YW1wPSQoeDp0aW1lc3RhbXApXHUwMDI2dXQ9JCh4OnV0KSIsImNhbGxiYWNrQm9keVR5cGUiOiJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQifQ==",
    "x:timestamp": "2002-10-02T10:00:00-05:00",
    "x:ut": "0crNlLbbHYTVHA2B0R5rO30VL1cbv503"
}
```

```http
HTTP/1.1 200 ok
Content-Type: application/json

{
  "data": {
    "active": true,
    "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI",
    "id": "57932de63c1fa63b819aa678",
    "photo_uuid": "",
    "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI?imageView2/1/w/200/h/200",
    "timestamp": "2016-09-01T11:12:46+08:00",
    "type": 2,
    "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
  },
  "success": true
}
```

获取上传 Token API，用于获取t头像文件所需要的 UpToken。就目前而言，上传图片所使用的 UpToken 不需要传入额外的参数。
注意，本接口上传的为原图，即是未经过裁剪和滤镜处理过的图片，服务器会根据传入的各种参数自动处理图片

### HTTP Request

`POST https://up.qbox.me`

### Request Parameters

Parameter | Type | Description
----------|------|------------
file | File |  需要上传的照片
token | string | [获取上传 Token](#获取上传 Token) 所获取的 UpToken
x:timestamp | string | 头像时间
x:ut | string | 用户 Token

### Attribute Parameters

用户上传头像时所返回的数据和其他接口不一致，其它接口在发生错误时，HTTP Code 会使用 400 - 600 的状态码，同时在 Body 处会用 json 表示错误原因。而本接口会在无论发生错误与否都返回 200 状态码， 同时在 Body 处使用一个包含 success 字段的 json，用来表示是否发生错误。

Attribute | Type | Description
----------|------|------------
success | string | 是否操作成功
error | Object | 错误对象
data | Object | 对象

如操作成功，则会在 data 字段中包含如下内容：

Attribute | Type | Description
----------|------|------------
active | bool | 是否是当前使用头像
big\_image_url | string | 头像原图url
small\_image_url | string | 头像缩略图url
id | string | 头像的 object_id
photo_uuid | string | 头像的原图UUID（若头像来自于用户相册）
user_uuid | string | 用户UUID
timestamp | string | 时间戳
type | int | 头像类型

## 二次编辑照片

```http
PUT /photo/585b0a3f-8460-4c51-aa51-a0f4d7342c24 HTTP/1.1
Content-Type: application/json

{
    "crop": {
        "angle": 20,
        "width": 100,
        "height": 200,
        "anchor": {
            "x": 102,
            "y": 201          
        }
    },
    "filter": {
        "version": 1.0,
        "filter_id": "f12",
        "lookup_intensity": 0.5,
        "params": [
            {
                "0": 1,
                "1": 0.2
            }
        ]
    }
}
```

```http
HTTP/1.1 200 ok
Content-Type: application/json

{
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
            },
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
```

获取上传 Token API，用于获取上传文件所需要的 UpToken。就目前而言，上传图片所使用的 UpToken 不需要传入额外的参数。

### HTTP Request

`PUT /photo/:uuid`

### Request Parameters

Parameter | Type | Description
----------|------|------------
请详见照片调整参数

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | Color | 照片主色调
height | string | 照片高
width | string | 照片宽
privacy | string | 照片隐私类型
image_url | string | 照片 URL
timestamp | string | 时间戳


## 获取指定图片

```http
GET /photo/:uuid/data HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "comment_sum": 0,
  "display_image": {
    "display_height": 4032,
    "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/216e03d9-45f8-4be2-8d90-c7e37bfb80a2.jpg",
    "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/216e03d9-45f8-4be2-8d90-c7e37bfb80a2.jpg?imageMogr2/auto-orient/thumbnail/!200x200r/gravity/center/crop/200x200",
    "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/216e03d9-45f8-4be2-8d90-c7e37bfb80a2.jpg?imageMogr2/auto-orient/thumbnail/720x",
    "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/216e03d9-45f8-4be2-8d90-c7e37bfb80a2.jpg?imageMogr2/auto-orient/thumbnail/720x1800",
    "display_width": 3024,
    "edit_params": "{}",
    "file_size": 874744
  },
  "display_version": 2,
  "geo_location": "{\n  \"verticalAccuracy\" : 23.08505180196091,\n  \"speed\" : -1,\n  \"longitude\" : 118.7599710354486,\n  \"horizontalAccuracy\" : 158.6586584290421,\n  \"course\" : -1,\n  \"latitude\" : 31.97301806318671,\n  \"altitude\" : 42.42911529541016\n}",
  "height": 4032,
  "id": 4271,
  "in_pipeline": false,
  "md5": "c3171b25814ad3d9993d40861db2f78c",
  "note": {
    "content": "wow，fantastic baby",
    "id": 73,
    "style": "v1/c",
    "timestamp": "2016-02-20T11:12:46+08:00",
    "title": "Big Bang",
    "uuid": "8ad6900d-fd33-4ded-83d5-2e591a880d36"
  },
  "primary_color": "baa893ff",
  "privacy": "photo_privacy_public",
  "timestamp": "2016-07-05T14:30:52+08:00",
  "user": {
    "avatar": {
      "active": true,
      "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI",
      "id": "57932de63c1fa63b819aa678",
      "photo_uuid": "",
      "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI?imageView2/1/w/200/h/200",
      "timestamp": "2016-09-01T11:12:46+08:00",
      "type": 2,
      "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
    },
    "birthday": "1994-06-04T23:00:00+08:00",
    "followees": 1,
    "followers": 14,
    "friends": 53,
    "gender": "user_gender_male",
    "id": 32,
    "images": 38,
    "location": {
      "country": "中国",
      "state": "湖南省",
      "city": "长沙市",
      "district": "芙蓉区"
    },
    "nickname": "我勒个去",
    "photo_create_at": "2016-07-08T12:30:35+08:00",
    "real_name": "天了噜",
    "tuso_create_at": "2016-07-23T16:54:18.077047064+08:00",
    "tuso_id": "709163",
    "tusos": 0,
    "user_create_at": "2016-05-30T13:13:08+08:00",
    "uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
  },
  "uuid": "b6b84e2d-05c2-4eee-a43a-ca4856b270ac",
  "width": 3024
}
```

获取图片数据


前提条件：


若图片的所有者 和 资源请求者 不是一个人或不是好友关系, 则会返回权限不足错误。

若是有关系，但请求的图片类型为隐私，同样会返回权限不足错误。

### HTTP Request

`GET /photo/:uuid/data`

### Request Parameters

Parameter | Type | Description
----------|------|------------

### Attribute Parameters


Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | Color | 照片主色调
height | string | 照片高
width | string | 照片宽
privacy | string | 照片隐私类型
display_image | display_image | 照片 display_image 信息
display_version | int | 图片版本
geo_location | string | 图片位置信息
lite_image | string | 图片url
md5 | string | 图片MD5
timestamp | string | 时间戳
user | User | User 对象



## 查询用户图片列表

```http
GET /user/:uuid/photos?since_id=12&max_id=45&page=1&count=20 HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "comment_sum": 0,
    "display_image": {
      "display_height": 775,
      "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/0e1605d7-12e0-4364-b2af-cc249f89bc59.jpg",
      "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/0e1605d7-12e0-4364-b2af-cc249f89bc59.jpg?imageMogr2/auto-orient/thumbnail/!200x200r/gravity/center/crop/200x200",
      "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/0e1605d7-12e0-4364-b2af-cc249f89bc59.jpg?imageMogr2/auto-orient/thumbnail/1280x",
      "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/0e1605d7-12e0-4364-b2af-cc249f89bc59.jpg?imageMogr2/auto-orient/thumbnail/1800x720",
      "display_width": 1538,
      "edit_params": "{}",
      "file_size": 279080
    },
    "display_version": 2,
    "geo_location": "{}",
    "height": 775,
    "id": 9243,
    "in_pipeline": false,
    "lite_image": {
      "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhEFaSrVPSd-jBreW2FsNZNav_jD"
    },
    "md5": "32b20902c92e700c68d959314e803b05",
    "primary_color": "#ffffff",
    "privacy": "photo_privacy_public",
    "timestamp": "2016-02-01T11:12:46+08:00",
    "user": {
      "avatar": {
        "active": true,
        "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI",
        "id": "57932de63c1fa63b819aa678",
        "photo_uuid": "",
        "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI?imageView2/1/w/200/h/200",
        "timestamp": "2016-09-01T11:12:46+08:00",
        "type": 2,
        "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
      },
      "birthday": "1994-06-04T23:00:00+08:00",
      "followees": 1,
      "followers": 14,
      "friends": 53,
      "gender": "user_gender_male",
      "id": 32,
      "images": 38,
      "location": {
        "country": "中国",
        "state": "湖南省",
        "city": "长沙市",
        "district": "芙蓉区"
      },
      "nickname": "我勒个去",
      "photo_create_at": "2016-07-08T12:30:35+08:00",
      "real_name": "天了噜",
      "tuso_create_at": "2016-07-23T16:56:20.972846772+08:00",
      "tuso_id": "709163",
      "tusos": 0,
      "user_create_at": "2016-05-30T13:13:08+08:00",
      "uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
    },
    "uuid": "6cee2f17-38b1-4714-a72b-b7ec69e5fdca",
    "width": 1538
  },
  {
    "comment_sum": 0,
    "display_image": {
      "display_height": 775,
      "display_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/934d26b1-487e-4e84-92e0-ee454e30a58c.jpg",
      "display_url_square": "http://7xodxr.com2.z0.glb.qiniucdn.com/934d26b1-487e-4e84-92e0-ee454e30a58c.jpg?imageMogr2/auto-orient/thumbnail/!200x200r/gravity/center/crop/200x200",
      "display_url_thumbnail": "http://7xodxr.com2.z0.glb.qiniucdn.com/934d26b1-487e-4e84-92e0-ee454e30a58c.jpg?imageMogr2/auto-orient/thumbnail/1280x",
      "display_url_waterfall": "http://7xodxr.com2.z0.glb.qiniucdn.com/934d26b1-487e-4e84-92e0-ee454e30a58c.jpg?imageMogr2/auto-orient/thumbnail/1800x720",
      "display_width": 1538,
      "edit_params": "{}",
      "file_size": 97917
    },
    "display_version": 2,
    "geo_location": "{}",
    "height": 775,
    "id": 9224,
    "in_pipeline": false,
    "lite_image": {
      "url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fkt3H_g64Uo8YT-RsLnBkpxfcjfC"
    },
    "md5": "32b20902c92e700c68d959314e803b05",
    "primary_color": "#ffffff",
    "privacy": "photo_privacy_public",
    "timestamp": "2016-02-01T11:12:46+08:00",
    "user": {
      "avatar": {
        "active": true,
        "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI",
        "id": "57932de63c1fa63b819aa678",
        "photo_uuid": "",
        "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI?imageView2/1/w/200/h/200",
        "timestamp": "2016-09-01T11:12:46+08:00",
        "type": 2,
        "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
      },
      "birthday": "1994-06-04T23:00:00+08:00",
      "followees": 1,
      "followers": 14,
      "friends": 53,
      "gender": "user_gender_male",
      "id": 32,
      "images": 38,
      "location": {
        "country": "中国",
        "state": "湖南省",
        "city": "长沙市",
        "district": "芙蓉区"
      },
      "nickname": "我勒个去",
      "photo_create_at": "2016-07-08T12:30:35+08:00",
      "real_name": "天了噜",
      "tuso_create_at": "2016-07-23T16:56:20.973133671+08:00",
      "tuso_id": "709163",
      "tusos": 0,
      "user_create_at": "2016-05-30T13:13:08+08:00",
      "uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
    },
    "uuid": "2876b2c5-6393-4343-a5b3-5f6daf9ac8c0",
    "width": 1538
  }
]
```

获取图片数据

前提条件：


若图片的所有者 和 资源请求者 不是一个人或不是好友关系, 则会返回权限不足错误。

若是还有关系，但请求的图片类型为隐私，同样会返回权限不足错误。

且此API查询图片可进行批量操作。

### HTTP Request

`GET /user/:UUIDString/photos`

### Request Parameters

Parameter | Type | Description
----------|------|------------
since_id | int | 图片最小编号
max_id | int | 图片最大编号
page | int | 页数
count | int | 每页照片数


### Attribute Parameters


Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | Color | 照片主色调
height | string | 照片高
width | string | 照片宽
privacy | string | 照片隐私类型
display_image | display_image | 照片 display_image 信息
display_version | int | 图片版本
geo_location | string | 图片位置信息
lite_image | string | 图片url
md5 | string | 图片MD5
timestamp | string | 时间戳
user | User | User 对象



## 设置头像

```http
POST /photos/avatar HTTP/1.1
Content-Type: application/json

{
    "object_id": "57848aca3c1fa67b61562884",
    "timestamp": "2016-06-04T11:12:46+08:00"
}
```
或

```http
POST /photos/avatar HTTP/1.1
Content-Type: application/json

{
    "photo_uuid": "6ccb7c7d-a263-4730-bd43-9398f55dced5",
    "timestamp": "2016-06-04T11:12:46+08:00"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "active": true,
    "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI",
    "id": "57932de63c1fa63b819aa678",
    "photo_uuid": "",
    "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI?imageView2/1/w/200/h/200",
    "timestamp": "2016-09-01T11:12:46+08:00",
    "type": 2,
    "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
}
```

创建头像, 时间戳为必传参数，传入 object_id 表示从历史头像之中选取一个头像来当做新的头像。

传入 photo_uuid 则表示是从图片中选取一个图片来当做头像。
 
注：当通过 object_id 选取历史头像生成新的头像之后，原来的老头像会被删除，老的 object_id 会查不到图片！！

### HTTP Request

`POST /photos/avatar`

### Request Parameters

Parameter | Type | Description
----------|------|------------
photo_uuid | string | 图片原图 UUID

或

Parameter | Type | Description
----------|------|------------
object_id | string | 历史头像的id

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
active | bool | 是否是当前使用头像
big\_image_url | string | 头像原图url
small\_image_url | string | 头像缩略图url
id | string | 头像的 object_id
photo_uuid | string | 头像的原图UUID（若头像来自于用户相册）
user_uuid | string | 用户UUID
timestamp | string | 时间戳
type | int | 头像类型



## 获取用户头像列表

```http
GET /user/:uuid/avatar HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "active": true,
    "big_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI",
    "id": "57932de63c1fa63b819aa678",
    "photo_uuid": "",
    "small_image_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/Fpi6r7o_T6_GomcDaXfUsVoI-tvI?imageView2/1/w/200/h/200",
    "timestamp": "2016-09-01T11:12:46+08:00",
    "type": 2,
    "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
  },
  {
    "active": false,
    "big_image_url": "",
    "id": "579318f03c1fa6146d8adf22",
    "photo_uuid": "",
    "small_image_url": "?imageView2/1/w/200/h/200",
    "timestamp": "2016-05-30T13:13:08+08:00",
    "type": 1,
    "user_uuid": "ac9530e1-e763-45c3-99ee-63e49ca7ecf7"
  }
]
```

获取历史头像列表数据

### HTTP Request

`GET /photo/:uuid/data`

### Request Parameters

Parameter | Type | Description
----------|------|------------

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | string | 头像id
user_uuid | string | 用户uuid
active | bool | 表示这个头像是否使用中
big\_image_url | string | 头像原始url
small\_image_url | string | 头像缩略图url
timestamp | string | 时间戳


## 设置图片公开

```http
PUT /photo/585b0a3f-8460-4c51-aa51-a0f4d7342c24/public HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
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
            },
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
```

将照片的类型设置成公开。

动作发起人必须是图片所有者

若传入的照片类型**已经**是公开类型，则会返回错误。

### HTTP Request

`PUT /photo/:uuid/public`

### Request Parameters

Parameter | Type | Description
----------|------|------------

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | Color | 照片主色调
height | string | 照片高
width | string | 照片宽
privacy | string | 照片隐私类型
image_url | string | 照片 URL
timestamp | string | 时间戳


## 设置图片隐私

```http
PUT /photo/585b0a3f-8460-4c51-aa51-a0f4d7342c24/private HTTP/1.1
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
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
            },
        }
    },
    "height": 200,
    "width": 200,
    "md5": "biyuw3rgbvrgn32l4",
    "privacy": "photo_privacy_private",
    "image_url": {
        "lite_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i",
        "thumbnail_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i"
    },
    "file_size": 2139178,
    "timestamp": "2002-10-02T23:00:00+08:00"
}
```

将照片的类型设置成隐私。

动作发起人必须是图片所有者

将照片设置成隐私之后，不可从相册、图说、随记中访问到隐私照片。隐私照片仅只有自己可见。

若传入的照片类型**已经**是隐私类型，则会返回错误。
### HTTP Request

`PUT /photo/:uuid/private`

### Request Parameters

Parameter | Type | Description
----------|------|------------

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | Color | 照片主色调
height | string | 照片高
width | string | 照片宽
privacy | string | 照片隐私类型
image_url | string | 照片 URL
timestamp | string | 时间戳


## 删除图片

```http
DELETE /photo/:uuid/delete HTTP/1.1
```

```http
HTTP/1.1 200 OK
```

删除图片

动作发起人必须是图片所有者

删除图片之后，与照片相关联的一切（如图说、随记、以及图片评论等等与该图片相关的事物均删除。）

若图片已经被删除或者找不到图片，均返回错误。

### HTTP Request

`PUT /photo/:uuid/delete `

### Request Parameters

Parameter | Type | Description
----------|------|------------

### Attribute Parameters

Attribute | Type | Description
----------|------|------------


## 批量公开图片

```http
PUT /photos/public HTTP/1.1
Content-Type: application/json

{
    "uuids": ["d19bb220-0fc0-4591-8862-6d7f86f737fb"]
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[{
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
            },
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
}]
```

将照片的类型设置成公开，可批量操作。

动作发起人必须是图片所有者

若传入的照片类型**已经**是公开类型，则会返回错误。

### HTTP Request

`PUT /photos/public`

### Request Parameters

Parameter | Type | Description
----------|------|------------
uuid | List(UUID) | 照片 UUID 数组

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | Color | 照片主色调
height | string | 照片高
width | string | 照片宽
privacy | string | 照片隐私类型
image_url | string | 照片 URL
timestamp | string | 时间戳


## 批量隐私图片

```http
PUT /photos/private HTTP/1.1
Content-Type: application/json

{
    "uuids": ["d19bb220-0fc0-4591-8862-6d7f86f737fb"]
}
```


```http
HTTP/1.1 200 OK
Content-Type: application/json

{{
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
            },
        }
    },
    "height": 200,
    "width": 200,
    "md5": "biyuw3rgbvrgn32l4",
    "privacy": "photo_privacy_private",
    "image_url": {
        "lite_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i",
        "thumbnail_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i"
    },
    "file_size": 2139178,
    "timestamp": "2002-10-02T23:00:00+08:00"
}]
```

将照片的类型设置成隐私，可批量操作。

动作发起人必须是图片所有者

若传入的照片类型**已经**是隐私类型，则会返回错误。

### HTTP Request

`PUT /photos/private `

### Request Parameters

Parameter | Type | Description
----------|------|------------
uuid | List(UUID) | 照片 UUID 数组

### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 照片 ID
uuid | string | 照片 UUID， UUID 是用于所有照片相关操作的唯一识别号
primary_color | Color | 照片主色调
height | string | 照片高
width | string | 照片宽
privacy | string | 照片隐私类型
image_url | string | 照片 URL
timestamp | string | 时间戳


## 批量删除图片

```http
DELETE /photos/delete HTTP/1.1
Content-Type: application/json

{
    "uuids": ["d19bb220-0fc0-4591-8862-6d7f86f737fb"]
}
```

```http
HTTP/1.1 200 OK
```

删除图片

动作发起人必须是图片所有者

删除图片之后，与照片相关联的一切（如图说、随记、以及图片评论等等与该图片相关的事物均删除。）

若图片已经被删除或者找不到图片，均返回错误。

### HTTP Request

`DELETE /photos/delete `

### Request Parameters

Parameter | Type | Description
----------|------|------------
uuid | List(UUID) | 照片 UUID 数组

### Attribute Parameters

Attribute | Type | Description
----------|------|------------



## 发送随记

```http
POST /photo/d19bb220-0fc0-4591-8862-6d7f86f737fb/note HTTP/1.1
Content-Type: application/json

{
    "title": "Big Bang",
    "content": "wow，fantastic baby",
    "style": "v1/c",
    "timestamp": "2002-10-02T23:00:00+08:00"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "id": "1",
    "uuid": "d19bb220-0fc0-4591-8862-6d7f86f737fb",
    "title": "Big Bang",
    "content": "wow，fantastic baby",
    "style": "v1/c",
    "timestamp": "2002-10-02T23:00:00+08:00"
}
```

发送随记

注：标题（title）永远不能为空，正文随意。

### HTTP Request

`POST /photo/:uuid/note `

### Request Parameters

Parameter | Type | Description
----------|------|------------
title | string | 随记标题
content | string | 随记正文
style | string | 随记样式
timestamp | string | 随记创建时间
    
### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 随记 ID
uuid | string | 随记 UUID， UUID 是用于所有随记相关操作的唯一识别号
title | string | 随记标题
content | string | 随记正文
style | string | 随记样式
timestamp | string | 随记创建时间


## 更新随记

```http
PUT /note/:UUID HTTP/1.1
Content-Type: application/json

{
    "title": "今天天气不错哦",
    "content": "wow",
    "style": "v1/c",
    "timestamp": "2002-10-02T23:00:00+08:00"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "id": "1",
    "uuid": "d19bb220-0fc0-4591-8862-6d7f86f737fb",
    "title": "今天天气不错哦",
    "content": "wow",
    "style": "v1/c",
    "timestamp": "2002-10-02T23:00:00+08:00"
}
```
前提条件：
随记发送成功

随记发送成功之后的24小时之内可以对随记的标题和正文做修改（标题永远不能为空）。

24小时之后锁定，无法对随记的任何内容做修改（删除除外）

### HTTP Request

`PUT /note/:uuid`

### Request Parameters

Parameter | Type | Description
----------|------|------------
title | string | 随记标题
content | string | 随记正文
style | string | 随记样式
timestamp | string | 随记创建时间
    
### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 随记 ID
uuid | string | 随记 UUID， UUID 是用于所有随记相关操作的唯一识别号
title | string | 随记标题
content | string | 随记正文
style | string | 随记样式
timestamp | string | 随记创建时间

## 图片留言

```http
POST /photo/:UUID/comment/ HTTP/1.1

Content-Type: application/json

{
    "reply_to": "78f82f90-6536-4614-9f69-600b8748a04f",
    "content": "啊，乖乖站好",
    "timestamp": "2002-10-02T23:00:00+08:00"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "id": "2",
    "uuid": "d19bb220-0fc0-4591-8862-6d7f86f737fb",
    "user": {
        "id": 1,
        "uuid": "78f82f90-6536-4614-9f69-600b8748a04f",
        "avatar": {
            "id": 18,
            "uuid": "585b0a3f-8460-4c51-aa51-a0f4d7342c24",
            "image_url": {
                "lite_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i",
                "thumbnail_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i"
            },
        }
    },
    "reply_to"{
        "id": "1"
        "uuid": "78f82f90-6536-4614-9f69-600b8748a04f"
        "content": "很厉害呢！",
        "timestamp": "2002-10-02T23:00:00+08:00"，
        "user": {
            "id": 2,
            "uuid": "c21c6b67-14cc-437f-aac0-2dca492f0a6b",
            "avatar": {
                "id": 18,
                "uuid": "585b0a3f-8460-4c51-aa51-a0f4d7342c24",
                "image_url": {
                    "lite_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/    FhdqNvuWYK6ArJxoPjZOpIJjNP5i",
                "thumbnail_url": "http://7xodxr.com2.z0.glb.qiniucdn.com/FhdqNvuWYK6ArJxoPjZOpIJjNP5i"
                },
            },
        },
    },
    "content": "啊，乖乖站好",
    "timestamp": "2002-10-02T23:00:00+08:00"
}
```
此为图片留言板。

注：reply_to 为回复对象的评论的UUID，非此评论本身的UUID

留言板规则：
 
 1. 只允许图片拥有者的好友能够查看图片且评论
 
 2. 拥有者和每个好友双方相互只能回复一次
 
 如：
 
 用户 | 内容 
-----|------
好友1（评论图片） | 这张照片很棒！ 
拥有者（回复好友1） | 是的，哥就是这样厉害。 
（此对话被关闭，拥有者和好友1之间无法继续留言）

 用户 | 内容 
-----|------
好友2（评论图片） | 你咋不上天？ 
拥有者（回复好友2） | 我没窜天猴 
 
 （此对话被关闭，拥有者和好友2之间无法继续留言）
 

### HTTP Request

`POST /photo/:uuid/comment/`

### Request Parameters

Parameter | Type | Description
----------|------|------------
reply_to | string | 回复评论之 UUID
content | string | 留言正文
timestamp | string | 留言创建时间
    
### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 评论 ID
uuid | string | 留言 UUID， UUID 是用于所有评论相关操作的唯一识别号
content | string | 留言正文
timestamp | string | 留言创建时间


## 获取图片留言

```http
GET /photo/:UUID/comments?since_id=12&max_id=45&page=1&count=20 HTTP/1.1
Content-Type: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

[{
    "id": "2",
    "uuid": "d19bb220-0fc0-4591-8862-6d7f86f737fb",
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
    "reply_to"{
        "id": "1"
        "uuid": "78f82f90-6536-4614-9f69-600b8748a04f"
    },
    "content": "啊，乖乖站好",
    "timestamp": "2002-10-02T23:00:00+08:00"
}]
```

### HTTP Request

`GET /photo/:uuid/comments`

### Request Parameters

Parameter | Type | Description
----------|------|------------
since_id | int | 图片最小编号
max_id | int | 图片最大编号
page | int | 页数
count | int | 每页照片数
    
### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 评论 ID
uuid | string | 留言 UUID， UUID 是用于所有评论相关操作的唯一识别号
content | string | 留言正文
timestamp | string | 留言创建时间

## 删除图片留言

```http
DELETE /photo/:UUID/comment/:cUUID HTTP/1.1
Content-Type: application/json
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "id": "2",
    "uuid": "d19bb220-0fc0-4591-8862-6d7f86f737fb",
    "content": "啊，乖乖站好",
    "timestamp": "2002-10-02T23:00:00+08:00"
}
```

留言板删除规则：
 
    1. 自留言发布起24小时内可删除
    2. 留言发布者可删除自己的留言；po不可删除留言
    3. 若在删除之前，该留言已被回复，则连回复内容一并删除
 

### HTTP Request

`DELETE /photo/:uuid/comment/:cuuid`

### Request Parameters

Parameter | Type | Description
----------|------|------------


### Attribute Parameters

Attribute | Type | Description
----------|------|------------
id | int | 评论 ID
uuid | string | 留言 UUID， UUID 是用于所有评论相关操作的唯一识别号
content | string | 留言正文
timestamp | string | 留言创建时间