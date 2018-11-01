# -*- coding: utf-8 -*-
import json
import random
import string
import tornado
import tornado.gen
from datetime import datetime as dt
from sqlalchemy import or_, between

from db.repo import RepoDomain, RepoUser, RepoProduct, RepoRouteSupply, RepoRouteInterface, RepoOperator, RepoTemplate, \
    RepoInterfacePrice
from handlers import JsonHandler
from handlers.user import STATUS, gen_key, get_initial
from utils import sign_request


class ApiDomainHandler(JsonHandler):
    @tornado.gen.coroutine
    def post(self, path):
        if path == 'list_all':
            self.post_list_all_domain()
            return
        elif path == 'add':
            yield self.post_add_domain()
            return
        elif path == 'copy_product':
            yield self.post_copy_product()
            return

    @tornado.gen.coroutine
    def post_list_all_domain(self):
        session = self.session('repo')
        domain_id = self.json_args.get('domain_id')

        result = list()

        try:
            q = session.query(RepoDomain).filter(
                    or_(RepoDomain.up_domain == domain_id, RepoDomain.domain_id == domain_id)).order_by(RepoDomain.id)
            for domain in q.all():
                result.append({
                    'domain_id': domain.domain_id,
                    'domain_name': domain.domain_name,
                    'title': domain.title,
                    'hosts': domain.hosts,
                    'up_domain': domain.up_domain,
                    'up_user': domain.up_user,
                    'status': domain.status,
                    'status_n': STATUS.get(domain.status),
                    'create_time': str(domain.create_time),
                })
            self.finish(json.dumps({'data': result, 'status': "ok"}))
        except Exception as e:
            self.finish(json.dumps({'status': 'fail', 'msg': str(e)}))
        finally:
            session.close()

    @tornado.gen.coroutine
    def post_add_domain(self):
        domain_id = self.json_args.get('domain_id')
        domain_name = self.json_args.get('domain_name')
        title = self.json_args.get('title')
        hosts = self.json_args.get('hosts')
        up_user = self.json_args.get('up_user', None)
        id_start = self.json_args.get('id_start', None)
        id_end = self.json_args.get('id_end', None)
        template_list = self.json_args.get('template_list')
        up_domain_id = None
        db_up_user = None

        status = "enabled"

        session = self.session('repo')

        try:
            if up_user:
                # sub-domain
                db_up_user = session.query(RepoUser).filter(RepoUser.user_id == up_user).first()
                if db_up_user is None:
                    raise RuntimeError('没有找到指定的上游用户 %s' % up_user)

                up_domain_id = db_up_user.domain_id

                # check start-end in up_domain
                db_up_domain = session.query(RepoDomain).filter(RepoDomain.domain_id == up_domain_id).one()

                if id_start < db_up_domain.id_start or id_end > db_up_domain.id_end:
                    raise RuntimeError('子平台用户段需要在上级平台用户端内')

                # 用户不可重叠
                exist_domain = session.query(RepoDomain).filter(RepoDomain.up_domain == up_domain_id).filter(
                        or_(between(RepoDomain.id_start, id_start, id_end),
                            between(RepoDomain.id_end, id_start, id_end))).first()

                if exist_domain:
                    raise RuntimeError('与同级平台的用户段重叠 %s(%s)' % (exist_domain.domain_name, exist_domain.domain_id))

            else:
                raise RuntimeError('请选择一个上级用户')  # 暂时关闭顶级平台

                # top-level domain
                exist_domain = session.query(RepoDomain).filter(
                        or_(between(RepoDomain.id_start, id_start, id_end),
                            between(RepoDomain.id_end, id_start, id_end))).first()

                if exist_domain:
                    raise RuntimeError('用户段重叠 %s' % exist_domain.domain_id)

            domain = RepoDomain()
            domain.domain_id = domain_id
            domain.domain_name = domain_name
            domain.title = title
            domain.hosts = hosts
            domain.up_domain = up_domain_id
            domain.up_user = up_user
            domain.status = status
            domain.id_start = id_start
            domain.id_end = id_end
            domain.create_time = dt.now()

            session.add(domain)

            # add route/interface

            route = RepoRouteSupply()
            route.domain_id = domain_id
            route.name = '内部路由'
            route.area = 'CN'
            route.adapt_flag = 'yes'
            route.interfaces = 'quxun'
            route.status = 'enabled'
            route.create_time = dt.now()
            session.add(route)

            interface = RepoRouteInterface()
            interface.domain_id = domain_id
            interface.interface_id = 'quxun'
            interface.name = '<趣讯上游>'
            interface.carrier = '1,2,3'
            interface.area = 'CN'
            interface.create_time = dt.now()
            session.add(interface)

            # add user/operator

            user_id = id_start

            user = RepoUser()
            user.domain_id = domain_id
            user.user_id = user_id
            user.name = domain_name
            user.master_id = user_id
            user.shard_id = user_id
            user.type = db_up_user.type
            user.password = gen_key(16, string.ascii_uppercase + string.ascii_lowercase + string.digits)
            user.secret = gen_key(32, string.ascii_uppercase + string.ascii_lowercase + string.digits)
            user.iv = gen_key(16, string.digits)
            user.back_url = db_up_user.back_url
            user.tags = get_initial(domain_name)
            user.level = 1
            user.prefix = 'TB'
            user.status = 'enabled'
            user.services = db_up_user.services
            user.create_time = dt.now()

            session.add(user)

            rand_pass = ''.join(random.sample(string.ascii_letters + string.digits, 6))
            signed = sign_request(rand_pass.encode())

            admin_login = 'admin' + user_id

            operator = RepoOperator()
            operator.domain_id = domain_id
            operator.user_id = user_id
            operator.login = admin_login
            operator.name = domain_name + '管理员'
            operator.password = signed
            operator.role = 'down_admin'
            operator.status = 'enabled'

            session.add(operator)
            session.commit()

            # copy template
            if template_list:
                q = session.query(RepoTemplate).filter(RepoTemplate.domain_id == up_domain_id)
                for template in q.all():
                    if template.template_id in template_list:
                        copy_template = RepoTemplate()
                        copy_template.domain_id = domain_id
                        copy_template.template_id = template.template_id
                        copy_template.template_name = template.template_name
                        copy_template.user_id_start = id_start
                        copy_template.user_id_end = id_end
                        copy_template.shard_id = user_id
                        copy_template.type = template.type
                        copy_template.back_url = template.back_url
                        copy_template.level = template.level
                        copy_template.prefix = template.prefix
                        copy_template.status = template.status
                        copy_template.services = template.services
                        copy_template.role = template.role
                        session.add(copy_template)

                session.commit()

            self.finish({'status': 'ok', 'msg':
                ('创建成功\n'
                 '管理用户名：%s\n'
                 '密码：%s\n'
                 '（！！这里是唯一记录密码的机会！！）') % (admin_login, rand_pass)})

        except Exception as e:
            self.finish({'status': 'fail', 'msg': '创建失败' + str(e)})

        finally:
            session.close()

    @tornado.gen.coroutine
    def post_copy_product(self):
        up_domain_id = self.json_args.get('up_domain_id')
        domain_id = self.json_args.get('domain_id')
        product_list = self.json_args.get('product_list')

        session = self.session('repo')
        product_set = set()

        try:
            q = session.query(RepoProduct.product_id).filter(RepoProduct.domain_id == domain_id)
            for (product_id,) in q.all():
                product_set.add(product_id)

            # found route
            supply = session.query(RepoRouteSupply).filter(RepoRouteSupply.domain_id == domain_id).first()
            if supply is None:
                raise RuntimeError('找不到货源定义')

            for product_id in product_list:
                if product_id in product_set:
                    continue

                product = session.query(RepoProduct).filter(RepoProduct.domain_id == up_domain_id).filter(
                        RepoProduct.product_id == product_id).one()

                price = RepoInterfacePrice()
                price.domain_id = domain_id
                price.interface_id = 'quxun'
                price.product_id = product.product_id
                price.value = product.price * 10000
                price.create_time = dt.now()
                session.add(price)

                to_product = RepoProduct()
                to_product.domain_id = domain_id
                to_product.product_id = product.product_id
                to_product.name = product.name
                to_product.type = product.type
                to_product.carrier = product.carrier
                to_product.price = product.price
                to_product.value = product.price * 10000
                to_product.area = product.area
                to_product.use_area = product.use_area
                to_product.p1 = product.price * 10000
                to_product.p2 = product.price * 10000
                to_product.p3 = product.price * 10000
                to_product.p4 = product.price * 10000
                to_product.p5 = product.price * 10000
                to_product.scope = product.scope
                to_product.legacy_id = product.legacy_id
                to_product.routing = supply.id
                to_product.notes = product.notes
                to_product.status = product.status
                to_product.update_time = dt.now()

                session.add(to_product)
                session.commit()

            self.finish({'status': 'ok', 'msg': '创建成功'})

        except Exception as e:
            self.finish({'status': 'fail', 'msg': '创建失败' + str(e)})

        finally:
            session.close()
