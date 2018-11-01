import netifaces
def get_local_ip():
    results = []
    for i in netifaces.interfaces():
        info = netifaces.ifaddresses(i)
        if netifaces.AF_INET  in info:
            results.append(info[netifaces.AF_INET][0]['addr'])

    return results

if __name__ == "__main__":
    print(get_local_ip())
