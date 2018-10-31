FROM golang:1.6.2

MAINTAINER Lincan Li "lincan@ngs.tech"

WORKDIR $GOPATH/src/git.ngs.tech/mean/trial

ADD . $GOPATH/src/git.ngs.tech/mean/trial

RUN go install -a git.ngs.tech/mean/trial

EXPOSE 8080

ENTRYPOINT ["/go/bin/trial"]