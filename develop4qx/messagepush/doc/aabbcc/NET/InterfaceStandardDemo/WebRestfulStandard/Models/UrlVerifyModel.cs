using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace WebRestfulStandard.Models
{
    public class UrlVerifyModel
    {
        public string Cmd { get; set; }

        public override string ToString()
        {
            StringBuilder sb = new StringBuilder();
            sb.Append(DateTime.Now);
            sb.Append("  ");
            sb.Append("Cmd:").Append(Cmd);
            return sb.ToString();
        }
    }
}