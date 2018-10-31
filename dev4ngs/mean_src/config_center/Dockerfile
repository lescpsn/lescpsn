FROM golang:1.6.2

MAINTAINER Lincan Li "lincan@ngs.tech"

RUN go get github.com/tools/godep

WORKDIR $GOPATH/src/git.ngs.tech/mean/config_center

ADD . $GOPATH/src/git.ngs.tech/mean/config_center
RUN godep restore -v
RUN go install -a git.ngs.tech/mean/config_center

EXPOSE 8080

ENTRYPOINT ["/go/bin/config_center"]