using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebRequestStandardDemo;

namespace WebRequestStandardDemoTest
{
    [TestClass]
    public class QueryAmtStandardDemoTest
    {
        [TestMethod]
        public void CallApiTest()
        {
            var response = QueryAmtStandardDemo.CallApi();
            Console.WriteLine(response);
        }
    }
}
