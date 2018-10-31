/**
 * 
 */
package com.zillionstar.yc.servlet.standard;

import java.io.BufferedReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 上行状�?报告推�?
 * @author ZillionStar-Gavin
 *
 */
public class SmsrptpushServlet extends HttpServlet {

    private static final long serialVersionUID = 5387347289366804226L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException,
        IOException {
        doPost(req, resp);
    }

    /**
     * 接收Post请求Url
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException,
        IOException {
        PrintWriter out = resp.getWriter();
        resp.setContentType("application/json;charset=utf-8");
        try {
        	//读取传�?过来的Postt数据
            BufferedReader bufReader = req.getReader();
            String buf = "";
            String line;
            while ((line = bufReader.readLine()) != null) {
                buf += line;
            }

            try {
            	//�?��编写的�?辑，这里是例子（数据库操作等在此编写�?
                String path = req.getRealPath("");								//获取web项目根目�?
                FileWriter fw = new FileWriter(path + "/demo/log.html",true); 	//日志输入文件 
                PrintWriter pw = new PrintWriter(fw);							//写入日志文件
                pw.println(buf+"<br>");
                pw.close();
                fw.close();
            } catch (IOException e) {
                out.println(e.getMessage());
            }

            String[] parm = buf.replace("{", "").replace("}", "").split(",");	//截取Json数据
            if (parm[0].split(":")[0].trim().replace("\"", "").equals("Msg_Id")
                && parm[1].split(":")[0].trim().replace("\"", "").equals("Dest_Id")
                && parm[2].split(":")[0].trim().replace("\"", "").equals("Src_terminal_Id")
                && parm[3].split(":")[0].trim().replace("\"", "").equals("Stat")) {
                out.print("{Rspcode:0}");
            } else {
                out.print("{Rspcode:1}");
            }
        } catch (Exception e) {
            out.print("{Rspcode:1}");
        }
        
        out.flush();
        out.close();
    }
}
