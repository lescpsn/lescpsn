using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;

namespace WebRequestDemo
{
    public class MtDemo
    {
        //基础URL，由平台提供 http://{IP}:{port}/{version} 
        private const string BaseUrl = "http://211.149.232.213:28080/HIF12";
        //方法，由平台提供
        private const string Method = "mt";
        //用户ID
        private const string UserId = "http06";
         //帐号密码
        private const string Password = "******";
        //客户流水号，可包含数字字母 （可以不填）
        private const string CliMsgId = "msg00001";
        //短信接收端手机号码集合，用半角逗号（英文逗号）分开，每批发 送的手机号数量不得超过不能超过客户设置带宽。 
        //通常以20个号码做为上限。 
        //手机号建议不重复，不强制限制
        private const string Mobile = "13466566405,15024379262";
        //短信内容，UTF-8 编码字符串，单条通常为 65 汉字以内（根据签 名规则不同），超过限制字数会被分拆，
        //同时计费条数会根据最终拆 分条数计算，具体由平台拆分结果确定。 
        private const string Content = "这是一个演习";

        /// <summary>
        /// 调用平台短信接口
        /// </summary>
        /// <returns>返回结果</returns>
        public static string CallApi()
        {
            string url = string.Format("{0}/{1}", BaseUrl, Method); //拼接URL
            Dictionary<string,string> postData=new Dictionary<string, string>();    //POST参数
            postData.Add("Userid", UserId);         //参数：用户ID 
            postData.Add("Passwd", Password);       //参数：密码
            postData.Add("Cli_Msg_Id", CliMsgId);   //参数：客户流水号（可不填）
            postData.Add("Mobile", Mobile);         //参数：手机号
            postData.Add("Content", Content);       //参数：短信内容

            //拼接JSON数据
            StringBuilder param=new StringBuilder();
            param.Append("{");
            foreach (var data in postData)
            {
                param.Append(data.Key + ":\"" + data.Value + "\",");
            }
            param.Remove(param.Length-1, 1);        //去除末尾的逗号
            param.Append("}");

            HttpWebRequest myRequest = (HttpWebRequest)WebRequest.Create(url);  //建立Request请求
            myRequest.Method = "POST";                                  //采用POST方式提交
            myRequest.Accept = "application/json";                      //客户端响应接收数据格式
            myRequest.ContentType = "application/json;charset=utf-8;";  //类型
            
            UTF8Encoding encoding = new UTF8Encoding();                 //参数编码格式
            byte[] postParams = encoding.GetBytes(param.ToString());    //转化编码格式
            myRequest.ContentLength = postParams.Length;                //内容长度 
            Stream postStream = myRequest.GetRequestStream();           //请求流数据
            //发送数据
            postStream.Write(postParams, 0, postParams.Length);
            postStream.Flush();
            postStream.Close();
                              
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
