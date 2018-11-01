import logging
import pinyin
import random
import re
import string
import time
import tornado.gen
from datetime import datetime as dt
from tornado import gen
from tornado.httpclient import AsyncHTTPClient, HTTPRequest

from db.fuelcard import FuelAccount
from db.repo import RepoService, RepoOperator, RepoUser, RepoProduct, RepoSpecial, RepoSyncLog, RepoDomain, \
    RepoRouteSupply, RepoRouteInterface, RepoInterfacePrice
from utils import signature

MAX_NAME = 50

request_log = logging.getLogger('purus.request')

login_re = re.compile('^[0-9a-zA-Z]{4,12}$')


def get_initial(str):
    py = pinyin.get_initial(str).lower()
    for c in '(),- /':
        py = py.replace(c, '')
    return py


def gen_key(size, chars=None):
    if chars is None:
        chars = string.ascii_lowercase + string.ascii_uppercase + string.digits

    return ''.join(random.choice(chars) for _ in range(size))


def clen(text):
    if text is None:
        return 4

    if type(text) is int:
        return len(str(text))

    if type(text) is bool:
        return len(str(text))

    l = 0
    for c in text:
        if ord(c) < 128:
            l += 1
        else:
            l += 2
    return l


"""
Publishing
"""


def publish_purus(user_list, operator_list, domain_list, service_list, curr_service, interface_list):
    down_set = set()

    ##### DOWNSTREAM #####
    text = 'downstream:\n'

    name_padding = 10
    for d in user_list:
        l = clen(d.name)
        name_padding = max(l, name_padding)

    for d in user_list:
        if d.services is None or curr_service.service_id not in d.services:
            continue

        if d.status == 'disabled':
            request_log.info('SKIP DISABLED USER %s', d.name)
            continue

        down_set.add(d.user_id)

        if d.type in ['data-seller', 'data-agent']:
            # found sharding
            data_service = next(filter(lambda s: s.roles == 'data' and s.service_id in d.services, service_list), None)

            text += "  '%s': { name: '%s', %s shard_id: '%s', master: '%s', domain_id: '%s', shard: '%s', pass: '%s', iv: '%s', tags: '%s', type: '%s' }\n" % (
                d.user_id,
                d.name,
                ' ' * (name_padding - clen(d.name)),
                d.shard_id or d.master_id,
                d.master_id,
                d.domain_id,
                data_service and data_service.sharding or '',
                d.password,
                d.iv,
                d.tags,
                d.type)

        elif d.type in ['sinopec-supplier', 'sinopec-seller', 'full-seller']:
            # found sharding
            data_service = next(filter(lambda s: s.roles == 'data' and s.service_id in d.services, service_list), None)

            text += "  '%s': { name: '%s', %s shard_id: '%s', master: '%s', domain_id: '%s', shard: '%s', pass: '%s', iv: '%s', key: '%s', tags: '%s', type: '%s' }\n" % (
                d.user_id,
                d.name,
                ' ' * (name_padding - clen(d.name)),
                d.shard_id or d.master_id,
                d.master_id,
                d.domain_id,
                data_service and data_service.sharding or '',
                d.password,
                d.iv,
                d.secret,
                d.tags,
                d.type)

        elif d.type == 'fee-agent':
            # fee-agent: hide key
            fee_service = next(filter(lambda s: s.roles == 'fee' and s.service_id in d.services, service_list), None)

            text += "  '%s': { name: '%s', %s shard_id: '%s', master: '%s', domain_id: '%s', shard: '%s', tags: '%s', type: '%s' }\n" % (
                d.user_id,
                d.name,
                ' ' * (name_padding - clen(d.name)),
                d.shard_id or d.master_id,
                d.master_id,
                d.domain_id,
                fee_service and fee_service.sharding or '',
                d.tags,
                d.type)

    ##### USER #####
    text += '\nuser:\n'

    login_padding = 1
    name_padding = 10
    for u in operator_list:
        name_padding = max(clen(u.name), name_padding)
        login_padding = max(len(u.login), login_padding)

    for u in operator_list:
        if u.user_id not in down_set:
            continue

        if u.status == 'disabled':
            request_log.info('SKIP DISABLED OPERATOR %s,%s', u.login, u.name)
            continue

        text += " '%s'%s: { login: '%s',%s user_id: '%s', role: '%s',%s name: '%s',%s password: '%s'}\n" % (
            u.id,
            ' ' * (4 - len(str(u.id))),
            u.login,
            ' ' * (login_padding - len(u.login)),
            u.user_id,
            u.role,
            ' ' * (14 - len(u.role)),
            u.name,
            ' ' * (name_padding - clen(u.name)),
            u.password)

    ##### DOMAIN #####
    text += '\ndomain:\n'
    for d in domain_list:
        text += " '%s': { host: '%s', title: '%s', up_domain: '%s', up_user: '%s'}\n" % (
            d.domain_id,
            d.hosts,
            d.title,
            d.up_domain or '',
            d.up_user or '')

    ##### CURRENT INTERFACE #####
    text += '\ninterface:\n'
    for i in interface_list:
        text += "  '%s'%s: '%s'\n" % (i.interface_id, ' ' * (15 - len(i.interface_id)), i.name)

    return text


