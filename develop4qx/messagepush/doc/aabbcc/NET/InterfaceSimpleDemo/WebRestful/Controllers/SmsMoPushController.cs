using System.Net.Http;
using System.Web.Http;
using WebRestful.Models;

namespace WebRestful.Controllers
{
    public class SmsMoPushController : ApiController
    {
        /// <summary>
        /// 上行短信推送
        /// </summary>
        /// <param name="model">传送的Model对象</param>
        /// <returns>Json数据</returns>
        public HttpResponseMessage Post(SmsMoPushModel model)
        {
            string json = string.Empty;

            //验证参数
            if (model.Msg_Id == null)
            {
                //信息标识 不存在
                json = "{\"Rspcode\":1}";
                return new HttpResponseMessage { Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json") };
            }
            if (model.Dest_Id == null)
            {
                //用户上行服务号 不存在
                json = "{\"Rspcode\":1}";
                return new HttpResponseMessage { Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json") };
            }
            if (model.Mobile == null)
            {
                //用户手机号 不存在
                json = "{\"Rspcode\":1}";
                return new HttpResponseMessage { Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json") };
            }
            if (model.Content == null)
            {
                //短信内容 不存在
                json = "{\"Rspcode\":1}";
                return new HttpResponseMessage { Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json") };
            }
            
            //需要编写的逻辑，这里是例子（数据库操作等在此编写）
            FileWriteHelper.Write("Log_SmsMoPush.txt",model.ToString());
            json = "{\"Rspcode\":0}";

            //返回结果，正确：{\"Rspcode\":0}，错误：{\"Rspcode\":1}
            return new HttpResponseMessage { Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json") };
        }
    }
}
