# -*- coding: utf8 -*-
import pinyin
import time
import yaml

from repo import ConfigRepo

REPO_DIR = 'config_repo'


def add_login_to_name():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    user = repo.user

    for d in repo.downstream:
        login = next((u['login'] for u in user if u['user_id'] == d['id']), None)
        print(login)

        if login and login not in d['name']:
            d['name'] = d['name'] + ' ' + login

    repo.save('downstream')


def add_tags():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in repo.downstream:
        name = d['name']

        py = pinyin.get_initial(name).lower()
        for c in '(),- /':
            py = py.replace(c, '')

        print(name, py)

        d['tags'] = py

    repo.save('downstream')
    repo.publish()


def add_plevel():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in repo.downstream:
        d['plevel'] = 1

    repo.save('downstream')
    repo.publish()


def add_prefix():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in repo.downstream:
        d['prefix'] = 'TB'

    repo.save('downstream')
    repo.publish()


def add_level2():
    tsp = int(time.mktime(time.localtime()))

    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in repo.downstream:
        plevel = d.get('plevel', 1)
        if plevel == 'None':
            plevel = '1'

        d['tsp'] = tsp
        d['status'] = 'enable'
        d['mobile'] = ''
        d['qq'] = ''
        d['cooperation'] = ''
        d['notes'] = ''
        d['plevel'] = int(plevel)

    repo.save('downstream')
    repo.publish()


def regulate_user():
    tsp = int(time.mktime(time.localtime()))
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in repo.downstream:
        print(d)

        # plevel
        if 'plevel' not in d or d['plevel'] == 'None':
            d['plevel'] = 1
        elif type(d['plevel']) == str:
            d['plevel'] = int(d['plevel'])

        # prefix
        if 'prefix' not in d or d['prefix'] == 'None':
            d['prefix'] = 'TB'

        if 'status' not in d:
            d['status'] = 'enabled'

        # tsp
        if 'tsp' not in d or d['tsp'] == 'None':
            d['tsp'] = tsp
        elif type(d['tsp']) == str:
            d['tsp'] = int(d['tsp'])

        if 'cooperation' not in d:
            d['cooperation'] = ''

        if 'qq' not in d:
            d['qq'] = ''

        if 'mobile' not in d:
            d['mobile'] = ''

        if 'notes' not in d:
            d['notes'] = ''

    repo.save('downstream')
    repo.publish()


def regulate_product():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    product = repo.get_product()
    for p in product:
        p['price'] = int(p['price'])
        p['value'] = int(p['value'])

        p['p1'] = int(p['p1'])
        p['p2'] = int(p['p2'])
        p['p3'] = int(p['p3'])
        p['p4'] = int(p['p4'])
        p['p5'] = int(p['p5'])

    repo.save('product')


def set_plevel():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in repo.downstream:
        if d['master_id'] == '300001':
            d['plevel'] = 1
        elif d['master_id'] == '300002':
            d['plevel'] = 2
        elif d['master_id'] == '300003':
            d['plevel'] = 3
        elif d['master_id'] == '300004':
            d['plevel'] = 4
        elif d['master_id'] == '300005':
            d['plevel'] = 5

    repo.save('downstream')


def reset_master():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in repo.downstream:
        d['master_id'] = d['id']

    repo.save('downstream')


def x_password():
    password = yaml.load(open('password.yaml', 'r'))
    print(password)

    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    user = repo.user

    for uid in user:

        if uid['password'] != 'f17637e565e1af9e1d7ad5030060f7f1dd88bc32':
            continue

        if uid['id'] in password:
            print(password[uid['id']])
        else:
            print(uid)

    d = repo.get_downstream(uid['user_id'])
    print(d)

def add_status():
    cfg = {'path': REPO_DIR}
    repo = ConfigRepo(cfg)

    for d in repo.downstream:
        if d['status'] == '':
            d['status'] = 'enabled'

    repo.save('downstream')

if __name__ == '__main__':
    # add_level2()
    # add_login_to_name()
    # regulate_product()
    # regulate_user()
    # set_plevel()
    # reset_master()
    x_password()
