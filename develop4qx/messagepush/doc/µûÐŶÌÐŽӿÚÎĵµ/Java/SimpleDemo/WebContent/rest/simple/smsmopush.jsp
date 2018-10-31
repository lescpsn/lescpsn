<%@page import="java.io.IOException"%><%@page import="java.io.FileWriter"%><%@page import="java.io.BufferedReader"%><%@page import="java.io.PrintWriter"%><%@ page language="java" contentType="application/json;charset=utf-8" pageEncoding="UTF-8"%><%
    try {
        BufferedReader bufReader = request.getReader();
        String buf = "";
        String line;
        while ((line = bufReader.readLine()) != null) {
            buf += line;
        }

        try {
            String path = request.getRealPath("");
            FileWriter fw = new FileWriter(path + "/demo/log.html",true); 
            PrintWriter pw = new PrintWriter(fw);
            pw.println(buf+"<br>");
            pw.close();
            fw.close();
        } catch (IOException e) {
            out.println(e.getMessage());
        }
        
        String[] parm = buf.replace("{", "").replace("}", "").split(",");

        if (parm[0].split(":")[0].trim().replace("\"", "").equals("Msg_Id") &&
            parm[1].split(":")[0].trim().replace("\"", "").equals("Dest_Id") &&
            parm[2].split(":")[0].trim().replace("\"", "").equals("Mobile") &&
            parm[3].split(":")[0].trim().replace("\"", "").equals("Content")) {
            out.print("{Rspcode:0}");
        } else {
            out.print("{Rspcode:1}");
        }
    } catch (Exception e) {
        out.print("{Rspcode:1}");
    }
%>