#!/usr/bin/env python3

def fibs(num):
    '''
    AAAAAAAAAAAAAAAAAAAAA
    '''
    result = [0, 1]
    for i in range(2, num):
        result.append(result[i-1] + result[i-2])

    return(result)

if __name__ == "__main__":
    fib_ret = fibs(40)
    print(fib_ret)
