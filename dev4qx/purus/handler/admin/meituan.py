# -*- coding: utf8 -*-
import base64
import json
import logging
import re
import time
from Crypto.Cipher import AES
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest

import tornado.ioloop
import tornado.httpserver
import tornado.web

from handler import JsonHandler

from secret import padding
from utils.escape import escape_data_result

request_log = logging.getLogger("purus.request")

class MeituanBase(JsonHandler):
    carrier_name_dict ={"1":"移动","2":"联通","3":"电信"}
    USER_ID = '100005'  #美团固定的产品编码

    #根据产品ID获取产品信息
    def get_product_dict(self):
        purus = self.master

        product_dit = {}
        product_keys = purus.keys('product:{user_id}:data:*'.format(user_id=self.USER_ID))
        for product_id in product_keys:
            product_info = purus.hmget(product_id, ['offer', 'carrier', 'value', 'discount', 'scope','name'])
            offer = product_info[0]  # 产品编码
            carrier = product_info[1]  # 运营商
            value = product_info[2]  # 面值
            discount = product_info[3]  # 折扣
            scope = product_info[4]  # 区域
            name = product_info[5] #产品名称
            product_dit[offer] = {'carrier': carrier, 'value': value, 'discount': discount, 'scope': scope,'name':name}

        return product_dit

    #判断产品ID是否存在
    def check_product_exist(self,product_id):
        product_dict = self.get_product_dict()
        if product_id in product_dict:
            return True
        else:
            return False


#用于接收美团订单的Handler
class ApiMeituanHandler(MeituanBase):
    def post(self):
        print("ApiMeituanHandler:", self.json_args)

        mobile = self.json_args.get('mobile')
        meituan_sn = self.json_args.get('meituan_sn')
        product_id = self.json_args.get('product_id')

        if not self.check_product_exist(product_id):
            return self.finish( json.dumps( {'status': 'fail','msg':'未知的产品编号'} )  )

        if mobile == None or meituan_sn == None or product_id == None:
            return self.finish( json.dumps( {'status': 'fail','msg':'参数错误'} )  )
        else:
            order_limit = 1000
            if self.master.scard("set:meituan:ready") > order_limit:
                return self.finish( json.dumps( {'status': 'fail','msg':'系统繁忙'} )  )

            #生成美团专属订单号
            uid = int(self.master.incr('uid:meituan'))
            time_now = time.localtime()
            tsp = time.strftime("%Y%m%d%H%M%S", time.localtime())
            site = 0
            meituan_order_id = ( 'M%s%d%07d' % (tsp, site, uid) )

            #记录订单的详细数据
            self.master.hmset("meituan:{0}".format(meituan_order_id),
                                {
                                'mobile':mobile,
                                'meituan_sn':meituan_sn,
                                'product_id':product_id,
                                'create_tsp':int(time.mktime(time_now)),
                                'order_state':'ready'
                                }
                            )

            self.master.sadd("set:meituan:ready", meituan_order_id)

            return self.finish( json.dumps( {'status': 'ok','msg':'等待处理'} )  )

#用于接收订单处理结果的Handler
class MeituanCallbackHandler(MeituanBase):
    def post(self):
        print("MeituanCallbackHandler:", self.json_args)

        quxun_order_id = self.json_args.get("transactionid")  #读取趣讯订单号
        meituan_order_id = self.json_args.get("order_id")  #读取美团订单号
        orderstatus = self.json_args.get("orderstatus")  #读取订单状态

        if quxun_order_id and meituan_order_id and orderstatus:
            self.master.srem("set:meituan:checked",meituan_order_id)
            order_status = self.json_args.get("orderstatus")

            finish_tsp = int(time.mktime(time.localtime()))
            self.master.hmset("meituan:{0}".format(meituan_order_id), {"finish_tsp":finish_tsp, "quxun_order_id":quxun_order_id})

            if order_status == "finish":
                self.master.hset("meituan:{0}".format(meituan_order_id), "order_state", "success")
                self.master.sadd("set:meituan:finish",meituan_order_id)
            else:
                self.master.hset("meituan:{0}".format(meituan_order_id), "order_state", "fail")
                self.master.sadd("set:meituan:fail",meituan_order_id)
        else:
            print("无法处理的回调结果!!!!!")

        self.finish('1')

