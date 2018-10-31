FROM golang:1.6.2

MAINTAINER Lincan Li "lincan@ngs.tech"

RUN go get github.com/tools/godep

WORKDIR $GOPATH/src/git.ngs.tech/mean/dream

ADD . $GOPATH/src/git.ngs.tech/mean/dream

RUN godep restore -v

RUN go install -a git.ngs.tech/mean/dream

EXPOSE 10001

ENTRYPOINT ["/go/bin/dream"]