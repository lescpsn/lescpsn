(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function getQueryStringByName(name) {
    var result = location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
    if (result == null || result.length < 1) {
        return "";
    }
    return result[1];
}
var do_query = getQueryStringByName('do_query') == '1';
var task_id = getQueryStringByName('task_id');
var start_time = getQueryStringByName('start_time');
var order_type = getQueryStringByName('order_type');

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return view;
};

var MainContent = React.createClass({
    displayName: "MainContent",

    onQuery: function (filters, requ_type) {
        var filter_map = this.state.filter_map;
        filter_map.page_index = 1;

        for (var i in filters) {
            filter_map[i] = filters[i];
        }
        //alert(JSON.stringify(filter_map));
        this.setState({ filter_map: filter_map });

        var requ_data = {
            requ_type: requ_type,
            argu_list: filter_map
        };

        var argu_list = "";
        for (var i in filter_map) {
            argu_list += _.str.sprintf('&%s=%s', encodeURIComponent(i), encodeURIComponent(filter_map[i]));
        }

        $.ajax({
            url: _.str.sprintf('/api/sinopec_order_query?product=sinopec&requ_type=%s%s', encodeURIComponent(requ_type), argu_list),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    if (requ_type == "fuel_card_query") {
                        this.setState({
                            order_list: resp_data.data.order_list,
                            page_info: resp_data.data.page_info
                        });
                    } else if (requ_type == "fuel_card_export") {
                        var path = resp_data.data.path;
                        if (path) {
                            window.location.assign(path);
                        }
                    }
                } else {
                    alert("查询出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("查询异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            filter_map: {
                page_index: 1,
                page_size: 20
            },
            order_list: [],
            page_info: null
        };
    },

    componentDidMount: function () {},

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        return React.createElement(
            "div",
            { className: "wrapper" },
            React.createElement(QueryPanel, { onQuery: this.onQuery }),
            React.createElement(
                "div",
                { className: "panel" },
                React.createElement(OrderList, {
                    order_list: this.state.order_list,
                    onQuery: this.onQuery,
                    page_info: this.state.page_info })
            )
        );
    }
});

var QueryPanel = React.createClass({
    displayName: "QueryPanel",

    onClickQuery: function (requ_type) {
        var date_range = this.refs.DateRange.getDateRange();

        var user_id = $('#form_user_id').val();
        if (typeof user_id == "undefined") {
            user_id = '';
        }

        var filters = {
            order_id: $('#form_order_id').val(),
            account: $('#form_account').val(),
            card_id: $('#form_card_id').val(),
            price: $('#form_price').val(),
            result: $('#form_result').val(),
            task_id: $('#form_task_id').val(),
            user_id: user_id,

            start: date_range.start,
            end: date_range.end
        };

        this.props.onQuery(filters, requ_type);
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
        $('#form_task_id').val(task_id);
        $('#form_result').val(order_type);
        if (do_query) {
            this.onClickQuery("fuel_card_query");
        }
    },

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        //近7天卡单
        var last_7_date = moment().startOf('days').add('days', -6).format('YYYY-MM-DD');
        var last_7_block_url = _.str.sprintf('/fuel_card/order_list?start_time=%s&order_type=%s&do_query=%s', encodeURIComponent(last_7_date), encodeURIComponent("-1"), encodeURIComponent("1"));

        return React.createElement(
            "div",
            { className: "panel" },
            React.createElement(
                "header",
                { className: "panel-heading row" },
                React.createElement(
                    "span",
                    { className: "pull-left" },
                    React.createElement("i", { className: "icon-search" }),
                    "订单查询"
                )
            ),
            React.createElement(
                "div",
                { className: "panel-body" },
                React.createElement(
                    "form",
                    { className: "form-horizontal" },
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "label",
                            { className: "col-sm-4 col-md-1 control-label" },
                            "订单编号"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-8 col-md-2" },
                            React.createElement("input", { id: "form_order_id", type: "text", className: "form-control input-sm" })
                        ),
                        React.createElement(
                            "label",
                            { className: "col-sm-4 col-md-1 control-label" },
                            "加油卡号"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-8 col-md-2" },
                            React.createElement("input", { id: "form_account", type: "text", className: "form-control input-sm" })
                        ),
                        React.createElement(
                            "label",
                            { className: "col-sm-4 col-md-1 control-label" },
                            "充值卡号"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-8 col-md-2" },
                            React.createElement("input", { id: "form_card_id", type: "text", className: "form-control input-sm" })
                        ),
                        React.createElement(
                            "label",
                            { className: "col-sm-4 col-md-1 control-label" },
                            "面值"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-8 col-md-2" },
                            React.createElement(
                                "select",
                                { id: "form_price", className: "form-control m-bot15 input-sm" },
                                React.createElement(
                                    "option",
                                    { value: "" },
                                    "全部"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "30" },
                                    "30"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "50" },
                                    "50"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "100" },
                                    "100"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "200" },
                                    "200"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "500" },
                                    "500"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "1000" },
                                    "1000"
                                )
                            )
                        ),
                        React.createElement(
                            "label",
                            { className: "col-sm-4 col-md-1 control-label" },
                            "时间范围"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-8 col-md-5" },
                            React.createElement(DateRange, { ref: "DateRange" })
                        ),
                        React.createElement(
                            "label",
                            { className: "col-sm-4 col-md-1 control-label" },
                            "任务编号"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-8 col-md-2" },
                            React.createElement("input", { id: "form_task_id", type: "text", className: "form-control input-sm" })
                        ),
                        React.createElement(
                            "label",
                            { className: "col-sm-4 col-md-1 control-label" },
                            "状态"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-8 col-md-2" },
                            React.createElement(
                                "select",
                                { id: "form_result", className: "form-control m-bot15 input-sm" },
                                React.createElement(
                                    "option",
                                    { value: "" },
                                    "全部"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "-1" },
                                    "卡单"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "1" },
                                    "成功"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "9" },
                                    "失败"
                                ),
                                React.createElement(
                                    "option",
                                    { value: "0" },
                                    "充值中"
                                )
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "col-md-offset-1 col-md-5" },
                            React.createElement(
                                "a",
                                { id: "act_query", href: "javascript:void(0);", className: "btn btn-danger m-right5", onClick: this.onClickQuery.bind(this, "fuel_card_query") },
                                React.createElement("i", { className: "icon-search" }),
                                " 查询"
                            ),
                            React.createElement(
                                "a",
                                { id: "act_query", href: last_7_block_url, className: "btn btn-info  m-right5" },
                                React.createElement("i", { className: "icon-wrench" }),
                                " 近7天卡单"
                            ),
                            React.createElement(
                                "a",
                                { id: "act_query", href: "javascript:void(0);", className: "btn btn-primary", onClick: this.onClickQuery.bind(this, "fuel_card_export") },
                                React.createElement("i", { className: "icon-download-alt" }),
                                " 导出结果"
                            )
                        )
                    ),
                    React.createElement(UserList, null)
                )
            )
        );
    }
});

var UserList = React.createClass({
    displayName: "UserList",

    getUserList: function () {
        $.ajax({
            url: '/api/user/list_local',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({ user_list: data });

                $('#form_user_id').selectpicker({});
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            user_list: []
        };
    },

    componentDidMount: function () {
        this.getUserList();
    },

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        if (!this.state.user_list || !this.state.user_list.length) {
            return null;
        }

        var userListNodes = this.state.user_list.map(function (user_info, index) {
            return React.createElement(
                "option",
                { value: user_info.id, "data-subtext": user_info.tags },
                user_info.id,
                " - ",
                user_info.name
            );
        }.bind(this));

        return React.createElement(
            "div",
            { className: "form-group has-error" },
            React.createElement(
                "label",
                { className: "control-label col-md-1" },
                React.createElement("i", { className: "icon_lock" }),
                " 用户"
            ),
            React.createElement(
                "div",
                { className: "col-md-5" },
                React.createElement(
                    "select",
                    { className: "form-control", id: "form_user_id", "data-live-search": "true" },
                    React.createElement(
                        "option",
                        { value: "", "data-subtext": "" },
                        "     - 全部"
                    ),
                    userListNodes
                )
            )
        );
    }
});

