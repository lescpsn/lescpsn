from datetime import datetime
from tornado.httpclient import HTTPClient
import hashlib
import json
import base64

def get_str_md5(str):
    md5=hashlib.md5(str.encode('utf-8')).hexdigest()

    return(md5)

def send_sms():
    BaseUrl = "http://123.57.48.46:28080/chif10"
    Method = "mtsms"
    UserId = "quxun"
    Password = "quxun"

    CliMsgId = "msg00001"
    PkTotal = 1
    PkNumber = 1
    RegisteredDelivery = 0
    MsgLevel = 0
    ServiceId = ""
    TPPId = 0
    TPUdhi = 0
    MsgFmt = 15
    MsgSrc = ""
    SrcId = ""
    DestTerminalId = ["18655590095","15062203369"]
#    MsgContent = "南京趣讯测试";
    MsgContent = "sms test";

    timeStamp = datetime.now().strftime('%Y%m%d%H%M%S')
    token = UserId + timeStamp + Password
    print(token)
    Md5Token = get_str_md5(token)
    url = "{0}/{1}/{2}/{3}".format(BaseUrl, Method, UserId, Md5Token)
#    print(url)

# set_header("Content-Type", "text/plain")
# httpURLConnection.setRequestProperty("accept", "application/json");
# httpURLConnection.setRequestProperty("Content-Type", "application/json;charset=utf-8");

    try:
        body = json.dumps({
            "Cli_Msg_Id": CliMsgId,
            "Pk_total ": PkTotal,
            "Pk_number": PkNumber,
            "Registered_Delivery": RegisteredDelivery,
            "Msg_level": MsgLevel,
            "Service_Id": ServiceId,
            "TP_pId": TPPId,
            "TP_udhi": TPUdhi,
            "Msg_Fmt": MsgFmt,
            "Msg_src": MsgSrc,
            "Src_Id": SrcId,
            "Dest_terminal_Id": DestTerminalId,
            "MsgContent": MsgContent
        })
#        print("test body: "+body)
        authorization = UserId+":"+timeStamp
        bytesString = authorization.encode(encoding="utf-8")
        encodestr = base64.b64encode(bytesString)
        authorization_base64 = encodestr.decode()
#        print("authorization_base64: " + authorization_base64)

        headers = {
            "Authorization": authorization_base64,
            "Accept": "application/json",
            "Content-Type": "application/json;charset=utf-8;"
        }
        http_client = HTTPClient()

        print("url: "+url)
#        print("method: "+method)
        print(headers)
        print(body)

        response = http_client.fetch(url, method='POST',headers = headers, body=body, request_timeout=120)
#        print(response.body.decode())
        print(response.body)
        print("test end:")

    except Exception as e:
        print(e)

if __name__ == "__main__":
    send_sms()

# curl -d "Dest_terminal_Id=["18655590095", "15062203369"]&MsgContent='this is my test'" -v  "http://123.57.48.46:28080/chif10/mtsms/quxun/f18aecf1ab496f0a423c34270618797b"
