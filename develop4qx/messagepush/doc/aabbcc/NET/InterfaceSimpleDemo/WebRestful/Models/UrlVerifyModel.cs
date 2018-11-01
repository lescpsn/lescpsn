using System;
using System.Text;

namespace WebRestful.Models
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