#用于处理美团客服管理界面的Handler
class AdminMeituanHandler(MeituanBase):

    @tornado.web.authenticated
    def get(self):
        if 'admin' not in self.current_user['roles']:
            return self.redirect('/auth/login')

        return self.render('meituan.html', title=self.application.title)

    @gen.coroutine
    @tornado.web.authenticated
    def post(self):
        if 'admin' not in self.current_user['roles']:
            return self.finish( json.dumps( {'status': 'fail','msg':'访问失败'} ) )

        print("AdminMeituanHandler:", self.json_args)

        request_type = self.json_args.get('request_type')
        meituan_order_id = self.json_args.get('meituan_order_id')
        product_id = self.json_args.get('product_id')
        filter_conditions = self.json_args.get('filter_conditions')

        #读取订单列表
        if request_type == "get_unsubmit_order_list":      #获取待提交的订单
            return self.get_meituan_order_list(filter_conditions,"set:meituan:ready")

        elif request_type == "get_unrefund_order_list":  #获取待退款的订单
            return self.get_meituan_order_list(filter_conditions,"set:meituan:fail")

        elif request_type == "get_unfinish_order_list":   #获取所有待处理的订单 (待提交+待退款)
            return self.get_meituan_order_list(filter_conditions,"set:meituan:ready","set:meituan:fail")

        #订单进一步处理
        elif request_type == "submit_order" and meituan_order_id: #提交订单充值
            return ( yield self.submit_order(meituan_order_id) )
        elif request_type == "delete_order" and meituan_order_id: #删除订单
            return self.delete_order(meituan_order_id)
        elif request_type == "change_order" and meituan_order_id and product_id: #修改订单套餐
            return self.change_order(meituan_order_id,product_id)
        elif request_type == "refund_order" and meituan_order_id: #退款订单
            return self.refund_order(meituan_order_id)


        #获取套餐数据套餐列表
        elif request_type == "get_product_list":
            return self.get_product_list()

        #未知请求
        else:
            return self.finish( json.dumps( {'status': 'fail','msg':'未知请求'} ) )


    def get_product_list(self):
        product_list = []
        #product_dit[offer] = {'carrier': carrier, 'value': value, 'discount': discount, 'scope': scope,'name':name}
        product_dict = self.get_product_dict()
        for product_id in product_dict:
            product_list.append(
                {
                    "product_id":product_id,  #产品编号
                    "carrier":self.carrier_name_dict.get(product_dict[product_id]['carrier'], "未知"),  #运营商
                    "value":product_dict[product_id]['value'], #面值
                    "scope":product_dict[product_id]['carrier'],  #区域
                    "name":product_dict[product_id]['name'], #产品名称
                }
            )
        product_list = sorted(product_list,key=lambda product_list: product_list['product_id'])
        return self.finish( json.dumps( {'status': 'ok','product_list':product_list} ) )

    def get_meituan_order_list(self, filter_conditions, *keys):
        page_index = 1
        filter_mobile = None
        filter_start_tsp = None
        filter_end_tsp = None

        if filter_conditions:
            #页码
            page_index = filter_conditions.get("page_index")
            page_index = [page_index,1][not page_index]
            page_index = int (page_index)
            page_index = [page_index,1][page_index < 1]

            #手机号
            filter_mobile = filter_conditions.get("mobile")

            #起始时间
            start_time = filter_conditions.get('start_time')
            if start_time:
                start_time = time.strptime(start_time, '%Y/%m/%d %H:%M:%S')
                filter_start_tsp = int(time.mktime(start_time))

            end_time = filter_conditions.get('end_time')
            if end_time:
                end_time = time.strptime(end_time, '%Y/%m/%d %H:%M:%S')
                filter_end_tsp = int(time.mktime(end_time))

        #获取所有的id，并对id进行排序操作
        order_sizes = {"ready_size":0, "fail_size":0, "unfinish_size":0 }
        order_list = []
        for key in ["set:meituan:ready", "set:meituan:fail"]:
            charge_state = re.search(r"set:meituan:(.+)$",key).groups()[0]
            for meituan_order_id in self.master.smembers(key):
                mobile,meituan_sn,product_id,create_tsp,check_tsp,finish_tsp,order_state=self.master.hmget("meituan:{0}".format(meituan_order_id),
                                  "mobile",
                                  "meituan_sn",
                                  "product_id",
                                  "create_tsp",
                                  "check_tsp",
                                  "finish_tsp",
                                  "order_state")

                create_tsp = int(create_tsp)
                create_time=""
                if create_tsp != None:
                    create_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(create_tsp))

                state_time= None
                if not state_time and finish_tsp:
                    state_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(int(finish_tsp)))

                if not state_time and check_tsp:
                    state_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(int(check_tsp)))

                #进行条件过滤
                if (filter_start_tsp and filter_end_tsp) and (create_tsp<filter_start_tsp or create_tsp > filter_end_tsp):
                    continue

                if filter_mobile and filter_mobile != mobile:
                    continue

                order_sizes['{0}_size'.format(charge_state)] += 1

                if key in keys:
                    #进行数据结构组装
                    product_info = self.get_product_dict().get(product_id)
                    if not product_info:
                        print("无法获取订单({0})的产品编号({1})所对应的产品信息:".format(meituan_order_id, product_id))
                        continue

                    purchase_price =  float( product_info['discount'] ) * float(product_info['value']) / 10000

                    order_list.append({
                                    "meituan_order_id":meituan_order_id,
                                    "mobile":mobile,
                                    "product_name":product_info['name'],        #产品名称
                                    "carrier":self.carrier_name_dict.get(product_info["carrier"], "未知"),  #运营商
                                    "value":product_info['value'],      #面值
                                    "purchase_price":purchase_price,    #采购金额
                                    "create_time":create_time,
                                    "state_time":state_time,
                                    "charge_state":charge_state,
                                    "order_state":order_state,
                                    "meituan_sn":meituan_sn,
                                    "notes":"备注待定"
                                    })

        order_sizes['unfinish_size'] = order_sizes['ready_size'] + order_sizes['fail_size']

        order_list = sorted(order_list,key=lambda order_list: order_list['meituan_order_id'])
        order_id_list_size = len(order_list)

        #根据分页号码获取部分数据
        max_page_line = 20  #每页最多20行
        page_count = int(order_id_list_size / max_page_line)  + int([1,0][order_id_list_size%max_page_line == 0]) #一共有多少页数据

        if page_index > page_count:
            page_index = page_count
        if page_index < 0 :
            page_index = 0

        order_begin = (page_index - 1) * max_page_line
        order_list = order_list[order_begin:order_begin+max_page_line]

        return self.finish( json.dumps({'status': 'ok',
                                        'order_list':order_list,
                                        'page_index':page_index,
                                        'page_count':page_count,
                                        'order_sizes':order_sizes,
                                                   }))

    def get_order_sizes(self):
        ready_size = self.master.scard("set:meituan:ready")
        fail_size = self.master.scard("set:meituan:fail")
        unfinish_size= ready_size+fail_size

        return {"ready_size":ready_size, "fail_size":fail_size, "unfinish_size":unfinish_size }

    @gen.coroutine
    def submit_order(self,meituan_order_id): #订单状态从ready(等待确认)转为checked(充值中)
        if not self.master.srem("set:meituan:ready",meituan_order_id):
            return self.finish( json.dumps({"status":"fail", "msg":"订单不存在或已被处理"}) )

        #进行充值操作
        result, charge_state, order_state = yield self.charge_order(meituan_order_id)

        #修改订单状态
        tsp_now = int(time.mktime(time.localtime()))
        self.master.hset("meituan:{0}".format(meituan_order_id), "check_tsp", tsp_now)

        self.master.sadd("set:meituan:{0}".format(charge_state), meituan_order_id)
        self.master.hset("meituan:{0}".format(meituan_order_id), "order_state", order_state)

        return self.finish( json.dumps({"status":"ok", "order_state":order_state}) )

    def change_order(self,meituan_order_id,new_product_id):#订单状态从ready(等待确认)转为ready(等待确认)
        if not self.check_product_exist(new_product_id):
            return self.finish( json.dumps({"status":"fail","msg":"未知产品编号"}) )

        self.master.hset("meituan:{0}".format(meituan_order_id), "product_id", new_product_id)
        return self.finish( json.dumps({"status":"ok"}) )

    def delete_order(self,meituan_order_id): #订单状态从ready(等待确认)转为delete(删除)
        return self.finish_order(meituan_order_id,"ready","delete")

    def refund_order(self,meituan_order_id):#订单状态从fail(充值失败)转为refuned(已退款)
        return self.finish_order(meituan_order_id,"fail","refuned")

    def finish_order(self,meituan_order_id,before_state, after_state):
        if not self.master.srem("set:meituan:{0}".format(before_state), meituan_order_id):
            return self.finish( json.dumps({"status":"fail", "msg":"订单不存在或已被处理"}) )

        finish_tsp = int(time.mktime(time.localtime()))
        self.master.hmset("meituan:{0}".format(meituan_order_id), {"order_state":after_state, "finish_tsp":finish_tsp})
        self.master.sadd("set:meituan:finish",meituan_order_id)

        return self.finish( json.dumps({"status":"ok"}) )

    #订单充值
    @gen.coroutine
    def charge_order(self,meituan_order_id):
        order_info = self.master.hgetall( "meituan:{0}".format(meituan_order_id) )
        if not order_info:
            print("无法查询到订单({0})的详细信息，充值失败".format(meituan_order_id))
            return (False,"fail","no_order_info")

        product_dict = self.get_product_dict()
        if order_info['product_id'] not in product_dict:
            print("无法查询到订单({0})的充值产品信息，充值失败".format(meituan_order_id))
            return (False,"fail","no_product_fino")

        try:
            face_value = product_dict.get(order_info['product_id']).get('value')

            downstream = self.application.config['downstream'][self.USER_ID]
            code = json.dumps({
                'request_no': meituan_order_id,
                'contract_id': '100001',
                'order_id': meituan_order_id,
                'plat_offer_id': order_info['product_id'],
                'phone_id': order_info['mobile'],
                'facevalue': int(face_value),
            })

            iv = downstream['iv']
            passphrase = downstream['pass']
            aes = AES.new(passphrase, AES.MODE_CBC, iv)

            b = aes.encrypt(padding(code))
            encrypted = base64.b64encode(b).decode('utf8')

            body = json.dumps({'partner_no': self.USER_ID, 'code': encrypted})

            url = 'http://{shard}/data/order'.format(shard=downstream['shard'])

            http_client = AsyncHTTPClient()
            request = HTTPRequest(url=url, method='POST', body=body)
            response = yield http_client.fetch(request)

            if response.code == 200:
                resp = json.loads(response.body.decode('utf8'))

                result = resp['orderstatus']
                if result != 'processing':
                    print( '订单({0})充值失败：{1}({2})'.format(meituan_order_id, escape_data_result(result),result) )
                    return (False,"fail","charge_fail")
                else:
                    return (True,"checked","checked")

        except Exception as e:
            print(meituan_order_id," exception:",e)
            return (False,"fail","exception")

        return (False,"fail","unknown")

