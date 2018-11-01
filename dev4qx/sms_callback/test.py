#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
from tornado.httpclient import HTTPClient


if __name__ == "__main__":
    post_body = {
        "transactionid": "Q2016041023554116291961",
        "phone_id" : "18655590095",
        "order_id": "S1604107335921",
        "ordertime": "2016-04-11 00:07:31",
        "orderstatus": "finish",
        "plat_offer_id": "TBC00000100B",
        "result_code": "1",
        "facevalue": "2"
    }
    url = "http://192.168.1.159:10020/upstream/callback/700271"
    http_client = HTTPClient()
    response = http_client.fetch(url, method='POST', body=json.dumps(post_body), request_timeout=120)
