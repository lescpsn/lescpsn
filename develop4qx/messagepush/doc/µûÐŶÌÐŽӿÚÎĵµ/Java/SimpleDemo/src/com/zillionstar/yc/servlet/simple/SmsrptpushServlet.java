/**
 * 
 */
package com.zillionstar.yc.servlet.simple;

import java.io.BufferedReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 上行状态报告推送
 * @author wangy
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
            BufferedReader bufReader = req.getReader();
            String buf = "";
            String line;
            while ((line = bufReader.readLine()) != null) {
                buf += line;
            }

            try {
                String path = req.getRealPath("");
                FileWriter fw = new FileWriter(path + "/demo/log.html",true); 
                PrintWriter pw = new PrintWriter(fw);
                pw.println(buf+"<br>");
                pw.close();
                fw.close();
            } catch (IOException e) {
                out.println(e.getMessage());
            }

            String[] parm = buf.replace("{", "").replace("}", "").split(",");

            if (parm[0].split(":")[0].trim().replace("\"", "").equals("Msg_Id")
                && parm[1].split(":")[0].trim().replace("\"", "").equals("Dest_Id")
                && parm[2].split(":")[0].trim().replace("\"", "").equals("Mobile")
                && parm[3].split(":")[0].trim().replace("\"", "").equals("Status")) {
                out.print("{Rspcode:0}");
            } else {
                out.print("{Rspcode:1}");
            }
        } catch (Exception e) {
            out.print("{Rspcode:\"1\"}");
        }
        
        out.flush();
        out.close();
    }
}
