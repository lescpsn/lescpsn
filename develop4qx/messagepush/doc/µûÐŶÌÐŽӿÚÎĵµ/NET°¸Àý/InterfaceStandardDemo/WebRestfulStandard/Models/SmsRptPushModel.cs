using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace WebRestfulStandard.Models
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
        public string Src_terminal_Id { get; set; }

        /// <summary>
        /// 发送短信的应答结果 
        /// </summary>
        public string Stat { get; set; }

        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append(DateTime.Now);
            sb.Append("  ");
            sb.Append("Msg_Id:").Append(Msg_Id);
            sb.Append(",Dest_Id:").Append(Dest_Id);
            sb.Append(",Src_terminal_Id:").Append(Src_terminal_Id);
            sb.Append(",Stat:").Append(Stat);
            return sb.ToString();
        }
    }
}