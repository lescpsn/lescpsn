# -*- coding:utf-8 -*-

# This file epiphany.py is created by lincan for Project Epiphany
# on a date of 3/7/16 - 10:40 AM

from pyspark import SparkContext


class Epiphany:
    __daily_ops = None
    __permanent_scores = None
    __legacy_scores = None
    __user_scores = None

    def __init__(self, spark_context: SparkContext):
        self.spark_context = spark_context

    def _load_rdd(self, hdfs_string):
        return self.spark_context.textFile(hdfs_string)

    @property
    def daily_ops(self):
        """
        daily_ops represents overall user's normal operation, it can be trigger by
        regular business operations. All the operation records are stored in a
        HDFS file.

        designated format: **`user_id,type,normal_score,datetime`**
        type indicate category of the operation, while normal_score shows how much
        this single action will affect user's global score without considering other
        factors such as similar history record.

        type can be as polymorphic as following:
        1: 公开一张照片 +1
        2: 隐私一张照片 -1
        3: 删除日记 -12
        4: 写日记 +8 (每天上限为 +8)
        5: 增加一个粉丝 +1
        6: 减少一个粉丝 -1
        7: 增加一个好友 +8
        8: 减少一个好友 -25
        9: 删除一条图说 -5
        10: 删除一张照片 -1 // (如果该照片附带彻底隐藏图说，则相应扣除删除图说的热度)
        11: 添加一个关注 +0.5
        12: 减少一个关注 -0.5
        13: 每天登陆 +1
        13#: 连续7天登陆后从第八天登陆开始每天+2, 连续21天登陆后第22天登陆开始每天+3
        14: 拍照热度 +2 (每天上限为 +16/ 每天)
        14#: 连续7天拍照后，从第八天起每天拍照热度+3，上限为+24每天, 连续21天拍照后，从第二十二天起每天拍照热度+5，上限为+40每天
        15: 将照片发布为图说 +3
        15#: 照片不可重复计算, 发图说热度上限为30每天
        16: 每张照片写随记 +2 (每天上限为 +30)
        17: 上传一张照片 +1 (总上限为 +600)
        18: 更新一次头像 +3 (不和上传照片重叠)
        19: 用户的图说被主人自己 @ 出去每个人 +1.5 (上限60每天)
        20: 用户的图说被主人自己 @ 出每个第三方平台 +6 (上限30每天)
        21: 用户的图说被其他用户 @ 每个人 +2 (上限300每天)
        22: 用户的图说被其他用户 @ 到他们第三方平台 +15 (上限1500每天)
        23: 用户的图说被其他用用户点赞 +0.5 (上限500每天)
        24: 用户的图说被其他用户预览 +0.2  (上限200每天)
        25: 用户的图说被其他用户评论 +0.2  (上限100每天)
        24-25#: 第24条和第25条相加总上限为200，单个用户评论总上限热度为5每天
        26: 用户的个人主页被关注人查看 +0.5  (上限500每天)
        27: 用户的个人主页被好友查看 +1  (上限100每天)
        26-27#: 第26条和第27条相加总上限为500每天
        28: 用户的个人主页照片被好友评论 +1  (上限100每天)
        29: 用户的个人主页照片主人回复好友 +0.5  (上限50每天)
        28-29#: 第28条和第29条相加总上限为100每天
        30: 更新图说新版本 +19，永久热度 +1
        31: 照片被图说编辑选用 +30 (和活动奖励2可完全叠加) 永久热度 +10
        32: 用户每观看他人照片100张 +4
        33: 用户每做一次留言 +0.5  (上限为20每天)
        34: 用户每对一条图说评论 +0.3 (上限为18每天)
        35: 第一次使用图说拍照 +15
        36: 第一次使用快速拍照 +10
        37: 上传5张瀑布流照片 +20
        38: 添加第一个关注 +5
        39: 第一次被3个粉丝关注 +30
        40: 添加第一个好友 +10
        41: 发布一条图说 +5
        42: 你的图说第一次被五个人赞 +30
        43: 第一次使用随记功能 +15
        44: 第一次给好友留言 +5
        45: 每第一次使用新的滤镜并保存照片 +12（共19个滤镜，每个滤镜使用过后不可二次累加热度）
        46: 使用图说下载照片功能下载5张照片 +20
        47: 使用图说绑定完邮箱和手机, 永久热度 +15
        48: 使用图说填写完所有信息, 永久热度 +20
        49: 为图说应用消费, 永久热度 +100
        50: 获得100个关注, 永久热度 +20
        51: 获得500个关注, 永久热度 +300
        52: 如发现存在恶意刷热度有且不限于僵尸粉，疯狂注册刷粉评论和转发等，一经查实热度清为-200
        :return: daily_ops
        """
        if self.__daily_ops is None:
            self.__daily_ops = self._load_rdd("daily_ops.txt") \
                .map(lambda line: tuple(line.split(","))) \
                .map(lambda row: (int(row[0]), row[1:4]))

        return self.__daily_ops

    @property
    def permanent_scores(self):
        """
        permanent_scores indicate user's score floor against global lower limit
        (default: -500)
        :return:
        """
        if self.__permanent_scores is None:
            self.__permanent_scores = self._load_rdd("permanent_scores.txt") \
                .map(lambda line: line.split(","))

        return self.__permanent_scores

    @property
    def legacy_score(self):
        """
        legacy_score stores scores overflowed a day before, namely the score out
        of bound.
        :return:
        """
        if self.__legacy_scores is None:
            self.__legacy_scores = self._load_rdd("legacy.txt") \
                .map(lambda line: line.split(",")) \
                .map(lambda row: (int(row[0]), row[1]))

        return self.__legacy_scores

    @property
    def user_scores(self):
        """
        legacy_score stores scores overflowed a day before, namely the score out
        of bound.
        :return:
        """
        if self.__user_scores is None:
            self.__user_scores = self._load_rdd("user_scores.txt") \
                .map(lambda line: line.split(","))

        return self.__user_scores

    def calculate_score(self):
        def map_joined_key(row):
            user_id = row[0]
            joined_key = row[1]

            # legacy_score
            legacy_score = 0 if joined_key[1] is None else joined_key[1]
            joined_key = joined_key[0]

            # permanent_score
            permanent_score = 0 if joined_key[1] is None else joined_key[1]
            joined_key = joined_key[0]

            user_ops = joined_key[0]

            # user_scores
            user_scores = -25 if joined_key[1] is None else joined_key[1]

            return user_id, user_ops, user_scores, permanent_score, legacy_score

        x = self.daily_ops \
            .reduceByKey(lambda a, b: (a, b)) \
            .leftOuterJoin(self.user_scores) \
            .leftOuterJoin(self.permanent_scores) \
            .leftOuterJoin(self.legacy_score) \
            .map(map_joined_key)

        print(x.collect())
