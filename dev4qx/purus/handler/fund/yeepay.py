# encoding: utf8
import hmac
import json
import re
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest
from urllib.parse import quote, unquote
import tornado.web
import tornado.gen
from datetime import datetime
import logging
import onetimepass as otp

from db.purus import PayYeepay
from handler import BaseHandler
from utils import signature

request_log = logging.getLogger("purus.request")


@tornado.gen.coroutine
def call_refund(base_url, user_id, income, token, operator, notes):
    sign = signature('{user_id}{order_id}{income}{operator}{token}'.format(
        user_id=user_id,
        order_id='',
        income=income,
        operator=operator,
        token=token))

    body = json.dumps({
        'type': 'deposit',
        'user_id': user_id,
        'operator': operator,
        'token': token,
        'income': str(income),
        'notes': notes,
        'sign': sign,
        'order_id': ''})

    request_log.info('FUND REQ %s', body)

    http_client = AsyncHTTPClient()

    url = 'http://%s/admin/fund' % base_url
    try:
        request = HTTPRequest(url=url, method='POST', body=body, request_timeout=120)
        response = yield http_client.fetch(request)

        if response.code == 200:
            body = response.body.decode()
            request_log.info('FUND RESP %s', body)

            resp = json.loads(body)
            if resp['status'] == 'ok':
                return 'success'
            else:
                return 'fail'

    except Exception as e:
        print(e)
        print('CALL FUND FAIL')
    finally:
        http_client.close()

    return 'exception'


class YeepayCallbackHandler(BaseHandler):
    @tornado.gen.coroutine
    def callback(self, query):
        args = {}
        for kv in query.split('&'):
            k, v = kv.split('=')
            args[k] = v

        order = args.get('r6_Order')
        btype = args.get('r9_BType')
        hmac1 = args.get('hmac')
        trx_id = args.get('r2_TrxId')

        if btype == '1':
            self.redirect('/yeepay/back?order=%s' % order)

        else:
            sign = [
                args.get('p1_MerId'),
                args.get('r0_Cmd'),
                args.get('r1_Code'),
                trx_id,
                args.get('r3_Amt'),
                args.get('r4_Cur'),
                unquote(args.get('r5_Pid'), encoding='gbk'),
                order,
                args.get('r7_Uid'),
                args.get('r8_MP'),
                btype
            ]

            mac = hmac.new(self.application.config['yeepay']['mer_key'].encode())
            for v in sign:
                mac.update(v.encode())
            hmac0 = mac.hexdigest()

            if hmac0 == hmac1:
                self.finish('success')
            else:
                request_log.error('YEEPAY HMAC DIFF %s %s', hmac, hmac0)
                self.send_error(500)
                return

            key = 'pay:yeepay:%s' % order

            cb_count = self.master.hincrby(key, 'cb_count', 1)
            if cb_count == 1:

                pay_info = self.master.hmget(key, ['user_id', 'amount'])
                user_id = pay_info[0]
                amount = int(pay_info[1])
                fee = float(args.get('rq_TargetFee'))
                amount = amount / 10000 - fee

                base_url = self.application.config['downstream'][user_id]['shard']

                result = False
                for i in range(10):
                    secret = self.application.config['yeepay']['secret']
                    operator = self.application.config['yeepay']['operator']

                    token = otp.get_totp(secret, True).decode()

                    result = yield call_refund(base_url, user_id, amount, token, operator, trx_id)
                    if result in ['success', 'exception']:
                        break

                    yield gen.sleep(10)

                session = self.session('purus')

                try:
                    yeepay = session.query(PayYeepay).filter(PayYeepay.pay_order_id == order).one()
                    yeepay.pay_status = 'success'
                    yeepay.add_status = result
                    yeepay.trx_id = trx_id
                    yeepay.fee = int(fee * 10000)
                    yeepay.back_time = datetime.now()

                    session.add(yeepay)
                    session.commit()
                except Exception as e:
                    request_log.exception("UPDATE PAY_YEEPAY FAIL")
                finally:
                    session.close()

                self.master.hmset(key, {'add_status': result, 'fee': fee})
                self.master.expire(key, 3600 * 12)

    @tornado.gen.coroutine
    def post(self):
        # p1_MerId=10012431828&
        # r0_Cmd=Buy&
        # r1_Code=1&
        # r2_TrxId=316214240051443I&
        # r3_Amt=0.01&
        # r4_Cur=RMB&
        # r5_Pid=%D2%BB%C6%F0%B3%E4%C6%BD%CC%A8%BC%D3%BF%EE0.01%D4%AA&
        # r6_Order=PAY2015080700010&
        # r7_Uid=&
        # r8_MP=&
        # r9_BType=1&
        # ru_Trxtime=20150807133858&
        # ro_BankOrderId=2819841668&
        # rb_BankId=CMBCHINA-NET&
        # rp_PayDate=20150807133821&
        # rq_CardNo=&
        # rq_SourceFee=0.0&
        # rq_TargetFee=0.0&
        # hmac=9f1ea3dffbd2cd41feff0af70c569a18
        yield self.callback(self.request.body.decode())

    @tornado.gen.coroutine
    def get(self):
        # http://121.41.55.86:9988/echo?
        # p1_MerId=10012431828&r0_Cmd=Buy&r1_Code=1&r2_TrxId=117231242616294I&r3_Amt=0.01&r4_Cur=RMB&r5_Pid=%D2%BB&r6_Order=Q2015080612521438836728&r7_Uid=&r8_MP=&r9_BType=2
        # &ru_Trxtime=20150806153119&ro_BankOrderId=2819145883&rb_BankId=CMBCHINA-NET&rp_PayDate=20150806125300&rq_CardNo=&rq_SourceFee=0.0&rq_TargetFee=0.0
        # &hmac=5f2993b439613f5bb46012b7ff139e8f
        request_log.info('YEEPAY CALLBACK %s', self.request.query)
        yield self.callback(self.request.query)