var DateRange = React.createClass({
    displayName: "DateRange",

    getDateRange: function () {
        return {
            start: $('#DateRangeStart').val(),
            end: $('#DateRangeEnd').val()
        };
    },

    compile: function (start_time) {
        $('#DateRange').daterangepicker({
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
                cancelLabel: '取消',
                fromLabel: '从',
                toLabel: '至',
                customRangeLabel: '自定义',
                daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
                monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                firstDay: 1
            },
            showWeekNumbers: false
        }, function (start, end) {
            $('#DateRangeStart').val(moment(start).format('YYYY/MM/DD HH:mm:ss'));
            $('#DateRangeEnd').val(moment(end).format('YYYY/MM/DD HH:mm:ss'));
        });

        //设置初始数据
        var startDate = moment().startOf('days');
        if (start_time) {
            startDate = moment(start_time, "YYYY-MM-DD");
        }
        var endDate = moment().startOf('days').add('days', 1);

        $('#DateRange').data('daterangepicker').setStartDate(startDate);
        $('#DateRange').data('daterangepicker').setEndDate(endDate);
        $('#DateRangeStart').val(startDate.format('YYYY/MM/DD HH:mm:ss'));
        $('#DateRangeEnd').val(endDate.format('YYYY/MM/DD HH:mm:ss'));
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
        this.compile(start_time);
    },

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        return React.createElement(
            "div",
            null,
            React.createElement("input", { id: "DateRange", type: "text", className: "form-control input-sm" }),
            React.createElement("input", { id: "DateRangeStart", type: "hidden" }),
            React.createElement("input", { id: "DateRangeEnd", type: "hidden" })
        );
    }
});

var OrderList = React.createClass({
    displayName: "OrderList",

    ManualOrder: function (order_info) {
        this.refs.ManualOrderDlg.showDlg(order_info);
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {},

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        //目前只有卡单的订单才会有手工处理流程
        var orderListNodes = this.props.order_list.map(function (order_info, index) {
            console.info(order_info);

            var operBtnNode = null;
            if (order_info.status == "卡单(需手工处理)") {
                operBtnNode = React.createElement(
                    "a",
                    { href: "javascript:void(0);",
                        className: "btn btn-primary btn-xs btn-danger",
                        onClick: this.ManualOrder.bind(this, order_info) },
                    "手工处理"
                );
            }

            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    null,
                    order_info.order_id
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.account
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.create
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.update
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.status
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.card_id
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.price
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.account_price
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.bot_account
                ),
                React.createElement(
                    "td",
                    null,
                    operBtnNode
                )
            );
        }.bind(this));

        return React.createElement(
            "div",
            null,
            React.createElement(
                "header",
                { className: "panel-heading row" },
                React.createElement(
                    "span",
                    { className: "pull-left" },
                    React.createElement("i", { className: "icon-search" }),
                    "订单列表"
                )
            ),
            React.createElement(
                "div",
                { className: "panel-body table-responsive" },
                React.createElement(
                    "table",
                    { id: "order_result", className: "table table-striped table-hover" },
                    React.createElement(
                        "thead",
                        null,
                        React.createElement(
                            "tr",
                            null,
                            React.createElement(
                                "th",
                                null,
                                "订单编号"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "账号"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "开始时间"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "状态时间"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "订单状态"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "充值卡号码"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "面值"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "到账金额"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "外挂账号"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "操作"
                            )
                        )
                    ),
                    React.createElement(
                        "tbody",
                        null,
                        orderListNodes
                    )
                ),
                React.createElement(PageIndexGroup, { onQuery: this.props.onQuery, page_info: this.props.page_info })
            ),
            React.createElement(ManualOrderDlg, { ref: "ManualOrderDlg" })
        );
    }

});

var PageIndexGroup = React.createClass({
    displayName: "PageIndexGroup",

    onClickPage: function (page_index) {
        this.props.onQuery({ page_index: page_index }, 'fuel_card_query');
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {},

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        if (this.props.page_info == null) {
            return null;
        }
        var page_index = this.props.page_info.page_index;
        var max_page = this.props.page_info.max_page;

        var page_start = page_index - 4 > 0 ? page_index - 4 : 1;
        var page_end = page_index + 4 > max_page ? max_page : page_index + 4;

        var page_index_list = [];
        for (var i = page_start; i <= page_end; ++i) {
            page_index_list.push(i);
        }

        var pageIndexBtnBodes = page_index_list.map(function (i, index) {
            var disabled = null;
            if (i == this.props.page_info.page_index) {
                disabled = "disabled";
            }
            return React.createElement(
                "button",
                { className: "btn btn-default", disabled: disabled, type: "button", onClick: this.onClickPage.bind(this, i) },
                i
            );
        }.bind(this));

        var fastBackwardDisabled = null;
        var backwardDisabled = null;
        if (page_index <= 1) {
            fastBackwardDisabled = "disabled";
            backwardDisabled = "disabled";
        }

        var forwardDisabled = null;
        var fastForwardDisabled = null;
        if (page_index >= max_page) {
            forwardDisabled = "disabled";
            fastForwardDisabled = "disabled";
        }

        return React.createElement(
            "div",
            { className: "row" },
            React.createElement(
                "div",
                { className: "col-sm-12" },
                React.createElement(
                    "div",
                    { className: "btn-row dataTables_filter" },
                    React.createElement(
                        "div",
                        { id: "page_group", className: "btn-group" },
                        React.createElement(
                            "button",
                            { className: "btn btn-default", type: "button", disabled: fastBackwardDisabled, onClick: this.onClickPage.bind(this, 1) },
                            React.createElement("i", { className: "icon-fast-backward" })
                        ),
                        React.createElement(
                            "button",
                            { className: "btn btn-default", type: "button", disabled: backwardDisabled, onClick: this.onClickPage.bind(this, page_index - 1) },
                            React.createElement("i", { className: "icon-backward" })
                        ),
                        pageIndexBtnBodes,
                        React.createElement(
                            "button",
                            { className: "btn btn-default", type: "button", disabled: forwardDisabled, onClick: this.onClickPage.bind(this, page_index + 1) },
                            React.createElement("i", { className: "icon-forward" })
                        ),
                        React.createElement(
                            "button",
                            { className: "btn btn-default", type: "button", disabled: fastForwardDisabled, onClick: this.onClickPage.bind(this, max_page) },
                            React.createElement("i", { className: "icon-fast-forward" })
                        )
                    )
                )
            )
        );
    }
});