def publish_truman(user_list, operator_list, service):
    down_set = set()

    ##### USER #####
    text = 'user:\n'

    name_padding = 10
    for d in user_list:
        l = clen(d.name)
        name_padding = max(l, name_padding)

    for d in user_list:
        if d.services is None or service.service_id not in d.services:
            continue

        if d.status == 'disabled':
            request_log.info('SKIP DISABLED USER %s', d.name)
            continue

        down_set.add(d.user_id)

        text += ("  '%s': { name: '%s', "
                 "%s domain_id: '%s', shard_id: '%s', "
                 "SINOPEC_up_pool_list: '%s', SINOPEC_get_pool_set: '%s', "
                 "CMCC_FEE_up_pool_list: '%s', CMCC_FEE_get_pool_set: '%s', "
                 "aes_pass: '%s', aes_iv: '%s', type: '%s' }\n") % (
                    d.user_id,
                    d.name,
                    ' ' * (name_padding - clen(d.name)),
                    d.domain_id,
                    d.shard_id or d.master_id,
                    d.user_id, d.user_id, d.user_id, d.user_id,
                    d.password,
                    d.iv,
                    d.type)

    ##### OPERATOR #####
    text += '\noperator:\n'

    login_padding = 1
    name_padding = 10
    for u in operator_list:
        name_padding = max(clen(u.name), name_padding)
        login_padding = max(len(u.login), login_padding)

    for u in operator_list:
        if u.user_id not in down_set:
            continue

        if u.status == 'disabled':
            request_log.info('SKIP DISABLED OPERATOR %s,%s', u.login, u.name)
            continue

        text += " '%s'%s: { login: '%s',%s user_id: '%s', role: '%s',%s name: '%s',%s password: '%s'}\n" % (
            u.id,
            ' ' * (4 - len(str(u.id))),
            u.login,
            ' ' * (login_padding - len(u.login)),
            u.user_id,
            u.role,
            ' ' * (14 - len(u.role)),
            u.name,
            ' ' * (name_padding - clen(u.name)),
            u.password)

    return text


def publish_forrestal(user_list, service, account_list):
    user_set = set()
    ##### USER #####
    text = 'up_user:\n'

    name_padding = 10
    for d in user_list:
        l = clen(d.name)
        name_padding = max(l, name_padding)

    for d in user_list:
        if d.services is None or service.service_id not in d.services:
            continue
        else:
            user_set.add(d.user_id)

        if d.status == 'disabled':
            request_log.info('SKIP DISABLED USER %s', d.name)
            continue

        text += "  '%s': { name: '%s', %s aes_pass: '%s', aes_iv: '%s' }\n" % (
            d.user_id,
            d.name,
            ' ' * (name_padding - clen(d.name)),
            d.password,
            d.iv)

    text += 'fuel_account:\n'
    for acct in account_list:
        if acct.user_id not in user_set:
            continue
        text += "  '%s': { account: '%s', password: '%s' }\n" % (
            acct.user_id,
            acct.account,
            acct.password
        )

    return text


