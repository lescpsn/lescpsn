# -*- coding: utf-8 -*-
import logging
import time
import tornado.web
import tornado.gen
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop
import json

log = logging.getLogger("request")

class CallbackUpstreamHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def post(self, path):
        body = self.request.body.decode()
        self.finish('1')

        downstream = self.application.config['downstream'].get(path)
        if downstream is None:
            log.info('PATH NOT FOUND %s', path)
            return

        args = json.loads(body)
        order_status = args.get('orderstatus')
        offer_id = args.get('plat_offer_id')
        mobile = args.get('phone_id')
        if order_status == 'finish':
            yield self.application.sms_sender.send_sms(mobile, offer_id, downstream)

        back_url = downstream.get('back_url')
        yield self.call_downstream(back_url, body)

    @tornado.gen.coroutine
    def call_downstream(self, back_url, body):
        log.info('CALLBACK %s', back_url)

        http_client = AsyncHTTPClient()
        for i in range(5):
            try:
                response = yield http_client.fetch(back_url, method="POST", body=body)
                if response and response.code == 200:
                    log.info('UPSTREAM CALLBACK RESP SUCCESS')
                    break
            except Exception:
                log.exception('CallbackUpstreamHandler call_downstream error')

            yield tornado.gen.Task(IOLoop.instance().add_timeout, time.time() + 60 * i)
