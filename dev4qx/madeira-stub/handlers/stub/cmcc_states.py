import tornado.web

RESP = '''<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><AdcECInterfaceResponse xmlns="http://adc.ecinterface/"><AdcECInterfaceResult><OrigDomain>GDFP</OrigDomain><BIPCode>EC1001</BIPCode><BIPVer>0100</BIPVer><TransIDO>2015031609150220001</TransIDO><ECCode>200320936200200000</ECCode><AreaCode>998</AreaCode><ProcessTime>20150316091502</ProcessTime><Response><RspCode>0000</RspCode><RspDesc>成功</RspDesc></Response><SvcCont>&lt;?xml version="1.0" encoding="utf-8"?&gt;&#xD;
&lt;AdditionRsp&gt;&#xD;
  &lt;Status&gt;00&lt;/Status&gt;&#xD;
  &lt;OperSeqList&gt;&#xD;
    &lt;OperSeq&gt;25736781&lt;/OperSeq&gt;&#xD;
  &lt;/OperSeqList&gt;&#xD;
  &lt;ErrDesc /&gt;&#xD;
&lt;/AdditionRsp&gt;</SvcCont></AdcECInterfaceResult></AdcECInterfaceResponse></s:Body></s:Envelope>'''


class CmccStatesHandler(tornado.web.RequestHandler):
    def post(self):
        self.finish(RESP)
