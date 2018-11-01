using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebRequestDemo;

namespace WebRequestDemoTest
{
    [TestClass]
    public class QueryAmtfDemoTest
    {
        [TestMethod]
        public void CallApiTest()
        {
            var response=QueryAmtfDemo.CallApi();
            Console.WriteLine(response);
        }
    }
}
