FROM golang:1.6.2

MAINTAINER Lincan Li "lincan@ngs.tech"

RUN go get github.com/micro/micro

EXPOSE 8082

# COPY docker-entrypoint.sh /usr/local/bin/
# RUN ln -s usr/local/bin/docker-entrypoint.sh / # backwards compat
# ENTRYPOINT ["docker-entrypoint"]

# for current development stage
ENTRYPOINT ["/go/bin/micro"]
