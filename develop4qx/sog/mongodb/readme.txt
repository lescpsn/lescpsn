1、用不带认证方式首次启动mongodb，然后创建访问sog库的访问用户（密码中最好别出现@字符，因为python的mongodb的api中url有@分割字符）
/home/carhj/local/mongodb/bin/mongod --dbpath=/home/carhj/local/mongodb/data --logpath=/home/carhj/local/mongodb/logs --logappend  --port=27017 --fork

>use sog
>db.createUser({ user: "sog", pwd: "abc123", roles: [ { role: "read", db: "sog" } ]});

>use admin
>db.createUser({ user: "sog", pwd: "sog!@#", roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]})
>db.grantRolesToUser( "sog" , [ { role: "dbOwner", db: "sog" } ]) ;
采用db.auth("sog", "abc123")认证查看下
********************************************************************************

2、删除sog整个数据库
/home/carhj/local/mongodb/bin/mongo
use sog;
db.dropDatabase();
********************************************************************************

3、删除sog数据库中的某个特定的表
/home/carhj/local/mongodb/bin/mongo
use sog;
db.user.drop();
db.server.drop();
********************************************************************************

4、导入数据(user.json暂且不需要，可以不用导入)
(1)导入网关用户集合(按照user.json预定的格式，事先编辑好网关用户数据库文件)
/home/carhj/local/mongodb/bin/mongoimport -d sog -c user --type json \
--file /home/carhj/sog/mongodb/user.json

(2)导入资产服务器集合(按照server.json预定的格式，事先编辑好资产服务器文件)
/home/carhj/local/mongodb/bin/mongoimport -d sog -c server --type json \
--file /home/carhj/sog/mongodb/server.json
********************************************************************************

5、杀掉进程重新以带认证方式启动，编辑好mongodb.conf文件
killall mongod
/home/carhj/local/mongodb/bin/mongod -f /home/carhj/local/mongodb/mongodb.conf启动mongodb


6、常用命令
   [不带认证启动mongodb数据库]
    /home/carhj/local/mongodb/bin/mongod --dbpath=/home/carhj/local/mongodb/data --logpath=/home/carhj/local/mongodb/logs --logappend  --port=27017 --fork

   [命令行连接mongodb数据库]
    /home/carhj/local/mongodb/bin/mongo

   [mongodb数据库认证]
   db.auth("sog3", "abc123")

   [选择某个集合（即某个表）]
   use sog;

   [删除某个表]
   db.server.drop();

   [查看当前库的所有集合（即所有表）]
   show collections

   [查看某个集合（server集合）的所有内容]
   db.server.find()
