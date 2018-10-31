// Code generated by protoc-gen-go.
// source: github.com/micro/go-platform/trace/proto/trace.proto
// DO NOT EDIT!

/*
Package go_micro_platform_trace is a generated protocol buffer package.

It is generated from these files:
	github.com/micro/go-platform/trace/proto/trace.proto

It has these top-level messages:
	Annotation
	Span
	Service
	Node
*/
package go_micro_platform_trace

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

type Annotation_Type int32

const (
	Annotation_UNKNOWN             Annotation_Type = 0
	Annotation_START               Annotation_Type = 1
	Annotation_END                 Annotation_Type = 2
	Annotation_TIMEOUT             Annotation_Type = 3
	Annotation_CLIENT_REQUEST      Annotation_Type = 4
	Annotation_CLIENT_RESPONSE     Annotation_Type = 5
	Annotation_CLIENT_PUBLICATION  Annotation_Type = 6
	Annotation_SERVER_REQUEST      Annotation_Type = 7
	Annotation_SERVER_RESPONSE     Annotation_Type = 8
	Annotation_SERVER_SUBSCRIPTION Annotation_Type = 9
)

var Annotation_Type_name = map[int32]string{
	0: "UNKNOWN",
	1: "START",
	2: "END",
	3: "TIMEOUT",
	4: "CLIENT_REQUEST",
	5: "CLIENT_RESPONSE",
	6: "CLIENT_PUBLICATION",
	7: "SERVER_REQUEST",
	8: "SERVER_RESPONSE",
	9: "SERVER_SUBSCRIPTION",
}
var Annotation_Type_value = map[string]int32{
	"UNKNOWN":             0,
	"START":               1,
	"END":                 2,
	"TIMEOUT":             3,
	"CLIENT_REQUEST":      4,
	"CLIENT_RESPONSE":     5,
	"CLIENT_PUBLICATION":  6,
	"SERVER_REQUEST":      7,
	"SERVER_RESPONSE":     8,
	"SERVER_SUBSCRIPTION": 9,
}

func (x Annotation_Type) String() string {
	return proto.EnumName(Annotation_Type_name, int32(x))
}
func (Annotation_Type) EnumDescriptor() ([]byte, []int) { return fileDescriptor0, []int{0, 0} }

type Annotation struct {
	Timestamp int64             `protobuf:"varint,1,opt,name=timestamp" json:"timestamp,omitempty"`
	Type      Annotation_Type   `protobuf:"varint,2,opt,name=type,enum=go.micro.platform.trace.Annotation_Type" json:"type,omitempty"`
	Key       string            `protobuf:"bytes,3,opt,name=key" json:"key,omitempty"`
	Value     []byte            `protobuf:"bytes,4,opt,name=value,proto3" json:"value,omitempty"`
	Debug     map[string]string `protobuf:"bytes,5,rep,name=debug" json:"debug,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"bytes,2,opt,name=value"`
	Service   *Service          `protobuf:"bytes,6,opt,name=service" json:"service,omitempty"`
}

func (m *Annotation) Reset()                    { *m = Annotation{} }
func (m *Annotation) String() string            { return proto.CompactTextString(m) }
func (*Annotation) ProtoMessage()               {}
func (*Annotation) Descriptor() ([]byte, []int) { return fileDescriptor0, []int{0} }

func (m *Annotation) GetDebug() map[string]string {
	if m != nil {
		return m.Debug
	}
	return nil
}

func (m *Annotation) GetService() *Service {
	if m != nil {
		return m.Service
	}
	return nil
}

