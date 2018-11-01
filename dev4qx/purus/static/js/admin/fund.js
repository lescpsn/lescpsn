$(function () {
    var select_class = 'btn-info';

    var re_value = /^[0-9]{1,8}(\.[0-9]{1,3})?$/;
    var re_token = /[0-9]{6}/;

    $("#form_value").change(function () {
        $("#form_value").removeClass("error");
        $("#for_value").text('');
    });
    $("#form_token").change(function () {
        $("#form_token").removeClass("error");
        $("#for_token").text('');
    });

    var valid = function (e) {
        var value = $("#form_value").val();
        if (!re_value.test(value)) {
            $("#form_value").addClass("error");
            $("#for_value").text("请输入正确的金额");
        }
        var token = $("#form_token").val();
        if (!re_token.test(token)) {
            $("#form_token").addClass("error");
            $("#for_token").text("请输入六位数字");
            return false;
        }
        return true;
    };


    function upDigit(n) {
        var fraction = ['角', '分', '厘'];
        var digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
        var unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];
        var head = n < 0 ? '欠' : '';
        n = Math.abs($("#form_value").val());
        var s = '';
        for (var i = 0; i < fraction.length; i++) {
            s += (digit[Math.floor(n * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
        }
        s = s || '整';
        n = Math.floor(n);
        for (var i = 0; i < unit[0].length && n > 0; i++) {
            var p = '';
            for (var j = 0; j < unit[1].length && n > 0; j++) {
                p = digit[n % 10] + unit[1][j] + p;
                n = Math.floor(n / 10);
            }
            s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
        }
        $("#newnumber").val(head + s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整'))
    }

    $("#form_value").keyup(function () {
        var f_v = $("#form_value").val();
        upDigit(f_v);
    });


    $("#act_query").click(function () {
        var order_id = $("#form_order_id").val();
        var user_id = $("#form_user_id").val();

        var q = '/admin/fund/order?order_id=' + order_id + "&user_id=" + user_id;

        $.get(q, function (data) {
            if (data.status == 'ok') {
                var i = parseInt(data.value) / 10000;
                $("#form_value").val(i);

                if ($("#form_notes").val() == "") {
                    $("#form_notes").val('订单' + data.order_id + '退款' + i + '元');
                }
            } else {
                alert("订单查询失败，请到订单查询界面核对");
            }
        }, 'json').fail(function (e) {
            alert("查询失败");
        });
    });

    $("#act_adding").click(function (e) {

        if (!valid()) return;

        var type = $("#form_type").val();
        var value = $("#form_value").val();
        var token = $("#form_token").val();
        var operator = $("#form_operator").val();
        var user_id = $("#form_user_id").val();
        var order_id = $("#form_order_id").val();
        var notes = $("#form_notes").val();

        //////////
        $("#act_adding").attr('disabled', 'true');
        var data = {
            type: type,
            order_id: order_id,
            operator: operator,
            income: value,
            token: token,
            user_id: user_id,
            notes: notes
        };

        $.post('/admin/fund', JSON.stringify(data)).done(function (data) {
            var m = JSON.parse(data);
            alert(m.msg);
        }).fail(function () {
            alert('fail');
        }).always(function () {
            $("#act_adding").removeAttr('disabled');
        });
    });

    $("#form_type").change(function () {
        if ($("#form_type").val() == 'refund-manual') {
            $("#form_order").show(200);
            $("#form_value").prop('readonly', true);
        } else {
            $("#form_order").hide(200);
            $("#form_value").prop('readonly', false);
        }
    });

    $("#form_order").hide();

    $('#form_user_id').selectpicker({});
});