def publish_madeira(user_list, curr_service, domain_list):
    down_domain_set = set()
    domain_text = ''

    for curr_domain in domain_list:
        up_domain = next(filter(lambda x: x.domain_id == curr_domain.up_domain, domain_list), None)
        if up_domain is None:
            request_log.warn('CANNOT FOUND UP_DOMAIN %s', curr_domain.up_domain)
            continue

        up_user = next(filter(lambda u: u.user_id == curr_domain.up_user, user_list), None)
        if up_user is None:
            request_log.warn('CANNOT FOUND UP_USER %s', curr_domain.up_user)
            continue

        down_domain_set.add(curr_domain.domain_id)

        domain_text += "  '%s': { up_user: '%s', up_domain: '%s', up_host: '%s', up_aes_key: '%s', up_aes_iv: '%s'}\n" % (
            curr_domain.domain_id,
            curr_domain.up_user,
            curr_domain.up_domain,
            up_domain.hosts,
            up_user.password,
            up_user.iv)

    text = 'downstream:\n'

    name_padding = 10
    for d in user_list:
        l = clen(d.name)
        name_padding = max(l, name_padding)

    for d in user_list:
        if d.services is None or curr_service.service_id not in d.services:
            continue

        if d.status == 'disabled':
            continue

        domain_append = ''
        if d.domain_id in down_domain_set:
            domain_append = ", domain_id: '%s'" % d.domain_id

        content_append = ''
        if d.details and 'content=true' in d.details:
            content_append = ", content: true"

        text += ("  '%s': {"
                 " name: '%s', %s shard: '%s', master: '%s', pass: '%s', iv: '%s', key: '%s', back_url: '%s'%s%s}\n") % (
                    d.user_id,
                    d.name,
                    ' ' * (name_padding - clen(d.name)),
                    d.shard_id or d.master_id,
                    d.master_id,
                    d.password or '',
                    d.iv or '',
                    d.secret or '',
                    d.back_url or '',
                    content_append,
                    domain_append,)

    if domain_text:
        text += 'domain:\n' + domain_text

    return text


