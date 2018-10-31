$(function () {

    var query_data = { status: '', batch: '', page: 1, size: 20 };
    var batch_id = null;

    var do_list = function () {
        $.post('/charge/data/batch/list', JSON.stringify(query_data), 'json')
            .done(function (data) {
                var result = JSON.parse(data);

                $("#batch_list").html('').append($('<option/>').text('请选择一个批次'));

                $.each(result.data, function (idx) {
                    $("#batch_list").append($('<option/>').attr('value', result.data[idx]).text(result.data[idx]))
                });
            });
    };

    do_list();

    $("#act-refresh").click(function () {
        preview()
    });

    $("#status_filter").change(function () {
        preview();
    });

    $("#batch_list").change(function () {
        batch_id = $(this).val();
        query_data['batch'] = batch_id;

        $("#act_charge").text("开始:" + batch_id + ")").removeAttr('disabled');

        preview();
    });

    $("#act_charge").click(function () {
        var data = {'batch_id': batch_id};

        $("#act_charge").attr('disabled', 'true');
        $.post('/charge/data/batch/start', JSON.stringify(data)).done(function (data) {
            alert('1');
            $("#act_charge").removeAttr('disabled');
        })
    });

    var preview = function () {

        if (!query_data['batch'])
            return;

        if ($(this).attr('index')) {
            query_data.page = $(this).attr('index')
        }

        query_data.status = $("#status_filter").val();

        $.post('/charge/data/batch/query', JSON.stringify(query_data)).done(function (data) {

            var result = JSON.parse(data);

            console.info(JSON.stringify(result));

            $('#order_result > tbody > tr').remove();

            jQuery.each(result.data, function (idx, elem) {
                $('#order_result > tbody:last').append(
                    $('<tr>')   //订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
                        .append($('<td>').text(elem['mobile']))
                        .append($('<td>').text(elem['price']))
                        .append($('<td>').text(elem['order_id'] || ''))
                        .append($('<td>').text(elem['status']))
                )
            });

            // paging
            var p = parseInt(result.page);
            var max = parseInt(result.max);
            var start = p > 5 ? p - 5 : 1;

            var group = $('#page_group').html('');

            // forward
            if (p > 1) {
                group.append('<button class="btn btn-default" type="button" index="1"><i class="icon-fast-backward"></i></button >')
                    .append('<button class="btn btn-default" type="button" index="' + (p - 1) + '"><i class="icon-backward"></i></button>');
            } else {
                group.append('<button class="btn btn-default disabled" type="button"><i class="icon-fast-backward"></i></button>')
                    .append('<button class="btn btn-default disabled" type="button"><i class="icon-backward"></i></button>');
            }

            for (var i = start; i < p; i++)
                group.append('<button class="btn btn-default" type="button" index="' + i + '">' + i + '</button>')

            group.append('<button class="btn btn-primary disabled" type="button">' + p + '</button>')

            for (var i = p + 1; i < p + 5 && i <= max; i++)
                group.append('<button class="btn btn-default" type="button" index="' + i + '">' + i + '</button>')

            if (p < max) {
                group.append('<button class="btn btn-default" type="button" index="' + (p + 1) + '"><i class="icon-forward"></i></button>')
                    .append('<button class="btn btn-default" type="button" index="' + max + '"><i class="icon-fast-forward"></i></button>')
            } else {
                group.append('<button class="btn btn-default disabled" type="button"><i class="icon-forward"></i></button>')
                    .append('<button class="btn btn-default disabled" type="button"><i class="icon-fast-forward"></i></button>')
            }

            $("#page_group button").click(preview);

        }).fail(function (data) {
            alert('error');
        });
    };

    batch_id = $("#form_batch_id").val();

    var url = '/charge/data/batch/upload';
    $('#fileupload').fileupload({
        url: url,
        dataType: 'json',
        formData: {'batch_id': batch_id},

        change: function (e, data) {
            $.each(data.files, function (index, file) {
                $("#filename").text(file.name);
            });
        },


        done: function (e, data) {
            if (data.result['status'] == 'ok') {
                batch_id = data.result['batchId'];
                alert('上传成功，批次号' + batch_id);
//                    query_data.batch = batch_id;
                $("#batch_list").prepend($('<option/>').attr('value', batch_id).text(batch_id));
            } else {
                batch_id = null;
                alert(data.result['msg']);
                $("#act_charge").text().attr('disabled', 'true');
            }
        },

        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
//                $('#progress .progress-bar').css(
//                    'width',
//                    progress + '%'
//                );
        }
    });

})