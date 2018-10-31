FROM index.alauda.cn/library/ubuntu:14.04.4
MAINTAINER Jack <jack@nightc.com>
##
# Nginx: 1.10.0
# PHP  : 7.0.6
##
#Install system library
#RUN yum update -y

ENV NGINX_VERSION 1.10.0
ENV PHP_VERSION 7.0.6

#Update the sources
ADD  sources.list /etc/apt/sources.list
RUN apt-get update
RUN apt-get install dialog -y

RUN apt-get install -y \
        autoconf \
        file \
        g++ \
        gcc \
        libc-dev \
        make \
        automake \
        pkg-config \
        re2c \
        wget \
        python-setuptools \
    --no-install-recommends

#Download nginx & php && yaf
RUN mkdir -p /home/nginx-php && cd /home/nginx-php && \
    wget -c -O nginx.tar.gz http://nginx.org/download/nginx-$NGINX_VERSION.tar.gz

RUN mkdir -p /home/nginx-php && cd /home/nginx-php && \
    wget -O php.tar.gz http://php.net/distributions/php-$PHP_VERSION.tar.gz

RUN mkdir -p /home/nginx-php && cd /home/nginx-php && \
    wget -c -O yaf-3.0.2.tgz http://pecl.php.net/get/yaf-3.0.2.tgz

#Install PHP library
RUN apt-get install -y \
        ca-certificates \
        curl \
        supervisor \
        libedit2 \
        libsqlite3-0 \
        libxml2 \
        libjpeg-dev \
        libpng-dev \
        libmcrypt-dev \
        libreadline6 \
        libreadline6-dev \
        openssl \
        libssl-dev \
        libpcre3 \
        libpcre3-dev \
        $PHP_EXTRA_BUILD_DEPS \
        libcurl4-openssl-dev \
        libedit-dev \
        libsqlite3-dev \
        libssl-dev \
        libxml2-dev \
        xz-utils \
        libfreetype6-dev \
    --no-install-recommends

#Add user
RUN groupadd -r www && \
    useradd -M -s /sbin/nologin -r -g www www

#Make install nginx
RUN cd /home/nginx-php && \
    tar -zxvf nginx.tar.gz && \
    cd nginx-$NGINX_VERSION && \
    ./configure --prefix=/usr/local/nginx \
    --user=www --group=www \
    --error-log-path=/var/log/nginx_error.log \
    --http-log-path=/var/log/nginx_access.log \
    --pid-path=/var/run/nginx.pid \
    --with-pcre \
    --with-http_ssl_module \
    --without-mail_pop3_module \
    --without-mail_imap_module \
    --with-http_gzip_static_module && \
    make && make install



#Make install php
RUN cd /home/nginx-php && \
    tar zvxf php.tar.gz && \
    cd php-$PHP_VERSION && \
    ./configure --prefix=/usr/local/php \
    --with-config-file-path=/usr/local/php/etc \
    --with-config-file-scan-dir=/usr/local/php/etc/php.d \
    --with-fpm-user=www \
    --with-fpm-group=www \
    --with-mcrypt=/usr/include \
    --with-mysqli \
    --with-pdo-mysql \
    --with-openssl \
    --with-gd \
    --with-iconv \
    --with-zlib \
    --with-gettext \
    --with-curl \
    --with-png-dir \
    --with-jpeg-dir \
    --with-freetype-dir \
    --with-xmlrpc \
    --with-mhash \
    --enable-fpm \
    --enable-xml \
    --enable-shmop \
    --enable-sysvsem \
    --enable-inline-optimization \
    --enable-mbregex \
    --enable-mbstring \
    --enable-ftp \
    --enable-gd-native-ttf \
    --enable-mysqlnd \
    --enable-pcntl \
    --enable-sockets \
    --enable-zip \
    --enable-soap \
    --enable-session \
    --enable-opcache \
    --enable-bcmath \
    --enable-exif \
    --enable-fileinfo \
    --disable-rpath \
    --enable-ipv6 \
    --disable-debug && \
    make && make install

#Add the Yaf
RUN cd /home/nginx-php && \
    tar zxf yaf-3.0.2.tgz && \
    cd yaf-3.0.2 && \
    /usr/local/php/bin/phpize && \
    ./configure --with-php-config=/usr/local/php/bin/php-config && \
    make && make install

#Add the mongodb
RUN /usr/local/php/bin/pecl install mongodb

RUN cd /home/nginx-php/php-$PHP_VERSION && \
    cp php.ini-production /usr/local/php/etc/php.ini && \
    cp /usr/local/php/etc/php-fpm.conf.default /usr/local/php/etc/php-fpm.conf && \
    cp /usr/local/php/etc/php-fpm.d/www.conf.default /usr/local/php/etc/php-fpm.d/www.conf

#Install supervisor
RUN easy_install supervisor && \
    mkdir -p /var/log/supervisor && \
    mkdir -p /var/run/sshd && \
    mkdir -p /var/run/supervisord

#Add supervisord conf
ADD supervisord.conf /etc/supervisord.conf

#Remove zips
RUN cd / && rm -rf /home/nginx-php

#Create web folder
VOLUME ["/data/www", "/usr/local/nginx/conf/ssl", "/usr/local/nginx/conf/vhost", "/usr/local/php/etc/php.d"]

ADD app.tar.gz /data/www/
#ADD i.php /data/www/
ADD application.ini /data/www/conf/

ADD yaf.ini /usr/local/php/etc/php.d/yaf.ini
ADD mongodb.ini /usr/local/php/etc/php.d/mongodb.ini


#Update nginx config
ADD nginx.conf /usr/local/nginx/conf/nginx.conf

ADD php.ini /usr/local/php/etc/

#Start
ADD start.sh /start.sh
RUN chmod +x /start.sh

#Set port
EXPOSE 80 443

#Start it
#ENTRYPOINT ["/s.sh"]

#Start web server
#CMD ["/bin/bash", "/start.sh"]

# Clean
#RUN yum clean all
RUN rm -r /var/lib/apt/lists/*