type Span struct {
	// name; topic, service method, etc
	Name string `protobuf:"bytes,1,opt,name=name" json:"name,omitempty"`
	// id of the span
	Id string `protobuf:"bytes,2,opt,name=id" json:"id,omitempty"`
	// trace root id
	TraceId string `protobuf:"bytes,3,opt,name=trace_id" json:"trace_id,omitempty"`
	// parent span id
	ParentId string `protobuf:"bytes,4,opt,name=parent_id" json:"parent_id,omitempty"`
	// microseconds from epoch. start of span
	Timestamp int64 `protobuf:"varint,5,opt,name=timestamp" json:"timestamp,omitempty"`
	// microseconds. duration of span
	Duration int64 `protobuf:"varint,6,opt,name=duration" json:"duration,omitempty"`
	// should persist?
	Debug bool `protobuf:"varint,7,opt,name=debug" json:"debug,omitempty"`
	// source origin of the request
	Source *Service `protobuf:"bytes,8,opt,name=source" json:"source,omitempty"`
	// destination of the request
	Destination *Service `protobuf:"bytes,9,opt,name=destination" json:"destination,omitempty"`
	// annotations
	Annotations []*Annotation `protobuf:"bytes,10,rep,name=annotations" json:"annotations,omitempty"`
}

func (m *Span) Reset()                    { *m = Span{} }
func (m *Span) String() string            { return proto.CompactTextString(m) }
func (*Span) ProtoMessage()               {}
func (*Span) Descriptor() ([]byte, []int) { return fileDescriptor0, []int{1} }

func (m *Span) GetSource() *Service {
	if m != nil {
		return m.Source
	}
	return nil
}

func (m *Span) GetDestination() *Service {
	if m != nil {
		return m.Destination
	}
	return nil
}

func (m *Span) GetAnnotations() []*Annotation {
	if m != nil {
		return m.Annotations
	}
	return nil
}

type Service struct {
	Name     string            `protobuf:"bytes,1,opt,name=name" json:"name,omitempty"`
	Version  string            `protobuf:"bytes,2,opt,name=version" json:"version,omitempty"`
	Metadata map[string]string `protobuf:"bytes,3,rep,name=metadata" json:"metadata,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"bytes,2,opt,name=value"`
	Nodes    []*Node           `protobuf:"bytes,4,rep,name=nodes" json:"nodes,omitempty"`
}

func (m *Service) Reset()                    { *m = Service{} }
func (m *Service) String() string            { return proto.CompactTextString(m) }
func (*Service) ProtoMessage()               {}
func (*Service) Descriptor() ([]byte, []int) { return fileDescriptor0, []int{2} }

func (m *Service) GetMetadata() map[string]string {
	if m != nil {
		return m.Metadata
	}
	return nil
}

func (m *Service) GetNodes() []*Node {
	if m != nil {
		return m.Nodes
	}
	return nil
}

type Node struct {
	Id       string            `protobuf:"bytes,1,opt,name=id" json:"id,omitempty"`
	Address  string            `protobuf:"bytes,2,opt,name=address" json:"address,omitempty"`
	Port     int64             `protobuf:"varint,3,opt,name=port" json:"port,omitempty"`
	Metadata map[string]string `protobuf:"bytes,4,rep,name=metadata" json:"metadata,omitempty" protobuf_key:"bytes,1,opt,name=key" protobuf_val:"bytes,2,opt,name=value"`
}

func (m *Node) Reset()                    { *m = Node{} }
func (m *Node) String() string            { return proto.CompactTextString(m) }
func (*Node) ProtoMessage()               {}
func (*Node) Descriptor() ([]byte, []int) { return fileDescriptor0, []int{3} }

func (m *Node) GetMetadata() map[string]string {
	if m != nil {
		return m.Metadata
	}
	return nil
}

func init() {
	proto.RegisterType((*Annotation)(nil), "go.micro.platform.trace.Annotation")
	proto.RegisterType((*Span)(nil), "go.micro.platform.trace.Span")
	proto.RegisterType((*Service)(nil), "go.micro.platform.trace.Service")
	proto.RegisterType((*Node)(nil), "go.micro.platform.trace.Node")
	proto.RegisterEnum("go.micro.platform.trace.Annotation_Type", Annotation_Type_name, Annotation_Type_value)
}

