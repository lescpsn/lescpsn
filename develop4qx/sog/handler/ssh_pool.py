#!/usr/bin/env python3
# -*- coding:utf-8 -*-

import paramiko
from tornado.concurrent import TracebackFuture
from tornado.ioloop import IOLoop

class SSHPool(object):

    def __init__(self):
        self.clients = {}

    def get_client(self, server_ip, server_user, ssh_port, server_key, **kwargs):
        k = '%s@%s' % (server_user, server_ip)
        client = self.clients.get(k)
        if client is None:
            client = SSHClient()
            client.connect_key(server_ip,
                               ssh_port,
                               server_user,
                               server_key,
                               **kwargs)
            self.clients[k] = client

        return client

    def release_client(self, client):
        self.clients = dict([(k,v) for k,v in self.clients.items() if v!=client])
        client.close()

class SSHClient(object):

    def __init__(self, io_loop=None):
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.channel = None
        self.io_loop = io_loop or IOLoop.current()
        self.future = None
        self._result = ''
        self._ret = ''
        self.sftp_client = None
        self.count = 0

    def connect_passwd(self, server_ip, ssh_port, server_user, server_password, **kwargs):
        self.client.connect(hostname = server_ip,
                            port = ssh_port,
                            username = server_user,
                            password = server_password,
                            **kwargs)

    def connect_key(self, server_ip, ssh_port, server_user, server_key, **kwargs):
        self.client.connect(hostname = server_ip,
                            port = ssh_port,
                            username=server_user,
                            key_filename=server_key,
                            **kwargs)

    def put_file(self, filename):
        try:
            self.future = TracebackFuture()
            transport = self.client.get_transport()
            self.sftp_client = SFTPClient.from_transport(transport)
            self.remote = self.sftp_client.open(filename, 'wb')
            self.local = open(filename, 'rb')
            self.io_loop.add_handler(self.sftp_client.sock, self._handle_write, self.io_loop.WRITE | self.io_loop.ERROR)
            return self.future

        except Exception as e:
            print(e)
            pass

    def _handle_write(self, fd, events):
        # print("EVENT=%d,fd=%s" % (events, fd))
        if events & self.io_loop.WRITE:
            _buf = self.local.read(BLOCK_SIZE)
            if _buf:
                try:
                    a = time.time()
                    self.remote.write(_buf)
                    b = time.time()
                    self.count += len(_buf)
                    c = b - a
                except IOError as e:
                    print(e)
            else:
                self.io_loop.remove_handler(fd)
                self.remote.close()
                self.local.close()
                self.future.set_result('FINISH')

    def exec_command(self, command):
        try:
            self.future = TracebackFuture()
            self.channel = self.client.get_transport().open_session()
            self.channel.exec_command(command)
            # t=self.channel.recv(1024)
            # print(t)
            print("EXEC COMMAND[%s] STATUS: %s" % (command,self.channel.recv_exit_status()))
            self.io_loop.add_handler(self.channel.fileno(), self._handle_events, self.io_loop.READ | self.io_loop.ERROR)
            return self.future

        except Exception as e:
            print(e)
            pass

    def close(self):
        self.client.close()

    def _handle_events(self, fd, events):
        #print("EVENT=" + str(events))
        if events & self.io_loop.READ:
            _buf = self.channel.recv(1024)
            if len(_buf):
                #print(_buf.decode())
                self._result += _buf.decode()
            else:
                self.io_loop.remove_handler(self.channel.fileno())
                self.future.set_result(self._result)
                self._result = ""

        if events & self.io_loop.ERROR:
            self.io_loop.remove_handler(self.channel.fileno())
            self.future.set_result('ERROR')

if __name__ == "__main__":
    sshpool = SSHPool()
    sshclient = sshpool.get_client("192.168.1.159", "carhj", 22, "/home/carhj/qxdevelop/sog/key/id_rsa")
    sshclient.exec_command('tail -f /etc/passwd')
#    sshclient.exec_command('free')
   #sshclient.exec_command('uptime')
#  # sshpool.release_client(sshclient)
   #sshclient = sshpool.get_client("192.168.1.159", "carhj", 22, "/home/carhj/qxdevelop/sog/key/id_rsa")
   #sshclient.exec_command('df')
   #sshpool.release_client(sshclient)
