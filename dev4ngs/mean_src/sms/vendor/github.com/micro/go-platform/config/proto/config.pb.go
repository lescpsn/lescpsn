// Code generated by protoc-gen-go.
// source: github.com/micro/go-platform/config/proto/config.proto
// DO NOT EDIT!

/*
Package go_micro_platform_config is a generated protocol buffer package.

It is generated from these files:
	github.com/micro/go-platform/config/proto/config.proto

It has these top-level messages:
	ChangeSet
*/
package go_micro_platform_config

import proto "github.com/golang/protobuf/proto"
import fmt "fmt"
import math "math"

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
const _ = proto.ProtoPackageIsVersion1

type ChangeSet struct {
	Timestamp int64  `protobuf:"varint,1,opt,name=timestamp" json:"timestamp,omitempty"`
	Data      string `protobuf:"bytes,2,opt,name=data" json:"data,omitempty"`
	Checksum  string `protobuf:"bytes,3,opt,name=checksum" json:"checksum,omitempty"`
	Source    string `protobuf:"bytes,4,opt,name=source" json:"source,omitempty"`
}

func (m *ChangeSet) Reset()                    { *m = ChangeSet{} }
func (m *ChangeSet) String() string            { return proto.CompactTextString(m) }
func (*ChangeSet) ProtoMessage()               {}
func (*ChangeSet) Descriptor() ([]byte, []int) { return fileDescriptor0, []int{0} }

func init() {
	proto.RegisterType((*ChangeSet)(nil), "go.micro.platform.config.ChangeSet")
}

var fileDescriptor0 = []byte{
	// 159 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x09, 0x6e, 0x88, 0x02, 0xff, 0x34, 0xcd, 0xb1, 0x0a, 0xc2, 0x30,
	0x10, 0xc6, 0x71, 0x6a, 0x4b, 0xb1, 0x87, 0x88, 0x66, 0xca, 0x28, 0x4e, 0x2e, 0x26, 0x83, 0xe0,
	0x0b, 0xb8, 0xbb, 0xf8, 0x04, 0xe9, 0x99, 0xa6, 0x41, 0xaf, 0x57, 0xd2, 0xeb, 0xfb, 0xab, 0x51,
	0xc7, 0xdf, 0xdd, 0x1f, 0x3e, 0x38, 0x87, 0x28, 0xfd, 0xdc, 0x1a, 0x64, 0xb2, 0x14, 0x31, 0xb1,
	0x0d, 0x7c, 0x1c, 0x9f, 0x4e, 0x3a, 0x4e, 0x64, 0x91, 0x87, 0x2e, 0x06, 0x3b, 0x26, 0x16, 0xfe,
	0xc1, 0x64, 0x28, 0x1d, 0xd8, 0xe4, 0xde, 0xfc, 0x63, 0xf3, 0xfd, 0xef, 0xaf, 0xd0, 0x5c, 0x7a,
	0x37, 0x04, 0x7f, 0xf3, 0xa2, 0xb6, 0xd0, 0x48, 0x24, 0x3f, 0x89, 0xa3, 0x51, 0x17, 0xbb, 0xe2,
	0x50, 0xaa, 0x15, 0x54, 0x77, 0x27, 0x4e, 0x2f, 0xde, 0x6a, 0xd4, 0x06, 0x96, 0xd8, 0x7b, 0x7c,
	0x4c, 0x33, 0xe9, 0x32, 0x5f, 0xd6, 0x50, 0x4f, 0x3c, 0x27, 0xf4, 0xba, 0xfa, 0xb8, 0xad, 0xf3,
	0xe0, 0xe9, 0x15, 0x00, 0x00, 0xff, 0xff, 0xbd, 0xcc, 0xf4, 0xd8, 0xaa, 0x00, 0x00, 0x00,
}
