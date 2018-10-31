def test_1(val):
    print("val", val, type(val))

def test_2(val):
    print("val", val, type(val))

if __name__ == "__main__":
    for i in range(1,3):
        eval("test_"+str(i))(i)
