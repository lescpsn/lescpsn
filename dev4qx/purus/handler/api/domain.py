import logging
import json
import tornado.web
from handler import JsonHandler
from tornado.httpclient import AsyncHTTPClient

_author__ = 'xinxin'

request_log = logging.getLogger("purus.request")


class ApiDomainHandler(JsonHandler):
    @tornado.gen.coroutine
    @tornado.web.authenticated
    def post(self, path):  # 根据path调用相应的post_*方法
        if 'admin' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        if path == 'add':
            yield self.add()
            return
        elif path == 'list_all':
            yield self.list_all()
            return
        elif path == 'copy_product':
            yield self.copy_product()
            return
        else:
            self.send_error(403)

    @tornado.gen.coroutine
    def add(self):  # 检查权限，对输入参数添加缺失参数，调用Repo提供的domain新增接口

        requ_body = self.request.body.decode()
        request_log.debug('post_add RECV: {0}'.format(requ_body))
        response = None
        try:
            base_url = self.application.config['connection']['repo']
            url = base_url + '/api/domain/add'
            http_client = AsyncHTTPClient()

            request_log.info('post_add REQU {0} {1}'.format(url, requ_body))
            response = yield http_client.fetch(url, method='POST', body=requ_body, request_timeout=120)
        except Exception as e:
            print(e)

        if response and response.code == 200:
            response_body = response.body.decode()
            request_log.info('post_add RESP: {0}'.format(response_body))
            self.finish(response_body)
        else:
            request_log.exception('post_add EXCEPTION!!!')
            self.finish({'fail': '内部异常'})

    @tornado.gen.coroutine
    def list_all(self):  # 检查权限，对输入参数添加缺失参数，调用Repo提供的domain查询接口

        # body = self.request.body.decode()
        # body = json.loads(body)
        body = {'domain_id': self.current_user['domain_id']}

        response = None

        try:
            body = json.dumps(body)
            base_url = self.application.config['connection']['repo']
            url = base_url + '/api/domain/list_all'

            http_client = AsyncHTTPClient()
            response = yield http_client.fetch(url, method='POST', body=body, request_timeout=120)
        except Exception as e:
            print(e)

        if response and response.code == 200:
            response_body = response.body.decode()
            request_log.debug(response_body)

            return self.finish(response_body)
        else:
            self.finish({'fail': '失败'})

    @tornado.gen.coroutine
    def copy_product(self):

        body = self.request.body.decode()
        body = json.loads(body)
        body['up_domain_id'] = self.current_user['domain_id']
        body = json.dumps(body)

        response = None

        try:
            base_url = self.application.config['connection']['repo']
            url = base_url + '/api/domain/copy_product'
            http_client = AsyncHTTPClient()

            response = yield http_client.fetch(url, method='POST', body=body, request_timeout=120)

        except Exception as e:
            print(e)

        if response and response.code == 200:
            response_body = response.body.decode()
            self.finish(response_body)
        else:
            request_log.exception('COPY_PRODUCT EXCEPTION!!!')
            self.finish({'fail': '内部异常'})
