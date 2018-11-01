using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebRequestDemo;

namespace WebRequestDemoTest
{
    [TestClass]
    public class MtDemoTest
    {
        [TestMethod]
        public void CallApiTest()
        {
            var response = MtDemo.CallApi();
            Console.WriteLine(response);
        }
    }
}
