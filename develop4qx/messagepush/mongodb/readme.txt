mongodb中导入user_subscribe集合,其他json无须导入
/path/mongoimport -d 数据库名 -c 集合名 --type json --file 集合的json文件.json
.eg.  /home/carhj/local/mongodb/bin/mongoimport -d messagepush -c user_subscribe --type json --file user_subscribe.json
