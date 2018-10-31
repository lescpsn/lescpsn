#!/usr/bin/evn python
# -*- coding: utf-8 -*-

def foo():
    print("exec 1")
    yield 1
    print("done!")
f = foo()
f.next()
