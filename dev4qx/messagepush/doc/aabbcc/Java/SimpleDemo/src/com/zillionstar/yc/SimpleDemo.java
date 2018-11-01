/**
 *
 */
package com.zillionstar.yc;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.UUID;

/**
 * @author wangy
 */
public class SimpleDemo {
    // 平台Base URL
    // 由平台提供 http://{IP}:{port}/{version}
    // private static final String baseUrlString =
    // "http://121.41.85.249:28080/HIF12";
    private static final String baseUrl = "http://211.149.232.213:28080/HIF12";
    private static final String enterpriseUrl = "http://localhost:8080/yuecheng/rest/simple";
    // 用户ID
    private static final String userId = "http06";
    // 帐号密码
    private static final String password = "******";
    // 短信接收端手机号码集合，用半角逗号（英文逗号）分开，每批发 送的手机号数量不得超过不能超过客户设置带宽。
    // 通常以20个号码做为上限。
    // 手机号建议不重复，不强制限制
    private static final String mobile = "13466566405";
    // 短信内容，UTF-8 编码字符串，单条通常为 65 汉字以内（根据签 名规则不同），超过限制字数会被分拆，
    // 同时计费条数会根据最终拆 分条数计算，具体由平台拆分结果确定。
    private static final String content = "确定";