def get_pricing_line(this_product_list, user, user_special_list, supply_map, interface_list):
    # PRODUCT TO SPECIAL
    price_line = []
    product_area_set = set()
    product_to_special = dict()
    for product in this_product_list:
        product_area_set.add(product.area)

        special = next(filter(lambda s: s.product_id == product.product_id, user_special_list), None)
        product_to_special[product.product_id] = {}

        if special and special.status:
            product_to_special[product.product_id]['status'] = special.status == 'enabled'
        else:
            product_to_special[product.product_id]['status'] = product.status == 'enabled'

        if special and special.supply:
            product_to_special[product.product_id]['supply'] = special.supply
        else:
            product_to_special[product.product_id]['supply'] = product.routing

        if special and special.value:
            product_to_special[product.product_id]['value'] = special.value
        else:
            product_to_special[product.product_id]['value'] = None

    # AFTER
    request_log.debug('PRODUCT AREA FULL %s', product_area_set)

    price_limit = {}
    ### PRICE ###
    for product in this_product_list:
        if product.type == 'data' and product.area == 'CN':
            area = ''
        else:
            area = ':' + product.area

        if product.scope == '0':
            scope = ''
        else:
            scope = ':' + product.scope

        if product_to_special[product.product_id]['value']:
            # price by special
            price = product_to_special[product.product_id]['value']
        else:
            # price by level
            level = user.level

            if level == '1':
                price = product.p1
            elif level == '2':
                price = product.p2
            elif level == '3':
                price = product.p3
            elif level == '4':
                price = product.p4
            elif level == '5':
                price = product.p5
            else:
                raise ValueError('INVALID LEVEL %s (%s,%s)' % (level, product, user))

        key = 'price:{user_id}:{type}:{carrier}{area}{scope}:{price}'.format(
            user_id=user.user_id,
            type=product.type,
            carrier=product.carrier,
            area=area,
            scope=scope,
            price=product.price)

        if product_to_special[product.product_id]['status']:

            if product.type == 'data':
                value = '{value},{prefix}{code}'.format(
                    value=price,
                    prefix=user.prefix,
                    code=product.legacy_id[2:])
            elif product.type in ['fee', 'sinopec']:
                value = '{value}'.format(
                    value=price)

            product_to_special[product.product_id]['value'] = int(price)

            padding = ' ' * (70 - len(key) - len(value))
            price_line.append('set %s%s%s' % (key, padding, value))

            price_limit[product.area] = int(price)
        else:
            price_line.append('del %s' % key)

    ### ROUTE ###
    route_line = []
    # route:{user_id}:{product}:{carrier}:{area}:{price}
    # SUPPLY
    backup_map = {}
    apply_inf_list = []
    for product in this_product_list:
        if not product_to_special[product.product_id]['status']:
            continue

        supply_id = product_to_special[product.product_id]['supply']

        supply = supply_map.get(supply_id)
        interfaces = supply.interfaces.split(',')
        if supply.backup and supply.restriction:
            for bk in supply.backup.split(','):
                inf1, inf2 = bk.split('=>')
                backup_map[inf1] = {'id': inf2, 'time': supply.restriction}

        for i in interface_list:
            if i['id'] not in interfaces:
                continue
            if i['legacy'] != product.legacy_id:
                continue

            if product.area != 'CN' and i['area'] != 'CN' and product.area != i['area']:
                continue

            apply_inf_list.append(i)
            request_log.debug('APPLY INF %s', i)

    # sort by score & reduce
    apply_inf_list = sorted(apply_inf_list, key=lambda x: x['score'])

    reduce_inf_list = []
    for p in apply_inf_list:
        if p['area'] in product_area_set:
            reduce_inf_list.append(p)
            product_area_set.remove(p['area'])
        if p['area'] == 'CN':
            break

    request_log.debug('PRODUCT AREA REMAIN %s', product_area_set)
    request_log.debug('INF LIST FINAL %s', reduce_inf_list)

    for inf in reduce_inf_list:
        area = inf['area']

        # limit check
        li2 = int(inf['value'])
        if area != 'CN':
            li1 = price_limit.get(area) or price_limit.get('CN')

            if li2 > li1:
                request_log.critical('LOW PRICE FOUND %s %s %s (%s/%s)', area, li2, li1, user, this_product_list)
                product_area_set.add(area)
                continue

            if area in price_limit:
                del price_limit[area]
        else:
            for _area in price_limit:
                li1 = price_limit.get(_area)
                if li2 > li1:
                    request_log.critical('LOW PRICE FOUND %s %s %s %s (%s/%s)', area, li2, _area, li1, user,
                                         this_product_list)
                    product_area_set.add(area)
                    continue

        key = 'route:{user_id}:{type}:{carrier}:{area}:{scope}:{price}'.format(
            user_id=user.user_id,
            type=product.type,
            carrier=product.carrier,
            area=area,
            scope=product.scope,
            price=product.price)

        value = '{route},{value}'.format(
            route=inf['id'],
            value=inf['value'],
        )

        # TODO: get inf2 value
        if inf['id'] in backup_map:
            inf2 = backup_map[inf['id']]
            value += ';{route},{value}@time<{time}'.format(
                route=inf2['id'], value=inf['value'], time=inf2['time']
            )

        padding = ' ' * (60 - len(key) - len(inf['id']))
        route_line.append('set %s%s%s' % (key, padding, value))

    for area in product_area_set:
        key = 'route:{user_id}:{type}:{carrier}:{area}:{scope}:{price}'.format(
            user_id=user.user_id,
            type=product.type,
            carrier=product.carrier,
            area=area,
            scope=product.scope,
            price=product.price,
        )

        route_line.append('del %s' % key)

    ### PRODUCT ###
    product_line = []
    for product in this_product_list:
        if product.scope == '0':
            scope = ''
        else:
            scope = ':' + product.scope

        # route:{user_id}:{product}:{carrier}:{area}:{price}
        key = 'product:{user_id}:{type}:{carrier}:{area}:{price}{scope}'.format(
            user_id=user.user_id,
            type=product.type,
            carrier=product.carrier,
            area=product.area,
            scope=scope,
            price=product.price,
        )

        if product_to_special[product.product_id]['status']:
            value = product_to_special[product.product_id]['value']
            all_values = [
                'offer', '%s%s' % (user.prefix, product.legacy_id[2:]),
                'carrier', '%2s' % product.carrier,
                'value', '%5s' % product.price,
                'discount', '%d' % (value / int(product.price)),
                'name', product.name,
            ]

            if product.scope != '0':
                all_values += ['scope', product.scope]

            padding = ' ' * (60 - len(key))
            product_line.append('hmset %s%s%s' % (key, padding, ' '.join(all_values)))
        else:
            product_line.append('del   %s' % key)

    return price_line, route_line, product_line


