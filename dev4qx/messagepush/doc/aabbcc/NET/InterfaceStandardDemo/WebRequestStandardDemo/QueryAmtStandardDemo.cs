using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace WebRequestStandardDemo
{
    public class QueryAmtStandardDemo
    {
        //基础URL，由平台提供 http://{IP}:{port}/{version} 
        private const string BaseUrl = "http://211.149.232.213:28080/chif10";
        //方法，由平台提供
        private const string Method = "queryamtf";
        //用户ID
        private const string UserId = "http05";
        //帐号密码
        private const string Password = "******";

        /// <summary>
        /// 查询当前预付费用户余额
        /// </summary>
        /// <returns>返回结果</returns>
        public static string CallApi()
        {
            //拼接Token，account+时间戳yyyyMMddHHmmss+password 做 md5 编码(Hex 字符串)
            string timeStamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            string token = string.Format("{0}{1}{2}", UserId, timeStamp, Password);
            //拼接URL
            string url = string.Format("{0}/{1}/{2}/{3}", BaseUrl, Method, UserId, ToolHelper.GetMd5(token));

            HttpWebRequest myRequest = (HttpWebRequest)WebRequest.Create(url);      //建立Request请求
            myRequest.Method = "POST";                                              //采用POST方式提交
            myRequest.Accept = "application/json";                                  //客户端响应接收数据格式
            myRequest.ContentType = "application/json;charset=utf-8;";              //类型
            string authorization = ToolHelper.GetBase64(UserId + ":" + timeStamp);  //Base64加密
            myRequest.Headers.Add("Authorization", authorization);                  //用户鉴权

            string result = string.Empty;
            try
            {
                HttpWebResponse myResponse = (HttpWebResponse)myRequest.GetResponse();  //获取
                if (myResponse.StatusCode == HttpStatusCode.OK)         //返回正确（200 OK）
                {
                    StreamReader reader = new StreamReader(myResponse.GetResponseStream(), Encoding.UTF8);  //读取返回结果
                    result = reader.ReadToEnd();                        //获取JSON数据
                }
            }
            catch (Exception ex)
            {
                result = ex.Message;                                    //异常结果
            }

            return result;
        }
    }
}
