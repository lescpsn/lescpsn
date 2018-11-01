using System;
using System.Text;

namespace WebRestfulStandard.Models
{
    public class SmsMoPushModel
    {
        /// <summary>
        /// 信息标识
        /// </summary>
        public string Msg_Id { get; set; }

        /// <summary>
        /// 用户上行服务号 
        /// </summary>
        public string Dest_Id { get; set; }

        /// <summary>
        /// GSM 协议类型 
        /// </summary>
        public int TP_pId { get; set; }

        /// <summary>
        /// GSM 协议类型,仅使用 1位
        /// </summary>
        public int TP_udhi { get; set; }

        /// <summary>
        /// 短信内容编码,0：ASCII 串 3：短信写卡操作 4：二进制信息 8：UCS2 编码 15：含 GB 汉字
        /// </summary>
        public int Msg_Fmt { get; set; }

        /// <summary>
        /// 用户手机号
        /// </summary>
        public string Src_terminal_Id { get; set; }

        /// <summary>
        /// 短信内容，使用 Msg_Fmt 编码为 Byte[]         /// </summary>
        public byte[] Msg_Content { get; set; }

        public override string ToString()
        {
            StringBuilder sb=new StringBuilder();
            sb.Append(DateTime.Now);
            sb.Append("  ");
            sb.Append("Msg_Id:").Append(Msg_Id);
            sb.Append(",Dest_Id:").Append(Dest_Id);
            sb.Append(",TP_pId:").Append(TP_pId);
            sb.Append(",TP_udhi:").Append(TP_udhi);
            sb.Append(",Msg_Fmt:").Append(Msg_Fmt);
            sb.Append(",Src_terminal_Id:").Append(Src_terminal_Id);
            sb.Append(",Msg_Content:");
            foreach (var item in Msg_Content)
            {
                sb.Append(item+",");
            }
            sb.Remove(sb.Length - 1, 1);        //去除末尾的逗号
            return sb.ToString();
        }
    }
}