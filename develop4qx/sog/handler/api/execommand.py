#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import logging
import json
import tornado.web
from handler.ssh_pool import *
log = logging.getLogger('request')



class ApiExeCommandHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self):

        host_id = self.get_argument("host_id")
        command = self.get_argument("command")

        print(host_id)
        print("********")
        db = self.application.mongo_sog.sog
        host = yield db.server.find_one({'id':int(host_id)})
        log.info(host)
        server_ip = host.get('ip')
        server_user = host.get('loginuser')
        ssh_port = host.get('port')
        server_key = host.get('privatekey')
        #this is my test server
        #server_ip = "192.168.1.159"
        #server_user = "carhj"
        #ssh_port = 22
        #server_key = "/home/carhj/qxdevelop/sog/key/id_rsa"
        #this is my test server

        sshpool = self.application.sshpool
        sshclient = sshpool.get_client(server_ip, server_user, ssh_port, server_key)
        result = {}

        # 命令执行结果
        result = yield sshclient.exec_command(command)
        log.info("result:"+result)
        resp_data = {'status': "ok", 'data': result}
        resp_data = json.dumps(resp_data)
        return  self.finish(resp_data)
