FROM golang:1.6.2

MAINTAINER Huxu "hu@ngs.tech"

RUN go get github.com/tools/godep

WORKDIR $GOPATH/src/git.ngs.tech/mean/houston

ADD . $GOPATH/src/git.ngs.tech/mean/houston

RUN godep restore

RUN go install -a git.ngs.tech/mean/houston

EXPOSE 8080
ENTRYPOINT ["/go/bin/houston"]
