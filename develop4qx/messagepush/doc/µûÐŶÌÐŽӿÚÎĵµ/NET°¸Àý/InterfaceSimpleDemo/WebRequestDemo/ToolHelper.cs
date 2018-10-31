using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace WebRequestDemo
{
    public class ToolHelper
    {
        /// <summary>
        /// MD5加密算法
        /// </summary>
        /// <param name="s"></param>
        /// <returns></returns>
        public static string GetMd5(string s)
        {
            MD5 md5 = new MD5CryptoServiceProvider();

            byte[] t = md5.ComputeHash(Encoding.GetEncoding("utf-8").GetBytes(s));

            StringBuilder sb = new StringBuilder(32);

            for (int i = 0; i < t.Length; i++)
            {
                sb.Append(t[i].ToString("x").PadLeft(2, '0'));
            }

            return sb.ToString();
        }

        public static string GetBase64(string param)
        {
            //System.Text.Encoding encode = System.Text.Encoding.;
            byte[] bytedata =  System.Text.Encoding.GetEncoding(936).GetBytes(param);
            return Convert.ToBase64String(bytedata, 0, bytedata.Length);
        }
    }
}
