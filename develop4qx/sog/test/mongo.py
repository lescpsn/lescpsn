#!/usr/bin/env python3

import pymongo
def main():
    print("***** this is mongodb test *****")
    url="mongodb://sog3:abc123@127.0.0.1:27017/sog"
    conn = pymongo.MongoClient(url)
    db=conn.sog
    coll=db.server.find()
    for t in coll:
        print(t)

if __name__ == "__main__":
    main()
