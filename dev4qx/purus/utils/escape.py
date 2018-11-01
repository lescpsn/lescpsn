﻿def escape_role(key):
    return {
        'data_sellers': '流量代理',
        'fee_sellers': '话费代理',
        'admin': '管理员',
    }.get(key)


def escape_status(key):
    return {
        'create': '充值中',
        'called': '充值中',
        'finish': '充值成功',
        'fail': '充值失败',
    }.get(key)


def escape_data_result(key):
    return {'1': '成功',
            '9': '失败',
            '00000': '成功',
            '10003': '失败(非法参数)',
            '10005': '失败(签名验证失败)',
            '10006': '失败(非法合作方)',
            '10007': '失败(非法销售品)',
            '10010': '失败(号码欠费)',
            '10019': '失败(套餐互斥)',
            '10033': '失败(用户有在途工单，无法受理)',
            '10058': '失败(客户业务受限)',
            '90001': '失败(电信系统繁忙/90001)',
            '90003': '失败(异常报俊/90003)',
            '90004': '失败(集团CRM异步通知的订购结果为订购失败)',
            '90005': '失败(号码不存在)',
            '99999': '失败(未知异常)',
            '20003': '失败(账户余额不足)',
            '60002': '失败(账户余额不足)'
            }.get(key) or '失败(%s)' % key


def escape_fee_result(key):
    return {'0': '充值中',
            '1': '充值成功',
            '9': '充值失败(已退款)',
            '9001': '运营商维护',
            '5002': '费用不足',
            '5003': '无效的产品', }.get(key) or key


def escape_sinopec_result(key):
    return {'0': '充值中',
            '1': '充值成功',
            '9': '充值失败(已退款)',
            '-1': '卡单(需手工处理)',
            '5001': '代理商不存在',
            '5002': '代理商余额不足',
            '5003': '此商品暂时不可购买',
            '5004': '充值号码与所选商品不符',
            '5005': '充值请求验证错误',
            '5006': '代理商订单号重复',
            '5007': '所查询的订单不存在',
            '5008': '交易亏损不能充值',
            '5009': 'IP不符',
            '5010': '商品编号与充值金额不符',
            '5011': '商品数量不支持',
            '5012': '缺少必要参数或参数值不合法',
            '9999': '未知错误,需进入平台查询核实'
            }.get(key) or key


def escape_finance_type(key):
    return {'debit': '扣款',
            'debit-manual': '人工扣款',
            'refund': '自动退款',
            'refund-manual': '人工退款',
            'deposit': '加款'}.get(key) or key


def escape_carrier(key):
    return {'1': '移动',
            '2': '联通',
            '3': '电信',
            'sinopec': '中石化',
            }.get(key, key)


def escape_area(key):
    return {'BJ': '北京',
            'TJ': '天津',
            'HE': '河北',
            'SX': '山西',
            'NM': '内蒙古',
            'LN': '辽宁',
            'JL': '吉林',
            'HL': '黑龙江',
            'SH': '上海',
            'JS': '江苏',
            'ZJ': '浙江',
            'AH': '安徽',
            'FJ': '福建',
            'JX': '江西',
            'SD': '山东',
            'HA': '河南',
            'HB': '湖北',
            'HN': '湖南',
            'GD': '广东',
            'GX': '广西',
            'HI': '海南',
            'CQ': '重庆',
            'SC': '四川',
            'GZ': '贵州',
            'YN': '云南',
            'XZ': '西藏',
            'SN': '陕西',
            'GS': '甘肃',
            'QH': '青海',
            'NX': '宁夏',
            'XJ': '新疆',
            'TW': '台湾',
            'HK': '香港',
            'CN': '全国'}.get(key) or key


def escape_upstream(key):
    return {'machado': '趣讯卡充系统',
            'legend': '越亮传奇',
            'xicheng': '西城',
            '21cn-leliu': '21世纪-(乐流)',
            'cmcc-ha': '河南移动',
            'cmcc': '广东移动-分省(趣讯)',
            'cmcc-states': '广东移动-全国',
            'mopote': '成都微品',
            'cmcc-sn': '陕西移动-全国(逸弘)',
            'hacmcc': '河南移动-分省(能力平台)',
            'wo': '联通',
            'aspire': '北京卓望',
            'niukou': '纽扣',
            'aspire_ec': '江苏移动-分省(蝶信)',
            'migu': '动漫基地',
            'telecom_js': '镇江电信',
            'dahanfc': '大汉三通',
            'cmcc-snbj': '陕西移动(宝鸡)-分省',
            'cmcc-gd-jinyue': '广东移动-分省(今月)',
            'xiaowo': '上海小沃'
            }.get(key) or key