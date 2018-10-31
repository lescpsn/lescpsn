FROM golang:1.6.2

MAINTAINER Lincan Li "lincan@ngs.tech"

RUN go get github.com/tools/godep

WORKDIR $GOPATH/src/git.ngs.tech/mean/meta

ADD . $GOPATH/src/git.ngs.tech/mean/meta
RUN godep restore -v
RUN go install -a git.ngs.tech/mean/meta

EXPOSE 8080

ENTRYPOINT ["/go/bin/meta"]