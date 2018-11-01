def escape_role(key):
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
            '5002': '费用不足',
            '5003': '无效的产品', }.get(key) or key


def escape_finance_type(key):
    return {'debit': '扣款',
            'debit-manual': '人工扣款',
            'refund': '自动退款',
            'refund-manual': '人工退款',
            'deposit': '加款'}.get(key) or key


def escape_carrier(key):
    return {'1': '移动',
            '2': '联通',
            '3': '电信'}.get(key, key)


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