    /**
     * @param args
     */
    public static void main(String[] args) {
//         System.out.println(postMt());
//         System.out.println(postQueryamtf());
//        System.out.println(postMourlverify());
//        System.out.println(postSmsmopush());
//        System.out.println(postSmsrptpush());

    }

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
            URL realUrl = new URL(baseUrl + "/queryamtf/" + userId);
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            // 设置通用的请求属性
            httpURLConnection.setRequestProperty("accept", "application/json");
            httpURLConnection.setRequestProperty("Content-Type", "application/json;charset=utf-8");
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
            // 获取URLConnection对象对应的输出流
            printWriter = new PrintWriter(httpURLConnection.getOutputStream());
            // flush输出流的缓冲
            printWriter.flush();
            // 根据ResponseCode判断连接是否成功
            int responseCode = httpURLConnection.getResponseCode();
            if (responseCode != 200) {
                System.err.println(" Error===" + responseCode);
            } else {
//                System.out.println("Post Success!");
            }
            // 定义BufferedReader输入流来读取URL的ResponseData
            bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                responseResult += line;
            }
        } catch (Exception e) {
            System.err.println("send post request error!" + e);
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
    public static String postMt() {
        PrintWriter printWriter = null;
        BufferedReader bufferedReader = null;
        String responseResult = "";
        StringBuffer params = new StringBuffer();
        HttpURLConnection httpURLConnection = null;

        Map<String, Object> requestParamsMap = new HashMap<String, Object>();
        requestParamsMap.put("Userid", userId);
        requestParamsMap.put("Passwd", password);
        requestParamsMap.put("Cli_Msg_Id", UUID.randomUUID());
        requestParamsMap.put("Mobile", mobile);
        requestParamsMap.put("Content", content);

        Iterator<Entry<String, Object>> it = requestParamsMap.entrySet().iterator();
        params.append("{");
        while (it.hasNext()) {
            Map.Entry element = (Map.Entry) it.next();
            params.append("\"" + element.getKey() + "\"" + ":\"" + element.getValue() + "\",");
        }
        params.deleteCharAt(params.lastIndexOf(","));
        params.append("}");

        try {
            URL realUrl = new URL(baseUrl + "/mt");
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            // 设置通用的请求属性
            httpURLConnection.setRequestProperty("accept", "application/json");
            httpURLConnection.setRequestProperty("Content-Type", "application/json;charset=utf-8");
            httpURLConnection.setRequestProperty("Content-Length", String.valueOf(params.length()));
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
            // 获取URLConnection对象对应的输出流
            printWriter = new PrintWriter(httpURLConnection.getOutputStream());
            // 发送请求参数
            printWriter.write(params.toString());
            // flush输出流的缓冲
            printWriter.flush();
            // 根据ResponseCode判断连接是否成功
            int responseCode = httpURLConnection.getResponseCode();
            if (responseCode != 200) {
                System.err.println(" Error===" + responseCode);
            } else {
//                System.out.println("Post Success!");
            }
            // 定义BufferedReader输入流来读取URL的ResponseData
            bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                responseResult += line;
            }
        } catch (Exception e) {
            System.err.println("send post request error!" + e);
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
     * 上行URL验证
     *
     * @return
     */
    public static String postMourlverify() {
        PrintWriter printWriter = null;
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;

        try {
            URL realUrl = new URL(enterpriseUrl + "/index.jsp");
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            // 设置通用的请求属性
            httpURLConnection.setRequestProperty("accept", "application/json");
            httpURLConnection.setRequestProperty("Content-Type", "application/json;charset=utf-8");
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
            // 获取URLConnection对象对应的输出流
            printWriter = new PrintWriter(httpURLConnection.getOutputStream());
            // 发送请求参数
            printWriter.write("{\"Cmd\":\"Test\"}");
            // flush输出流的缓冲
            printWriter.flush();
            // 根据ResponseCode判断连接是否成功
            int responseCode = httpURLConnection.getResponseCode();
            if (responseCode != 200) {
                System.err.println(" Error===" + responseCode);
            } else {
//                System.out.println("Post Success!");
            }
            // 定义BufferedReader输入流来读取URL的ResponseData
            bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                responseResult += line;
            }
        } catch (Exception e) {
            System.err.println("send post request error!" + e);
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
     * 上行短信推送
     *
     * @return
     */
    public static String postSmsmopush() {
        PrintWriter printWriter = null;
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;
        StringBuffer params = new StringBuffer();

        Map<String, Object> requestParamsMap = new LinkedHashMap<String, Object>();
        requestParamsMap.put("Msg_Id", UUID.randomUUID());// 信息标识
        requestParamsMap.put("Dest_Id", "106901110001");// 用户上行服务号
        requestParamsMap.put("Mobile", mobile);
        requestParamsMap.put("Content", content);

        Iterator<Entry<String, Object>> it = requestParamsMap.entrySet().iterator();
        params.append("{");
        for (String key : requestParamsMap.keySet()) {
            params.append("\"" + key + "\"" + ":\"" + requestParamsMap.get(key) + "\",");
        }
        params.deleteCharAt(params.lastIndexOf(","));
        params.append("}");

        try {
            URL realUrl = new URL(enterpriseUrl + "/smsmopush.jsp");
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            // 设置通用的请求属性
            httpURLConnection.setRequestProperty("accept", "application/json");
            httpURLConnection.setRequestProperty("Content-Type", "application/json;charset=utf-8");
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
            // 获取URLConnection对象对应的输出流
            printWriter = new PrintWriter(httpURLConnection.getOutputStream());
            // 发送请求参数
            printWriter.write(params.toString());
            // flush输出流的缓冲
            printWriter.flush();
            // 根据ResponseCode判断连接是否成功
            int responseCode = httpURLConnection.getResponseCode();
            if (responseCode != 200) {
                System.err.println(" Error===" + responseCode);
            } else {
//                System.out.println("Post Success!");
            }
            // 定义BufferedReader输入流来读取URL的ResponseData
            bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                responseResult += line;
            }
        } catch (Exception e) {
            System.err.println("send post request error!" + e);
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
     * 上行状态报告推送
     *
     * @return
     */
    public static String postSmsrptpush() {
        PrintWriter printWriter = null;
        BufferedReader bufferedReader = null;
        String responseResult = new String();
        HttpURLConnection httpURLConnection = null;
        StringBuffer params = new StringBuffer();

        Map<String, Object> requestParamsMap = new LinkedHashMap<String, Object>();
        requestParamsMap.put("Msg_Id", UUID.randomUUID());// 信息标识
        requestParamsMap.put("Dest_Id", "106901110001");// 用户上行服务号
        requestParamsMap.put("Mobile", mobile);
        requestParamsMap.put("Status", "DELIVRD");

        params.append("{");
        for (String key : requestParamsMap.keySet()) {
            params.append("\"" + key + "\"" + ":\"" + requestParamsMap.get(key) + "\",");
        }
        params.deleteCharAt(params.lastIndexOf(","));
        params.append("}");

        try {
            URL realUrl = new URL(enterpriseUrl + "/smsrptpush.jsp");
            // 打开和URL之间的连接
            httpURLConnection = (HttpURLConnection) realUrl.openConnection();
            // 设置通用的请求属性
            httpURLConnection.setRequestProperty("accept", "application/json");
            httpURLConnection.setRequestProperty("Content-Type", "application/json;charset=utf-8");
            httpURLConnection.setDoOutput(true);
            httpURLConnection.setDoInput(true);
            // 获取URLConnection对象对应的输出流
            printWriter = new PrintWriter(httpURLConnection.getOutputStream());
            // 发送请求参数
            printWriter.write(params.toString());
            // flush输出流的缓冲
            printWriter.flush();
            // 根据ResponseCode判断连接是否成功
            int responseCode = httpURLConnection.getResponseCode();
            if (responseCode != 200) {
                System.err.println(" Error===" + responseCode);
            } else {
//                System.out.println("Post Success!");
            }
            // 定义BufferedReader输入流来读取URL的ResponseData
            bufferedReader = new BufferedReader(new InputStreamReader(httpURLConnection.getInputStream()));
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                responseResult += line;
            }
        } catch (Exception e) {
            System.err.println("send post request error!" + e);
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
}