//订单手工处理弹窗
var ManualOrderDlg = React.createClass({
    displayName: "ManualOrderDlg",

    //发送单笔订单的手工处理
    sendManualOrder: function (requ_type, argu_list) {
        var requ_data = {
            requ_type: requ_type,
            argu_list: argu_list
        };

        $.ajax({
            url: '/fuel_card/modem_forrestal/api/order/finish2',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    alert("手动处理成功");
                } else {
                    alert("手动处理订单出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("手动处理订单异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),

            complete: function (XMLHttpRequest, textStatus) {
                this.hideDlg();
            }.bind(this)
        });
    },

    //取消按钮
    onClickCancle: function () {
        this.hideDlg();
    },

    //订单成功
    onClickSuccess: function () {
        var account_price = parseInt($("#form_account_price").val());
        if (!account_price || account_price <= 0) {
            alert("请选择正确的金额");
            return;
        }

        if (!confirm(_.str.sprintf('把订单 %s 设为成功，订单金额 %s 元?', this.state.order_info.order_id, account_price))) {
            return;
        }

        this.sendManualOrder('order_success', {
            order_id: this.state.order_info.order_id,
            account_price: account_price
        });
    },

    //订单失败，卡有效
    onClickFailCardValid: function () {
        if (!confirm(_.str.sprintf('把订单 %s 设为失败， 充值卡 %s 有效?', this.state.order_info.order_id, this.state.order_info.card_id))) {
            return;
        }

        this.sendManualOrder('order_fail_card_valid', {
            order_id: this.state.order_info.order_id
        });
    },

    //订单失败,卡失效
    onClickFailCardInvalid: function () {
        if (!confirm(_.str.sprintf('把订单 %s 设为失败， 充值卡 %s 异常?', this.state.order_info.order_id, this.state.order_info.card_id))) {
            return;
        }

        this.sendManualOrder('order_fail_card_invalid', {
            order_id: this.state.order_info.order_id
        });
    },

    showDlg: function (order_info) {
        order_info.err_info = order_info.err_data;
        this.setState({ order_info: order_info });
        $('#ManualOrderDlg').modal('show');
    },

    hideDlg: function () {
        this.clearInput();
        $('#ManualOrderDlg').modal('hide');
    },

    clearInput: function () {
        this.setState({ order_info: {} });
    },

    getInitialState: function () {
        return { order_info: {} };
    },

    render: function () {
        return React.createElement(
            "div",
            { className: "modal", id: "ManualOrderDlg", tabIndex: "-1", role: "dialog" },
            React.createElement(
                "div",
                { className: "modal-dialog" },
                React.createElement(
                    "div",
                    { className: "modal-content" },
                    React.createElement(
                        "div",
                        { className: "modal-header" },
                        React.createElement(
                            "h5",
                            { className: "modal-title" },
                            " 卡单",
                            React.createElement(
                                "b",
                                null,
                                this.state.order_info.order_id
                            ),
                            "手工处理"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "modal-body form-horizontal" },
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "strong",
                                null,
                                "订单号:"
                            ),
                            " ",
                            this.state.order_info.order_id
                        ),
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "strong",
                                null,
                                "充值卡号:"
                            ),
                            " ",
                            this.state.order_info.card_id
                        ),
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "strong",
                                null,
                                "面值:"
                            ),
                            " ",
                            this.state.order_info.price
                        ),
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "strong",
                                null,
                                "卡单原因:"
                            ),
                            " ",
                            this.state.order_info.err_info
                        ),
                        React.createElement(
                            "div",
                            { className: "row price_color" },
                            "注意:卡单处理的结果在本页面会有所延迟"
                        ),
                        React.createElement(
                            "div",
                            { className: "form-group add-pro-body" },
                            React.createElement(
                                "ul",
                                { className: "nav nav-tabs m-bot15" },
                                React.createElement(
                                    "li",
                                    { className: "active" },
                                    React.createElement(
                                        "a",
                                        { href: "#manual_success", "data-toggle": "tab" },
                                        "置成功"
                                    )
                                ),
                                React.createElement(
                                    "li",
                                    null,
                                    React.createElement(
                                        "a",
                                        { href: "#manual_fail", "data-toggle": "tab" },
                                        "置失败"
                                    )
                                )
                            ),
                            React.createElement(
                                "div",
                                { id: "myTabContent", className: "tab-content m-bot15" },
                                React.createElement(
                                    "div",
                                    { className: "tab-pane active", id: "manual_success" },
                                    React.createElement(
                                        "div",
                                        { className: "row" },
                                        React.createElement(
                                            "label",
                                            { className: "col-sm-4 col-md-2 control-label" },
                                            "金额"
                                        ),
                                        React.createElement(
                                            "div",
                                            { className: "col-sm-8 col-md-9" },
                                            React.createElement(
                                                "select",
                                                { id: "form_account_price", className: "form-control m-bot15 input-sm" },
                                                React.createElement(
                                                    "option",
                                                    { value: "" },
                                                    "(无)"
                                                ),
                                                React.createElement(
                                                    "option",
                                                    { value: "30" },
                                                    "30"
                                                ),
                                                React.createElement(
                                                    "option",
                                                    { value: "50" },
                                                    "50"
                                                ),
                                                React.createElement(
                                                    "option",
                                                    { value: "100" },
                                                    "100"
                                                ),
                                                React.createElement(
                                                    "option",
                                                    { value: "200" },
                                                    "200"
                                                ),
                                                React.createElement(
                                                    "option",
                                                    { value: "500" },
                                                    "500"
                                                ),
                                                React.createElement(
                                                    "option",
                                                    { value: "1000" },
                                                    "1000"
                                                )
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "modal-footer form-horifooter" },
                                        React.createElement(
                                            "button",
                                            { id: "change_price_btn", type: "button",
                                                className: "btn btn-danger",
                                                onClick: this.onClickSuccess },
                                            "确定"
                                        ),
                                        React.createElement(
                                            "button",
                                            { type: "button",
                                                className: "btn btn-default",
                                                "data-dismiss": "modal",
                                                onClick: this.onClickCancle
                                            },
                                            "取消"
                                        )
                                    )
                                ),
                                React.createElement(
                                    "div",
                                    { className: "tab-pane", id: "manual_fail" },
                                    React.createElement(
                                        "div",
                                        { className: "form-horifooter" },
                                        React.createElement(
                                            "div",
                                            { className: "col-md-offset-3 col-md-8" },
                                            React.createElement(
                                                "button",
                                                { type: "button", className: "btn btn-success m-right10 m-bot20", onClick: this.onClickFailCardValid },
                                                "置失败,卡有效"
                                            ),
                                            React.createElement(
                                                "button",
                                                { type: "button", className: "btn btn-danger m-bot20", onClick: this.onClickFailCardInvalid },
                                                "置失败,卡异常"
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "modal-footer form-horifooter" },
                                        React.createElement(
                                            "button",
                                            { type: "button",
                                                className: "btn btn-default",
                                                "data-dismiss": "modal",
                                                onClick: this.onClickCancle
                                            },
                                            "取消"
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    }
});

React.render(React.createElement(MainContent, null), document.getElementById('main-content'));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWNcXGpzeFxcZnVlbF9jYXJkXFxvcmRlcl9saXN0LmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FDLFNBQVMsb0JBQVQsQ0FBOEIsSUFBOUIsRUFBb0M7QUFDakMsUUFBSSxTQUFTLFNBQVMsTUFBVCxDQUFnQixLQUFoQixDQUFzQixJQUFJLE1BQUosQ0FBVyxXQUFXLElBQVgsR0FBa0IsV0FBbEIsRUFBK0IsR0FBMUMsQ0FBdEIsQ0FBVCxDQUQ2QjtBQUVqQyxRQUFJLFVBQVUsSUFBVixJQUFrQixPQUFPLE1BQVAsR0FBZ0IsQ0FBaEIsRUFBbUI7QUFDckMsZUFBTyxFQUFQLENBRHFDO0tBQXpDO0FBR0EsV0FBTyxPQUFPLENBQVAsQ0FBUCxDQUxpQztDQUFwQztBQU9ELElBQUksV0FBVyxxQkFBcUIsVUFBckIsS0FBb0MsR0FBcEM7QUFDZixJQUFJLFVBQVUscUJBQXFCLFNBQXJCLENBQVY7QUFDSixJQUFJLGFBQWEscUJBQXFCLFlBQXJCLENBQWI7QUFDSixJQUFJLGFBQWEscUJBQXFCLFlBQXJCLENBQWI7O0FBRUosU0FBUyxhQUFULENBQXVCLE1BQXZCLEVBQStCO0FBQzNCLFFBQUksS0FBSyxJQUFJLFdBQUosQ0FBZ0IsT0FBTyxNQUFQLENBQXJCLENBRHVCO0FBRTNCLFFBQUksT0FBTyxJQUFJLFVBQUosQ0FBZSxFQUFmLENBQVAsQ0FGdUI7QUFHM0IsU0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksT0FBTyxNQUFQLEVBQWUsRUFBRSxDQUFGLEVBQUs7QUFDcEMsYUFBSyxDQUFMLElBQVUsT0FBTyxDQUFQLENBQVYsQ0FEb0M7S0FBeEM7QUFHQSxXQUFPLElBQVAsQ0FOMkI7Q0FBL0I7O0FBU0EsSUFBSSxjQUFjLE1BQU0sV0FBTixDQUFrQjs7O0FBQ2hDLGFBQVMsVUFBVSxPQUFWLEVBQW1CLFNBQW5CLEVBQThCO0FBQ25DLFlBQUksYUFB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QUFOLEVBQVI7O2lEQVBKOzZDQURKO3lDQUZKO3FDQURKO29DQWVJOzswQ0FBSyxXQUFVLDhCQUFWLEVBQUw7d0NBQ0k7OzhDQUFRLElBQUcsa0JBQUgsRUFBc0IsTUFBSyxRQUFMO0FBQ3RCLDJEQUFVLGdCQUFWO0FBQ0EseURBQVMsS0FBSyxjQUFMLEVBRmpCOzt5Q0FESjt3Q0FNSTs7OENBQVEsTUFBSyxRQUFMO0FBQ0EsMkRBQVUsaUJBQVY7QUFDQSxnRUFBYSxPQUFiO0FBQ0EseURBQVMsS0FBSyxhQUFMOzZDQUhqQjs7eUNBTko7cUNBZko7aUNBREo7Z0NBK0JJOztzQ0FBSyxXQUFVLFVBQVYsRUFBcUIsSUFBRyxhQUFILEVBQTFCO29DQUNJOzswQ0FBSyxXQUFVLGlCQUFWLEVBQUw7d0NBQ0k7OzhDQUFLLFdBQVUsMEJBQVYsRUFBTDs0Q0FDSTs7a0RBQVEsTUFBSyxRQUFMLEVBQWMsV0FBVSxtQ0FBVixFQUE4QyxTQUFTLEtBQUssb0JBQUwsRUFBN0U7OzZDQURKOzRDQUlJOztrREFBUSxNQUFLLFFBQUwsRUFBYyxXQUFVLHdCQUFWLEVBQW1DLFNBQVMsS0FBSyxzQkFBTCxFQUFsRTs7NkNBSko7eUNBREo7cUNBREo7b0NBV0k7OzBDQUFLLFdBQVUsOEJBQVYsRUFBTDt3Q0FDSTs7OENBQVEsTUFBSyxRQUFMO0FBQ0EsMkRBQVUsaUJBQVY7QUFDQSxnRUFBYSxPQUFiO0FBQ0EseURBQVMsS0FBSyxhQUFMOzZDQUhqQjs7eUNBREo7cUNBWEo7aUNBL0JKOzZCQUxKO3lCQU5KO3FCQUpKO2lCQURKO2FBREo7U0FESixDQURnQjtLQUFaO0NBM0dTLENBQWpCOztBQTRMSixNQUFNLE1BQU4sQ0FDSSxvQkFBQyxXQUFELE9BREosRUFHSSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FISiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCLvu79mdW5jdGlvbiBnZXRRdWVyeVN0cmluZ0J5TmFtZShuYW1lKSB7XHJcbiAgICB2YXIgcmVzdWx0ID0gbG9jYXRpb24uc2VhcmNoLm1hdGNoKG5ldyBSZWdFeHAoXCJbXFw/XFwmXVwiICsgbmFtZSArIFwiPShbXlxcJl0rKVwiLCBcImlcIikpO1xyXG4gICAgaWYgKHJlc3VsdCA9PSBudWxsIHx8IHJlc3VsdC5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiXCI7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0WzFdO1xyXG59XHJcbnZhciBkb19xdWVyeSA9IGdldFF1ZXJ5U3RyaW5nQnlOYW1lKCdkb19xdWVyeScpID09ICcxJztcclxudmFyIHRhc2tfaWQgPSBnZXRRdWVyeVN0cmluZ0J5TmFtZSgndGFza19pZCcpO1xyXG52YXIgc3RhcnRfdGltZSA9IGdldFF1ZXJ5U3RyaW5nQnlOYW1lKCdzdGFydF90aW1lJyk7XHJcbnZhciBvcmRlcl90eXBlID0gZ2V0UXVlcnlTdHJpbmdCeU5hbWUoJ29yZGVyX3R5cGUnKTtcclxuXHJcbmZ1bmN0aW9uIHRvQXJyYXlCdWZmZXIoYnVmZmVyKSB7XHJcbiAgICB2YXIgYWIgPSBuZXcgQXJyYXlCdWZmZXIoYnVmZmVyLmxlbmd0aCk7XHJcbiAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGFiKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnVmZmVyLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgdmlld1tpXSA9IGJ1ZmZlcltpXTtcclxuICAgIH1cclxuICAgIHJldHVybiB2aWV3O1xyXG59O1xyXG5cclxudmFyIE1haW5Db250ZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgb25RdWVyeTogZnVuY3Rpb24gKGZpbHRlcnMsIHJlcXVfdHlwZSkge1xyXG4gICAgICAgIHZhciBmaWx0ZXJfbWFwID0gdGhpcy5zdGF0ZS5maWx0ZXJfbWFwO1xyXG4gICAgICAgIGZpbHRlcl9tYXAucGFnZV9pbmRleCA9IDE7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgaW4gZmlsdGVycykge1xyXG4gICAgICAgICAgICBmaWx0ZXJfbWFwW2ldID0gZmlsdGVyc1tpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9hbGVydChKU09OLnN0cmluZ2lmeShmaWx0ZXJfbWFwKSk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGZpbHRlcl9tYXA6IGZpbHRlcl9tYXAgfSk7XHJcblxyXG4gICAgICAgIHZhciByZXF1X2RhdGEgPSB7XHJcbiAgICAgICAgICAgIHJlcXVfdHlwZTogcmVxdV90eXBlLFxyXG4gICAgICAgICAgICBhcmd1X2xpc3Q6IGZpbHRlcl9tYXBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhcmd1X2xpc3QgPSBcIlwiO1xyXG4gICAgICAgIGZvciAodmFyIGkgaW4gZmlsdGVyX21hcCkge1xyXG4gICAgICAgICAgICBhcmd1X2xpc3QgKz0gXy5zdHIuc3ByaW50ZignJiVzPSVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChpKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChmaWx0ZXJfbWFwW2ldKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IF8uc3RyLnNwcmludGYoJy9hcGkvc2lub3BlY19vcmRlcl9xdWVyeT9wcm9kdWN0PXNpbm9wZWMmcmVxdV90eXBlPSVzJXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChyZXF1X3R5cGUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VfbGlzdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BfZGF0YS5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXF1X3R5cGUgPT0gXCJmdWVsX2NhcmRfcXVlcnlcIilcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JkZXJfbGlzdDogcmVzcF9kYXRhLmRhdGEub3JkZXJfbGlzdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2VfaW5mbzogcmVzcF9kYXRhLmRhdGEucGFnZV9pbmZvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmKHJlcXVfdHlwZSA9PSBcImZ1ZWxfY2FyZF9leHBvcnRcIilcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXRoID0gcmVzcF9kYXRhLmRhdGEucGF0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24ocGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIuafpeivouWHuumUmSBcIiArIHJlc3BfZGF0YS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksXHJcblxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwi5p+l6K+i5byC5bi4IFwiICsgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLnByb3BzLnVybCwgc3RhdHVzLCBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBmaWx0ZXJfbWFwOiB7XHJcbiAgICAgICAgICAgICAgICBwYWdlX2luZGV4OiAxLFxyXG4gICAgICAgICAgICAgICAgcGFnZV9zaXplOiAyMCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb3JkZXJfbGlzdDogW10sXHJcbiAgICAgICAgICAgIHBhZ2VfaW5mbzogbnVsbCxcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIndyYXBwZXJcIj5cclxuICAgICAgICAgICAgICAgIDxRdWVyeVBhbmVsIG9uUXVlcnk9e3RoaXMub25RdWVyeX0gLz5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFuZWxcIj5cclxuICAgICAgICAgICAgICAgICAgICA8T3JkZXJMaXN0IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3JkZXJfbGlzdD17dGhpcy5zdGF0ZS5vcmRlcl9saXN0fSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uUXVlcnk9e3RoaXMub25RdWVyeX0gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlX2luZm89e3RoaXMuc3RhdGUucGFnZV9pbmZvfSAvPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudmFyIFF1ZXJ5UGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICBvbkNsaWNrUXVlcnk6IGZ1bmN0aW9uIChyZXF1X3R5cGUpIHtcclxuICAgICAgICB2YXIgZGF0ZV9yYW5nZSA9IHRoaXMucmVmcy5EYXRlUmFuZ2UuZ2V0RGF0ZVJhbmdlKCk7XHJcblxyXG4gICAgICAgIHZhciB1c2VyX2lkID0gJCgnI2Zvcm1fdXNlcl9pZCcpLnZhbCgpO1xyXG4gICAgICAgIGlmICh0eXBlb2YgKHVzZXJfaWQpID09IFwidW5kZWZpbmVkXCIpIHtcclxuICAgICAgICAgICAgdXNlcl9pZCA9ICcnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZpbHRlcnMgPSB7XHJcbiAgICAgICAgICAgIG9yZGVyX2lkOiAkKCcjZm9ybV9vcmRlcl9pZCcpLnZhbCgpLFxyXG4gICAgICAgICAgICBhY2NvdW50OiAkKCcjZm9ybV9hY2NvdW50JykudmFsKCksXHJcbiAgICAgICAgICAgIGNhcmRfaWQ6ICQoJyNmb3JtX2NhcmRfaWQnKS52YWwoKSxcclxuICAgICAgICAgICAgcHJpY2U6ICQoJyNmb3JtX3ByaWNlJykudmFsKCksXHJcbiAgICAgICAgICAgIHJlc3VsdDogJCgnI2Zvcm1fcmVzdWx0JykudmFsKCksXHJcbiAgICAgICAgICAgIHRhc2tfaWQ6ICQoJyNmb3JtX3Rhc2tfaWQnKS52YWwoKSxcclxuICAgICAgICAgICAgdXNlcl9pZDogdXNlcl9pZCxcclxuXHJcbiAgICAgICAgICAgIHN0YXJ0OiBkYXRlX3JhbmdlLnN0YXJ0LFxyXG4gICAgICAgICAgICBlbmQ6IGRhdGVfcmFuZ2UuZW5kLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucHJvcHMub25RdWVyeShmaWx0ZXJzLCByZXF1X3R5cGUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge307XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCgnI2Zvcm1fdGFza19pZCcpLnZhbCh0YXNrX2lkKTtcclxuICAgICAgICAkKCcjZm9ybV9yZXN1bHQnKS52YWwob3JkZXJfdHlwZSk7XHJcbiAgICAgICAgaWYgKGRvX3F1ZXJ5KSB7XHJcbiAgICAgICAgICAgIHRoaXMub25DbGlja1F1ZXJ5KFwiZnVlbF9jYXJkX3F1ZXJ5XCIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy/ov5E35aSp5Y2h5Y2VXHJcbiAgICAgICAgdmFyIGxhc3RfN19kYXRlID0gbW9tZW50KCkuc3RhcnRPZignZGF5cycpLmFkZCgnZGF5cycsIC02KS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuICAgICAgICB2YXIgbGFzdF83X2Jsb2NrX3VybCA9IF8uc3RyLnNwcmludGYoJy9mdWVsX2NhcmQvb3JkZXJfbGlzdD9zdGFydF90aW1lPSVzJm9yZGVyX3R5cGU9JXMmZG9fcXVlcnk9JXMnLFxyXG4gICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQobGFzdF83X2RhdGUpLFxyXG4gICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoXCItMVwiKSxcclxuICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KFwiMVwiKVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhbmVsXCI+XHJcbiAgICAgICAgICAgICAgICA8aGVhZGVyIGNsYXNzTmFtZT1cInBhbmVsLWhlYWRpbmcgcm93XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHVsbC1sZWZ0XCI+PGkgY2xhc3NOYW1lPVwiaWNvbi1zZWFyY2hcIj48L2k+6K6i5Y2V5p+l6K+iPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcblxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYW5lbC1ib2R5XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwiZm9ybS1ob3Jpem9udGFsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImNvbC1zbS00IGNvbC1tZC0xIGNvbnRyb2wtbGFiZWxcIj7orqLljZXnvJblj7c8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tOCBjb2wtbWQtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cImZvcm1fb3JkZXJfaWRcIiB0eXBlPVwidGV4dFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbCBpbnB1dC1zbVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiY29sLXNtLTQgY29sLW1kLTEgY29udHJvbC1sYWJlbFwiPuWKoOayueWNoeWPtzwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS04IGNvbC1tZC0yXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGlkPVwiZm9ybV9hY2NvdW50XCIgdHlwZT1cInRleHRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImNvbC1zbS00IGNvbC1tZC0xIGNvbnRyb2wtbGFiZWxcIj7lhYXlgLzljaHlj7c8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tOCBjb2wtbWQtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cImZvcm1fY2FyZF9pZFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtc20tNCBjb2wtbWQtMSBjb250cm9sLWxhYmVsXCI+6Z2i5YC8PC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNtLTggY29sLW1kLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwiZm9ybV9wcmljZVwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbCBtLWJvdDE1IGlucHV0LXNtXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIj7lhajpg6g8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjMwXCI+MzA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjUwXCI+NTA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjEwMFwiPjEwMDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMjAwXCI+MjAwPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCI1MDBcIj41MDA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjEwMDBcIj4xMDAwPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiY29sLXNtLTQgY29sLW1kLTEgY29udHJvbC1sYWJlbFwiPuaXtumXtOiMg+WbtDwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS04IGNvbC1tZC01XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPERhdGVSYW5nZSByZWY9XCJEYXRlUmFuZ2VcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImNvbC1zbS00IGNvbC1tZC0xIGNvbnRyb2wtbGFiZWxcIj7ku7vliqHnvJblj7c8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tOCBjb2wtbWQtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cImZvcm1fdGFza19pZFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sIGlucHV0LXNtXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtc20tNCBjb2wtbWQtMSBjb250cm9sLWxhYmVsXCI+54q25oCBPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNtLTggY29sLW1kLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwiZm9ybV9yZXN1bHRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgbS1ib3QxNSBpbnB1dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+5YWo6YOoPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCItMVwiPuWNoeWNlTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMVwiPuaIkOWKnzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiOVwiPuWksei0pTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMFwiPuWFheWAvOS4rTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtb2Zmc2V0LTEgY29sLW1kLTVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBpZD1cImFjdF9xdWVyeVwiIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kYW5nZXIgbS1yaWdodDVcIiBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tRdWVyeS5iaW5kKHRoaXMsXCJmdWVsX2NhcmRfcXVlcnlcIil9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJpY29uLXNlYXJjaFwiPjwvaT4g5p+l6K+iXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGlkPVwiYWN0X3F1ZXJ5XCIgaHJlZj17bGFzdF83X2Jsb2NrX3VybH0gY2xhc3NOYW1lPVwiYnRuIGJ0bi1pbmZvICBtLXJpZ2h0NVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJpY29uLXdyZW5jaFwiPjwvaT4g6L+RN+WkqeWNoeWNlVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBpZD1cImFjdF9xdWVyeVwiIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1wcmltYXJ5XCIgb25DbGljaz17dGhpcy5vbkNsaWNrUXVlcnkuYmluZCh0aGlzLFwiZnVlbF9jYXJkX2V4cG9ydFwiKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tZG93bmxvYWQtYWx0XCI+PC9pPiDlr7zlh7rnu5PmnpxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxVc2VyTGlzdCAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZm9ybT5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbnZhciBVc2VyTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIGdldFVzZXJMaXN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAnL2FwaS91c2VyL2xpc3RfbG9jYWwnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICB0eXBlOiAnZ2V0JyxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyB1c2VyX2xpc3Q6IGRhdGEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJCgnI2Zvcm1fdXNlcl9pZCcpLnNlbGVjdHBpY2tlcih7fSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHVzZXJfbGlzdDogW10sXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmdldFVzZXJMaXN0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24ocHJldlByb3BzLCBwcmV2U3RhdGUpe1xyXG4gICAgfSxcclxuICAgIFxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnN0YXRlLnVzZXJfbGlzdCB8fCAhdGhpcy5zdGF0ZS51c2VyX2xpc3QubGVuZ3RoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdXNlckxpc3ROb2RlcyA9IHRoaXMuc3RhdGUudXNlcl9saXN0Lm1hcChmdW5jdGlvbiAodXNlcl9pbmZvLCBpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKDxvcHRpb24gdmFsdWU9e3VzZXJfaW5mby5pZH0gZGF0YS1zdWJ0ZXh0PXt1c2VyX2luZm8udGFnc30gPnt1c2VyX2luZm8uaWR9IC0ge3VzZXJfaW5mby5uYW1lfTwvb3B0aW9uPik7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwIGhhcy1lcnJvclwiPlxyXG4gICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImNvbnRyb2wtbGFiZWwgY29sLW1kLTFcIj48aSBjbGFzc05hbWU9XCJpY29uX2xvY2tcIj48L2k+IOeUqOaItzwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC01XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBpZD1cImZvcm1fdXNlcl9pZFwiIGRhdGEtbGl2ZS1zZWFyY2g9XCJ0cnVlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJcIiBkYXRhLXN1YnRleHQ9XCJcIj4gICAgIC0g5YWo6YOoPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHt1c2VyTGlzdE5vZGVzfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbnZhciBEYXRlUmFuZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICBnZXREYXRlUmFuZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdGFydDogJCgnI0RhdGVSYW5nZVN0YXJ0JykudmFsKCksXHJcbiAgICAgICAgICAgIGVuZDogJCgnI0RhdGVSYW5nZUVuZCcpLnZhbCgpLFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBpbGU6IGZ1bmN0aW9uIChzdGFydF90aW1lKSB7XHJcbiAgICAgICAgJCgnI0RhdGVSYW5nZScpLmRhdGVyYW5nZXBpY2tlcih7XHJcbiAgICAgICAgICAgIHJhbmdlczoge1xyXG4gICAgICAgICAgICAgICAgJ+S7iuWkqSc6IFttb21lbnQoKS5zdGFydE9mKCdkYXlzJyksIG1vbWVudCgpLnN0YXJ0T2YoJ2RheXMnKS5hZGQoJ2RheXMnLCAxKV0sXHJcbiAgICAgICAgICAgICAgICAn5pio5aSpJzogW21vbWVudCgpLnN0YXJ0T2YoJ2RheXMnKS5zdWJ0cmFjdCgnZGF5cycsIDEpLCBtb21lbnQoKS5zdGFydE9mKCdkYXlzJyldLFxyXG4gICAgICAgICAgICAgICAgJ+acgOi/kTflpKknOiBbbW9tZW50KCkuc3RhcnRPZignZGF5cycpLnN1YnRyYWN0KCdkYXlzJywgNiksIG1vbWVudCgpLnN0YXJ0T2YoJ2RheXMnKS5hZGQoJ2RheXMnLCAxKV0sXHJcbiAgICAgICAgICAgICAgICAn5pyA6L+RMzDlpKknOiBbbW9tZW50KCkuc3RhcnRPZignZGF5cycpLnN1YnRyYWN0KCdkYXlzJywgMjkpLCBtb21lbnQoKS5zdGFydE9mKCdkYXlzJykuYWRkKCdkYXlzJywgMSldLFxyXG4gICAgICAgICAgICAgICAgJ+acrOaciCc6IFttb21lbnQoKS5zdGFydE9mKCdtb250aCcpLCBtb21lbnQoKS5zdGFydE9mKCdtb250aCcpLmFkZCgnbW9udGgnLCAxKV0sXHJcbiAgICAgICAgICAgICAgICAn5LiK5pyIJzogW21vbWVudCgpLnN1YnRyYWN0KCdtb250aCcsIDEpLnN0YXJ0T2YoJ21vbnRoJyksIG1vbWVudCgpLnN0YXJ0T2YoJ21vbnRoJyldXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9wZW5zOiAnbGVmdCcsXHJcbiAgICAgICAgICAgIGZvcm1hdDogJ1lZWVkvTU0vREQgSEg6bW06c3MnLFxyXG4gICAgICAgICAgICBzZXBhcmF0b3I6ICcgLSAnLFxyXG4gICAgICAgICAgICBzdGFydERhdGU6IG1vbWVudCgpLmFkZCgnZGF5cycsIC0yOSksXHJcbiAgICAgICAgICAgIGVuZERhdGU6IG1vbWVudCgpLFxyXG4gICAgICAgICAgICBtaW5EYXRlOiAnMjAxNC8wMS8wMScsXHJcbiAgICAgICAgICAgIG1heERhdGU6ICcyMDI1LzEyLzMxJyxcclxuICAgICAgICAgICAgdGltZVBpY2tlcjogdHJ1ZSxcclxuICAgICAgICAgICAgdGltZVBpY2tlckluY3JlbWVudDogMTAsXHJcbiAgICAgICAgICAgIHRpbWVQaWNrZXIxMkhvdXI6IGZhbHNlLFxyXG4gICAgICAgICAgICBsb2NhbGU6IHtcclxuICAgICAgICAgICAgICAgIGFwcGx5TGFiZWw6ICfnoa7orqQnLFxyXG4gICAgICAgICAgICAgICAgY2FuY2VsTGFiZWw6ICflj5bmtognLFxyXG4gICAgICAgICAgICAgICAgZnJvbUxhYmVsOiAn5LuOJyxcclxuICAgICAgICAgICAgICAgIHRvTGFiZWw6ICfoh7MnLFxyXG4gICAgICAgICAgICAgICAgY3VzdG9tUmFuZ2VMYWJlbDogJ+iHquWumuS5iScsXHJcbiAgICAgICAgICAgICAgICBkYXlzT2ZXZWVrOiBbJ+aXpScsICfkuIAnLCAn5LqMJywgJ+S4iScsICflm5snLCAn5LqUJywgJ+WFrSddLFxyXG4gICAgICAgICAgICAgICAgbW9udGhOYW1lczogWyfkuIDmnIgnLCAn5LqM5pyIJywgJ+S4ieaciCcsICflm5vmnIgnLCAn5LqU5pyIJywgJ+WFreaciCcsICfkuIPmnIgnLCAn5YWr5pyIJywgJ+S5neaciCcsICfljYHmnIgnLCAn5Y2B5LiA5pyIJywgJ+WNgeS6jOaciCddLFxyXG4gICAgICAgICAgICAgICAgZmlyc3REYXk6IDFcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2hvd1dlZWtOdW1iZXJzOiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcclxuICAgICAgICAgICAgJCgnI0RhdGVSYW5nZVN0YXJ0JykudmFsKG1vbWVudChzdGFydCkuZm9ybWF0KCdZWVlZL01NL0REIEhIOm1tOnNzJykpO1xyXG4gICAgICAgICAgICAkKCcjRGF0ZVJhbmdlRW5kJykudmFsKG1vbWVudChlbmQpLmZvcm1hdCgnWVlZWS9NTS9ERCBISDptbTpzcycpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy/orr7nva7liJ3lp4vmlbDmja5cclxuICAgICAgICB2YXIgc3RhcnREYXRlID0gbW9tZW50KCkuc3RhcnRPZignZGF5cycpO1xyXG4gICAgICAgIGlmIChzdGFydF90aW1lKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RhcnREYXRlID0gbW9tZW50KHN0YXJ0X3RpbWUsIFwiWVlZWS1NTS1ERFwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGVuZERhdGUgPSBtb21lbnQoKS5zdGFydE9mKCdkYXlzJykuYWRkKCdkYXlzJywgMSk7XHJcblxyXG4gICAgICAgICQoJyNEYXRlUmFuZ2UnKS5kYXRhKCdkYXRlcmFuZ2VwaWNrZXInKS5zZXRTdGFydERhdGUoc3RhcnREYXRlKTtcclxuICAgICAgICAkKCcjRGF0ZVJhbmdlJykuZGF0YSgnZGF0ZXJhbmdlcGlja2VyJykuc2V0RW5kRGF0ZShlbmREYXRlKTtcclxuICAgICAgICAkKCcjRGF0ZVJhbmdlU3RhcnQnKS52YWwoc3RhcnREYXRlLmZvcm1hdCgnWVlZWS9NTS9ERCBISDptbTpzcycpKTtcclxuICAgICAgICAkKCcjRGF0ZVJhbmdlRW5kJykudmFsKGVuZERhdGUuZm9ybWF0KCdZWVlZL01NL0REIEhIOm1tOnNzJykpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5jb21waWxlKHN0YXJ0X3RpbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGlucHV0IGlkPVwiRGF0ZVJhbmdlXCIgdHlwZT1cInRleHRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgaW5wdXQtc21cIiAvPlxyXG4gICAgICAgICAgICA8aW5wdXQgaWQ9XCJEYXRlUmFuZ2VTdGFydFwiIHR5cGU9XCJoaWRkZW5cIiAvPlxyXG4gICAgICAgICAgICA8aW5wdXQgaWQ9XCJEYXRlUmFuZ2VFbmRcIiB0eXBlPVwiaGlkZGVuXCIgLz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxudmFyIE9yZGVyTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIE1hbnVhbE9yZGVyOiBmdW5jdGlvbiAob3JkZXJfaW5mbykge1xyXG4gICAgICAgIHRoaXMucmVmcy5NYW51YWxPcmRlckRsZy5zaG93RGxnKG9yZGVyX2luZm8pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge307XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8v55uu5YmN5Y+q5pyJ5Y2h5Y2V55qE6K6i5Y2V5omN5Lya5pyJ5omL5bel5aSE55CG5rWB56iLXHJcbiAgICAgICAgdmFyIG9yZGVyTGlzdE5vZGVzID0gdGhpcy5wcm9wcy5vcmRlcl9saXN0Lm1hcChmdW5jdGlvbiAob3JkZXJfaW5mbywgaW5kZXgpIHtcclxuICAgICAgICAgICAgY29uc29sZS5pbmZvKG9yZGVyX2luZm8pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIG9wZXJCdG5Ob2RlID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKG9yZGVyX2luZm8uc3RhdHVzID09IFwi5Y2h5Y2VKOmcgOaJi+W3peWkhOeQhilcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgb3BlckJ0bk5vZGUgPSAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCIgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBidG4tcHJpbWFyeSBidG4teHMgYnRuLWRhbmdlclwiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLk1hbnVhbE9yZGVyLmJpbmQodGhpcyxvcmRlcl9pbmZvKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICDmiYvlt6XlpITnkIZcclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8ub3JkZXJfaWR9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8uYWNjb3VudH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57b3JkZXJfaW5mby5jcmVhdGV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8udXBkYXRlfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntvcmRlcl9pbmZvLnN0YXR1c308L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57b3JkZXJfaW5mby5jYXJkX2lkfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntvcmRlcl9pbmZvLnByaWNlfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntvcmRlcl9pbmZvLmFjY291bnRfcHJpY2V9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8uYm90X2FjY291bnR9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29wZXJCdG5Ob2RlfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8aGVhZGVyIGNsYXNzTmFtZT1cInBhbmVsLWhlYWRpbmcgcm93XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHVsbC1sZWZ0XCI+PGkgY2xhc3NOYW1lPVwiaWNvbi1zZWFyY2hcIj48L2k+6K6i5Y2V5YiX6KGoPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhbmVsLWJvZHkgdGFibGUtcmVzcG9uc2l2ZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0YWJsZSBpZD1cIm9yZGVyX3Jlc3VsdFwiIGNsYXNzTmFtZT1cInRhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtaG92ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7orqLljZXnvJblj7c8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7otKblj7c8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7lvIDlp4vml7bpl7Q8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7nirbmgIHml7bpl7Q8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7orqLljZXnirbmgIE8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7lhYXlgLzljaHlj7fnoIE8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7pnaLlgLw8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7liLDotKbph5Hpop08L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7lpJbmjILotKblj7c8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7mk43kvZw8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge29yZGVyTGlzdE5vZGVzfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICAgICAgICAgICAgPFBhZ2VJbmRleEdyb3VwIG9uUXVlcnk9e3RoaXMucHJvcHMub25RdWVyeX0gcGFnZV9pbmZvPXt0aGlzLnByb3BzLnBhZ2VfaW5mb30gLz5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPE1hbnVhbE9yZGVyRGxnIHJlZj1cIk1hbnVhbE9yZGVyRGxnXCIgLz5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbn0pO1xyXG5cclxudmFyIFBhZ2VJbmRleEdyb3VwID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgb25DbGlja1BhZ2U6IGZ1bmN0aW9uIChwYWdlX2luZGV4KSB7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5vblF1ZXJ5KHsgcGFnZV9pbmRleDogcGFnZV9pbmRleCB9LCAnZnVlbF9jYXJkX3F1ZXJ5Jyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7fTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucHJvcHMucGFnZV9pbmZvID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBwYWdlX2luZGV4ID0gdGhpcy5wcm9wcy5wYWdlX2luZm8ucGFnZV9pbmRleDtcclxuICAgICAgICB2YXIgbWF4X3BhZ2UgPSB0aGlzLnByb3BzLnBhZ2VfaW5mby5tYXhfcGFnZTtcclxuXHJcbiAgICAgICAgdmFyIHBhZ2Vfc3RhcnQgPSBwYWdlX2luZGV4IC0gNCA+IDAgPyBwYWdlX2luZGV4IC0gNCA6IDE7XHJcbiAgICAgICAgdmFyIHBhZ2VfZW5kID0gcGFnZV9pbmRleCArIDQgPiBtYXhfcGFnZSA/IG1heF9wYWdlIDogcGFnZV9pbmRleCArIDQ7XHJcblxyXG4gICAgICAgIHZhciBwYWdlX2luZGV4X2xpc3QgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gcGFnZV9zdGFydDsgaSA8PSBwYWdlX2VuZDsgKytpKSB7XHJcbiAgICAgICAgICAgIHBhZ2VfaW5kZXhfbGlzdC5wdXNoKGkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHBhZ2VJbmRleEJ0bkJvZGVzID0gcGFnZV9pbmRleF9saXN0Lm1hcChmdW5jdGlvbiAoaSwgaW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGRpc2FibGVkID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKGkgPT0gdGhpcy5wcm9wcy5wYWdlX2luZm8ucGFnZV9pbmRleCkge1xyXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQgPSBcImRpc2FibGVkXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdFwiIGRpc2FibGVkPXtkaXNhYmxlZH0gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9e3RoaXMub25DbGlja1BhZ2UuYmluZCh0aGlzLGkpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2l9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgdmFyIGZhc3RCYWNrd2FyZERpc2FibGVkID0gbnVsbDtcclxuICAgICAgICB2YXIgYmFja3dhcmREaXNhYmxlZCA9IG51bGw7XHJcbiAgICAgICAgaWYgKHBhZ2VfaW5kZXggPD0gMSkge1xyXG4gICAgICAgICAgICBmYXN0QmFja3dhcmREaXNhYmxlZCA9IFwiZGlzYWJsZWRcIjtcclxuICAgICAgICAgICAgYmFja3dhcmREaXNhYmxlZCA9IFwiZGlzYWJsZWRcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBmb3J3YXJkRGlzYWJsZWQgPSBudWxsO1xyXG4gICAgICAgIHZhciBmYXN0Rm9yd2FyZERpc2FibGVkID0gbnVsbDtcclxuICAgICAgICBpZiAocGFnZV9pbmRleCA+PSBtYXhfcGFnZSkge1xyXG4gICAgICAgICAgICBmb3J3YXJkRGlzYWJsZWQgPSBcImRpc2FibGVkXCI7XHJcbiAgICAgICAgICAgIGZhc3RGb3J3YXJkRGlzYWJsZWQgPSBcImRpc2FibGVkXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tMTJcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ0bi1yb3cgZGF0YVRhYmxlc19maWx0ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cInBhZ2VfZ3JvdXBcIiBjbGFzc05hbWU9XCJidG4tZ3JvdXBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCIgdHlwZT1cImJ1dHRvblwiIGRpc2FibGVkPXtmYXN0QmFja3dhcmREaXNhYmxlZH0gb25DbGljaz17dGhpcy5vbkNsaWNrUGFnZS5iaW5kKHRoaXMsMSl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tZmFzdC1iYWNrd2FyZFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCIgdHlwZT1cImJ1dHRvblwiIGRpc2FibGVkPXtiYWNrd2FyZERpc2FibGVkfSBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tQYWdlLmJpbmQodGhpcyxwYWdlX2luZGV4LTEpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJpY29uLWJhY2t3YXJkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3BhZ2VJbmRleEJ0bkJvZGVzfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHRcIiB0eXBlPVwiYnV0dG9uXCIgZGlzYWJsZWQ9e2ZvcndhcmREaXNhYmxlZH0gb25DbGljaz17dGhpcy5vbkNsaWNrUGFnZS5iaW5kKHRoaXMscGFnZV9pbmRleCsxKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiaWNvbi1mb3J3YXJkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHRcIiB0eXBlPVwiYnV0dG9uXCIgZGlzYWJsZWQ9e2Zhc3RGb3J3YXJkRGlzYWJsZWR9IG9uQ2xpY2s9e3RoaXMub25DbGlja1BhZ2UuYmluZCh0aGlzLG1heF9wYWdlKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiaWNvbi1mYXN0LWZvcndhcmRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbi8v6K6i5Y2V5omL5bel5aSE55CG5by556qXXHJcbnZhciBNYW51YWxPcmRlckRsZyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIC8v5Y+R6YCB5Y2V56yU6K6i5Y2V55qE5omL5bel5aSE55CGXHJcbiAgICBzZW5kTWFudWFsT3JkZXI6IGZ1bmN0aW9uIChyZXF1X3R5cGUsIGFyZ3VfbGlzdCkge1xyXG4gICAgICAgIHZhciByZXF1X2RhdGEgPSB7XHJcbiAgICAgICAgICAgIHJlcXVfdHlwZTogcmVxdV90eXBlLFxyXG4gICAgICAgICAgICBhcmd1X2xpc3Q6IGFyZ3VfbGlzdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAnL2Z1ZWxfY2FyZC9tb2RlbV9mb3JyZXN0YWwvYXBpL29yZGVyL2ZpbmlzaDInLFxyXG4gICAgICAgICAgICB0eXBlOiAncG9zdCcsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHJlcXVfZGF0YSksXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcF9kYXRhLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCLmiYvliqjlpITnkIbmiJDlip9cIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi5omL5Yqo5aSE55CG6K6i5Y2V5Ye66ZSZIFwiICsgcmVzcF9kYXRhLm1zZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBzdGF0dXMsIGVycikge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCLmiYvliqjlpITnkIborqLljZXlvILluLggXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uIChYTUxIdHRwUmVxdWVzdCwgdGV4dFN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlRGxnKCk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy/lj5bmtojmjInpkq5cclxuICAgIG9uQ2xpY2tDYW5jbGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmhpZGVEbGcoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy/orqLljZXmiJDlip9cclxuICAgIG9uQ2xpY2tTdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGFjY291bnRfcHJpY2UgPSBwYXJzZUludCgkKFwiI2Zvcm1fYWNjb3VudF9wcmljZVwiKS52YWwoKSk7XHJcbiAgICAgICAgaWYgKCFhY2NvdW50X3ByaWNlIHx8IGFjY291bnRfcHJpY2UgPD0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwi6K+36YCJ5oup5q2j56Gu55qE6YeR6aKdXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWNvbmZpcm0oXy5zdHIuc3ByaW50Zign5oqK6K6i5Y2VICVzIOiuvuS4uuaIkOWKn++8jOiuouWNlemHkeminSAlcyDlhYM/JyxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkLCBhY2NvdW50X3ByaWNlKVxyXG4gICAgICAgICAgICApKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZW5kTWFudWFsT3JkZXIoJ29yZGVyX3N1Y2Nlc3MnLCB7XHJcbiAgICAgICAgICAgIG9yZGVyX2lkOiB0aGlzLnN0YXRlLm9yZGVyX2luZm8ub3JkZXJfaWQsXHJcbiAgICAgICAgICAgIGFjY291bnRfcHJpY2U6IGFjY291bnRfcHJpY2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8v6K6i5Y2V5aSx6LSl77yM5Y2h5pyJ5pWIXHJcbiAgICBvbkNsaWNrRmFpbENhcmRWYWxpZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghY29uZmlybShfLnN0ci5zcHJpbnRmKCfmiororqLljZUgJXMg6K6+5Li65aSx6LSl77yMIOWFheWAvOWNoSAlcyDmnInmlYg/JyxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkLCB0aGlzLnN0YXRlLm9yZGVyX2luZm8uY2FyZF9pZClcclxuICAgICAgICAgICAgKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VuZE1hbnVhbE9yZGVyKCdvcmRlcl9mYWlsX2NhcmRfdmFsaWQnLCB7XHJcbiAgICAgICAgICAgIG9yZGVyX2lkOiB0aGlzLnN0YXRlLm9yZGVyX2luZm8ub3JkZXJfaWQsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8v6K6i5Y2V5aSx6LSlLOWNoeWkseaViFxyXG4gICAgb25DbGlja0ZhaWxDYXJkSW52YWxpZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghY29uZmlybShfLnN0ci5zcHJpbnRmKCfmiororqLljZUgJXMg6K6+5Li65aSx6LSl77yMIOWFheWAvOWNoSAlcyDlvILluLg/JyxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkLHRoaXMuc3RhdGUub3JkZXJfaW5mby5jYXJkX2lkKVxyXG4gICAgICAgICAgICApKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZW5kTWFudWFsT3JkZXIoJ29yZGVyX2ZhaWxfY2FyZF9pbnZhbGlkJywge1xyXG4gICAgICAgICAgICBvcmRlcl9pZDogdGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaG93RGxnOiBmdW5jdGlvbiAob3JkZXJfaW5mbykge1xyXG4gICAgICAgIG9yZGVyX2luZm8uZXJyX2luZm8gPSBvcmRlcl9pbmZvLmVycl9kYXRhO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBvcmRlcl9pbmZvOiBvcmRlcl9pbmZvIH0pO1xyXG4gICAgICAgICQoJyNNYW51YWxPcmRlckRsZycpLm1vZGFsKCdzaG93Jyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhpZGVEbGc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmNsZWFySW5wdXQoKTtcclxuICAgICAgICAkKCcjTWFudWFsT3JkZXJEbGcnKS5tb2RhbCgnaGlkZScpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhcklucHV0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7b3JkZXJfaW5mbzoge319KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgb3JkZXJfaW5mbzoge30gfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbFwiIGlkPVwiTWFudWFsT3JkZXJEbGdcIiB0YWJJbmRleD1cIi0xXCIgcm9sZT1cImRpYWxvZ1wiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1kaWFsb2dcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWNvbnRlbnRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1oZWFkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzc05hbWU9XCJtb2RhbC10aXRsZVwiPiDljaHljZU8Yj57dGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkfTwvYj7miYvlt6XlpITnkIY8L2g1PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5IGZvcm0taG9yaXpvbnRhbFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj48c3Ryb25nPuiuouWNleWPtzo8L3N0cm9uZz4ge3RoaXMuc3RhdGUub3JkZXJfaW5mby5vcmRlcl9pZH08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+PHN0cm9uZz7lhYXlgLzljaHlj7c6PC9zdHJvbmc+IHt0aGlzLnN0YXRlLm9yZGVyX2luZm8uY2FyZF9pZH08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+PHN0cm9uZz7pnaLlgLw6PC9zdHJvbmc+IHt0aGlzLnN0YXRlLm9yZGVyX2luZm8ucHJpY2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPjxzdHJvbmc+5Y2h5Y2V5Y6f5ZugOjwvc3Ryb25nPiB7dGhpcy5zdGF0ZS5vcmRlcl9pbmZvLmVycl9pbmZvfTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgcHJpY2VfY29sb3JcIj7ms6jmhI865Y2h5Y2V5aSE55CG55qE57uT5p6c5Zyo5pys6aG16Z2i5Lya5pyJ5omA5bu26L+fPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXAgYWRkLXByby1ib2R5XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXYtdGFicyBtLWJvdDE1XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJhY3RpdmVcIj48YSBocmVmPVwiI21hbnVhbF9zdWNjZXNzXCIgZGF0YS10b2dnbGU9XCJ0YWJcIj7nva7miJDlip88L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjbWFudWFsX2ZhaWxcIiBkYXRhLXRvZ2dsZT1cInRhYlwiPue9ruWksei0pTwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cIm15VGFiQ29udGVudFwiIGNsYXNzTmFtZT1cInRhYi1jb250ZW50IG0tYm90MTVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0YWItcGFuZSBhY3RpdmVcIiBpZD1cIm1hbnVhbF9zdWNjZXNzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtc20tNCBjb2wtbWQtMiBjb250cm9sLWxhYmVsXCI+6YeR6aKdPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS04IGNvbC1tZC05XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJmb3JtX2FjY291bnRfcHJpY2VcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgbS1ib3QxNSBpbnB1dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiPijml6ApPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMzBcIj4zMDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjUwXCI+NTA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIxMDBcIj4xMDA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIyMDBcIj4yMDA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCI1MDBcIj41MDA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIxMDAwXCI+MTAwMDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1mb290ZXIgZm9ybS1ob3JpZm9vdGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBpZD1cImNoYW5nZV9wcmljZV9idG5cIiB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBidG4tZGFuZ2VyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja1N1Y2Nlc3N9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDnoa7lrppcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja0NhbmNsZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+W5raIXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGFiLXBhbmVcIiBpZD1cIm1hbnVhbF9mYWlsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0taG9yaWZvb3RlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLW9mZnNldC0zIGNvbC1tZC04XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4tc3VjY2VzcyBtLXJpZ2h0MTAgbS1ib3QyMFwiIG9uQ2xpY2s9e3RoaXMub25DbGlja0ZhaWxDYXJkVmFsaWR9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg572u5aSx6LSlLOWNoeacieaViFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kYW5nZXIgbS1ib3QyMFwiIG9uQ2xpY2s9e3RoaXMub25DbGlja0ZhaWxDYXJkSW52YWxpZH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDnva7lpLHotKUs5Y2h5byC5bi4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWZvb3RlciBmb3JtLWhvcmlmb290ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja0NhbmNsZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+W5raIXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblJlYWN0LnJlbmRlcihcclxuICAgIDxNYWluQ29udGVudCAvPlxyXG4gICAgLFxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4tY29udGVudCcpXHJcbik7XHJcbiJdfQ==
