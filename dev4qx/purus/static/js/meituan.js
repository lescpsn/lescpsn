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
                batch: $('#form_batch').val(),
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

        $.post(_url, JSON.stringify(data)).done(function (data) {
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

    //确定操作警告框
    var CheckOperationWindow = function(opera_name, request_type, meituan_order_id, product_id){

        $('#screen_block').show();
        $("#check_operation_window").html("");

        container = $("<p>确定进行<span>"+ opera_name +"</span>操作吗?</p>");
        $("#check_operation_window").append(container);

        container = $("<p>");
        confirm_button = $("<a class='btn btn-danger' href='javascript:;'>确定</a>");
        confirm_button.click(function(){
            OrderOperator(request_type, meituan_order_id, product_id);
            $('#check_operation_window').hide();
        });
        container.append(confirm_button);

        cancle_button = $("<a class='btn btn-default' href='javascript:;'>取消</a>");
        cancle_button.click( function(){
             $('#screen_block').hide();
             $('#check_operation_window').hide();
         })
        container.append(cancle_button);

         $("#check_operation_window").append(container);
         $("#check_operation_window").show();
    }

    //全局变量用于存储当前选择的页面
    var g_request_type = null;
    var g_filter_conditions = new Object();

    //处理订单操作
    var OrderOperator = function(request_type,meituan_order_id, product_id){
        var request_data = JSON.stringify({
            "request_type":request_type,
            "meituan_order_id":meituan_order_id,
            "product_id":product_id,
        });

        $.post("/admin/meituan",request_data)
        .done(function(result){
            GetOrderList(g_request_type,g_filter_conditions);
            $('#screen_block').hide();
        })
        .fail(function(){});
    };

    //显示套餐列表
    var ShowProductList = function(meituan_order_id, product_name){
        var request_data = JSON.stringify({
            "request_type":"get_product_list",
        });
        $.post("/admin/meituan",request_data)
        .done(function(result){
            data = JSON.parse(result);

            if (data.status && data.status == 'ok')
            {
                $('#product_list_window').html("");

                //原来的产品
                container = $("<p><b>原来的产品：</b><span class='price_color' id='product_before_change'>"+product_name+"</span></p>");
                $('#product_list_window').append(container);

                //修改后的产品
                //下拉列表
                product_select_list = $("<select id='product_select_list'>")
                //alert( JSON.stringify(data.product_list) );
                jQuery.each(data.product_list, function (idx, product) {

                    product_select_list.append('<option ' + 'id=' + product.product_id +'>' +
                                            product.name+
                                            '</option>');
                });
                container = $("<span id='product_after_change'></span>");
                container.append(product_select_list);

                container2 = $("<p><b>修改后的产品：</b></p>");
                container2.append(container);

                $('#product_list_window').append(container2);


                //按钮
                container = $("<p>");
                confirm_button = $("<a class='btn btn-danger' href='javascript:;'>确定</a>");
                confirm_button.click(function(){
                    OrderOperator("change_order",meituan_order_id,$("#product_select_list option:selected").attr("id") );
                    $('#product_list_window').hide();
                });
                container.append(confirm_button);

                cancle_button = $("<a class='btn btn-default' href='javascript:;'>取消</a>");
                cancle_button.click( function(){ $('#product_list_window').hide();$('#screen_block').hide();})
                container.append(cancle_button);

                $('#product_list_window').append(container);

                $('#screen_block').show();
                $('#product_list_window').show();
            }
            else
            {
                alert("获取产品列表失败");
            }
        })
        .fail(function(){});
    };

    //过滤查询按钮事件处理
    $('#act_query').click(function(){
        g_filter_conditions.mobile = $('#form_number').val();
        g_filter_conditions.start_time = $('#form_range_start').val();
        g_filter_conditions.end_time = $('#form_range_end').val();
        g_filter_conditions.page_index = 1;

        $("#get_unfinish_order_list").addClass("col_on").siblings().removeClass("col_on");
        GetOrderList("get_unfinish_order_list", g_filter_conditions);
    });

    //读取订单列表
    var GetOrderList = function(request_type, filter_conditions){
        var request_data = JSON.stringify({
            "request_type":request_type,
            "filter_conditions":filter_conditions,
        });

        $('#order_result > tbody:last').html("");
        $("#unfinish_size").html(0);
        $("#ready_size").html(0);
        $("#fail_size").html(0);

        g_request_type = request_type;

        $.post("/admin/meituan",request_data)
        .done(function(result){
            data = JSON.parse(result);
            //alert(JSON.stringify(data));
            if (data.status && data.status == 'ok') {

                $("#unfinish_size").html(data.order_sizes.unfinish_size);
                $("#ready_size").html(data.order_sizes.ready_size);
                $("#fail_size").html(data.order_sizes.fail_size);

                $('#order_result > tbody:last').html("");

                jQuery.each(data.order_list, function (idx, elem) {

                   //状态和操作栏
                   var status = "未知";
                   var operation = $("<div></div>");
                   if(elem['charge_state'] == "ready")  //待充值
                   {
                       status = "待充值";
                       operation1= $("<a href='#'>提交</a>");
                       //operation1.click( function(){ OrderOperator("submit_order", elem['meituan_order_id']); });
                       operation1.click( function(){ CheckOperationWindow("提交", "submit_order", elem['meituan_order_id']); });
                       operation.append(operation1);

                       operation.append(" ");

                       operation2= $("<a href='#'>修改</a>");
                       operation2.click( function(){ ShowProductList(elem['meituan_order_id'],elem['product_name']); });
                       operation.append(operation2);

                        operation.append(" ");

                       operation3= $("<a href='#'>删除</a>");
                       operation3.click( function(){ CheckOperationWindow("删除", "delete_order", elem['meituan_order_id']); });
                       operation.append(operation3);
                   }
                   else if(elem['charge_state'] == "fail")  //待退款
                   {
                       status = "待退款";
                       operation1= $("<a href='#'>退款</a>");
                       operation1.click( function(){ CheckOperationWindow("退款", "refund_order", elem['meituan_order_id']); } );
                       operation.append(operation1);
                   }

                    $('#order_result > tbody:last').append(
                        $('<tr>')
                            .append($('<td class="text-center">').text(elem['meituan_order_id']))  //订单编号
                            .append($('<td class="text-center">').text(elem['mobile']))  //手机号
                            .append($('<td class="text-center">').text(elem['product_name'])) //产品名称
                            .append($('<td class="text-center">').text(elem['carrier'])) //运营商
                            .append($('<td class="text-center">').text(elem['value'])) //面值
                            .append($('<td class="text-center price_color">').text(elem['purchase_price'])) //采购金额
                            .append($('<td class="text-center">').text(elem['create_time']))  //开始时间
                            .append($('<td class="text-center">').text(elem['state_time'] || ''))  //状态时间
                            .append($('<td class="text-center">').text(status+"("+elem['order_state']+")")) //订单状态
                            .append($('<td class="text-center">').text(elem['meituan_sn'] || '')) //团购券密码
                            .append($('<td class="text-center">').append(operation)) //操作
                            .append($('<td class="text-center">').text(elem['remakrs'] || '')) //备注
                    );

                });

                // paging
                var p = parseInt(data.page_index);
                g_filter_conditions.page_index = p;
                var max = parseInt(data.page_count);
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

                $("#page_group button").click(function(){
                    g_filter_conditions.page_index = $(this).attr('index');
                    GetOrderList( request_type, g_filter_conditions );
                });

                //export
                if (max > 0)
                    $('#act_export').removeAttr('disabled');
                else
                    $('#act_export').attr('disabled', 'true');

            } else {
            }
        })
        .fail(function(){
            alert('网络异常，请重试');
        });
    };

    $('.col_line li').click(function () {
		$(this).addClass("col_on").siblings().removeClass("col_on");
        g_request_type = $(this).attr("id");
        GetOrderList(g_request_type);
    })

    GetOrderList("get_unfinish_order_list");

}();