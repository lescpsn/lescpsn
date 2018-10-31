var Script = function () {

    //daterange picker
//    $('#reservation').daterangepicker();

    $('#form_range').daterangepicker({
            ranges: {
                '今天': [moment().startOf('days'), moment().endOf('days')],
                '昨天': [moment().startOf('days').subtract('days', 1), moment().endOf('days').subtract('days', 1)],
                '最近7天': [moment().startOf('days').subtract('days', 6), moment().endOf('days')],
                '最近30天': [moment().startOf('days').subtract('days', 29), moment().endOf('days')],
                '本月': [moment().startOf('month'), moment().endOf('month')],
                '上月': [moment().subtract('month', 1).startOf('month'), moment().subtract('month', 1).endOf('month')]
            },
            opens: 'left',
            format: 'YYYY/MM/DD HH:mm:ss',
            separator: ' - ',
            startDate: moment().add('days', -29),
            endDate: moment(),
            minDate: '2014/01/01',
            maxDate: '2015/12/31',
            timePicker: true,
            timePickerIncrement: 10,
            timePicker12Hour: false,
            locale: {
                applyLabel: '确认',
                fromLabel: '从',
                toLabel: '至',
                customRangeLabel: '自定义',
                daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                firstDay: 1
            },
            showWeekNumbers: false
        },
        function (start, end) {
            //alert(typeof(start))
            $('#form_range_start').val(moment(start).format('YYYY/MM/DD HH:mm:ss'))
            $('#form_range_end').val(moment(end).format('YYYY/MM/DD HH:mm:ss'))
        });

    //Set the initial state of the picker label
//    $('#reportrange span').html(moment.add('days', -29 ).toString('MMMM d, yyyy') + ' - ' + Date.today().toString('MMMM d, yyyy'));

    var query_data = null;

    var fn_query = function (src) {

        if ($(this).attr('index') && query_data) {
            // console.info($(this).attr('index'))
            var data = query_data;
            data.page = $(this).attr('index')
        } else {
            var data = {
                number: $('#form_number').val(),
                start: $('#form_range_start').val(),
                end: $('#form_range_end').val(),
                batch: $('#form_batch').val(),
                status: $('#form_status').val(),
                page: 1,
                size: 10
            }
        }

        // console.info(data.page)
        query_data = data;

        $.post('/data/query', JSON.stringify(data)).done(function (data) {
            // alert(data)

            var result = JSON.parse(data);

            if (result.status == 'fail') {
                alert(result.msg);
                return;
            }
            // console.info(JSON.stringify(result))

            $('#order_result > tbody > tr').remove();

            jQuery.each(result.data, function (idx, elem) {
                $('#order_result > tbody:last').append(
                    $('<tr>')   //订单编号	手机号	产品名称	运营商	面值	采购金额	开始时间	状态时间	批次号	订单状态	备注
                        .append($('<td>').text(elem['id']))
                        .append($('<td>').text(elem['phone']))
                        .append($('<td>').text(elem['offer']))
                        .append($('<td>'))
                        .append($('<td>').text(elem['face']))
                        .append($('<td>').text(elem['price']))
                        .append($('<td>').text(elem['create']))
                        .append($('<td>').text(elem['update'] || ''))
                        .append($('<td>').text(elem['batch'] || ''))
                        .append($('<td>').text(elem['status']).addClass(elem['status'] == '失败' ? 'warning' : ''))
                        .append($('<td>').text(elem['notes'] || ''))
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

            for (var i = p + 1; i < p + 5 && i <= max; i++)
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
            alert('error');
        });
    };

    $('#act_query').click(fn_query);

    $('#act_export').click(function (e) {
        $.post('/order/export', JSON.stringify(query_data)).done(function (data) {
            var result = JSON.parse(data);
            window.location.assign('/' + result.path);
        })
    })
}();