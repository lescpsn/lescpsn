// Code generated by protoc-gen-go.
// source: diary.proto
// DO NOT EDIT!

package proto

import proto1 "github.com/golang/protobuf/proto"
import fmt "fmt"
import math "math"

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto1.Marshal
var _ = fmt.Errorf
var _ = math.Inf

type DiaryPrivacy int32

const (
	DiaryPrivacy_diary_privacy_null    DiaryPrivacy = 0
	DiaryPrivacy_diary_privacy_public  DiaryPrivacy = 1
	DiaryPrivacy_diary_privacy_private DiaryPrivacy = 2
)

var DiaryPrivacy_name = map[int32]string{
	0: "diary_privacy_null",
	1: "diary_privacy_public",
	2: "diary_privacy_private",
}
var DiaryPrivacy_value = map[string]int32{
	"diary_privacy_null":    0,
	"diary_privacy_public":  1,
	"diary_privacy_private": 2,
}

func (x DiaryPrivacy) String() string {
	return proto1.EnumName(DiaryPrivacy_name, int32(x))
}
func (DiaryPrivacy) EnumDescriptor() ([]byte, []int) { return fileDescriptor2, []int{0} }

type DiaryStatus int32

const (
	DiaryStatus_diary_status_none      DiaryStatus = 0
	DiaryStatus_diary_status_null      DiaryStatus = 1
	DiaryStatus_diary_status_saved     DiaryStatus = 2
	DiaryStatus_diary_status_published DiaryStatus = 3
)

var DiaryStatus_name = map[int32]string{
	0: "diary_status_none",
	1: "diary_status_null",
	2: "diary_status_saved",
	3: "diary_status_published",
}
var DiaryStatus_value = map[string]int32{
	"diary_status_none":      0,
	"diary_status_null":      1,
	"diary_status_saved":     2,
	"diary_status_published": 3,
}

func (x DiaryStatus) String() string {
	return proto1.EnumName(DiaryStatus_name, int32(x))
}
func (DiaryStatus) EnumDescriptor() ([]byte, []int) { return fileDescriptor2, []int{1} }

type Diary struct {
	ID           int64        `protobuf:"varint,1,opt,name=ID,json=iD" json:"ID,omitempty"`
	UUID         string       `protobuf:"bytes,2,opt,name=UUID,json=uUID" json:"UUID,omitempty"`
	CreatedAt    string       `protobuf:"bytes,3,opt,name=CreatedAt,json=createdAt" json:"CreatedAt,omitempty"`
	UserUUID     string       `protobuf:"bytes,4,opt,name=UserUUID,json=userUUID" json:"UserUUID,omitempty"`
	Title        *StringType  `protobuf:"bytes,5,opt,name=Title,json=title" json:"Title,omitempty"`
	Content      *StringType  `protobuf:"bytes,6,opt,name=Content,json=content" json:"Content,omitempty"`
	Style        *StringType  `protobuf:"bytes,7,opt,name=Style,json=style" json:"Style,omitempty"`
	DiaryPrivacy DiaryPrivacy `protobuf:"varint,8,opt,name=DiaryPrivacy,json=diaryPrivacy,enum=proto.DiaryPrivacy" json:"DiaryPrivacy,omitempty"`
	DiaryStatus  DiaryStatus  `protobuf:"varint,9,opt,name=DiaryStatus,json=diaryStatus,enum=proto.DiaryStatus" json:"DiaryStatus,omitempty"`
	Timestamp    string       `protobuf:"bytes,10,opt,name=Timestamp,json=timestamp" json:"Timestamp,omitempty"`
}

func (m *Diary) Reset()                    { *m = Diary{} }
func (m *Diary) String() string            { return proto1.CompactTextString(m) }
func (*Diary) ProtoMessage()               {}
func (*Diary) Descriptor() ([]byte, []int) { return fileDescriptor2, []int{0} }

func (m *Diary) GetTitle() *StringType {
	if m != nil {
		return m.Title
	}
	return nil
}

func (m *Diary) GetContent() *StringType {
	if m != nil {
		return m.Content
	}
	return nil
}

func (m *Diary) GetStyle() *StringType {
	if m != nil {
		return m.Style
	}
	return nil
}

func init() {
	proto1.RegisterType((*Diary)(nil), "proto.Diary")
	proto1.RegisterEnum("proto.DiaryPrivacy", DiaryPrivacy_name, DiaryPrivacy_value)
	proto1.RegisterEnum("proto.DiaryStatus", DiaryStatus_name, DiaryStatus_value)
}

func init() { proto1.RegisterFile("diary.proto", fileDescriptor2) }