var fileDescriptor0 = []byte{
	// 576 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x09, 0x6e, 0x88, 0x02, 0xff, 0x94, 0x54, 0x5d, 0x8f, 0xd2, 0x40,
	0x14, 0xb5, 0xb4, 0xa5, 0xf4, 0xb2, 0x1f, 0x75, 0x36, 0x71, 0x9b, 0x4d, 0x4c, 0x08, 0xbe, 0x90,
	0xb8, 0x16, 0xc5, 0x8f, 0x6c, 0x4c, 0x4c, 0x64, 0xd9, 0x3e, 0x10, 0x77, 0x0b, 0xd2, 0xa2, 0x8f,
	0x9b, 0x81, 0x8e, 0xd8, 0xb8, 0xed, 0x34, 0xd3, 0x81, 0x84, 0xff, 0xe2, 0x8b, 0xbf, 0xc2, 0xdf,
	0xe0, 0x83, 0xff, 0xc9, 0xe9, 0xb4, 0x80, 0x3c, 0xb0, 0xe2, 0xdb, 0xcc, 0xed, 0x3d, 0xa7, 0xf7,
	0xdc, 0x73, 0x5a, 0x78, 0x35, 0x8b, 0xf8, 0xd7, 0xf9, 0xc4, 0x99, 0xd2, 0xb8, 0x1d, 0x47, 0x53,
	0x46, 0xdb, 0x33, 0xfa, 0x2c, 0xbd, 0xc3, 0xfc, 0x0b, 0x65, 0x71, 0x9b, 0x33, 0x3c, 0x25, 0xed,
	0x94, 0x51, 0x4e, 0x8b, 0xb3, 0x23, 0xcf, 0xe8, 0x74, 0x46, 0x1d, 0xd9, 0xed, 0xac, 0x5a, 0x1d,
	0xf9, 0xb8, 0xf9, 0x5b, 0x05, 0xe8, 0x26, 0x09, 0xe5, 0x98, 0x47, 0x34, 0x41, 0x0f, 0xc1, 0xe4,
	0x51, 0x4c, 0x32, 0x8e, 0xe3, 0xd4, 0x56, 0x1a, 0x4a, 0x4b, 0x45, 0x6f, 0x40, 0xe3, 0xcb, 0x94,
	0xd8, 0x15, 0x71, 0x3b, 0xea, 0xb4, 0x9c, 0x1d, 0x4c, 0xce, 0x86, 0xc5, 0x09, 0x44, 0x3f, 0xaa,
	0x83, 0xfa, 0x8d, 0x2c, 0x6d, 0x55, 0xc0, 0x4c, 0x74, 0x08, 0xfa, 0x02, 0xdf, 0xcd, 0x89, 0xad,
	0x89, 0xeb, 0x01, 0x7a, 0x07, 0x7a, 0x48, 0x26, 0xf3, 0x99, 0xad, 0x37, 0xd4, 0x56, 0xbd, 0xe3,
	0xec, 0x43, 0x7a, 0x95, 0x03, 0xdc, 0x84, 0xb3, 0x25, 0x7a, 0x01, 0x46, 0x46, 0xd8, 0x22, 0x9a,
	0x12, 0xbb, 0x2a, 0xf8, 0xea, 0x9d, 0xc6, 0x4e, 0x02, 0xbf, 0xe8, 0x3b, 0x3b, 0x07, 0xf8, 0x8b,
	0xa0, 0x9c, 0x4d, 0xd9, 0x9e, 0x2d, 0x57, 0x68, 0xbe, 0xad, 0x5c, 0x28, 0xcd, 0x9f, 0x0a, 0x68,
	0xa5, 0x08, 0x63, 0xec, 0x7d, 0xf0, 0x06, 0x9f, 0x3d, 0xeb, 0x01, 0x32, 0x41, 0xf7, 0x83, 0xee,
	0x28, 0xb0, 0x14, 0x64, 0x80, 0xea, 0x7a, 0x57, 0x56, 0x25, 0x6f, 0x08, 0xfa, 0x37, 0xee, 0x60,
	0x1c, 0x58, 0x2a, 0x42, 0x70, 0xd4, 0xbb, 0xee, 0xbb, 0x5e, 0x70, 0x3b, 0x72, 0x3f, 0x8e, 0x5d,
	0x3f, 0xb0, 0x34, 0x74, 0x02, 0xc7, 0xeb, 0x9a, 0x3f, 0x1c, 0x78, 0xbe, 0x6b, 0xe9, 0xe8, 0x11,
	0xa0, 0xb2, 0x38, 0x1c, 0x5f, 0x5e, 0xf7, 0x7b, 0xdd, 0xa0, 0x3f, 0xf0, 0xac, 0x6a, 0x4e, 0xe0,
	0xbb, 0xa3, 0x4f, 0xee, 0x68, 0x4d, 0x60, 0xe4, 0x04, 0xeb, 0x5a, 0x49, 0x50, 0x43, 0xa7, 0x70,
	0x52, 0x16, 0xfd, 0xf1, 0xa5, 0xdf, 0x1b, 0xf5, 0x87, 0x92, 0xc1, 0x6c, 0x7e, 0xaf, 0x80, 0xe6,
	0xa7, 0x38, 0x41, 0x07, 0xa0, 0x25, 0x38, 0x26, 0xa5, 0x46, 0x80, 0x4a, 0x14, 0x16, 0x02, 0x91,
	0x05, 0x35, 0xb9, 0x9b, 0x5b, 0x51, 0x29, 0xdc, 0x11, 0xae, 0xa7, 0x98, 0x91, 0x84, 0xe7, 0x25,
	0x6d, 0x55, 0xda, 0x04, 0x41, 0x97, 0x41, 0x10, 0xb8, 0x70, 0xce, 0xa4, 0x19, 0x72, 0xed, 0x6a,
	0xbe, 0xb9, 0xc2, 0x46, 0x43, 0x5c, 0x6b, 0xe8, 0x39, 0x54, 0x33, 0x3a, 0x67, 0xc2, 0x95, 0xda,
	0x7e, 0xae, 0xa0, 0xd7, 0x50, 0x0f, 0xc5, 0x3b, 0xa2, 0xa4, 0x60, 0x35, 0xf7, 0x84, 0x5d, 0x40,
	0x1d, 0xaf, 0x83, 0x91, 0xd9, 0x20, 0x43, 0xf4, 0x64, 0x8f, 0x10, 0x35, 0x7f, 0x29, 0x60, 0xac,
	0x58, 0xb6, 0x37, 0x74, 0x0c, 0xc6, 0x82, 0xb0, 0x2c, 0x1f, 0xa3, 0x58, 0xd3, 0x7b, 0xa8, 0xc5,
	0x84, 0xe3, 0x10, 0x73, 0x2c, 0xd6, 0x74, 0x7f, 0x4c, 0x4b, 0x4a, 0xe7, 0xa6, 0x04, 0x14, 0x29,
	0x3b, 0x07, 0x3d, 0xa1, 0x42, 0x9f, 0x58, 0x69, 0x0e, 0x7f, 0xbc, 0x13, 0xee, 0x89, 0xae, 0xb3,
	0x36, 0x1c, 0x6e, 0xc3, 0xff, 0x15, 0xd2, 0x1f, 0x22, 0xa4, 0x39, 0xb2, 0x34, 0x77, 0x2d, 0x03,
	0x87, 0x21, 0x23, 0x59, 0x56, 0xca, 0x10, 0x2a, 0x53, 0xca, 0xb8, 0x74, 0x5a, 0x15, 0x1f, 0xde,
	0x46, 0x54, 0x31, 0xd5, 0xd3, 0x7b, 0xa7, 0xda, 0x56, 0xf4, 0xdf, 0x33, 0x4e, 0xaa, 0xf2, 0xf7,
	0xf3, 0xf2, 0x4f, 0x00, 0x00, 0x00, 0xff, 0xff, 0x1b, 0x64, 0xca, 0x8e, 0xb6, 0x04, 0x00, 0x00,
}