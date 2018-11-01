using System;
using System.Text;

namespace WebRestful.Models
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
        /// 用户手机号 
        /// </summary>
        public string Mobile { get; set; }

        /// <summary>
        /// 短信内容，UTF-8 编码字符串
        /// </summary>
        public string Content { get; set; }

        public override string ToString()
        {
            StringBuilder sb=new StringBuilder();
            sb.Append(DateTime.Now);
            sb.Append("  ");
            sb.Append("Msg_Id:").Append(Msg_Id);
            sb.Append(",Dest_Id:").Append(Dest_Id);
            sb.Append(",Mobile:").Append(Mobile);
            sb.Append(",Content:").Append(Content);
            return sb.ToString();
        }
    }
}