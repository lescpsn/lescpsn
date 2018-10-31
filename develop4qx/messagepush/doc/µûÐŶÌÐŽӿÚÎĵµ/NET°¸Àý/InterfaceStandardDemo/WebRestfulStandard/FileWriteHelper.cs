using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Web;

namespace WebRestfulStandard
{
    public class FileWriteHelper
    {
        /// <summary>
        /// 写入文件
        /// </summary>
        /// <param name="fileName">文件名</param>
        /// <param name="content">内容</param>
        public static void Write(string fileName,string content)
        {
            string filePath = HttpContext.Current.Server.MapPath("~")+"/Log/";
            StreamWriter sw = new StreamWriter(Path.Combine(filePath,fileName),true);
            //开始写入
            sw.WriteLine(content);
            //清空缓冲区
            sw.Flush();
            //关闭流
            sw.Close();
        }
    }
}