var fileDescriptor2 = []byte{
	// 347 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x09, 0x6e, 0x88, 0x02, 0xff, 0x74, 0x91, 0x4f, 0x4f, 0xc2, 0x40,
	0x10, 0xc5, 0x6d, 0xa1, 0x40, 0x07, 0x42, 0xca, 0x28, 0x64, 0x25, 0x1e, 0x8c, 0x17, 0x0d, 0x26,
	0x1c, 0xd0, 0xc4, 0xb3, 0x81, 0x8b, 0x37, 0x53, 0xe0, 0xe4, 0x81, 0x94, 0x76, 0xa3, 0x4d, 0x4a,
	0xdb, 0x74, 0xa7, 0x24, 0xfd, 0xd8, 0x7e, 0x03, 0xf7, 0x0f, 0x44, 0xaa, 0xe1, 0xb4, 0x9d, 0xf7,
	0x7b, 0x33, 0xfb, 0x3a, 0x0b, 0xdd, 0x28, 0x0e, 0x8a, 0x6a, 0x9a, 0x17, 0x19, 0x65, 0xe8, 0xe8,
	0x63, 0xdc, 0x4f, 0xcb, 0x24, 0xa1, 0x2a, 0xe7, 0x46, 0xbe, 0xfb, 0xb6, 0xc1, 0x59, 0x28, 0x1b,
	0xf6, 0xc1, 0x7e, 0x5b, 0x30, 0xeb, 0xd6, 0x7a, 0x68, 0xf8, 0x76, 0xbc, 0x40, 0x84, 0xe6, 0x7a,
	0x2d, 0x15, 0x5b, 0x2a, 0xae, 0xdf, 0x2c, 0xe5, 0x37, 0xde, 0x80, 0x3b, 0x2f, 0x78, 0x40, 0x3c,
	0x7a, 0x25, 0xd6, 0xd0, 0xc0, 0x0d, 0x8f, 0x02, 0x8e, 0xa1, 0xb3, 0x16, 0xbc, 0xd0, 0x5d, 0x4d,
	0x0d, 0x3b, 0xe5, 0xa1, 0xc6, 0x7b, 0x70, 0x56, 0x31, 0x25, 0x9c, 0x39, 0x12, 0x74, 0x67, 0x03,
	0x73, 0xfd, 0x74, 0x49, 0x45, 0x9c, 0x7e, 0xae, 0x64, 0x1e, 0xdf, 0x21, 0xc5, 0xf1, 0x11, 0xda,
	0xf3, 0x2c, 0x25, 0x9e, 0x12, 0x6b, 0x9d, 0xb3, 0xb6, 0x43, 0xe3, 0x50, 0x53, 0x97, 0x54, 0xc9,
	0xa9, 0xed, 0xb3, 0x53, 0x85, 0xe2, 0xf8, 0x02, 0x3d, 0xfd, 0x97, 0xef, 0x45, 0xbc, 0x0f, 0xc2,
	0x8a, 0x75, 0xa4, 0xbf, 0x3f, 0xbb, 0x3c, 0xf8, 0x4f, 0x91, 0xdf, 0x8b, 0x4e, 0x2a, 0x7c, 0x86,
	0xae, 0xa6, 0x4b, 0x0a, 0xa8, 0x14, 0xcc, 0xd5, 0x7d, 0x78, 0xda, 0x67, 0x88, 0x6f, 0x96, 0x6d,
	0x0a, 0xb5, 0xa7, 0x55, 0xbc, 0xe3, 0x82, 0x82, 0x5d, 0xce, 0xc0, 0xec, 0x89, 0x8e, 0xc2, 0xe4,
	0xa3, 0x1e, 0x06, 0x47, 0x80, 0xba, 0x79, 0x93, 0x1b, 0x61, 0xa3, 0xde, 0xc8, 0xbb, 0x40, 0x06,
	0x57, 0x75, 0x3d, 0x2f, 0xb7, 0x49, 0x1c, 0x7a, 0x16, 0x5e, 0xc3, 0xf0, 0x0f, 0x51, 0x27, 0x71,
	0xcf, 0x9e, 0x64, 0xb5, 0xc0, 0x38, 0x84, 0x81, 0x71, 0x0a, 0x5d, 0x6f, 0xd2, 0x2c, 0xe5, 0x72,
	0xf4, 0x3f, 0x59, 0xdd, 0x68, 0xfd, 0x26, 0x39, 0xc8, 0x22, 0xd8, 0xf3, 0xc8, 0xb3, 0xe5, 0xcb,
	0x8e, 0x6a, 0xba, 0x0e, 0x22, 0xbe, 0x24, 0x6b, 0x6c, 0x5b, 0x7a, 0x17, 0x4f, 0x3f, 0x01, 0x00,
	0x00, 0xff, 0xff, 0x31, 0x3c, 0xca, 0x83, 0x6e, 0x02, 0x00, 0x00,
}