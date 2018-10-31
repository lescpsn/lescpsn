from db.model import Order, UpOrder, Transaction, Account, Book

order_map = {}
up_order_map = {}
trans_map = {}
account_map = {}
book_map = {}


def get_order_shard(user_id):
    if user_id not in order_map:
        order_map[user_id] = type('Order_' + user_id, (Order,),
                                  {'__tablename__': 'order_' + user_id})
    return order_map[user_id]


def get_up_order_shard(user_id):
    if user_id not in up_order_map:
        up_order_map[user_id] = type('UpOrder_' + user_id, (UpOrder,),
                                     {'__tablename__': 'up_order_' + user_id})
    return up_order_map[user_id]


def get_trans_shard(user_id):
    if user_id not in trans_map:
        trans_map[user_id] = type('Transaction_' + user_id, (Transaction,),
                                  {'__tablename__': 'transaction_' + user_id})
    return trans_map[user_id]


def get_account_shard(user_id=None):
    if user_id is None:
        if '_' not in account_map:
            account_map['_'] = type('Account', (Account,), {'__tablename__': 'account'})
        return account_map['_']

    if user_id not in account_map:
        account_map[user_id] = type('Account_' + user_id, (Account,),
                                    {'__tablename__': 'account_' + user_id})
    return account_map[user_id]


def get_book_shard(user_id):
    if user_id not in book_map:
        book_map[user_id] = type('Book_' + user_id, (Book,),
                                 {'__tablename__': 'book_' + user_id})
    return book_map[user_id]