"""
Syncing
"""


@tornado.gen.coroutine
def sync_user(session, domain_id):
    # service could contains multi-domains.
    service_list = session.query(RepoService).all()
    # filter by domain_id
    service_list = [x for x in service_list if domain_id in x.domains]

    # loading all data, filter in services
    user_list = session.query(RepoUser).order_by(RepoUser.user_id).all()
    operator_list = session.query(RepoOperator).order_by(RepoOperator.user_id).all()
    domain_list = session.query(RepoDomain).order_by(RepoDomain.id).all()

    interface_list = session.query(RepoRouteInterface).filter(RepoRouteInterface.domain_id == domain_id).order_by(
        RepoRouteInterface.id).all()

    for service in service_list:
        request_log.info('SYNC USER => %s' % service)

        if service.sync_key is None or service.sync_user is None:
            request_log.info('SKIP %s' % service.service_id)
            continue

        url = service.sync_user
        secret = service.sync_key

        if service.type == 'purus':
            body = publish_purus(user_list, operator_list, domain_list, service_list, service, interface_list)
        elif service.type == 'madeira':
            body = publish_madeira(user_list, service, domain_list)
        elif service.type == 'truman':
            body = publish_truman(user_list, operator_list, service)
        elif service.type == 'forrestal':
            fuel_list = session.query(FuelAccount).filter(FuelAccount.status == 'valid').filter(
                FuelAccount.is_default != None).order_by(FuelAccount.user_id).all()
            body = publish_forrestal(user_list, service, fuel_list)
        else:
            request_log.error('UNKNOWN TYPE %s' % service.type)
            continue

        tsp = str(int(time.mktime(time.localtime())))
        v = signature(tsp + secret)

        http_client = AsyncHTTPClient()

        try:
            request_log.debug('BODY=\n%s', body)

            response = yield http_client.fetch(
                HTTPRequest(url=url, method='POST', body=body, validate_cert=False, headers={'tsp': tsp, 'v': v}))

            request_log.info('SYNC RESULT %d', response.code)

            log = RepoSyncLog()
            log.service_id = service.service_id
            log.result = response.code
            log.type = 'user'
            log.create_time = dt.now()

            session.add(log)
            session.commit()

        except Exception as e:
            request_log.exception("FAIL")


