function big_num(num) {
    var x = '';
    while (num.length > 5) {
        x += num.substring(0, 4) + ' ';
        num = num.substring(4)
    }

    x += num;
    return x;
}

var re_order = /^Q[0-9]{22}$/;

$(function () {
    var select_class = 'btn-info';

    var re_token = /[0-9]{6}/;

    var func_set_order = function () {
        var data = $(this).data();
        $('#form_order_id').val(data['id']);
        func_set_info(data);
    };

    var func_unknown = function (e) {

        $("#act_unknown").html($("<img src='/img/loading.gif' />")).attr('disabled', 'true');

        $.post('/admin/card/unknown', '', null, 'text').done(function (d) {
            var resp = JSON.parse(d);

            if (!resp['status'] || resp['status'] != 'ok') {
                return;
            }

            var orders = resp['order'];

            var node_result = $('#order_result');
            node_result.find('tbody > tr').remove();

            jQuery.each(orders, function (idx, order) {
                var card_no = '';
                var status = '';
                for (i = 0; i < order['cards'].length; i++) {
                    card_no += order['cards'][i]['id'] + ' ';
                    status += order['cards'][i]['s'] + ' ';
                }
                var tsp = parseInt(order['tsp']) * 1000;

                node_result.find('tbody:last').append(
                    $('<tr>')   //订单编号	订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	订单状态	备注
                        .append($('<td>').text(status))
                        .append($('<td>').text(order['id']))
                        .append($('<td>').text(order['area']))
                        .append($('<td>').text(order['number']))
                        .append($('<td>').text(order['price']))
                        .append($('<td>').text(card_no))
                        .append($('<td>').text(new Date(tsp).toLocaleString()))
                        .data(order)
                )
            });

            node_result.find('tbody > tr').click(func_set_order);
        }).always(function () {
            $("#act_unknown").text("刷新").removeAttr('disabled');
        });
    };

    var func_query = function (e) {

        var order_id = $("#form_order_id").val();
        if (!re_order.test(order_id)) {
            alert('请检查您输入的订单号');
            return;
        }
        var data = {'order_id': order_id};

        $("#act_query").attr('enabled');

        $.post('/admin/card/single', JSON.stringify(data), null, 'text').done(function (d) {
            var resp = JSON.parse(d);
            var p = $('#card_list').html('');
            if (resp['status'] && resp['order'] && resp['status'] === 'ok') {
                func_set_info(resp['order']);
            }
        }).fail(function () {
            alert('fail');
        }).always(function () {
            $("#act_query").removeAttr('disabled');
        });
    };

    var func_set_info = function (order) {

        var p = $('#card_list').html('');
        p.append($('<h3>').text('号码：' + order['number']));

        if (order['cards'].length && order['cards'].length > 0) {
            for (var i = 0; i < order['cards'].length; i++) {
                p.append($('<h3>').text('卡号：' + big_num(order['cards'][i]['id']) + ' (' + order['cards'][i]['s'] + ')'))
            }

            if (order['audio'].length && order['audio'].length > 0) {
                for (var j = 0; j < order['audio'].length; j++) {
                    p.append($("<p>")
                            .append($('<audio controls>').append($('<source>').attr('src', order['audio'][j]).attr("type", "audio/mpeg")))
                            .append($('<a>').attr('href', order['audio'][j]).attr('target', '_blank').text('第' + (j + 1) + '次.mp3'))
                    );
                }
            }
            if (order['notes'] && order['notes'] != '') {
                p.append($('<h3>').text('语音识别：' + order['notes']));
            }
        } else {
            p.append($('<h3>').text('卡号：没有找到订单对应的卡号'));
        }

        $("#act_query").data(order);
    };

    var func_callback = function (e) {
        var order = $("#act_query").data();
        if (!order) {
            alert('请先选择一个订单或者查询一个订单');
            return;
        }

        if (order['r']) {
            if (confirm('订单：' + order['id'] + '已经有返回值：' + order['r'] + '，如果需要强制回调，请点击取消！')) {
                return;
            }
        }

        var order_id = $("#form_order_id").val();
        if (order_id && order_id != order['id']) {
            alert('输入框中的订单与查询订单不一致，请检查！');
            $("#form_order_id").focus();
            return;
        }

        if (!re_order.test(order_id)) {
            alert('请检查您输入的订单号');
            return;
        }

        var back_result = $("#act_callback").data('result');

        if (!back_result) {
            alert("请先选择返回值！");
            return;
        }

        var last_result = order['cards'][order['cards'].length - 1]['r'];
        if (last_result == 901 && back_result == 903) {
            if (confirm("订单状态为'卡无效'，您选择的是'号码无效'，确定继续么？\n（取消=继续，确定=再想想）")) {
                return;
            }
        }

        if (!confirm('订单号：' + order_id + '，返回值：' + back_result)) {
            return;
        }

        $("#act_callback").attr('disabled', 'true');
        var data = {'order_id': order_id, 'back_result': back_result};
        $.post('/admin/card/callback', JSON.stringify(data), null, 'json').done(function (d) {
            alert(d['msg']);
            // clean
            $("#form_order_id").val('');
            $('#card_list').html('');
            func_unknown();

        }).fail(function () {
            alert('fail');
        }).always(function () {
            $("#act_callback").removeAttr('disabled');
        });
    };

    var func_set_options = function (e) {
        var result = e.data;

        $("#options").find("a").removeClass("btn-info");

        $(this).addClass("btn-info").blur();
        $("#act_callback").data('result', result);
    };

    var on_notification = false;

    var func_unknown_count = function (e) {
        if (on_notification) return;

        $.post('/admin/card/unknown', '', null, 'text').done(function (d) {
            var resp = JSON.parse(d);

            if (!resp['status'] || resp['status'] != 'ok') {
                return;
            }

            var len = resp['order'].length;
            var current = $('#order_result').find('tbody > tr').size();

            if (len != current) {
                if ("Notification" in window) {
                    Notification.requestPermission(function (permission) {
                        if (permission === "granted") {
                            var n = new Notification("有新的未知订单，请刷新(#‵′)");
                            on_notification = true;
                            n.onclick = function () {
                                on_notification = false;
                                func_unknown();
                            };
                        }
                    });
                }
            }
        });
    };

    $("#option_0").click("0", func_set_options);
    $("#option_9").click("9", func_set_options);
    $("#option_903").click("903", func_set_options);

    $("#act_callback").click(func_callback);
    $("#act_query").click(func_query);
    $("#act_unknown").click(func_unknown);

    window.setInterval(func_unknown_count, 30 * 1000);
});