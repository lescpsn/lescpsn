$(function () {
    var last_head = null;
    var last_prod = null;
    var last_number = null;

    var select_class = 'btn-info';

    var patt1 = new RegExp("[0-9]{0,11}");
    var patt2 = new RegExp("[0-9]{11}");

    var valid = function (e) {
        var number = $("#form_number").val();

        if (last_number == number) return true;

        var number0 = number;

        if (patt1.test(number) == false) {
            $("#form_number").addClass("error");
            return false;
        } else {
            $("#form_number").removeClass("error");
        }

        if (number.length > 11)
            number = number.substr(0, 11);
        if (number.length > 7)
            number = number.substr(0, 7) + ' ' + number.substr(7);
        if (number.length > 3)
            number = number.substr(0, 3) + ' ' + number.substr(3);
        if (number.length == 0)
            number = '请输入号码';

        $("#show_number").text(number);

        if (number0.length >= 7) {
            get_prod(number0);
        } else if (number0.length < 7) {
            $("#show_carrier").text('');
            $("#prod").html('');
        }

        last_number = number0;
        return true;
    };

    var set_prod = function (ret) {
        $("#prod").html("");
        for (var i = 0; i < ret.prod.length; i++) {
            $("#prod").append("<li><input type='hidden' value='" + ret.prod[i]['offer'] + "'/><strong>" + ret.prod[i]['name'] + "</strong><span>采购价格<b class='price'>" + ret.prod[i]['value'] + "</b> 元</span></li>");
        }
        $("#show_carrier").text(ret.name);
        $("#prod li").bind("click", function () {
            $(this).addClass("prod_hover").siblings().removeClass("prod_hover");
        });
    };

    var get_prod = function (number0) {
        if (number0.substr(0, 7) == last_head) {
            set_prod(last_prod);
        } else {
            $.get('/charge/data/single/product?m=' + number0).done(function (data) {
                var ret = JSON.parse(data);
                if (ret && ret.status && ret.status == 'ok') {
                    set_prod(ret);
                    last_head = number0.substring(0, 7);
                    last_prod = ret;
                }
            });
        }
    };

    var query_order = function (sp_order_id, times) {
        console.info('CHECK ' + sp_order_id + '(' + times + ')');

        var data = {page: 1, size: 5};

        $.post('/query/data', JSON.stringify(data)).done(function (data) {
            // alert(data)

            var result = JSON.parse(data);

            if (result.status == 'fail') {
                alert(result.msg);
                return;
            }
            // console.info(JSON.stringify(result))

            $('#order_result > tbody > tr').remove();
            var found = false;
            jQuery.each(result.data, function (idx, elem) {

                if (sp_order_id == elem['sp_id']) {
                    found = true;
                }

                $('#order_result > tbody:last').append(
                    $('<tr>')   //订单编号	订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	订单状态	备注
                        .append($('<td>').text(elem['id']))
                        .append($('<td>').text(elem['sp_id']))
                        .append($('<td>').text(elem['phone']))
                        .append($('<td>').text(elem['name']))
                        .append($('<td>').text(elem['carrier']))
                        .append($('<td>').text(elem['create']))
                        .append($('<td>').text(elem['result']))
                        .append($('<td>').text(elem['update'] || ''))
                        .append($('<td>').text(elem['price']).addClass('text-right'))
                        .append($('<td>').text(elem['value']).addClass('text-right'))
                        .append($('<td>').text(elem['balance'] || '').addClass('text-right'))
                        .append($('<td>').text(elem['notes'] || ''))
                )
            });

            if (sp_order_id && !found && times < 3) {
                window.setTimeout(query_order.bind(this, sp_order_id, times + 1), 5000 * times);
            }
        });
    };

    var single_charge = function (e) {

        var number = $("#form_number").val();

        if (patt2.test(number) == false) {
            $("#form_number").addClass("error");
            $("#for_number").text("请输入正确的手机号码");
            return false;
        } else {
            $("#form_number").removeClass("error");
            $("#for_number").text("");
        }

        var prod = $('#prod li.prod_hover input').val();
        if (!prod || prod.length == 0) {
            alert("请选择充值产品");
            return;
        }

        //////////
        $("#act_charge").attr('disabled', 'true');

        var data = {number: number, prod: prod};
        $.post('/api/latest_check', JSON.stringify(data)).done(function (check) {
            if (check.status && check.status == 'fail') {
                if (!confirm(check.msg)) {
                    $("#act_charge").removeAttr('disabled');
                    return;
                }
            }

            $.post('/charge/data/single', JSON.stringify(data)).done(function (data) {
                console.debug(data);

                var m = JSON.parse(data);
                alert(m.msg);
                if (m.status == 'ok') {
                    $("#form_number").val('');
                }

                window.setTimeout(query_order.bind(this, m.sp_order_id, 1), 3000);

            }).always(function () {
                $("#act_charge").removeAttr('disabled');
            });

        });
    };

    $("#form_number").keyup(valid).mouseup(valid);


    $("#act_charge").click(single_charge);
    $("#act_query").click(query_order);
});