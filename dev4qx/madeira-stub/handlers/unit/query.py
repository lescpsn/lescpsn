import json
from tornado.httpclient import HTTPClient
import tornado.web


class UnitQueryHandler(tornado.web.RequestHandler):
    def get(self):
        self.render('query.html')

    @tornado.gen.coroutine
    def post(self, *args, **kwargs):
        body = self.request.body.decode()

        body_info = json.loads(body)

        t = body_info['type']
        u = body_info['user_id']
        url = body_info['url']

        ret = None

        if t == 'prod':
            q = {'partner_no': u,
                 'request_no': "R20140512123022",
                 'contract_id': '100001'}

            # call & wait
            http_client = HTTPClient()
            try:
                body = json.dumps(q)
                response = http_client.fetch(url + '/data/prod', method='POST', body=body)

                ret = response.body.decode('utf8')
                ret = json.dumps(json.loads(ret), indent=4)

            except Exception as e:
                print(e)
            finally:
                http_client.close()

        self.finish(json.dumps({'ret': ret}))