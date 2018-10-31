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
 * 验证客户提供上行URL
 * @author wangy
 *
 */
public class MourlverifyServlet extends HttpServlet {

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
            String buf = bufReader.readLine();
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
            
            String[] cmdParm = buf.replace("{", "").replace("}", "").split(":");
            if ("Test".equals(cmdParm[1].replace("\"", ""))) {
                out.print("{Ret:\"0\"}");
            } else {
                out.print("{Ret:\"1\"}");
            }
        } catch (Exception e) {
            out.print("{Ret:\"1\"}");
        }
        
        out.flush();
        out.close();
    }
}
