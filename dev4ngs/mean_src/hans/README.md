# 图说的搜索引擎微服务

## 此微服务主要功能有： 用户搜索、粉丝搜索、关注搜索

## 使用方式:

 本微服务通过接收事件通知,执行相应操作,比如数据的写入。当用户注册时、关注时、被关注时、取消关注时 将数据发给当前的微服务进行处理。

 当用户注册时,以tuso_user为索引,以图说id为索引的id进行文档读写;

 当用户关注某一个用户时,需要发送两个广播,一个是通知对方查看(账户动态),另一个是 将关注的用户写入以用户tushuoid为索引的文档中,同时也向被关注的用户文档中插入该条记录

 当用户取消对某个人对关注时,同时要删除这两个人相关对记录。

 针对每一个用户只维护自己数据,不会进行关联查询。也就是说每个用户的信息发生改变时,也要通知搜索引擎更新它的索引,粉丝的数量会比较大,


# 接口url如下：

`[GIN-debug] GET    /v1/search/user/:Keywords --> git.ngs.tech/mean/hans/route.SearchDataForUsersHandler.func1 (9 handlers)`

`[GIN-debug] GET    /v1/search/followee/:Keywords --> git.ngs.tech/mean/hans/route.SearchDataForFolloweeHandler.func1 (9 handlers)`

`[GIN-debug] GET    /v1/search/follower/:Keywords --> git.ngs.tech/mean/hans/route.SearchDataForFollowerHandler.func1 (9 handlers)`