# re_amount = re.compile(r'^\d{1,6}(\.\d{1,2})?$')
re_amount = re.compile(r'^\d{1,6}?$')


class YeepayHandler(BaseHandler):
    @tornado.web.authenticated
    @tornado.gen.coroutine
    def get(self, path):
        if path == '':
            self.render('add_fund_yeepay.html', title=self.application.title, message=None, refresh=False)

        elif path == '/back':
            pay_order_id = self.get_argument('order')
            status = self.master.hget('pay:yeepay:%s' % pay_order_id, 'add_status')

            refresh = False
            if status == 'success':
                message = '支付成功！'
            elif status == 'fail':
                message = '加款出现异常，请与客服联系'
            else:
                message = '正在确认您的支付，请稍后...'
                refresh = True

            self.render('add_fund_yeepay.html', title=self.application.title, message=message, refresh=refresh)

        elif path == '/order':

            try:
                amount = self.get_argument('amount')
                if not re_amount.search(amount):
                    self.finish('<html><body>请输入有效的金额</body></html>')
                    return

                amount = float(amount)
                if amount < 100:
                    self.finish('<html><body>金额必须大于100</body></html>')
                    return

                tsp = datetime.now()
                pay_id = int(self.master.incr('xid:yeepay')) % 100000
                pay_order_id = 'QPAY%s%05d' % (tsp.strftime('%Y%m%d'), pay_id)

                # create pay order
                # redirect


                product_name = '一起充平台加款%.2f元' % amount
                in_amount = int(amount * 10000)

                sign = [
                    'Buy',
                    self.application.config['yeepay']['mer_id'],
                    pay_order_id,
                    '%.2f' % amount,
                    'CNY',
                    product_name,
                    '',
                    product_name,
                    self.application.config['yeepay']['callback_url']
                ]

                mac = hmac.new(self.application.config['yeepay']['mer_key'].encode())
                for v in sign:
                    mac.update(v.encode())
                r = mac.hexdigest()

                print(r)

                args = [
                    'p0_Cmd=Buy',
                    'p1_MerId=%s' % self.application.config['yeepay']['mer_id'],
                    'p2_Order=%s' % pay_order_id,
                    'p3_Amt=%.2f' % amount,
                    'p4_Cur=CNY',
                    'p5_Pid=%s' % quote(product_name, encoding='gbk'),
                    'p6_Pcat=%s' % '',
                    'p7_Pdesc=%s' % quote(product_name, encoding='gbk'),
                    'p8_Url=%s' % self.application.config['yeepay']['callback_url'],
                    'hmac=%s' % r
                ]

                # create pay order
                user_id = self.current_user['partner_id']
                self.master.hmset('pay:yeepay:%s' % pay_order_id, {
                    'user_id': user_id,
                    'amount': in_amount,
                    'cb_count': 0
                })

                # persist to db
                session = self.session('purus')
                try:
                    yeepay = PayYeepay()
                    yeepay.user_id = user_id
                    yeepay.amount = in_amount
                    yeepay.pay_order_id = pay_order_id
                    yeepay.create_time = datetime.now()
                    session.add(yeepay)
                    session.commit()

                except Exception as e:
                    request_log.exception('INSERT PAY_YEEPAY FAIL')

                finally:
                    session.close()

                url = 'https://www.yeepay.com/app-merchant-proxy/node?' + '&'.join(args)
                self.redirect(url)

            except Exception as e:
                request_log.exception('PAY FALL')
                self.send_error(500)
                #
                # @tornado.web.authenticated
                # def post(self, path):
                #     if path == '/check':
                #
                #     self.render('add_fund_yeepay.html', title=self.application.title, message=self.request.body.decode())
