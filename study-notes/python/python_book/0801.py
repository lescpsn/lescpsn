#!/usr/bin/env python3
#-*- coding:utf-8 -*-

try:
    x=input("Enter First Number:")
    y=input("Enter Second Number:")
    print(float(x)/float(y))
    print("end")

except Exception as e:
    print("Exception:",e)
