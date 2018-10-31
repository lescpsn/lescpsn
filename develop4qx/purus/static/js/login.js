$(function () {

    var reload_img = function () {
        $("#img-captcha").attr("src", "/auth/captcha.jpg?t=" + new Date().getTime());
    };

    $("div.input-group input").focus(function () {
        $("div.message").empty();
    });

    $("#loginBtn").click(function () {

        if ($(this).attr('disabled') == 'true') {
            return;
        }

        $(this).attr('disabled', 'true');

        var username = $("#username").val();
        var password = $("#password").val();
        var captcha = $("#captcha").val();

        var data = JSON.stringify({
            'user': username,
            'password': password,
            'captcha': captcha
        });

        $.post("/auth/login", data)
            .done(function (data) {
                data = JSON.parse(data);
                if (data.status && data.status == 'ok') {
                    window.location.replace("/dashboard");
                } else {
                    $("div.message").empty()
                        .append('<label class="error">' + data.msg + '</label>')
                    reload_img();
                    $("#loginBtn").removeAttr('disabled');
                }
            }).fail(function (data) {
                alert('网络异常，请重试');
                $("#loginBtn").removeAttr('disabled');
            });
        return false;
    });

    $("#img-captcha").click(reload_img);

    $('#username').keypress(function (e) {
        if (e.which == 13) {
            $("#password").focus();
        }
    });

    $('#password').keypress(function (e) {
        if (e.which == 13) {
            $("#captcha").focus();
        }
    });

    $('#captcha').keypress(function (e) {
        if (e.which == 13) {
            $("#loginBtn").click();
        }
    });


});