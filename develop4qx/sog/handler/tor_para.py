import logging
import time

from paramiko.sftp_client import SFTPClient
import paramiko
from tornado.concurrent import TracebackFuture
from tornado.ioloop import IOLoop

BLOCK_SIZE = 1024

request_log = logging.getLogger("config")


class SSHClientManager(object):
    def __init__(self):
        self.clients = {}

    def get_client(self, host, username, port, **kwargs):
        k = '%s@%s' % (username, host)
        client = self.clients.get(k)
        if client is None:
            client = SSHClient()
            client.connect(host, username, port, **kwargs)
            self.clients[k] = client

        return client


class SSHClient(object):
    _host_map = {}

    def __init__(self, io_loop=None):
        self.client = paramiko.SSHClient()
        self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # self.transport = None
        self.channel = None
        self.io_loop = io_loop or IOLoop.current()
        self.future = None
        self._result = ''
        self.sftp_client = None
        self.count = 0

    def connect(self, host, uesrname, port, **kwargs):
        self.client.connect(host, username=uesrname, port=port, allow_agent=False, **kwargs)

    def put_file(self, filename):
        try:
            self.future = TracebackFuture()

            transport = self.client.get_transport()
            self.sftp_client = SFTPClient.from_transport(transport)
            self.remote = self.sftp_client.open(filename, 'wb')
            self.local = open(filename, 'rb')
            # self.remote.setblocking(0)
            # _buf = self.local.read(100)
            # self.remote.write(_buf)
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
        request_log.info('EXECUTE %s', command)

        try:
            self.future = TracebackFuture()
            transport = self.client.get_transport()
            self.channel = transport.open_session()
            self.channel.exec_command(command)

            self.io_loop.add_handler(self.channel.fileno(), self._handle_events, self.io_loop.READ | self.io_loop.ERROR)

            return self.future
        except Exception as e:
            print(e)
            pass

    def _handle_events(self, fd, events):
        # print("EVENT=" + str(events))
        if events & self.io_loop.READ:
            _buf = self.channel.recv(1024)
            if len(_buf):
                print(_buf.decode())
                self._result += _buf.decode()
            else:
                self.io_loop.remove_handler(self.channel.fileno())
                self.future.set_result(self._result)

        if events & self.io_loop.ERROR:
            self.io_loop.remove_handler(self.channel.fileno())
            self.future.set_result('ERROR')
