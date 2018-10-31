using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;

namespace WebRequestStandardDemo
{
    public class MtStandardDemo
    {
        //基础URL，由平台提供 http://{IP}:{port}/{version} 
        private const string BaseUrl = "http://211.149.232.213:28080/chif10";
        //方法，由平台提供
        private const string Method = "mtsms";
        //用户ID
        private const string UserId = "http05";
        //帐号密码
        private const string Password = "******";
        //客户流水号，可包含数字字母 （可以不填）
        private const string CliMsgId = "msg00001";
        //相同信息总条数，从 1开,默认为 1
        private const int PkTotal = 1;
        //相同信息序号，从 1开始,默认为 1
        private const int PkNumber = 1;
        //是否要求返回状态确认报告：0：不需要 1：需要 默认为 0-不要状态报告
        private const int RegisteredDelivery = 0;
        //信息级别 （0-9）数字越大，级别越高 默认为 0 
        private const int MsgLevel = 0;
        //业务类型，是数字、字母和符号的组合 默认为空
        private const string ServiceId = "";
        //GSM 协议类型。默认 0
        private const int TPPId = 0;
        //GSM 协议类型 仅使用 1 位 默认 0 
        private const int TPUdhi = 0;
        //短信内容编码： 0：ASCII 串 3：短信写卡操作 4：二进制信息 8：UCS2 编码 15：含 GB 汉字 默认为 15
        private const int MsgFmt = 15;
        //信息内容来源(数字、英文) 默认为空
        private const string MsgSrc = "";
        //源号码，子扩展号，如可扩展，则扩展在短信平台分配的扩展号后，但总号码不超过 21 位 默认为空-不扩展、使用短信平台分配的父扩展号
        private const string SrcId = "";
        //手机号码（最大 21 位），集合表示。单次提交最多不能超过客户带宽。 手机号建议不重复，不强制限制。
        private static string[] DestTerminalId = { "15024379262", "13466566405" };
        //短信内容，使用 Msg_Fmt 编码编码为 Byte[] 
        private const string MsgContent = "测试";

        /// <summary>
        /// 调用平台短信接口
        /// </summary>
        /// <returns>返回结果</returns>
        public static string CallApi()
        {
            //拼接Token，account+时间戳yyyyMMddHHmmss+password 做 md5 编码(Hex 字符串)
            string timeStamp = DateTime.Now.ToString("yyyyMMddHHmmss");
            string token = string.Format("{0}{1}{2}", UserId,timeStamp, Password);
            //拼接URL
            string url = string.Format("{0}/{1}/{2}/{3}", BaseUrl, Method, UserId, ToolHelper.GetMd5(token)); 

            Dictionary<string, object> postData = new Dictionary<string, object>();    //POST参数
            postData.Add("Cli_Msg_Id", CliMsgId);                        //参数：客户流水号 
            postData.Add("Pk_total ", PkTotal);                          //参数：相同信息总条数
            postData.Add("Pk_number", PkNumber);                         //参数：相同信息序号
            postData.Add("Registered_Delivery", RegisteredDelivery);     //参数：是否要求返回状态确认报告
            postData.Add("Msg_level", MsgLevel);                         //参数：信息级别 （0-9）数字越大，级别越高
            postData.Add("Service_Id", ServiceId);                       //参数：业务类型，是数字、字母和符号的组合
            postData.Add("TP_pId", TPPId);                               //参数：GSM 协议类型
            postData.Add("TP_udhi", TPUdhi);                             //参数：GSM 协议类型
            postData.Add("Msg_Fmt", MsgFmt);                             //参数：短信内容编码
            postData.Add("Msg_src", MsgSrc);                             //参数：信息内容来源(数字、英文) 
            postData.Add("Src_Id", SrcId);                               //源号码，子扩展号
            postData.Add("Dest_terminal_Id", DestTerminalId);            //手机号码（最大 21 位），集合表示。
            byte[] msgContentByte = System.Text.Encoding.GetEncoding(936).GetBytes(MsgContent); //使用GB2312 转码
            postData.Add("Msg_Content", msgContentByte);                //短信内容，使用 Msg_Fmt 编码编码为 Byte[]。

            //手动拼接JSON数据（此处可以使用JSON的序列化工具）
            StringBuilder param = new StringBuilder();
            param.Append("{");
            foreach (var data in postData)
            {
                if (data.Value.GetType().Name == "String[]" )   
                {
                    param.Append("\"" + data.Key + "\"");
                    param.Append(":");
                    param.Append("[");

                    foreach (string str in (string[])(data.Value))
                    {
                        param.Append(str + ",");
                    }
                    param.Remove(param.Length - 1, 1);        //去除末尾的逗号
                    param.Append("],");
                }
                else if (data.Value.GetType().Name == "Byte[]")
                {
                    param.Append("\"" + data.Key + "\"");
                    param.Append(":");
                    param.Append("[");

                    foreach (byte by in (byte[])(data.Value))
                    {
                        param.Append(by + ",");
                    }
                    param.Remove(param.Length - 1, 1);        //去除末尾的逗号
                    param.Append("],");
                }
                else
                {
                    param.Append(data.Key + ":\"" + data.Value + "\",");
                }
            }
            param.Remove(param.Length - 1, 1);        //去除末尾的逗号
            param.Append("}");

            HttpWebRequest myRequest = (HttpWebRequest)WebRequest.Create(url);      //建立Request请求
            myRequest.Method = "POST";                                              //采用POST方式提交
            myRequest.Accept = "application/json";                                  //客户端响应接收数据格式
            myRequest.ContentType = "application/json;charset=utf-8;";              //类型
            string authorization = ToolHelper.GetBase64(UserId + ":" + timeStamp);  //Base64加密
            myRequest.Headers.Add("Authorization", authorization);                  //用户鉴权

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