@tornado.gen.coroutine
def sync_pricing(session, domain_id, filter_user=None, filter_product=None):
    request_log.info('SYNC PRICING [user=%s,prod=%s]', filter_user, filter_product)

    price_lines = []
    route_lines = []
    product_lines = []
    product_madeira_lines = []

    service_list = session.query(RepoService).all()
    service_list = [x for x in service_list if domain_id in x.domains]

    # product
    q_product = session.query(RepoProduct).filter(RepoProduct.domain_id == domain_id)

    if filter_product:
        legacy_id = session.query(RepoProduct.legacy_id).filter(RepoProduct.domain_id == domain_id).filter(
            RepoProduct.product_id == filter_product).one()

        if legacy_id:
            legacy_id = legacy_id[0]
            q_product = q_product.filter(RepoProduct.legacy_id == legacy_id)

    product_list = list(
        q_product.order_by(RepoProduct.carrier, RepoProduct.area, RepoProduct.scope, RepoProduct.value).all())

    legacy_list = []
    for product in product_list:
        if product.legacy_id not in legacy_list:
            legacy_list.append(product.legacy_id)

    request_log.info('LOAD PRODUCT %d(%d)', len(product_list), len(legacy_list))

    # user
    q_user = session.query(RepoUser).filter(RepoUser.domain_id == domain_id)
    if filter_user:
        q_user = q_user.filter(RepoUser.user_id == filter_user)
    user_list = q_user.order_by(RepoUser.user_id).all()

    request_log.info('LOAD USER %d', len(user_list))

    # special
    q_special = session.query(RepoSpecial)

    if filter_user:
        q_special = q_special.filter(RepoSpecial.user_id == filter_user)

    special_list = q_special.order_by(RepoSpecial.id).all()

    # supply
    supply_map = {}
    for supply in session.query(RepoRouteSupply).filter(RepoRouteSupply.domain_id == domain_id).all():
        supply_map[str(supply.id)] = supply

    # interface
    interface_list = []
    for inf, prz, prod in session.query(RepoRouteInterface, RepoInterfacePrice, RepoProduct).filter(
                    RepoRouteInterface.interface_id == RepoInterfacePrice.interface_id).filter(
                RepoInterfacePrice.product_id == RepoProduct.product_id).all():
        interface_list.append({
            'id': inf.interface_id,
            'product': prz.product_id,
            'value': prz.value,
            'score': prz.score,
            'legacy': prod.legacy_id,
            'area': prod.area})

    for user in user_list:
        for legacy_id in legacy_list:
            user_special_list = list(filter(lambda s: s.user_id == user.user_id, special_list))

            this_product_list = list(filter(lambda p: p.legacy_id == legacy_id, product_list))

            price_line, route_line, product_line = get_pricing_line(
                this_product_list,
                user,
                user_special_list,
                supply_map,
                interface_list)

            product_lines += product_line
            price_lines += price_line
            route_lines += route_line

            if user.details and 'product=true' in user.details:
                product_madeira_lines += product_line

        yield gen.moment

    for service in service_list:
        request_log.info('SYNC PRICING => %s' % service)

        if service.sync_key is None or service.sync_product is None:
            request_log.info('SKIP %s' % service)
            continue

        if service.type == 'purus':
            body = '\n'.join(product_lines)
            request_log.info('\n' + body)
        elif service.type == 'madeira':
            body = '\n'.join(price_lines + route_lines + product_madeira_lines)
            request_log.info('\n' + body)
        else:
            request_log.warn('UNKNOWN TYPE %s', service.type)
            continue

        url = service.sync_product
        secret = service.sync_key

        request_log.info('SYNC VIA %s' % url)

        tsp = str(int(time.mktime(time.localtime())))
        v = signature(tsp + secret)

        http_client = AsyncHTTPClient()
        try:
            response = yield http_client.fetch(
                HTTPRequest(url=url, method='POST', body=body, headers={'tsp': tsp, 'v': v}, request_timeout=120))

            request_log.info('SYNC RESULT %d', response.code)

            log = RepoSyncLog()
            log.service_id = service.service_id
            log.type = 'pricing'
            log.result = response.code
            log.create_time = dt.now()

            session.add(log)
            session.commit()

        except Exception as e:
            request_log.exception("FAIL")


__author__ = 'Kevin'
