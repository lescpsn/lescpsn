using System.Net.Http;
using System.Web.Http;
using WebRestfulStandard.Models;

namespace WebRestfulStandard.Controllers
{
    public class UrlVerifyController : ApiController
    {
        /// <summary>
        /// 上行 URL 验证
        /// </summary>
        /// <param name="model">传送的Model对象</param>
        /// <returns>Json数据</returns>
        public HttpResponseMessage Post(UrlVerifyModel model)
        {
            string json = string.Empty;

            //验证参数
            if (model.Cmd == null)
            {
                json = "{\"Ret\":\"1\"}";
                return new HttpResponseMessage { Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json") };
            }

            //需要编写的逻辑，这里是例子（数据库操作等在此编写）
            FileWriteHelper.Write("Log_UrlVerifyStandard.txt", model.ToString());
            json = "{\"Ret\":\"0\"}";

            //返回结果，正确：{\"Ret\":\"0\"}，错误：{\"Ret\":\"1\"}
            return new HttpResponseMessage { Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json") };
        }
    }
}
