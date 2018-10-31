using System;
using System.Text;

namespace WebRestful.Models
{
    public class SmsRptPushModel
    {
        /// <summary>
        /// 信息标识 对应响应中的 msgid
        /// </summary>
        public string Msg_Id { get; set; }

        /// <summary>
        /// 服务号 
        /// </summary>
        public string Dest_Id { get; set; }

        /// <summary>
        /// 用户手机号 
        /// </summary>
        public string Mobile { get; set; }

        /// <summary>
        /// 发送短信的应答结果 
        /// </summary>
        public string Status { get; set; }

        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append(DateTime.Now);
            sb.Append("  ");
            sb.Append("Msg_Id:").Append(Msg_Id);
            sb.Append(",Dest_Id:").Append(Dest_Id);
            sb.Append(",Mobile:").Append(Mobile);
            sb.Append(",Status:").Append(Status);
            return sb.ToString();
        }
    }
}