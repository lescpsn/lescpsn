var Script = function () {
    $('#form_range').daterangepicker({
            ranges: {
                '今天': [moment().startOf('days'), moment().startOf('days').add('days', 1)],
                '昨天': [moment().startOf('days').subtract('days', 1), moment().startOf('days')],
                '最近7天': [moment().startOf('days').subtract('days', 6), moment().startOf('days').add('days', 1)],
                '最近30天': [moment().startOf('days').subtract('days', 29), moment().startOf('days').add('days', 1)],
                '本月': [moment().startOf('month'), moment().startOf('month').add('month', 1)],
                '上月': [moment().subtract('month', 1).startOf('month'), moment().startOf('month')]
            },
            opens: 'left',
            format: 'YYYY/MM/DD HH:mm:ss',
            separator: ' - ',
            startDate: moment().add('days', -29),
            endDate: moment(),
            minDate: '2014/01/01',
            maxDate: '2025/12/31',
            timePicker: true,
            timePickerIncrement: 10,
            timePicker12Hour: false,
            locale: {
                applyLabel: '确认',
                cancelLabel:'取消',
                fromLabel: '从',
                toLabel: '至',
                customRangeLabel: '自定义',
                daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
                monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                firstDay: 1
            },
            showWeekNumbers: false
        },
        function (start, end) {
            //alert(typeof(start))
            $('#form_range_start').val(moment(start).format('YYYY/MM/DD HH:mm:ss'));
            $('#form_range_end').val(moment(end).format('YYYY/MM/DD HH:mm:ss'));
        });

    // init
    var startDate = moment().startOf('days');
    var endDate = moment().startOf('days').add('days', 1);
    $('#form_range').data('daterangepicker').setStartDate(startDate);
    $('#form_range').data('daterangepicker').setEndDate(endDate);
    $('#form_range_start').val(startDate.format('YYYY/MM/DD HH:mm:ss'));
    $('#form_range_end').val(endDate.format('YYYY/MM/DD HH:mm:ss'));

    var query_data = null;

    var fn_query = function (src) {

        var data = {};
        if ($(this).attr('index') && query_data) {
            // console.info($(this).attr('index'))
            data = query_data;
            data.page = $(this).attr('index')
        } else {
            data = {
                number: $('#form_number').val(),
                start: $('#form_range_start').val(),
                end: $('#form_range_end').val(),
                //batch: $('#form_batch').val(),
                result: $('#form_result').val(),
                id: $('#form_order_id').val(),
                sp_id: $('#form_sp_order_id').val(),
                carrier: $('#form_carrier').val(),
                area: $('#form_area').val(),
                page: 1,
                size: 50
            };

            if ($("#form_user_id")) {
                data.user_id = $("#form_user_id").val();
            }
        }

        // console.info(data.page)
        query_data = data;
        $.post(_url, JSON.stringify(query_data)).done(function (data) {
            console.log(data)
            var result = JSON.parse(data);
            if (result.status == 'fail') {
                alert(result.msg);
                return;
            }


            // console.info(JSON.stringify(result))

            $('#order_result > tbody > tr').remove();

            jQuery.each(result.data, function (idx, elem) {
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
                        .append($('<td>').text(elem['user_name'] || ''))
                        //.append($('<td>').text(elem['notes'] || ''))
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

            group.append('<button class="btn btn-primary disabled" type="button">' + p + '</button>');

            for (i = p + 1; i < p + 5 && i <= max; i++)
                group.append('<button class="btn btn-default" type="button" index="' + i + '">' + i + '</button>')

            if (p < max) {
                group.append('<button class="btn btn-default" type="button" index="' + (p + 1) + '"><i class="icon-forward"></i></button>')
                    .append('<button class="btn btn-default" type="button" index="' + max + '"><i class="icon-fast-forward"></i></button>')
            } else {
                group.append('<button class="btn btn-default disabled" type="button"><i class="icon-forward"></i></button>')
                    .append('<button class="btn btn-default disabled" type="button"><i class="icon-fast-forward"></i></button>')
            }

            $("#page_group button").click(fn_query);

            //export
            if (max > 0)
                $('#act_export').removeAttr('disabled');
            else
                $('#act_export').attr('disabled', 'true');
        }).fail(function (data) {
            alert('查询失败');
        });
    };

    $('#act_query').click(fn_query);

    $('#act_export').click(function (e) {
        if (!query_data) {
            alert('请先执行查询');
            return;
        }

        var url = window.location.pathname + '/export';
        $.post(url, JSON.stringify(query_data)).done(function (data) {
            var result = JSON.parse(data);

            if (result && result.status && result.status == 'ok') {
                window.location.assign('/' + result.path);
            } else {
                alert(result.msg);
            }
        })
    });

    $('#form_user_id').selectpicker({});

    var re_user = new RegExp("user_id=(\\d+)");
    var result = re_user.exec(location.search);
    if (result) {
        $('#form_user_id').selectpicker('val', result[1]);
    }
}();