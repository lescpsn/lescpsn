$(function () {

    function error_msg(msg) {
        var node = $('<div class="alert alert-block alert-danger fade in">' +
            '<button data-dismiss="alert" class="close close-sm" type="button"><i class="icon-remove"></i></button>' +
            '<strong>' + msg + '</strong></div>');


        $("#panel").prepend(node);


        // <strong>Oh snap!</strong>
    }

    $("div.input-group input").focus(function () {
        $("div.message").empty();
    });

    $("#act_change").click(function () {

        $(this).attr('disabled', 'true');

        var old_pass = $("#old_pass").val();
        var new_pass = $("#new_pass").val();
        var new_pass_2 = $("#new_pass_2").val();
        var captcha = $("#captcha").val();

        if (old_pass.length == 0 || new_pass.length == 0 || captcha.length != 4) {
            error_msg('请输入正确的密码');
            return;
        }

        if (new_pass != new_pass_2) {
            error_msg('两次输入的密码不一致');
            return;
        }

        var data = JSON.stringify({
            'old_pass': old_pass,
            'new_pass': new_pass,
            'captcha': captcha
        });

        $.post("/auth/password", data)
            .done(function (data) {
                data = JSON.parse(data);
                if (data.status && data.status == 'ok') {
                    alert('密码修改成功！');
                    window.location.replace("/dashboard");
                } else {
                    error_msg(data.msg);
                    reload_img();
                    $("#act_change").removeAttr('disabled');
                }
            }).fail(function (data) {
                error_msg('网络异常，请重试');
                $("#act_change").removeAttr('disabled');
            });

        return false;
    });

    var reload_img = function () {
        $("#captcha-img").attr("src", "/auth/captcha.jpg?t=" + new Date().getTime());
    };

    $("#captcha-img").click(reload_img);
});