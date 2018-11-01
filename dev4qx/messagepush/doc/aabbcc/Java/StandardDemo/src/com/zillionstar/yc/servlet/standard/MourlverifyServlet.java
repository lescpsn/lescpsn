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
//ƽ̨Base URL
// ��ƽ̨�ṩ http://{IP}:{port}/{version}
private static final String baseUrl = "http://ln.pro-group.com.cn:8888/sms.aspx";
// �û�ID
private static final String UserId = "214";
//�����û��ʺ�
private static final String Account = "yuecheng";
//�ʺ�����
private static final String Password = "******";
//ȫ�����к���
private static final String Mobile = "15024379262";
//��������
private static final String Content = "�ֻ�����֤�����   ";
//��ʱ����ʱ��
private static final String SendTime = "";
//������������
private static final String Action = "send";
//�Ƿ������ݰ����Ƿ��ؼ���
private static final String CheckContent = "1";
//��������
private static final String TaskName = "΢�źŰ��ֻ�";
//����������
private static final String CountNumber = "1";
//�ֻ���������
private static final String MobileNumber = "1";
//С��ͨ������������
private static final String TelephoneNumber = "0";

/**
 * ���ѷ�������ѯ�ӿ�
 *
 * @return
 */
public static String postQueryamtf() {
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
        String action="overage";
        //ƴ��URL
        String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s",
        baseUrl,action,UserId,Account,Password);
        URL realUrl = new URL(url);
        // �򿪺�URL֮�������
        httpURLConnection = (HttpURLConnection) realUrl.openConnection();
        httpURLConnection.setDoOutput(true);
        httpURLConnection.setDoInput(true);
        // ����ResponseCode�ж������Ƿ�ɹ�
        int responseCode = httpURLConnection.getResponseCode();
        if (responseCode != 200) {
        responseResult = " Error===" + responseCode;
        }
        // ����BufferedReader����������ȡURL��ResponseData
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
 * �ύ����
 *
 * @return
 */
public static String postMt()  throws Exception{
        BufferedReader bufferedReader = null;
        String responseResult = "";
        HttpURLConnection httpURLConnection = null;					//����HttpURLConnection

        try {
        //ƴ��URL
        String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s&mobile=%s&content=%s&sendTime=%s&taskName=%s&checkcontent=%s&mobilenumber=%s&countnumber=%s&telephonenumber=%s",
        baseUrl,Action,UserId,Account,Password,Mobile,URLEncoder.encode(Content, "utf-8"),SendTime,URLEncoder.encode(TaskName, "utf-8"),CheckContent,MobileNumber,CountNumber,TelephoneNumber);
        URL realUrl = new URL(url);
        // �򿪺�URL֮�������
        httpURLConnection = (HttpURLConnection) realUrl.openConnection();
        httpURLConnection.setDoOutput(true);
        httpURLConnection.setDoInput(true);
        // ����ResponseCode�ж������Ƿ�ɹ�
        int responseCode = httpURLConnection.getResponseCode();
        if (responseCode != 200) {
        responseResult = " Error===" + responseCode;
        }
        // ����BufferedReader����������ȡURL��ResponseData
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
 * �Ƿ��ؼ��ʲ�ѯ
 *
 * @return
 */
public static String queryIllegalKeyword() {
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
        //����
        String action="checkkeyword";
        //ƴ��URL
        String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s&content=%s",
        baseUrl,action,UserId,Account,Password,URLEncoder.encode(Content, "utf-8"));
        URL realUrl = new URL(url);
        // �򿪺�URL֮�������
        httpURLConnection = (HttpURLConnection) realUrl.openConnection();
        httpURLConnection.setDoOutput(true);
        httpURLConnection.setDoInput(true);
        // ����ResponseCode�ж������Ƿ�ɹ�
        int responseCode = httpURLConnection.getResponseCode();
        if (responseCode != 200) {
        responseResult = " Error===" + responseCode;
        }
        // ����BufferedReader����������ȡURL��ResponseData
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
 * ״̬����ӿ�
 *
 * @return
 */
public static String reportStatus() {
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
        String baseUrlAddress="http://ln.pro-group.com.cn:8888/statusApi.aspx";
        //����
        String action="query";
        //ƴ��URL
        String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s",
        baseUrlAddress,action,UserId,Account,Password);
        URL realUrl = new URL(url);
        // �򿪺�URL֮�������
        httpURLConnection = (HttpURLConnection) realUrl.openConnection();
        httpURLConnection.setDoOutput(true);
        httpURLConnection.setDoInput(true);
        // ����ResponseCode�ж������Ƿ�ɹ�
        int responseCode = httpURLConnection.getResponseCode();
        if (responseCode != 200) {
        responseResult = " Error===" + responseCode;
        }
        // ����BufferedReader����������ȡURL��ResponseData
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
 * ״̬����ӿ�
 *
 * @return
 */
public static String reportUpInfo() {
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
        String baseUrlAddress="http://ln.pro-group.com.cn:8888/callApi.aspx";
        //����
        String action="query";
        //ƴ��URL
        String url=String.format("%s?action=%s&userid=%s&account=%s&password=%s",
        baseUrlAddress,action,UserId,Account,Password);
        URL realUrl = new URL(url);
        // �򿪺�URL֮�������
        httpURLConnection = (HttpURLConnection) realUrl.openConnection();
        httpURLConnection.setDoOutput(true);
        httpURLConnection.setDoInput(true);
        // ����ResponseCode�ж������Ƿ�ɹ�
        int responseCode = httpURLConnection.getResponseCode();
        if (responseCode != 200) {
        responseResult = " Error===" + responseCode;
        }
        // ����BufferedReader����������ȡURL��ResponseData
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