<%@page import="java.io.BufferedReader"%>
<%@page import="java.io.PrintWriter"%>
<%@ page language="java" contentType="application/json;charset=utf-8"
    pageEncoding="UTF-8"%><%
    try {
        BufferedReader bufReader = request.getReader();
        String buf = bufReader.readLine();
        String[] cmdParm = buf.replace("{", "").replace("}", "").split(":");
        if ("Test".equals(cmdParm[1].replace("\"", ""))) {
            out.print("{Ret:\"0\"}");
        }
    } catch (Exception e) {
        out.print(e);
        out.print("{Ret:\"1\"}");
    }
%>