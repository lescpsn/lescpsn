<%@page import="org.apache.jasper.tagplugins.jstl.core.Out"%>
<%@page import="java.net.URLEncoder"%>
<%@page import="java.util.Date"%>
<%@page import="java.security.MessageDigest"%>
<%@page import="java.text.SimpleDateFormat"%>
<%@page import="java.io.Reader"%>
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
    private static final String baseUrl = "http://ln.pro-group.com.cn:8888/sms.aspx";
    // 用户ID
    private static final String UserId = "214";
    //发送用户帐号
    private static final String Account = "yuecheng";
    //帐号密码
    private static final String Password = "******";
    //全部被叫号码 
    private static final String Mobile = "15024379262";
    //发送内容 
    private static final String Content = "手机绑定验证码测试   ";
    //定时发送时间
    private static final String SendTime = "";
    //发送任务命令 
    private static final String Action = "send";
    //是否检查内容包含非法关键字 
    private static final String CheckContent = "1";
    //任务名称 
    private static final String TaskName = "微信号绑定手机";
    //号码总数量 
    private static final String CountNumber = "1";
    //手机号码数量  
    private static final String MobileNumber = "1";
    //小灵通或座机号码数
    private static final String TelephoneNumber = "0";

    /**
     * 余额及已发送量查询接口 
     * 
     * @return
     */
    public static String postQueryamtf() {
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
        	String action="overage";
	    	//拼接URL
	    	String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s",
	    			baseUrl,action,UserId,Account,Password);
	        URL realUrl = new URL(url);	
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
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
	    BufferedReader bufferedReader = null;
	    String responseResult = "";
	    HttpURLConnection httpURLConnection = null;					//创建HttpURLConnection
	    
	    try {			
	    	//拼接URL
	    	String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s&mobile=%s&content=%s&sendTime=%s&taskName=%s&checkcontent=%s&mobilenumber=%s&countnumber=%s&telephonenumber=%s",
	    			baseUrl,Action,UserId,Account,Password,Mobile,URLEncoder.encode(Content, "utf-8"),SendTime,URLEncoder.encode(TaskName, "utf-8"),CheckContent,MobileNumber,CountNumber,TelephoneNumber);
	        URL realUrl = new URL(url);							
	        // 打开和URL之间的连接
	        httpURLConnection = (HttpURLConnection) realUrl.openConnection();
	        httpURLConnection.setDoOutput(true);
	        httpURLConnection.setDoInput(true);
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
     * 非法关键词查询
     * 
     * @return
     */
    public static String queryIllegalKeyword() {
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
        	//方法
        	String action="checkkeyword";
	    	//拼接URL
	    	String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s&content=%s",
	    			baseUrl,action,UserId,Account,Password,URLEncoder.encode(Content, "utf-8"));
	        URL realUrl = new URL(url);	
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
            // 根据ResponseCode判断连接是否成功
            int responseCode = httpURLConnection.getResponseCode();
            if (responseCode != 200) {
                responseResult = " Error===" + responseCode;
            }
            // 定义BufferedReader输入流来读取URL的ResponseData
            bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                responseResult += new String(line.getBytes("gbk"),"UTF-8");
            }
        } catch (Exception e) {
            responseResult = "send post request error!" + e;
        } finally {
            httpURLConnection.disconnect();
            try {
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
     * 状态报告接口 
     * 
     * @return
     */
    public static String reportStatus() {
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
        	String baseUrlAddress="http://ln.pro-group.com.cn:8888/statusApi.aspx";	
        	//方法
        	String action="query";
	    	//拼接URL
	    	String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s",
	    			baseUrlAddress,action,UserId,Account,Password);
	        URL realUrl = new URL(url);	
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
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
     * 状态报告接口 
     * 
     * @return
     */
    public static String reportUpInfo() {
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
        	String baseUrlAddress="http://ln.pro-group.com.cn:8888/callApi.aspx";	
        	//方法
        	String action="query";
	    	//拼接URL
	    	String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s",
	    			baseUrlAddress,action,UserId,Account,Password);
	        URL realUrl = new URL(url);	
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
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
                if (bufferedReader != null) {
                    bufferedReader.close();
                }
            } catch (IOException ex) {
                ex.printStackTrace();
            }
        }
        return responseResult;
    }
%>


<%
    String m = request.getParameter("m");
    if (m.equals("mt")) {
        out.println(postMt());
    } else if(m.equals("queryamtf")) {
        out.println(postQueryamtf());
    }else if(m.equals("queryIllegalKeyword")){
    	out.println(queryIllegalKeyword());
    }else if(m.equals("reportStatus")){
    	out.println(reportStatus());
    }else if(m.equals("reportUpInfo")){
    	out.println(reportUpInfo());
    }
%>