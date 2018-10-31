import json
from tornado.httpclient import HTTPClient

if __name__ == "__main__":
    msg = "超时"
    type = "madeira.order_timeout"
    # type = "system.power_failure"
    payload ={"order_list": ['Q20000000000']}
    body = {
        "msg": msg,
        "type": type,
        "payload": payload,
    }
#     title = "1"
#     domain_id = "1"
#     domain_name = "1"
#     up_domain = "1"
#     hosts = "1"
#     up_user = "1"
#     status = "1"
#
#     body = {
#         "title": title,
#         "domain_id": domain_id,
#         "domain_name": domain_name,
#         "up_domain": up_domain,
#         "hosts": hosts,
#         "up_user": up_user,
#         "status": status,
#
#     }

    body = json.dumps(body)
    url = "http://192.168.1.159:8899/inbox"
    try:
        http_client = HTTPClient()
        response = http_client.fetch(url, method='POST', body=body, request_timeout=120)
    except Exception as e:
        print(e)
