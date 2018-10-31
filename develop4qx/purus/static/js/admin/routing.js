$(function () {

    var fn_status = function (e) {
        elem = e.data;

        var func;
        if (elem['status'] == 'OFF') {
            func = 'ON';
        } else if (elem['status'] == 'ON') {
            func = 'OFF';
        }

        var data = JSON.stringify({id: elem['id'], func: func});
        $.post('/admin/routing/set', data).done(function (d) {
            var resp = JSON.parse(d);

            if (resp && resp.status && resp.status == 'ok') {
                fn_query();
            } else {
                alert(resp.msg);
            }
        });
    };

    var fn_switch = function (e) {
        var user_id = $("#form_user_id").val();
        var carrier = $("#form_carrier").val();
        var price = $("#form_price").val();
        var area = $("#form_area").val();
        var func = e.data;

        var data = JSON.stringify({user_id: user_id, carrier: carrier, price: price, area: area, func: func});

        $.post('/admin/routing/setall', data).done(function (d) {
            var resp = JSON.parse(d);

            if (resp && resp.status && resp.status == 'ok') {
                fn_query();
            } else {
                alert(resp.msg);
            }
        });
    };

    var fn_query = function (e) {

        var user_id = $("#form_user_id").val();
        var carrier = $("#form_carrier").val();
        var price = $("#form_price").val();
        var area = $("#form_area").val();

        var data = JSON.stringify({user_id: user_id, carrier: carrier, price: price, area: area});
        $("#act_query").attr('enabled');

        $.post('/admin/routing/all', data).done(function (d) {
            var m = JSON.parse(d);

            if (m && m.status && m.status == 'ok') {
                $('#routing_table > tbody > tr').remove();
                var p = $('#routing_table > tbody:last');

                jQuery.each(m.routing, function (idx, elem) {
                    var btn = $('<a>').attr('href', '#').click(elem, fn_status);
                    if (elem['status'] == 'OFF') {
                        btn.text(elem['area'] + ' - 开启').addClass('btn btn-info btn-xs');
                    } else if (elem['status'] == 'ON') {
                        btn.text(elem['area'] + ' - 维护').addClass('btn btn-danger btn-xs');
                    }

                    p.append($('<tr>')
                            .append($('<td>').text(elem['user_id']))
                            .append($('<td>').text(elem['carrier']))
                            .append($('<td>').text(elem['area']))
                            .append($('<td>').text(elem['price']))
                            .append($('<td>').text(elem['routing']))
                            .append($('<td>').text(elem['status']))
                            .append($('<td>').append(btn))
                    )
                });
            }
        }).fail(function () {
            alert('fail');
        }).always(function () {
            $("#act_query").removeAttr('disabled');
        });
    };

    $("#act_query").click(fn_query);
    $("#act_switch_on").click('ON', fn_switch);
    $("#act_switch_off").click('OFF', fn_switch);

});