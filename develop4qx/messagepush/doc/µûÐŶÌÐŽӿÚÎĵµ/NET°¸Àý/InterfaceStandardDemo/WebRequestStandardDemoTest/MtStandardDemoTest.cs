using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using WebRequestStandardDemo;

namespace WebRequestStandardDemoTest
{
    [TestClass]
    public class MtStandardDemoTest
    {
        [TestMethod]
        public void CallApiTest()
        {
            var response = MtStandardDemo.CallApi();
            Console.WriteLine(response);
        }
    }
}
