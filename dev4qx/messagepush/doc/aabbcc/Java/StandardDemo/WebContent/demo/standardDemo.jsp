<%@page import="org.apache.commons.codec.binary.Base64"%>
<%@page import="java.util.Date"%>
<%@page import="java.security.MessageDigest"%>
<%@page import="org.apache.commons.codec.binary.Hex" %>
<%@page import="java.text.SimpleDateFormat"%>
<%@page import="java.io.Reader"%>
<%@page import="com.google.gson.GsonBuilder"%>
<%@page import="java.util.LinkedHashMap"%>
<%@page import="java.util.Map.Entry"%>
<%@page import="java.util.Iterator"%>
<%@page import="java.util.UUID"%>
<%@page import="java.util.HashMap"%>
<%@page import="java.util.Map"%>
<%@page import="java.io.IOException"%>
<%@page import="java.io.InputStreamReader"%>
<%@page import="java.net.URL"%>
<%@page import="java.net.HttpURLConnection"%>
<%@page import="java.io.BufferedReader"%>
<%@page import="java.io.PrintWriter"%>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%!
	//平台Base URL
    // 由平台提供 http://{IP}:{port}/{version}
    private static final String baseUrl = "http://211.149.232.213:28080/chif10";
    private static final String enterpriseUrl = "http://localhost:8080/yuecheng/rest/simple";
    // 用户ID
    private static final String UserId = "http05";
    // 帐号密码
    private static final String Password = "******";
    //客户流水号，可包含数字字母 （可以不填）
    private static final String CliMsgId = "msg00001";
    //相同信息总条数，从 1开,默认为 1
    private static final int PkTotal = 1;
    //相同信息序号，从 1开始,默认为 1
    private static final int PkNumber = 1;
    //是否要求返回状态确认报告：0：不需要 1：需要 默认为 0-不要状态报告
    private static final int RegisteredDelivery = 0;
    //信息级别 （0-9）数字越大，级别越高 默认为 0 
    private static final int MsgLevel = 0;
    //业务类型，是数字、字母和符号的组合 默认为空
    private static final String ServiceId = "";
    //GSM 协议类型。默认 0
    private static final int TPPId = 0;
    //GSM 协议类型 仅使用 1 位 默认 0 
    private static final int TPUdhi = 0;
    //短信内容编码： 0：ASCII 串 3：短信写卡操作 4：二进制信息 8：UCS2 编码 15：含 GB 汉字 默认为 15
    private static final int MsgFmt = 15;
    //信息内容来源(数字、英文) 默认为空
    private static final String MsgSrc = "";
    //源号码，子扩展号，如可扩展，则扩展在短信平台分配的扩展号后，但总号码不超过 21 位 默认为空-不扩展、使用短信平台分配的父扩展号
    private static final String SrcId = "";
    //手机号码（最大 21 位），集合表示。单次提交最多不能超过客户带宽。 手机号建议不重复，不强制限制。
    private static final String[] DestTerminalId = { "15024379262", "13466566405" };
    //短信内容，使用 Msg_Fmt 编码编码为 Byte[] 
    private static final String MsgContent = "测试";

    /**
     * 查询当前预付费用户余额
     * 
     * @return
     */
    public static String postQueryamtf() {
        PrintWriter printWriter = null;
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
			String time = new SimpleDateFormat( "yyyyMMddHHmmss" ).format( new Date( ) );			//时间戳yyyyMMddHHmmss
			String token = Hex.encodeHexString( new Md5( ).encrypt( UserId + time + Password ) );	//拼接Token
            URL realUrl = new URL(baseUrl + "/queryamtf/" +UserId+"/"+token);						//拼接URL
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
			String str = UserId + ":" + time;
			byte[] datas = str.getBytes("GBK");
	        String authorization = new String(Base64.encodeBase64(datas));	
            // 设置通用的请求属性
            httpURLConnection.setRequestProperty("accept", "application/json");
            httpURLConnection.setRequestProperty("Content-Type", "application/json;charset=utf-8");
	        httpURLConnection.setRequestProperty("Authorization", authorization);
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
            // 获取URLConnection对象对应的输出流
            printWriter = new PrintWriter(httpURLConnection.getOutputStream());
            // flush输出流的缓冲
            printWriter.flush();
            // 根据ResponseCode判断连接是否成功
            int responseCode = httpURLConnection.getResponseCode();
            if (responseCode != 200) {
                responseResult = " Error===" + responseCode;
            }
            // 定义BufferedReader输入流来读取URL的ResponseData
            bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                responseResult += line;
            }
        } catch (Exception e) {
            responseResult = "send post request error!" + e;
        } finally {
            httpURLConnection.disconnect();
            try {
                if (printWriter != null) {
                    printWriter.close();
                }
                if (bufferedReader != null) {
                    bufferedReader.close();
                }
            } catch (IOException ex) {
                ex.printStackTrace();
            }

        }
        return responseResult;
    }

    /**
     * 提交短信
     * 
     * @return
     */
    public static String postMt()  throws Exception{
	    PrintWriter printWriter = null;								
	    BufferedReader bufferedReader = null;
	    String responseResult = "";
	    HttpURLConnection httpURLConnection = null;					//创建HttpURLConnection
	
	    //Post数据类
	    CHIFMtSmsSubmit submit = new CHIFMtSmsSubmit( );			//手机号码（最大 21 位），集合表示。
		submit.setDest_terminal_Id( DestTerminalId );				//手机号码（最大 21 位），集合表示。
		submit.setMsg_Fmt( MsgFmt );								//参数：短信内容编码
		submit.setMsg_level( MsgLevel );							//参数：信息级别 （0-9）数字越大，级别越高
		submit.setMsg_src( MsgSrc );								//参数：信息内容来源(数字、英文) 
		submit.setPk_number( PkNumber );							//参数：相同信息序号
		submit.setPk_total( PkTotal );								//参数：相同信息总条数
		submit.setRegistered_Delivery( RegisteredDelivery );		//参数：是否要求返回状态确认报告
		submit.setService_Id( ServiceId );							//参数：业务类型，是数字、字母和符号的组合
		submit.setSrc_Id( SrcId );									//源号码，子扩展号
		submit.setTP_pId( TPPId );									//参数：GSM 协议类型
		submit.setTP_udhi( TPUdhi );								//参数：GSM 协议类型
	    byte[] msg_content = MsgContent.getBytes("GBK");			//GBK编码转化
	    submit.setMsg_Content(msg_content);							//短信内容，使用 Msg_Fmt 编码编码为 Byte[]。
	    String json = submit.toJson();								//对象转化为Json
	    
	    try {
			String time = new SimpleDateFormat( "yyyyMMddHHmmss" ).format( new Date( ) );			//时间戳yyyyMMddHHmmss
			String token = Hex.encodeHexString( new Md5( ).encrypt( UserId + time + Password ) );	//拼接Token
			
	        URL realUrl = new URL(baseUrl + "/mtsms/"+UserId+"/"+token);							//拼接URL
	        // 打开和URL之间的连接
	        httpURLConnection = (HttpURLConnection) realUrl.openConnection();
	        
			String str = UserId + ":" + time;
			byte[] datas = str.getBytes("GBK");
	        String authorization = new String(Base64.encodeBase64(datas));	   						//Base64加密
	     	// 设置通用的请求属性
	        httpURLConnection.setRequestProperty("accept", "application/json");
	        httpURLConnection.setRequestProperty("Content-Type", "application/json;charset=utf-8");
	        httpURLConnection.setRequestProperty("Authorization", authorization);
	        httpURLConnection.setDoOutput(true);
	        httpURLConnection.setDoInput(true);
	        // 获取URLConnection对象对应的输出流
	        printWriter = new PrintWriter(httpURLConnection.getOutputStream());
	        // 发送请求参数
	        printWriter.write(json);
	        // flush输出流的缓冲
	        printWriter.flush();
	        // 根据ResponseCode判断连接是否成功
	        int responseCode = httpURLConnection.getResponseCode();
	        if (responseCode != 200) {
	            responseResult = " Error===" + responseCode;
	        } 
	        // 定义BufferedReader输入流来读取URL的ResponseData
	        bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
	        String line;
	        while ((line = bufferedReader.readLine()) != null) {
	            responseResult += line;
	        }
	    } catch (Exception e) {
	        responseResult = "send post request error!" + e;
	    } finally {
	        httpURLConnection.disconnect();
	        try {
	            if (printWriter != null) {
	                printWriter.close();
	            }
	            if (bufferedReader != null) {
	                bufferedReader.close();
	            }
	        } catch (IOException ex) {
	            ex.printStackTrace();
	        }
	
	    }
	    return responseResult;
	}

	/*
	 *  MD5加密
	 */
	public static class Md5 {
		MessageDigest alg;

		public Md5( ) {
			try {
				alg = MessageDigest.getInstance( "MD5" );
			} catch( Exception ex ) {
				ex.printStackTrace( );
			}
		}

		public byte[] encrypt( String key ) {
			return computeDigest( key.getBytes( ) );
		}

		public byte[] computeDigest( byte[] b ) {
			try {
				alg.reset( );
				alg.update( b );
				byte[] hash = alg.digest( ); // 得到摘要
				return hash;
			} catch( Exception ex ) {
				ex.printStackTrace( );
				return null;
			}
		}

	}
	
	/*
	 *Post数据提交类
	 */
	public static class CHIFMtSmsSubmit {
		private String Cli_Msg_Id;
		private Integer Pk_total;
		private Integer Pk_number;
		private Integer Registered_Delivery;
		private Integer Msg_level;
		private String Service_Id;
		private Integer TP_pId;
		private Integer TP_udhi;
		private Integer Msg_Fmt;
		private String Msg_src;
		private String Src_Id;
		private String[] Dest_terminal_Id;
		private byte[] Msg_Content;
	
		public static CHIFMtSmsSubmit fromJson( String json ) {
			return new GsonBuilder( ).create( ).fromJson( json, CHIFMtSmsSubmit.class );
		}
	
		public static CHIFMtSmsSubmit fromJson( Reader jsonReader ) {
			return new GsonBuilder( ).create( ).fromJson( jsonReader, CHIFMtSmsSubmit.class );
		}
	
		public String toJson( ) {
			return new GsonBuilder( ).create( ).toJson( this );
		}
	
		public String getCli_Msg_Id( ) {
			return Cli_Msg_Id;
		}
	
		public void setCli_Msg_Id( String cli_Msg_Id ) {
			Cli_Msg_Id = cli_Msg_Id;
		}
	
		public Integer getPk_total( ) {
			return Pk_total;
		}
	
		public void setPk_total( Integer pk_total ) {
			Pk_total = pk_total;
		}
	
		public Integer getPk_number( ) {
			return Pk_number;
		}
	
		public void setPk_number( Integer pk_number ) {
			Pk_number = pk_number;
		}
	
		public Integer getRegistered_Delivery( ) {
			return Registered_Delivery;
		}
	
		public void setRegistered_Delivery( Integer registered_Delivery ) {
			Registered_Delivery = registered_Delivery;
		}
	
		public Integer getMsg_level( ) {
			return Msg_level;
		}
	
		public void setMsg_level( Integer msg_level ) {
			Msg_level = msg_level;
		}
	
		public String getService_Id( ) {
			return Service_Id;
		}
	
		public void setService_Id( String service_Id ) {
			Service_Id = service_Id;
		}
	
		public Integer getTP_pId( ) {
			return TP_pId;
		}
	
		public void setTP_pId( Integer tP_pId ) {
			TP_pId = tP_pId;
		}
	
		public Integer getTP_udhi( ) {
			return TP_udhi;
		}
	
		public void setTP_udhi( Integer tP_udhi ) {
			TP_udhi = tP_udhi;
		}
	
		public Integer getMsg_Fmt( ) {
			return Msg_Fmt;
		}
	
		public void setMsg_Fmt( Integer msg_Fmt ) {
			Msg_Fmt = msg_Fmt;
		}
	
		public String getMsg_src( ) {
			return Msg_src;
		}
	
		public void setMsg_src( String msg_src ) {
			Msg_src = msg_src;
		}
	
		public String getSrc_Id( ) {
			return Src_Id;
		}
	
		public void setSrc_Id( String src_Id ) {
			Src_Id = src_Id;
		}
	
		public String[] getDest_terminal_Id( ) {
			return Dest_terminal_Id;
		}
	
		public void setDest_terminal_Id( String[] dest_terminal_Id ) {
			Dest_terminal_Id = dest_terminal_Id;
		}
	
		public byte[] getMsg_Content( ) {
			return Msg_Content;
		}
	
		public void setMsg_Content( byte[] msg_Content ) {
			Msg_Content = msg_Content;
		}
	}
%>


<%
    String m = request.getParameter("m");
    if (m.equals("mt")) {
        out.println(postMt());
    } else if(m.equals("queryamtf")) {
        out.println(postQueryamtf());
    }
%>