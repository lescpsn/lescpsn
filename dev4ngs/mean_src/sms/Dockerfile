FROM golang:1.6.2

MAINTAINER Lincan Li "lincan@ngs.tech"

RUN go get github.com/tools/godep

WORKDIR $GOPATH/src/git.ngs.tech/mean/sms

ADD . $GOPATH/src/git.ngs.tech/mean/sms
RUN godep restore -v
RUN go install -a git.ngs.tech/mean/sms

EXPOSE 10000 10001

ENTRYPOINT ["/go/bin/sms"]