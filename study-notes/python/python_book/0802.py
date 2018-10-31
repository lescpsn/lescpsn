#!/usr/bin/env python3
# -*- coding:utf-8 -*-

class MuffCal:
    muff = False
#    muff = True
    def cal(self, expr):
        try:
            return(eval(expr))
        except Exception:
            if self.muff == False:
                print("div zero error")
            else:
                raise



cc = MuffCal()
cc.cal('10/4')
