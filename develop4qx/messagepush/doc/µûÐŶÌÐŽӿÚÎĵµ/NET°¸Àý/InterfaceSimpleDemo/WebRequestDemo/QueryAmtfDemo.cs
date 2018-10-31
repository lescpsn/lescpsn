using System;
using System.IO;
using System.Net;
using System.Text;

namespace WebRequestDemo
{
    public class QueryAmtfDemo
    {
        //基础URL，由平台提供 http://{IP}:{port}/{version} 
        private const string BaseUrl = "http://211.149.232.213:28080/HIF12";
        //方法，由平台提供
        private const string Method = "queryamtf";
        //用户ID
        private const string UserId = "http05"; 

        /// <summary>
        /// 调用平台接口
        /// </summary>
        /// <returns>返回结果</returns>
        public static string CallApi()
        {
            string url = string.Format("{0}/{1}/{2}", BaseUrl, Method, UserId);  //拼接地址：基础URL+方法+用户ID

            HttpWebRequest myRequest = (HttpWebRequest)WebRequest.Create(url);  //需要引入using System.Net
            myRequest.Method = "POST";                                  //采用POST方式提交
            myRequest.Accept = "application/json";                      //客户端响应接收数据格式
            myRequest.ContentType = "application/json;charset=utf-8;";  //类型
            myRequest.ContentLength = 0;                                //内容长度 

            try
            {
                string result = string.Empty;
                HttpWebResponse myResponse = (HttpWebResponse)myRequest.GetResponse();
                if (myResponse.StatusCode == HttpStatusCode.OK)         //返回正确（200 OK）
                {
                    StreamReader reader = new StreamReader(myResponse.GetResponseStream(), Encoding.UTF8);  //读取返回结果
                    result = reader.ReadToEnd();                    //获取JSON数据
                }
                return result;
            }
            catch (Exception ex)
            {
                return ex.Message;                                  //未经授权(401 Unauthorized)
            }
        }
    }
}
