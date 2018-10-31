#!/usr/bin/env python3
#-*- coding:utf-8 -*-

class Person:
    print("**********")
    def setName(self, name):
        self.name = name

    def getName(self):
        return self.name

    def greet(self):
        print("hello world %s." % self.name)

#foo = Person()
#bar = Person()

#foo.setName('carhj')
#bar.setName('qiaoting')

#foo.greet()
#bar.greet()
#Person.greet(foo)
#print(Person.getName(bar))

if __name__ == "__main__":
    print("dd")
