#!/usr/bin/env python3
# -*- coding:utf-8 -*-
import logging
import json
import tornado.web
from handler.ssh_pool import *
log = logging.getLogger('request')

class ApiOverviewHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        host_id = self.get_argument("host_id")
        db = self.application.mongo_sog.sog
        host = yield db.server.find_one({'id':int(host_id)})
        log.info(host)
        server_ip = host.get('ip')
        server_user = host.get('loginuser')
        ssh_port = host.get('port')
        server_key = host.get('privatekey')

        #this is my test server
        server_ip = "192.168.1.159"
        server_user = "carhj"
        ssh_port = 22
        server_key = "/home/carhj/qxdevelop/sog/key/id_rsa"
        #this is my test server

        sshpool = self.application.sshpool
        sshclient = sshpool.get_client(server_ip, server_user, ssh_port, server_key)
        result = {}

        # 磁盘信息,注意多硬盘的情况，需要循环读取每个硬盘的信息
        df_ret = yield sshclient.exec_command("df | grep '^/'")
        df_ret = df_ret.split('\n')
        df_data = []
        for d in df_ret:
            if d:
                log.info("df:"+d)
                disk = d.split(' ')[0]
                used = d.split(' ')[-2]
                mount = d.split(' ')[-1]
                df = {'disk':disk, 'used':used, 'mount':mount}
                df_data.append(df)

        # 内存信息
        free_ret = yield sshclient.exec_command("free | sed -n '2p' | awk '{print $2,$3,$4}'")
        free_ret = free_ret.strip()
        log.info("free:"+free_ret)
        free_data = {'total':free_ret.split(' ')[0],
                     'used':free_ret.split(' ')[1],
                     'free':free_ret.split(' ')[2]
        }

        # 负载信息
        uptime_ret = yield sshclient.exec_command("uptime | awk -F[,] '{for (i=3;i<NF;i++) printf $i;print $NF}'|awk -F[:] '{print $2}'")
        uptime_ret = uptime_ret.strip()
        log.info("uptime:"+uptime_ret)
        uptime_data = [uptime_ret.split(' ')[0],uptime_ret.split(' ')[1],uptime_ret.split(' ')[2]]

        result = {'disk':df_data, 'memory':free_data, 'load':uptime_data}
        resp_data = {'status': "ok", 'data': result}
        resp_data = json.dumps(resp_data)
        return  self.finish(resp_data)

class ApiAllOverviewHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        db = self.application.mongo_sog.sog
        host_result = yield db.server.find({},{'id':1,'ip':1,'hostname':1,'notes':1,
                                          'loginuser': 1, 'port': 1, 'privatekey': 1,
                                          '_id':0}).to_list(None)

        result = []
        for h in host_result:
            server_ip = h.get('ip')
            server_user = h.get('loginuser')
            ssh_port = h.get('port')
            server_key = h.get('privatekey')
            print(server_ip,server_user,ssh_port,server_key)

            #this is my test server
#            server_ip = "192.168.1.159"
#            server_user = "carhj"
#            ssh_port = 22
#            server_key = "/home/carhj/qxdevelop/sog/key/id_rsa"
            #this is my test server

            sshpool = self.application.sshpool
            sshclient = sshpool.get_client(server_ip, server_user, ssh_port, server_key)

            # 磁盘信息,注意多硬盘的情况，需要循环读取每个硬盘的信息
            df_ret = yield sshclient.exec_command("df | grep '^/'")
            df_ret = df_ret.split('\n')
            df_data = []
            for d in df_ret:
                if d:
                    log.info("df:"+d)
                    disk = d.split(' ')[0]
                    used = d.split(' ')[-2]
                    mount = d.split(' ')[-1]
                    df = {'disk':disk, 'used':used, 'mount':mount}
                    df_data.append(df)

            # 内存信息
            free_ret = yield sshclient.exec_command("free -h| sed -n '2p' | awk '{print $2,$3,$4}'")
            free_ret = free_ret.strip()
            log.info("free:"+free_ret)
            free_data = {'total':free_ret.split(' ')[0],
                         'used':free_ret.split(' ')[1],
                         'free':free_ret.split(' ')[2]
            }

            # 负载信息
            uptime_ret = yield sshclient.exec_command("uptime | awk -F[,] '{for (i=3;i<NF;i++) printf $i;print $NF}'|awk -F[:] '{print $2}'")
            uptime_ret = uptime_ret.strip()
            log.info("uptime:"+uptime_ret)
            uptime_data = [uptime_ret.split(' ')[0],uptime_ret.split(' ')[1],uptime_ret.split(' ')[2]]


            t = {
                'id':h.get('id'),
                'ip': h.get('ip'),
                'notes':h.get('notes'),
                'hostname':h.get('hostname'),
                'disk':df_data,
                'memory':free_data,
                'load':uptime_data
            }
            result.append(t)
        resp_data = {'status': "ok", 'data': result}
        resp_data = json.dumps(resp_data)
        return  self.finish(resp_data)

class ApiServerlisHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        db = self.application.mongo_sog.sog
        result = yield db.server.find({},{'id':1,'ip':1,'hostname':1,'notes':1, '_id':0}).to_list(None)
        log.info(result)
        resp_data = {'status': "ok", 'data': result}
        resp_data = json.dumps(resp_data)
        return  self.finish(resp_data)

class ApiExecCmdHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        host_id = self.get_argument("host_id")
        command = self.get_argument("command")
        db = self.application.mongo_sog.sog
        host = yield db.server.find_one({'id':int(host_id)})
        log.info(host)
        server_ip = host.get('ip')
        server_user = host.get('loginuser')
        ssh_port = host.get('port')
        server_key = host.get('privatekey')

        #this is my test server
        server_ip = "192.168.1.159"
        server_user = "carhj"
        ssh_port = 22
        server_key = "/home/carhj/qxdevelop/sog/key/id_rsa"
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
