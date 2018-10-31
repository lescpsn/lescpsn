Nginx and PHP for Docker

## Last Version
nginx: **1.10.0**   
php:   **7.0.6**

## Installation
Pull the image from the docker index rather than downloading the git repo. This prevents you having to build the image on every docker host.
```sh
docker pull cnjack/nginx-php7:latest
```

To pull the Nightly Version:   
```
docker pull cnjack/nginx-php7:nightly
```

## Running
To simply run the container:
```sh
docker run --name nginx -p 8080:80 -d cnjack/nginx-php7
```
You can then browse to http://\<docker_host\>:8080 to view the default install files.

## Volumes
If you want to link to your web site directory on the docker host to the container run:
```sh
docker run --name nginx -p 8080:80 -v /your_code_directory:/data/www -d cnjack/nginx-php7
```

## Enabling SSL
```sh
docker run -d --name=nginx \
-p 80:80 -p 443:443 \
-v your_crt_key_files:/usr/local/nginx/conf/ssl \
-e PROXY_WEB=On \
-e PROXY_CRT=your_crt_name \
-e PROXY_KEY=your_key_name \
-e PROXY_DOMAIN=your_domain \
cnjack/nginx-php7
```

## Enabling Extensions
```sh
docker run --name nginx -p 8080:80 -d -v /your_php_extension:/usr/local/php/etc/php.d cnjack/nginx-php7
```

## ChangeLog
add the yaf   
add the mongodb   
del the xdebug   

## Author
Author: Skiychan    
Email:  dev@skiy.net       
Link:   https://www.zzzzy.com