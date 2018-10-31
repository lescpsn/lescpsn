(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//显示全屏遮罩
var Showfullbg = function () {
    $("#reload_fullbg,#reload_icon").show();
};

//隐藏全屏遮罩
var Hidefullbg = function () {
    $("#reload_fullbg,#reload_icon").hide();
};

Date.prototype.Format = function (fmt) {
    //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o) if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return fmt;
};

//判断本时段是否可以充值
var is_valid_time = function () {
    var time_now = new Date().Format("hhmm");
    time_now = Number(time_now);

    if (time_now > 2240 || time_now < 100) {
        return false;
    } else {
        return true;
    }
};

//记录单笔充值历史
var G_ORDER_LIST = [];

var MainContent = React.createClass({
    displayName: "MainContent",

    onRecharge: function () {
        this.refs.OrderList.updateOrderList();
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {},

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        if (!is_valid_time()) {
            alert("当前时间段不能充值, 请等到凌晨1点之后");
            return null;
        }

        return React.createElement(
            "div",
            { className: "wrapper" },
            React.createElement("div", { id: "reload_fullbg" }),
            React.createElement(
                "div",
                { id: "reload_icon" },
                React.createElement("i", { className: "icon-spinner icon-spin icon-4x" })
            ),
            React.createElement(CardInventoryInfoTable, null),
            React.createElement(RechargePanel, { ref: "RechargePanel", onRecharge: this.onRecharge }),
            React.createElement(OrderList, { ref: "OrderList" })
        );
    }
});

var RechargePanel = React.createClass({
    displayName: "RechargePanel",

    //卡号变更事件
    onAccountInput: function () {

        var new_value = $('#form_account').val();

        if (new_value.length < 19) {

            $("#form_account").addClass('error');
            $('#form_account_error').removeClass('hidden');
            $('#form_account_error,#customer_msg').addClass('hidden');
        } else {
            $("#form_account").removeClass('error');
        }
        if (new_value.length == 0) {
            $('#show_number').text('请输入加油卡号');
            $("#show_carrier").text('');
            $("#prod").hide();
            $("#act_charge").attr({ 'disabled': 'disabled' });
        }
        $('#show_number').text(new_value);
        if (new_value.length >= 10) {
            this.getProductList(new_value);
            $("#prod").show();
        } else if (new_value.length < 10) {
            this.setState({
                carrier: '',
                prod_list: []
            });
            $("#show_carrier").text('');
            $("#prod").hide();
            $("#act_charge").attr({ 'disabled': 'disabled' });
        }
        if (new_value.length == 19) {
            $("#form_account").removeClass('error');
            $('#form_account_error').addClass('hidden');
            this.getProductList(new_value);
        }
    },

    //读取产品列表
    getProductList: function (new_value) {

        $.ajax({
            url: _.str.sprintf('/charge/sinopec/single/product?account_number=%s', encodeURIComponent(new_value)),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {

                if (resp_data.status == 'ok') {
                    this.setState({
                        last_account_10: new_value.substr(0, 10),
                        carrier: resp_data.name,
                        prod_list: resp_data.prod
                    });
                    $("#prod").show();
                    $('#act_charge').removeAttr('disabled');
                } else {
                    $("#form_account_error").removeClass('hidden');
                }
            }.bind(this),

            error: function (xhr, status, err) {
                $("#prod").hide();
                alert("读取产品列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //设置产品列表
    setProd: function (prod_list) {
        $("#prod").html("");
        for (var i = 0; i < prod_list.length; i++) {
            $("#prod").append("<li><input type='hidden' value='" + prod_list[i]['offer'] + "'/><strong>" + prod_list[i]['name'] + "</strong><span>采购价格<b class='price'>" + prod_list[i]['value'] + "</b> 元</span></li>");
        }
        $("#show_carrier").text(this.state.carrier);
        $("#prod li").bind("click", function () {
            $(this).addClass("prod_hover").siblings().removeClass("prod_hover");
        });
    },

    //发送充值请求
    onClickRechargeRequ: function () {
        var onRecharge = this.props.onRecharge;
        if (!is_valid_time()) {
            alert("当前时间段不能充值, 请等到凌晨1点之后");
            return null;
        }

        var account = $("#form_account").val();
        if (account.length != 19) {
            alert('卡号不正确');
            return;
        }
        var prod = $('#prod li.prod_hover input').val();
        if (!prod || prod.length == 0) {
            alert("请选择充值产品");
            return;
        }

        $("#act_charge").attr({ 'disabled': 'disabled' });
        var data = { number: account, prod: prod };
        $.post('/api/latest_check', JSON.stringify(data)).done(function (check) {
            if (check.status && check.status == 'fail') {
                if (!confirm(check.msg)) {

                    $("#act_charge").removeAttr('disabled');
                    return;
                }
            }
            Showfullbg();
            $.post('/charge/sinopec/single', JSON.stringify(data)).done(function (data) {
                console.debug(data);

                var m = JSON.parse(data);

                var create_time = moment().startOf('second').format('YYYY-MM-DD HH:mm:ss');

                //alert(m.msg);
                if (m.status == 'ok') {
                    G_ORDER_LIST.unshift({ create_time: create_time, account: account, order_id: m.order_id, processing: true, result: false, order_data: {} });
                    alert("充值请求发送成功,\n" + "订单编号为:" + m.order_id + "\n您稍后可以在订单记录查询这笔订单!");
                    $("#show_carrier").text('');
                    $("#act_charge").attr({ 'disabled': 'disabled' });
                    $('#customer_msg').addClass('hidden');
                    $("#form_account").val('');
                    $("#prod").hide();
                    $('#show_number').text('请输入加油卡号');
                } else if (m.status == 'fail') {
                    G_ORDER_LIST.unshift({ create_time: create_time, account: account, order_id: m.order_id, processing: false, result: true });
                    alert('充值失败!\n' + m.msg);
                    $("#act_charge").removeAttr('disabled');
                    return;
                }

                //window.setTimeout(query_order.bind(this, m.sp_order_id, 1), 3000);
            }).always(function () {
                onRecharge();
                $("#act_charge").attr('disabled');
            }.bind(onRecharge));
            Hidefullbg();
        });
    },

    //显示常用客户列表弹窗
    onClickCustomerDlg: function () {
        this.refs.CustomerDlg.showDlg(this.getProductList);
    },

    getInitialState: function () {
        return {
            last_account_10: null,
            carrier: null,
            prod_list: []
        };
    },

    //在dom构建之后可以使用jquery进行事件绑定
    componentDidMount: function () {
        $('#form_account').keydown(function (e) {
            if (!e) var e = window.event;

            if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 96 && e.keyCode <= 105 || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 37 || e.keyCode == 39) {} else {

                return false;
            };
        });
    },

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {

        var prodListNodes = this.setProd(this.state.prod_list);

        return React.createElement(
            "section",
            { className: "panel" },
            React.createElement(
                "header",
                { className: "panel-heading row" },
                React.createElement(
                    "span",
                    { className: "pull-left" },
                    React.createElement("i", { className: "icon-edit" }),
                    "加油卡单笔充值"
                ),
                React.createElement(
                    "b",
                    { className: "price_color" },
                    "(每日22：50至次日凌晨00:50为系统结算时间，此段时间中石化网站暂停充值。)"
                )
            ),
            React.createElement(
                "div",
                { className: "panel-body" },
                React.createElement(
                    "form",
                    { className: "form-validate form-horizontal ", method: "get" },
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "label",
                            { className: "col-sm-2 col-md-2 control-label" },
                            "账号"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-6 col-md-5" },
                            React.createElement("input", { id: "form_account", className: "form-control", autocomplete: "off", placeholder: "请输入19位中石化加油卡卡号",
                                maxLength: "19", onChange: this.onAccountInput })
                        ),
                        React.createElement(
                            "button",
                            { type: "button", className: "btn btn-danger m-bot10", onClick: this.onClickCustomerDlg },
                            "常用客户列表"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-8 col-md-offset-2 col-md-5" },
                            React.createElement(
                                "span",
                                { className: "form-control alert alert-danger padding-5 m-bot-none hidden",
                                    id: "form_account_error" },
                                "请输入正确的19位中石化加油卡卡号"
                            ),
                            React.createElement("span", { className: "form-control alert alert-info padding-5 m-bot-none hidden",
                                id: "customer_msg" })
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "label",
                            { className: "col-sm-2 col-md-2 control-label" },
                            " "
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-4" },
                            React.createElement(
                                "h1",
                                { id: "show_number" },
                                "请输入加油卡号"
                            )
                        ),
                        React.createElement(
                            "div",
                            { className: "col-sm-4" },
                            React.createElement("h2", { id: "show_carrier" })
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "label",
                            { className: "col-sm-2 col-md-2 control-label" },
                            "充值产品"
                        ),
                        React.createElement(
                            "ul",
                            { id: "prod", className: "col-sm-8" },
                            prodListNodes
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "div",
                            { className: "col-lg-offset-2 col-lg-10" },
                            React.createElement(
                                "a",
                                { id: "act_charge", href: "javascript:void(0);", className: "btn btn-danger", disabled: "disabled", onClick: this.onClickRechargeRequ },
                                React.createElement("i", { className: "icon-ok-circle" }),
                                " 确定"
                            )
                        )
                    )
                )
            ),
            React.createElement(CustomerDlg, { ref: "CustomerDlg" })
        );
    }

});

//常用用户列表弹窗
var CustomerDlg = React.createClass({
    displayName: "CustomerDlg",

    //读取常用客户列表
    getCustomerList: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/customer_list?&requ_type=%s', encodeURIComponent('get_customer_list')),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        customer_list: resp_data.data.customer_list
                    });
                } else {
                    alert("读取客户列表出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("读取客户列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function () {
        this.getCustomerList();
    },

    getInitialState: function () {
        return {
            customer_list: [],
            getProductList: null
        };
    },

    showDlg: function (getProductList) {
        this.setState({
            getProductList: getProductList
        });
        this.getCustomerList();
        $('#CustomerDlg').modal('show');
    },

    hideDlg: function () {
        this.clear();
        $('#CustomerDlg').modal('hide');
    },

    clear: function () {
        this.setState({
            customer_list: [],
            getProductList: null
        });
    },

    SelectCardId: function () {
        var card_id = $('#form_customer_id').val();
        var card_name = $('#form_customer_id').find("option:selected").attr("title");
        $('#show_number').text(card_id);
        $('#form_account').val(card_id).removeClass('error');
        $('#form_account_error').addClass('hidden');

        $('#act_charge').removeAttr('disabled');
        this.state.getProductList(card_id);
        $("#prod").show();
        $('#customer_msg').removeClass("hidden");
        $('#customer_msg').text("当前选择的客户为: " + card_name);
        this.hideDlg();
    },

    render: function () {
        var customerListNodes = this.state.customer_list.map(function (customer_info, index) {
            return React.createElement(
                "option",
                { value: customer_info.card_id, "data-subtext": customer_info.card_id, title: customer_info.name },
                customer_info.card_id,
                " - ",
                customer_info.name
            );
        });

        return React.createElement(
            "div",
            { className: "modal", id: "CustomerDlg", tabIndex: "-1", role: "dialog" },
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
                            "选择常用客户账号"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "modal-body form-horizontal" },
                        React.createElement(
                            "div",
                            { className: "form-group add-pro-body" },
                            React.createElement(
                                "div",
                                { className: "col-sm-8 col-lg-12" },
                                React.createElement(
                                    "select",
                                    { className: "form-control m-bot15", id: "form_customer_id",
                                        "data-live-search": "true" },
                                    customerListNodes
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "modal-footer form-horifooter" },
                        React.createElement(
                            "button",
                            { type: "button", id: "add_account_btn", className: "btn btn-danger", onClick: this.SelectCardId },
                            "选择"
                        ),
                        React.createElement(
                            "button",
                            { type: "button", className: "btn btn-default", "data-dismiss": "modal" },
                            "取消"
                        )
                    )
                )
            )
        );
    }
});

//库存信息
var CardInventoryInfoTable = React.createClass({
    displayName: "CardInventoryInfoTable",

    getCardInventory: function () {
        $.ajax({
            url: '/fuel_card/card_inventory?requ_type=get_user_inventory&card_type=SINOPEC',
            dataType: 'json',
            type: 'get',

            success: function (resp_data) {
                console.info("库存信息", resp_data);
                if (resp_data.status == 'ok') {
                    var price_list = [];
                    for (var price in resp_data.data.price_inventory) {
                        price_list.push({
                            price: price,
                            count: resp_data.data.price_inventory[price]
                        });
                    }

                    this.setState({ price_list: price_list, error_msg: null });
                } else {
                    this.setState({ price_list: [], error_msg: "库存信息读取失败" });
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            price_list: [],
            error_msg: "等待读取"
        };
    },

    componentDidMount: function () {
        this.getCardInventory();
    },

    render: function () {
        var priceCountNodes = this.state.price_list.map(function (price_info, index) {
            return React.createElement(
                "span",
                { key: "priceCountNodes_" + index, className: "label label-primary m-right10" },
                price_info.price,
                "元 剩余",
                React.createElement(
                    "span",
                    { className: "badge" },
                    price_info.count
                )
            );
        }.bind(this));

        return React.createElement(
            "section",
            { className: "panel" },
            React.createElement(
                "header",
                { className: "panel-heading row" },
                React.createElement(
                    "span",
                    { className: "pull-left" },
                    React.createElement("i", { className: "icon-briefcase" }),
                    "库存信息"
                ),
                React.createElement(
                    "span",
                    { className: "pull-right" },
                    React.createElement(
                        "a",
                        { className: "btn btn-info m-right5", href: "javascript:void(0);", onClick: this.getCardInventory },
                        React.createElement("i", { className: "icon-refresh" }),
                        " 刷新"
                    )
                ),
                React.createElement(
                    "div",
                    { className: "col-sm-offset-1" },
                    React.createElement(
                        "h3",
                        { className: "margin-none" },
                        priceCountNodes
                    )
                )
            )
        );
    }
});

var OrderList = React.createClass({
    displayName: "OrderList",

    ManualOrder: function (order_info) {
        this.refs.ManualOrderDlg.showDlg(order_info);
    },

    updateOrderList: function () {
        if (this.state.in_query) {
            return;
        }
        this.setState({ order_list: G_ORDER_LIST, in_query: true });

        for (var i in G_ORDER_LIST) {
            if (!G_ORDER_LIST[i].result) {
                $.ajax({
                    url: _.str.sprintf('/api/sinopec_order_query?product=sinopec&requ_type=%s&order_id=%s', encodeURIComponent('fuel_card_query'), encodeURIComponent(G_ORDER_LIST[i].order_id)),
                    type: 'get',
                    dataType: 'json',
                    async: false,

                    success: function (resp_data) {
                        if (resp_data.status == 'ok') {
                            var result_info = resp_data.data.order_list[0];
                            if (result_info) {
                                G_ORDER_LIST[i].order_data = result_info;
                                if (result_info.status == "充值中" || result_info.status == "卡单(需手工处理)") {
                                    G_ORDER_LIST[i].result = false;
                                } else {
                                    G_ORDER_LIST[i].result = true;
                                }
                            }
                        } else {
                            //alert("查询出错 " + resp_data.msg);
                            console.error(this.props.url, "查询出错");
                        }
                    }.bind(this),

                    error: function (xhr, status, err) {
                        //alert("查询异常 " + err.toString());
                        console.error(this.props.url, status, err.toString());
                    }.bind(this)
                });
            }
        }

        this.setState({ order_list: G_ORDER_LIST, in_query: false });
    },

    getInitialState: function () {
        return {
            order_list: [],
            in_query: false
        };
    },

    componentDidMount: function () {
        setInterval(this.updateOrderList, 10 * 1000);
    },

    componentDidUpdate: function (updateOrderList, prevState) {},

    render: function () {

        var orderListNodes = this.state.order_list.map(function (order_info, index) {
            if (!order_info.order_data.status) {
                order_info.order_data.status = "充值中";
            }

            var operBtnNode = null;
            if (order_info.order_data.status == "卡单(需手工处理)") {
                operBtnNode = React.createElement(
                    "a",
                    { href: "javascript:void(0);",
                        className: "btn btn-primary btn-xs btn-danger",
                        onClick: this.ManualOrder.bind(this, order_info.order_data) },
                    "手工处理"
                );
            }

            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    null,
                    order_info.create_time
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.account
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.processing ? order_info.order_data.status : "充值失败"
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.order_id
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.order_data.card_id
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.order_data.price
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.order_data.account_price
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.order_data.account_price ? order_info.order_data.update : null
                ),
                React.createElement(
                    "td",
                    null,
                    order_info.order_data.bot_account
                ),
                React.createElement(
                    "td",
                    null,
                    operBtnNode
                )
            );
        }.bind(this));

        return React.createElement(
            "section",
            { className: "panel" },
            React.createElement(
                "header",
                { className: "panel-heading row" },
                React.createElement(
                    "span",
                    { className: "pull-left" },
                    React.createElement("i", { className: "icon-search" }),
                    "充值记录"
                ),
                React.createElement(
                    "b",
                    { className: "price_color" },
                    "(大概会有十秒左右的延迟。)"
                ),
                React.createElement(
                    "span",
                    { className: "pull-right" },
                    React.createElement(
                        "a",
                        { className: "btn btn-info m-right5", href: "javascript:void(0);", onClick: this.updateOrderList },
                        React.createElement("i", { className: "icon-refresh" }),
                        " 刷新"
                    )
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
                                "创建时间"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "账号"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "状态"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "订单号"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "卡号"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "面值"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "到账面值"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "到账时间"
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
                )
            ),
            React.createElement(ManualOrderDlg, { ref: "ManualOrderDlg" })
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWNcXGpzeFxcZnVlbF9jYXJkXFxzaW5nbGVfcmVjaGFyZ2UuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0NBLElBQUksYUFBYSxZQUFZO0FBQ3pCLE1BQUUsNkJBQUYsRUFBaUMsSUFBakMsR0FEeUI7Q0FBWjs7O0FBS2pCLElBQUksYUFBYSxZQUFZO0FBQ3pCLE1BQUUsNkJBQUYsRUFBaUMsSUFBakMsR0FEeUI7Q0FBWjs7QUFJakIsS0FBSyxTQUFMLENBQWUsTUFBZixHQUF3QixVQUFVLEdBQVYsRUFBZTs7QUFDbkMsUUFBSSxJQUFJO0FBQ0osY0FBTSxLQUFLLFFBQUwsS0FBa0IsQ0FBbEI7QUFDTixjQUFNLEtBQUssT0FBTCxFQUFOO0FBQ0EsY0FBTSxLQUFLLFFBQUwsRUFBTjtBQUNBLGNBQU0sS0FBSyxVQUFMLEVBQU47QUFDQSxjQUFNLEtBQUssVUFBTCxFQUFOO0FBQ0EsY0FBTSxLQUFLLEtBQUwsQ0FBVyxDQUFDLEtBQUssUUFBTCxLQUFrQixDQUFsQixDQUFELEdBQXdCLENBQXhCLENBQWpCO0FBQ0EsYUFBSyxLQUFLLGVBQUwsRUFBTDtBQVBJLEtBQUosQ0FEK0I7QUFVbkMsUUFBSSxPQUFPLElBQVAsQ0FBWSxHQUFaLENBQUosRUFBc0IsTUFBTSxJQUFJLE9BQUosQ0FBWSxPQUFPLEVBQVAsRUFBVyxDQUFDLEtBQUssV0FBTCxLQUFxQixFQUFyQixDQUFELENBQTBCLE1BQTFCLENBQWlDLElBQUksT0FBTyxFQUFQLENBQVUsTUFBVixDQUE1RCxDQUFOLENBQXRCO0FBQ0EsU0FBSyxJQUFJLENBQUosSUFBUyxDQUFkLEVBQ0ksSUFBSSxJQUFJLE1BQUosQ0FBVyxNQUFNLENBQU4sR0FBVSxHQUFWLENBQVgsQ0FBMEIsSUFBMUIsQ0FBK0IsR0FBL0IsQ0FBSixFQUF5QyxNQUFNLElBQUksT0FBSixDQUFZLE9BQU8sRUFBUCxFQUFXLE1BQUMs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QUFMOzZDQUhqQjs7eUNBREo7cUNBWEo7aUNBL0JKOzZCQUxKO3lCQU5KO3FCQUpKO2lCQURKO2FBREo7U0FESixDQURnQjtLQUFaO0NBM0dTLENBQWpCOztBQTRMSixNQUFNLE1BQU4sQ0FDSSxvQkFBQyxXQUFELE9BREosRUFFSSxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FGSiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCLvu78vL+aYvuekuuWFqOWxj+mBrue9qVxyXG52YXIgU2hvd2Z1bGxiZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoXCIjcmVsb2FkX2Z1bGxiZywjcmVsb2FkX2ljb25cIikuc2hvdygpO1xyXG59O1xyXG5cclxuLy/pmpDol4/lhajlsY/pga7nvalcclxudmFyIEhpZGVmdWxsYmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKFwiI3JlbG9hZF9mdWxsYmcsI3JlbG9hZF9pY29uXCIpLmhpZGUoKTtcclxufTtcclxuXHJcbkRhdGUucHJvdG90eXBlLkZvcm1hdCA9IGZ1bmN0aW9uIChmbXQpIHsgLy9hdXRob3I6IG1laXp6XHJcbiAgICB2YXIgbyA9IHtcclxuICAgICAgICBcIk0rXCI6IHRoaXMuZ2V0TW9udGgoKSArIDEsIC8v5pyI5Lu9XHJcbiAgICAgICAgXCJkK1wiOiB0aGlzLmdldERhdGUoKSwgLy/ml6VcclxuICAgICAgICBcImgrXCI6IHRoaXMuZ2V0SG91cnMoKSwgLy/lsI/ml7ZcclxuICAgICAgICBcIm0rXCI6IHRoaXMuZ2V0TWludXRlcygpLCAvL+WIhlxyXG4gICAgICAgIFwicytcIjogdGhpcy5nZXRTZWNvbmRzKCksIC8v56eSXHJcbiAgICAgICAgXCJxK1wiOiBNYXRoLmZsb29yKCh0aGlzLmdldE1vbnRoKCkgKyAzKSAvIDMpLCAvL+Wto+W6plxyXG4gICAgICAgIFwiU1wiOiB0aGlzLmdldE1pbGxpc2Vjb25kcygpIC8v5q+r56eSXHJcbiAgICB9O1xyXG4gICAgaWYgKC8oeSspLy50ZXN0KGZtdCkpIGZtdCA9IGZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKHRoaXMuZ2V0RnVsbFllYXIoKSArIFwiXCIpLnN1YnN0cig0IC0gUmVnRXhwLiQxLmxlbmd0aCkpO1xyXG4gICAgZm9yICh2YXIgayBpbiBvKVxyXG4gICAgICAgIGlmIChuZXcgUmVnRXhwKFwiKFwiICsgayArIFwiKVwiKS50ZXN0KGZtdCkpIGZtdCA9IGZtdC5yZXBsYWNlKFJlZ0V4cC4kMSwgKFJlZ0V4cC4kMS5sZW5ndGggPT0gMSkgPyAob1trXSkgOiAoKFwiMDBcIiArIG9ba10pLnN1YnN0cigoXCJcIiArIG9ba10pLmxlbmd0aCkpKTtcclxuICAgIHJldHVybiBmbXQ7XHJcbn1cclxuXHJcbi8v5Yik5pat5pys5pe25q615piv5ZCm5Y+v5Lul5YWF5YC8XHJcbnZhciBpc192YWxpZF90aW1lID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHRpbWVfbm93ID0gbmV3IERhdGUoKS5Gb3JtYXQoXCJoaG1tXCIpO1xyXG4gICAgdGltZV9ub3cgPSBOdW1iZXIodGltZV9ub3cpO1xyXG5cclxuICAgIGlmICh0aW1lX25vdyA+IDIyNDAgfHwgdGltZV9ub3cgPCAxMDApIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufTtcclxuXHJcbi8v6K6w5b2V5Y2V56yU5YWF5YC85Y6G5Y+yXHJcbnZhciBHX09SREVSX0xJU1QgPSBbXTtcclxuXHJcbnZhciBNYWluQ29udGVudCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIG9uUmVjaGFyZ2U6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnJlZnMuT3JkZXJMaXN0LnVwZGF0ZU9yZGVyTGlzdCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge307XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghaXNfdmFsaWRfdGltZSgpKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwi5b2T5YmN5pe26Ze05q615LiN6IO95YWF5YC8LCDor7fnrYnliLDlh4zmmagx54K55LmL5ZCOXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwid3JhcHBlclwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBpZD1cInJlbG9hZF9mdWxsYmdcIj48L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJyZWxvYWRfaWNvblwiPjxpIGNsYXNzTmFtZT1cImljb24tc3Bpbm5lciBpY29uLXNwaW4gaWNvbi00eFwiPjwvaT48L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxDYXJkSW52ZW50b3J5SW5mb1RhYmxlIC8+XHJcbiAgICAgICAgICAgICAgICA8UmVjaGFyZ2VQYW5lbCByZWY9XCJSZWNoYXJnZVBhbmVsXCIgIG9uUmVjaGFyZ2U9e3RoaXMub25SZWNoYXJnZX0vPlxyXG4gICAgICAgICAgICAgICAgPE9yZGVyTGlzdCByZWY9XCJPcmRlckxpc3RcIi8+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbnZhciBSZWNoYXJnZVBhbmVsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgLy/ljaHlj7flj5jmm7Tkuovku7ZcclxuICAgIG9uQWNjb3VudElucHV0OiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBuZXdfdmFsdWUgPSAkKCcjZm9ybV9hY2NvdW50JykudmFsKCk7XHJcblxyXG4gICAgICAgIGlmIChuZXdfdmFsdWUubGVuZ3RoIDwgMTkpIHtcclxuXHJcbiAgICAgICAgICAgICQoXCIjZm9ybV9hY2NvdW50XCIpLmFkZENsYXNzKCdlcnJvcicpO1xyXG4gICAgICAgICAgICAkKCcjZm9ybV9hY2NvdW50X2Vycm9yJykucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xyXG4gICAgICAgICAgICAkKCcjZm9ybV9hY2NvdW50X2Vycm9yLCNjdXN0b21lcl9tc2cnKS5hZGRDbGFzcygnaGlkZGVuJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJChcIiNmb3JtX2FjY291bnRcIikucmVtb3ZlQ2xhc3MoJ2Vycm9yJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChuZXdfdmFsdWUubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgJCgnI3Nob3dfbnVtYmVyJykudGV4dCgn6K+36L6T5YWl5Yqg5rK55Y2h5Y+3Jyk7XHJcbiAgICAgICAgICAgICQoXCIjc2hvd19jYXJyaWVyXCIpLnRleHQoJycpO1xyXG4gICAgICAgICAgICAkKFwiI3Byb2RcIikuaGlkZSgpO1xyXG4gICAgICAgICAgICAkKFwiI2FjdF9jaGFyZ2VcIikuYXR0cih7ICdkaXNhYmxlZCc6ICdkaXNhYmxlZCcgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQoJyNzaG93X251bWJlcicpLnRleHQobmV3X3ZhbHVlKTtcclxuICAgICAgICBpZiAobmV3X3ZhbHVlLmxlbmd0aCA+PSAxMCkge1xyXG4gICAgICAgICAgICB0aGlzLmdldFByb2R1Y3RMaXN0KG5ld192YWx1ZSk7XHJcbiAgICAgICAgICAgICQoXCIjcHJvZFwiKS5zaG93KCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChuZXdfdmFsdWUubGVuZ3RoIDwgMTApIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICBjYXJyaWVyOiAnJyxcclxuICAgICAgICAgICAgICAgIHByb2RfbGlzdDogW10sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAkKFwiI3Nob3dfY2FycmllclwiKS50ZXh0KCcnKTtcclxuICAgICAgICAgICAgJChcIiNwcm9kXCIpLmhpZGUoKTtcclxuICAgICAgICAgICAgJChcIiNhY3RfY2hhcmdlXCIpLmF0dHIoeyAnZGlzYWJsZWQnOiAnZGlzYWJsZWQnIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobmV3X3ZhbHVlLmxlbmd0aCA9PSAxOSkge1xyXG4gICAgICAgICAgICAkKFwiI2Zvcm1fYWNjb3VudFwiKS5yZW1vdmVDbGFzcygnZXJyb3InKTtcclxuICAgICAgICAgICAgJCgnI2Zvcm1fYWNjb3VudF9lcnJvcicpLmFkZENsYXNzKCdoaWRkZW4nKTtcclxuICAgICAgICAgICAgdGhpcy5nZXRQcm9kdWN0TGlzdChuZXdfdmFsdWUpO1xyXG4gICAgICAgIH0gICAgICBcclxuICAgIH0sXHJcblxyXG4gICAgLy/or7vlj5bkuqflk4HliJfooahcclxuICAgIGdldFByb2R1Y3RMaXN0OiBmdW5jdGlvbiAobmV3X3ZhbHVlKSB7XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXy5zdHIuc3ByaW50ZignL2NoYXJnZS9zaW5vcGVjL3NpbmdsZS9wcm9kdWN0P2FjY291bnRfbnVtYmVyPSVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChuZXdfdmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BfZGF0YSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZXNwX2RhdGEuc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdF9hY2NvdW50XzEwOiBuZXdfdmFsdWUuc3Vic3RyKDAsIDEwKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FycmllcjogcmVzcF9kYXRhLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2RfbGlzdDogcmVzcF9kYXRhLnByb2QsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNwcm9kXCIpLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjYWN0X2NoYXJnZScpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjZm9ybV9hY2NvdW50X2Vycm9yXCIpLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAkKFwiI3Byb2RcIikuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCLor7vlj5bkuqflk4HliJfooajlvILluLggXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8v6K6+572u5Lqn5ZOB5YiX6KGoXHJcbiAgICBzZXRQcm9kOiBmdW5jdGlvbiAocHJvZF9saXN0KSB7XHJcbiAgICAgICAgJChcIiNwcm9kXCIpLmh0bWwoXCJcIik7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9kX2xpc3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgJChcIiNwcm9kXCIpLmFwcGVuZChcIjxsaT48aW5wdXQgdHlwZT0naGlkZGVuJyB2YWx1ZT0nXCIgKyBwcm9kX2xpc3RbaV1bJ29mZmVyJ10gKyBcIicvPjxzdHJvbmc+XCIgKyBwcm9kX2xpc3RbaV1bJ25hbWUnXSArIFwiPC9zdHJvbmc+PHNwYW4+6YeH6LSt5Lu35qC8PGIgY2xhc3M9J3ByaWNlJz5cIiArIHByb2RfbGlzdFtpXVsndmFsdWUnXSArIFwiPC9iPiDlhYM8L3NwYW4+PC9saT5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQoXCIjc2hvd19jYXJyaWVyXCIpLnRleHQodGhpcy5zdGF0ZS5jYXJyaWVyKTtcclxuICAgICAgICAkKFwiI3Byb2QgbGlcIikuYmluZChcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcyhcInByb2RfaG92ZXJcIikuc2libGluZ3MoKS5yZW1vdmVDbGFzcyhcInByb2RfaG92ZXJcIik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8v5Y+R6YCB5YWF5YC86K+35rGCXHJcbiAgICBvbkNsaWNrUmVjaGFyZ2VSZXF1OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIG9uUmVjaGFyZ2UgPSB0aGlzLnByb3BzLm9uUmVjaGFyZ2U7XHJcbiAgICAgICAgaWYgKCFpc192YWxpZF90aW1lKCkpIHtcclxuICAgICAgICAgICAgYWxlcnQoXCLlvZPliY3ml7bpl7TmrrXkuI3og73lhYXlgLwsIOivt+etieWIsOWHjOaZqDHngrnkuYvlkI5cIik7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFjY291bnQgPSAkKFwiI2Zvcm1fYWNjb3VudFwiKS52YWwoKTtcclxuICAgICAgICBpZiAoYWNjb3VudC5sZW5ndGggIT0gMTkpIHtcclxuICAgICAgICAgICAgYWxlcnQoJ+WNoeWPt+S4jeato+ehricpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBwcm9kID0gJCgnI3Byb2QgbGkucHJvZF9ob3ZlciBpbnB1dCcpLnZhbCgpO1xyXG4gICAgICAgIGlmICghcHJvZCB8fCBwcm9kLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwi6K+36YCJ5oup5YWF5YC85Lqn5ZOBXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgJChcIiNhY3RfY2hhcmdlXCIpLmF0dHIoeyAnZGlzYWJsZWQnOiAnZGlzYWJsZWQnIH0pO1xyXG4gICAgICAgIHZhciBkYXRhID0geyBudW1iZXI6IGFjY291bnQsIHByb2Q6IHByb2QgfTtcclxuICAgICAgICAkLnBvc3QoJy9hcGkvbGF0ZXN0X2NoZWNrJywgSlNPTi5zdHJpbmdpZnkoZGF0YSkpLmRvbmUoZnVuY3Rpb24gKGNoZWNrKSB7XHJcbiAgICAgICAgICAgIGlmIChjaGVjay5zdGF0dXMgJiYgY2hlY2suc3RhdHVzID09ICdmYWlsJykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFjb25maXJtKGNoZWNrLm1zZykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNhY3RfY2hhcmdlXCIpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFNob3dmdWxsYmcoKTtcclxuICAgICAgICAgICAgJC5wb3N0KCcvY2hhcmdlL3Npbm9wZWMvc2luZ2xlJywgSlNPTi5zdHJpbmdpZnkoZGF0YSkpLmRvbmUoZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoZGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG0gPSBKU09OLnBhcnNlKGRhdGEpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjcmVhdGVfdGltZSA9IG1vbWVudCgpLnN0YXJ0T2YoJ3NlY29uZCcpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcycpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vYWxlcnQobS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG0uc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICBHX09SREVSX0xJU1QudW5zaGlmdCh7IGNyZWF0ZV90aW1lOiBjcmVhdGVfdGltZSwgYWNjb3VudDogYWNjb3VudCwgb3JkZXJfaWQ6IG0ub3JkZXJfaWQsIHByb2Nlc3Npbmc6IHRydWUsIHJlc3VsdDogZmFsc2UsIG9yZGVyX2RhdGE6IHt9IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi5YWF5YC86K+35rGC5Y+R6YCB5oiQ5YqfLFxcblwiICsgXCLorqLljZXnvJblj7fkuLo6XCIgKyBtLm9yZGVyX2lkICsgXCJcXG7mgqjnqI3lkI7lj6/ku6XlnKjorqLljZXorrDlvZXmn6Xor6Lov5nnrJTorqLljZUhXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjc2hvd19jYXJyaWVyXCIpLnRleHQoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjYWN0X2NoYXJnZVwiKS5hdHRyKHsgJ2Rpc2FibGVkJzogJ2Rpc2FibGVkJyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjY3VzdG9tZXJfbXNnJykuYWRkQ2xhc3MoJ2hpZGRlbicpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoXCIjZm9ybV9hY2NvdW50XCIpLnZhbCgnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNwcm9kXCIpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjc2hvd19udW1iZXInKS50ZXh0KCfor7fovpPlhaXliqDmsrnljaHlj7cnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobS5zdGF0dXMgPT0gJ2ZhaWwnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgR19PUkRFUl9MSVNULnVuc2hpZnQoeyBjcmVhdGVfdGltZTogY3JlYXRlX3RpbWUsIGFjY291bnQ6IGFjY291bnQsIG9yZGVyX2lkOiBtLm9yZGVyX2lkLCBwcm9jZXNzaW5nOiBmYWxzZSwgcmVzdWx0OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KCflhYXlgLzlpLHotKUhXFxuJyttLm1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChcIiNhY3RfY2hhcmdlXCIpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vd2luZG93LnNldFRpbWVvdXQocXVlcnlfb3JkZXIuYmluZCh0aGlzLCBtLnNwX29yZGVyX2lkLCAxKSwgMzAwMCk7XHJcblxyXG4gICAgICAgICAgICB9KS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgb25SZWNoYXJnZSgpO1xyXG4gICAgICAgICAgICAgICAgJChcIiNhY3RfY2hhcmdlXCIpLmF0dHIoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgIH0uYmluZChvblJlY2hhcmdlKSk7XHJcbiAgICAgICAgICAgIEhpZGVmdWxsYmcoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8v5pi+56S65bi455So5a6i5oi35YiX6KGo5by556qXXHJcbiAgICBvbkNsaWNrQ3VzdG9tZXJEbGc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnJlZnMuQ3VzdG9tZXJEbGcuc2hvd0RsZyh0aGlzLmdldFByb2R1Y3RMaXN0KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbGFzdF9hY2NvdW50XzEwOiBudWxsLFxyXG4gICAgICAgICAgICBjYXJyaWVyOiBudWxsLFxyXG4gICAgICAgICAgICBwcm9kX2xpc3Q6IFtdLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvL+WcqGRvbeaehOW7uuS5i+WQjuWPr+S7peS9v+eUqGpxdWVyeei/m+ihjOS6i+S7tue7keWumlxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKCcjZm9ybV9hY2NvdW50Jykua2V5ZG93bihcclxuICAgICAgICBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICBpZiAoIWUpIHZhciBlID0gd2luZG93LmV2ZW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKCgoZS5rZXlDb2RlID49IDQ4KSAmJiAoZS5rZXlDb2RlIDw9IDU3KSkgfHwgKChlLmtleUNvZGUgPj0gOTYpICYmIChlLmtleUNvZGUgPD0gMTA1KSkgfHwgZS5rZXlDb2RlID09IDggfHwgZS5rZXlDb2RlID09IDkgfHwgZS5rZXlDb2RlID09IDM3IHx8IGUua2V5Q29kZSA9PSAzOSkge1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBwcm9kTGlzdE5vZGVzID0gdGhpcy5zZXRQcm9kKHRoaXMuc3RhdGUucHJvZF9saXN0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicGFuZWxcIj5cclxuICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGluZyByb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwdWxsLWxlZnRcIj5cclxuICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJpY29uLWVkaXRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICDliqDmsrnljaHljZXnrJTlhYXlgLxcclxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPGIgY2xhc3NOYW1lPVwicHJpY2VfY29sb3JcIj4o5q+P5pelMjLvvJo1MOiHs+asoeaXpeWHjOaZqDAwOjUw5Li657O757uf57uT566X5pe26Ze077yM5q2k5q615pe26Ze05Lit55+z5YyW572R56uZ5pqC5YGc5YWF5YC844CCKTwvYj5cclxuICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYW5lbC1ib2R5XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGZvcm0gY2xhc3NOYW1lPVwiZm9ybS12YWxpZGF0ZSBmb3JtLWhvcml6b250YWwgXCIgbWV0aG9kPVwiZ2V0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImNvbC1zbS0yIGNvbC1tZC0yIGNvbnRyb2wtbGFiZWxcIj7otKblj7c8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tNiBjb2wtbWQtNVwiPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgaWQ9XCJmb3JtX2FjY291bnRcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2xcIiBhdXRvY29tcGxldGU9XCJvZmZcIiBwbGFjZWhvbGRlcj1cIuivt+i+k+WFpTE55L2N5Lit55+z5YyW5Yqg5rK55Y2h5Y2h5Y+3XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4TGVuZ3RoPVwiMTlcIiBvbkNoYW5nZT17dGhpcy5vbkFjY291bnRJbnB1dH0gLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kYW5nZXIgbS1ib3QxMFwiIG9uQ2xpY2s9e3RoaXMub25DbGlja0N1c3RvbWVyRGxnfT7luLjnlKjlrqLmiLfliJfooag8L2J1dHRvbj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS04IGNvbC1tZC1vZmZzZXQtMiBjb2wtbWQtNVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbCBhbGVydCBhbGVydC1kYW5nZXIgcGFkZGluZy01IG0tYm90LW5vbmUgaGlkZGVuXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZD1cImZvcm1fYWNjb3VudF9lcnJvclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDor7fovpPlhaXmraPnoa7nmoQxOeS9jeS4reefs+WMluWKoOayueWNoeWNoeWPt1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgYWxlcnQgYWxlcnQtaW5mbyBwYWRkaW5nLTUgbS1ib3Qtbm9uZSBoaWRkZW5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkPVwiY3VzdG9tZXJfbXNnXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtc20tMiBjb2wtbWQtMiBjb250cm9sLWxhYmVsXCI+IDwvbGFiZWw+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMSBpZD1cInNob3dfbnVtYmVyXCI+6K+36L6T5YWl5Yqg5rK55Y2h5Y+3PC9oMT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMiBpZD1cInNob3dfY2FycmllclwiPjwvaDI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImNvbC1zbS0yIGNvbC1tZC0yIGNvbnRyb2wtbGFiZWxcIj7lhYXlgLzkuqflk4E8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsIGlkPVwicHJvZFwiIGNsYXNzTmFtZT1cImNvbC1zbS04XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Byb2RMaXN0Tm9kZXN9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1sZy1vZmZzZXQtMiBjb2wtbGctMTBcIj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YSBpZD1cImFjdF9jaGFyZ2VcIiBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApO1wiIGNsYXNzTmFtZT1cImJ0biBidG4tZGFuZ2VyXCIgZGlzYWJsZWQ9XCJkaXNhYmxlZFwiIG9uQ2xpY2s9e3RoaXMub25DbGlja1JlY2hhcmdlUmVxdX0+PGkgY2xhc3NOYW1lPVwiaWNvbi1vay1jaXJjbGVcIj48L2k+IOehruWumjwvYT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Zvcm0+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxDdXN0b21lckRsZyByZWY9XCJDdXN0b21lckRsZ1wiIC8+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxufSk7XHJcblxyXG4vL+W4uOeUqOeUqOaIt+WIl+ihqOW8ueeql1xyXG52YXIgQ3VzdG9tZXJEbGcgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICAvL+ivu+WPluW4uOeUqOWuouaIt+WIl+ihqFxyXG4gICAgZ2V0Q3VzdG9tZXJMaXN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBfLnN0ci5zcHJpbnRmKCcvZnVlbF9jYXJkL2N1c3RvbWVyX2xpc3Q/JnJlcXVfdHlwZT0lcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoJ2dldF9jdXN0b21lcl9saXN0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgdHlwZTogJ2dldCcsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcF9kYXRhLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbWVyX2xpc3Q6IHJlc3BfZGF0YS5kYXRhLmN1c3RvbWVyX2xpc3QsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi6K+75Y+W5a6i5oi35YiX6KGo5Ye66ZSZIFwiICsgcmVzcF9kYXRhLm1zZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBzdGF0dXMsIGVycikge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCLor7vlj5blrqLmiLfliJfooajlvILluLggXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5nZXRDdXN0b21lckxpc3QoKTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY3VzdG9tZXJfbGlzdDogW10sXHJcbiAgICAgICAgICAgIGdldFByb2R1Y3RMaXN0OiBudWxsLFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIHNob3dEbGc6IGZ1bmN0aW9uIChnZXRQcm9kdWN0TGlzdCkge1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICBnZXRQcm9kdWN0TGlzdDogZ2V0UHJvZHVjdExpc3QsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5nZXRDdXN0b21lckxpc3QoKTtcclxuICAgICAgICAkKCcjQ3VzdG9tZXJEbGcnKS5tb2RhbCgnc2hvdycpO1xyXG4gICAgfSxcclxuXHJcbiAgICBoaWRlRGxnOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5jbGVhcigpO1xyXG4gICAgICAgICQoJyNDdXN0b21lckRsZycpLm1vZGFsKCdoaWRlJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNsZWFyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgIGN1c3RvbWVyX2xpc3Q6IFtdLFxyXG4gICAgICAgICAgICBnZXRQcm9kdWN0TGlzdDogbnVsbCxcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgU2VsZWN0Q2FyZElkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNhcmRfaWQgPSAkKCcjZm9ybV9jdXN0b21lcl9pZCcpLnZhbCgpO1xyXG4gICAgICAgIHZhciBjYXJkX25hbWUgPSAkKCcjZm9ybV9jdXN0b21lcl9pZCcpLmZpbmQoXCJvcHRpb246c2VsZWN0ZWRcIikuYXR0cihcInRpdGxlXCIpO1xyXG4gICAgICAgICQoJyNzaG93X251bWJlcicpLnRleHQoY2FyZF9pZCk7XHJcbiAgICAgICAgJCgnI2Zvcm1fYWNjb3VudCcpLnZhbChjYXJkX2lkKS5yZW1vdmVDbGFzcygnZXJyb3InKTtcclxuICAgICAgICAkKCcjZm9ybV9hY2NvdW50X2Vycm9yJykuYWRkQ2xhc3MoJ2hpZGRlbicpO1xyXG5cclxuICAgICAgICAkKCcjYWN0X2NoYXJnZScpLnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgdGhpcy5zdGF0ZS5nZXRQcm9kdWN0TGlzdChjYXJkX2lkKTtcclxuICAgICAgICAkKFwiI3Byb2RcIikuc2hvdygpO1xyXG4gICAgICAgICQoJyNjdXN0b21lcl9tc2cnKS5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcclxuICAgICAgICAkKCcjY3VzdG9tZXJfbXNnJykudGV4dChcIuW9k+WJjemAieaLqeeahOWuouaIt+S4ujogXCIgKyBjYXJkX25hbWUpO1xyXG4gICAgICAgIHRoaXMuaGlkZURsZygpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3VzdG9tZXJMaXN0Tm9kZXMgPSB0aGlzLnN0YXRlLmN1c3RvbWVyX2xpc3QubWFwKGZ1bmN0aW9uIChjdXN0b21lcl9pbmZvLCBpbmRleCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKDxvcHRpb24gdmFsdWU9e2N1c3RvbWVyX2luZm8uY2FyZF9pZH0gZGF0YS1zdWJ0ZXh0PXtjdXN0b21lcl9pbmZvLmNhcmRfaWR9IHRpdGxlPXtjdXN0b21lcl9pbmZvLm5hbWV9PntjdXN0b21lcl9pbmZvLmNhcmRfaWR9IC0ge2N1c3RvbWVyX2luZm8ubmFtZX08L29wdGlvbj4pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbFwiIGlkPVwiQ3VzdG9tZXJEbGdcIiB0YWJJbmRleD1cIi0xXCIgcm9sZT1cImRpYWxvZ1wiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1kaWFsb2dcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWNvbnRlbnRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1oZWFkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzc05hbWU9XCJtb2RhbC10aXRsZVwiPumAieaLqeW4uOeUqOWuouaIt+i0puWPtzwvaDU+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWJvZHkgZm9ybS1ob3Jpem9udGFsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXAgYWRkLXByby1ib2R5XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tOCBjb2wtbGctMTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgbS1ib3QxNVwiIGlkPVwiZm9ybV9jdXN0b21lcl9pZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1saXZlLXNlYXJjaD1cInRydWVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjdXN0b21lckxpc3ROb2Rlc31cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibW9kYWwtZm9vdGVyIGZvcm0taG9yaWZvb3RlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJhZGRfYWNjb3VudF9idG5cIiBjbGFzc05hbWU9XCJidG4gYnRuLWRhbmdlclwiIG9uQ2xpY2s9e3RoaXMuU2VsZWN0Q2FyZElkfT7pgInmi6k8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdFwiIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCI+5Y+W5raIPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApXHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbi8v5bqT5a2Y5L+h5oGvXHJcbnZhciBDYXJkSW52ZW50b3J5SW5mb1RhYmxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgZ2V0Q2FyZEludmVudG9yeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogJy9mdWVsX2NhcmQvY2FyZF9pbnZlbnRvcnk/cmVxdV90eXBlPWdldF91c2VyX2ludmVudG9yeSZjYXJkX3R5cGU9U0lOT1BFQycsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwi5bqT5a2Y5L+h5oGvXCIsIHJlc3BfZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZihyZXNwX2RhdGEuc3RhdHVzID09ICdvaycpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByaWNlX2xpc3QgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIHByaWNlIGluIHJlc3BfZGF0YS5kYXRhLnByaWNlX2ludmVudG9yeSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlX2xpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogcHJpY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogcmVzcF9kYXRhLmRhdGEucHJpY2VfaW52ZW50b3J5W3ByaWNlXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwcmljZV9saXN0OiBwcmljZV9saXN0LCBlcnJvcl9tc2c6IG51bGx9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwcmljZV9saXN0OltdLCBlcnJvcl9tc2c6IFwi5bqT5a2Y5L+h5oGv6K+75Y+W5aSx6LSlXCJ9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcHJpY2VfbGlzdDogW10sXHJcbiAgICAgICAgICAgIGVycm9yX21zZzogXCLnrYnlvoXor7vlj5ZcIixcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuZ2V0Q2FyZEludmVudG9yeSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcHJpY2VDb3VudE5vZGVzID0gdGhpcy5zdGF0ZS5wcmljZV9saXN0Lm1hcChmdW5jdGlvbiAocHJpY2VfaW5mbywgaW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICg8c3BhbiBrZXk9e1wicHJpY2VDb3VudE5vZGVzX1wiK2luZGV4fSBjbGFzc05hbWU9XCJsYWJlbCBsYWJlbC1wcmltYXJ5IG0tcmlnaHQxMFwiPntwcmljZV9pbmZvLnByaWNlfeWFgyDliankvZk8c3BhbiBjbGFzc05hbWU9XCJiYWRnZVwiPntwcmljZV9pbmZvLmNvdW50fTwvc3Bhbj48L3NwYW4+KTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJwYW5lbFwiPlxyXG4gICAgICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJwYW5lbC1oZWFkaW5nIHJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB1bGwtbGVmdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJpY29uLWJyaWVmY2FzZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIOW6k+WtmOS/oeaBr1xyXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImJ0biBidG4taW5mbyBtLXJpZ2h0NVwiIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCIgb25DbGljaz17dGhpcy5nZXRDYXJkSW52ZW50b3J5fT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tcmVmcmVzaFwiIC8+IOWIt+aWsFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNtLW9mZnNldC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJtYXJnaW4tbm9uZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3ByaWNlQ291bnROb2Rlc31cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9oMz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG52YXIgT3JkZXJMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgTWFudWFsT3JkZXI6IGZ1bmN0aW9uIChvcmRlcl9pbmZvKSB7XHJcbiAgICAgICAgdGhpcy5yZWZzLk1hbnVhbE9yZGVyRGxnLnNob3dEbGcob3JkZXJfaW5mbyk7XHJcbiAgICB9LFxyXG5cclxuICAgIHVwZGF0ZU9yZGVyTGlzdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmluX3F1ZXJ5KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldFN0YXRlKHsgb3JkZXJfbGlzdDogR19PUkRFUl9MSVNULCBpbl9xdWVyeTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpIGluIEdfT1JERVJfTElTVClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghR19PUkRFUl9MSVNUW2ldLnJlc3VsdClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IF8uc3RyLnNwcmludGYoJy9hcGkvc2lub3BlY19vcmRlcl9xdWVyeT9wcm9kdWN0PXNpbm9wZWMmcmVxdV90eXBlPSVzJm9yZGVyX2lkPSVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KCdmdWVsX2NhcmRfcXVlcnknKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KEdfT1JERVJfTElTVFtpXS5vcmRlcl9pZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgICAgICAgICAgYXN5bmM6IGZhbHNlLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwX2RhdGEuc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHRfaW5mbyA9IHJlc3BfZGF0YS5kYXRhLm9yZGVyX2xpc3RbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihyZXN1bHRfaW5mbylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBHX09SREVSX0xJU1RbaV0ub3JkZXJfZGF0YSA9IHJlc3VsdF9pbmZvO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRfaW5mby5zdGF0dXMgPT0gXCLlhYXlgLzkuK1cIiB8fCByZXN1bHRfaW5mby5zdGF0dXMgPT0gXCLljaHljZUo6ZyA5omL5bel5aSE55CGKVwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgR19PUkRFUl9MSVNUW2ldLnJlc3VsdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBHX09SREVSX0xJU1RbaV0ucmVzdWx0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2FsZXJ0KFwi5p+l6K+i5Ye66ZSZIFwiICsgcmVzcF9kYXRhLm1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBcIuafpeivouWHuumUmVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vYWxlcnQoXCLmn6Xor6LlvILluLggXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBvcmRlcl9saXN0OiBHX09SREVSX0xJU1QsIGluX3F1ZXJ5OiBmYWxzZX0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBvcmRlcl9saXN0OiBbXSxcclxuICAgICAgICAgICAgaW5fcXVlcnk6IGZhbHNlLFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2V0SW50ZXJ2YWwodGhpcy51cGRhdGVPcmRlckxpc3QsIDEwICogMTAwMCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHVwZGF0ZU9yZGVyTGlzdCwgcHJldlN0YXRlKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgb3JkZXJMaXN0Tm9kZXMgPSB0aGlzLnN0YXRlLm9yZGVyX2xpc3QubWFwKGZ1bmN0aW9uIChvcmRlcl9pbmZvLCBpbmRleCkge1xyXG4gICAgICAgICAgICBpZiAoIW9yZGVyX2luZm8ub3JkZXJfZGF0YS5zdGF0dXMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG9yZGVyX2luZm8ub3JkZXJfZGF0YS5zdGF0dXMgPSBcIuWFheWAvOS4rVwiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgb3BlckJ0bk5vZGUgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAob3JkZXJfaW5mby5vcmRlcl9kYXRhLnN0YXR1cyA9PSBcIuWNoeWNlSjpnIDmiYvlt6XlpITnkIYpXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG9wZXJCdG5Ob2RlID0gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApO1wiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnkgYnRuLXhzIGJ0bi1kYW5nZXJcIiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5NYW51YWxPcmRlci5iaW5kKHRoaXMsb3JkZXJfaW5mby5vcmRlcl9kYXRhKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICDmiYvlt6XlpITnkIZcclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8uY3JlYXRlX3RpbWV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8uYWNjb3VudH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57b3JkZXJfaW5mby5wcm9jZXNzaW5nID8gb3JkZXJfaW5mby5vcmRlcl9kYXRhLnN0YXR1cyA6IFwi5YWF5YC85aSx6LSlXCJ9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8ub3JkZXJfaWR9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8ub3JkZXJfZGF0YS5jYXJkX2lkfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntvcmRlcl9pbmZvLm9yZGVyX2RhdGEucHJpY2V9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyX2luZm8ub3JkZXJfZGF0YS5hY2NvdW50X3ByaWNlfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntvcmRlcl9pbmZvLm9yZGVyX2RhdGEuYWNjb3VudF9wcmljZSA/IG9yZGVyX2luZm8ub3JkZXJfZGF0YS51cGRhdGUgOiBudWxsfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntvcmRlcl9pbmZvLm9yZGVyX2RhdGEuYm90X2FjY291bnR9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29wZXJCdG5Ob2RlfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInBhbmVsXCI+XHJcbiAgICAgICAgICAgICAgICA8aGVhZGVyIGNsYXNzTmFtZT1cInBhbmVsLWhlYWRpbmcgcm93XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHVsbC1sZWZ0XCI+PGkgY2xhc3NOYW1lPVwiaWNvbi1zZWFyY2hcIj48L2k+5YWF5YC86K6w5b2VPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDxiIGNsYXNzTmFtZT1cInByaWNlX2NvbG9yXCI+KOWkp+amguS8muacieWNgeenkuW3puWPs+eahOW7tui/n+OAgik8L2I+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPVwiYnRuIGJ0bi1pbmZvIG0tcmlnaHQ1XCIgaHJlZj1cImphdmFzY3JpcHQ6dm9pZCgwKTtcIiBvbkNsaWNrPXt0aGlzLnVwZGF0ZU9yZGVyTGlzdH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJpY29uLXJlZnJlc2hcIiAvPiDliLfmlrBcclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYW5lbC1ib2R5IHRhYmxlLXJlc3BvbnNpdmVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8dGFibGUgaWQ9XCJvcmRlcl9yZXN1bHRcIiBjbGFzc05hbWU9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLWhvdmVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5Yib5bu65pe26Ze0PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+6LSm5Y+3PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+54q25oCBPC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+6K6i5Y2V5Y+3PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5Y2h5Y+3PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+6Z2i5YC8PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5Yiw6LSm6Z2i5YC8PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5Yiw6LSm5pe26Ze0PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5aSW5oyC6LSm5Y+3PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5pON5L2cPC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtvcmRlckxpc3ROb2Rlc31cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8TWFudWFsT3JkZXJEbGcgcmVmPVwiTWFudWFsT3JkZXJEbGdcIi8+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuXHJcbi8v6K6i5Y2V5omL5bel5aSE55CG5by556qXXHJcbnZhciBNYW51YWxPcmRlckRsZyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIC8v5Y+R6YCB5Y2V56yU6K6i5Y2V55qE5omL5bel5aSE55CGXHJcbiAgICBzZW5kTWFudWFsT3JkZXI6IGZ1bmN0aW9uIChyZXF1X3R5cGUsIGFyZ3VfbGlzdCkge1xyXG4gICAgICAgIHZhciByZXF1X2RhdGEgPSB7XHJcbiAgICAgICAgICAgIHJlcXVfdHlwZTogcmVxdV90eXBlLFxyXG4gICAgICAgICAgICBhcmd1X2xpc3Q6IGFyZ3VfbGlzdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAnL2Z1ZWxfY2FyZC9tb2RlbV9mb3JyZXN0YWwvYXBpL29yZGVyL2ZpbmlzaDInLFxyXG4gICAgICAgICAgICB0eXBlOiAncG9zdCcsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgIGRhdGE6IEpTT04uc3RyaW5naWZ5KHJlcXVfZGF0YSksXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcF9kYXRhLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCLmiYvliqjlpITnkIbmiJDlip9cIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi5omL5Yqo5aSE55CG6K6i5Y2V5Ye66ZSZIFwiICsgcmVzcF9kYXRhLm1zZyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBzdGF0dXMsIGVycikge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCLmiYvliqjlpITnkIborqLljZXlvILluLggXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uIChYTUxIdHRwUmVxdWVzdCwgdGV4dFN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlRGxnKCk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy/lj5bmtojmjInpkq5cclxuICAgIG9uQ2xpY2tDYW5jbGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmhpZGVEbGcoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLy/orqLljZXmiJDlip9cclxuICAgIG9uQ2xpY2tTdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGFjY291bnRfcHJpY2UgPSBwYXJzZUludCgkKFwiI2Zvcm1fYWNjb3VudF9wcmljZVwiKS52YWwoKSk7XHJcbiAgICAgICAgaWYgKCFhY2NvdW50X3ByaWNlIHx8IGFjY291bnRfcHJpY2UgPD0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwi6K+36YCJ5oup5q2j56Gu55qE6YeR6aKdXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWNvbmZpcm0oXy5zdHIuc3ByaW50Zign5oqK6K6i5Y2VICVzIOiuvuS4uuaIkOWKn++8jOiuouWNlemHkeminSAlcyDlhYM/JyxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkLCBhY2NvdW50X3ByaWNlKVxyXG4gICAgICAgICAgICApKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZW5kTWFudWFsT3JkZXIoJ29yZGVyX3N1Y2Nlc3MnLCB7XHJcbiAgICAgICAgICAgIG9yZGVyX2lkOiB0aGlzLnN0YXRlLm9yZGVyX2luZm8ub3JkZXJfaWQsXHJcbiAgICAgICAgICAgIGFjY291bnRfcHJpY2U6IGFjY291bnRfcHJpY2UsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8v6K6i5Y2V5aSx6LSl77yM5Y2h5pyJ5pWIXHJcbiAgICBvbkNsaWNrRmFpbENhcmRWYWxpZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghY29uZmlybShfLnN0ci5zcHJpbnRmKCfmiororqLljZUgJXMg6K6+5Li65aSx6LSl77yMIOWFheWAvOWNoSAlcyDmnInmlYg/JyxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkLCB0aGlzLnN0YXRlLm9yZGVyX2luZm8uY2FyZF9pZClcclxuICAgICAgICAgICAgKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2VuZE1hbnVhbE9yZGVyKCdvcmRlcl9mYWlsX2NhcmRfdmFsaWQnLCB7XHJcbiAgICAgICAgICAgIG9yZGVyX2lkOiB0aGlzLnN0YXRlLm9yZGVyX2luZm8ub3JkZXJfaWQsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8v6K6i5Y2V5aSx6LSlLOWNoeWkseaViFxyXG4gICAgb25DbGlja0ZhaWxDYXJkSW52YWxpZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghY29uZmlybShfLnN0ci5zcHJpbnRmKCfmiororqLljZUgJXMg6K6+5Li65aSx6LSl77yMIOWFheWAvOWNoSAlcyDlvILluLg/JyxcclxuICAgICAgICAgICAgdGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkLHRoaXMuc3RhdGUub3JkZXJfaW5mby5jYXJkX2lkKVxyXG4gICAgICAgICAgICApKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZW5kTWFudWFsT3JkZXIoJ29yZGVyX2ZhaWxfY2FyZF9pbnZhbGlkJywge1xyXG4gICAgICAgICAgICBvcmRlcl9pZDogdGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBzaG93RGxnOiBmdW5jdGlvbiAob3JkZXJfaW5mbykge1xyXG4gICAgICAgIG9yZGVyX2luZm8uZXJyX2luZm8gPSBvcmRlcl9pbmZvLmVycl9kYXRhO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoeyBvcmRlcl9pbmZvOiBvcmRlcl9pbmZvIH0pO1xyXG4gICAgICAgICQoJyNNYW51YWxPcmRlckRsZycpLm1vZGFsKCdzaG93Jyk7XHJcbiAgICB9LFxyXG5cclxuICAgIGhpZGVEbGc6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmNsZWFySW5wdXQoKTtcclxuICAgICAgICAkKCcjTWFudWFsT3JkZXJEbGcnKS5tb2RhbCgnaGlkZScpO1xyXG4gICAgfSxcclxuXHJcbiAgICBjbGVhcklucHV0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7b3JkZXJfaW5mbzoge319KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgb3JkZXJfaW5mbzoge30gfTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbFwiIGlkPVwiTWFudWFsT3JkZXJEbGdcIiB0YWJJbmRleD1cIi0xXCIgcm9sZT1cImRpYWxvZ1wiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1kaWFsb2dcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWNvbnRlbnRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1oZWFkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoNSBjbGFzc05hbWU9XCJtb2RhbC10aXRsZVwiPiDljaHljZU8Yj57dGhpcy5zdGF0ZS5vcmRlcl9pbmZvLm9yZGVyX2lkfTwvYj7miYvlt6XlpITnkIY8L2g1PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1ib2R5IGZvcm0taG9yaXpvbnRhbFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj48c3Ryb25nPuiuouWNleWPtzo8L3N0cm9uZz4ge3RoaXMuc3RhdGUub3JkZXJfaW5mby5vcmRlcl9pZH08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+PHN0cm9uZz7lhYXlgLzljaHlj7c6PC9zdHJvbmc+IHt0aGlzLnN0YXRlLm9yZGVyX2luZm8uY2FyZF9pZH08L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93XCI+PHN0cm9uZz7pnaLlgLw6PC9zdHJvbmc+IHt0aGlzLnN0YXRlLm9yZGVyX2luZm8ucHJpY2V9PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPjxzdHJvbmc+5Y2h5Y2V5Y6f5ZugOjwvc3Ryb25nPiB7dGhpcy5zdGF0ZS5vcmRlcl9pbmZvLmVycl9pbmZvfTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3cgcHJpY2VfY29sb3JcIj7ms6jmhI865Y2h5Y2V5aSE55CG55qE57uT5p6c5Zyo5pys6aG16Z2i5Lya5pyJ5omA5bu26L+fPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXAgYWRkLXByby1ib2R5XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cIm5hdiBuYXYtdGFicyBtLWJvdDE1XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9XCJhY3RpdmVcIj48YSBocmVmPVwiI21hbnVhbF9zdWNjZXNzXCIgZGF0YS10b2dnbGU9XCJ0YWJcIj7nva7miJDlip88L2E+PC9saT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjbWFudWFsX2ZhaWxcIiBkYXRhLXRvZ2dsZT1cInRhYlwiPue9ruWksei0pTwvYT48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cIm15VGFiQ29udGVudFwiIGNsYXNzTmFtZT1cInRhYi1jb250ZW50IG0tYm90MTVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0YWItcGFuZSBhY3RpdmVcIiBpZD1cIm1hbnVhbF9zdWNjZXNzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtc20tNCBjb2wtbWQtMiBjb250cm9sLWxhYmVsXCI+6YeR6aKdPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS04IGNvbC1tZC05XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgaWQ9XCJmb3JtX2FjY291bnRfcHJpY2VcIiBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgbS1ib3QxNSBpbnB1dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiPijml6ApPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiMzBcIj4zMDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjUwXCI+NTA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIxMDBcIj4xMDA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIyMDBcIj4yMDA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCI1MDBcIj41MDA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIxMDAwXCI+MTAwMDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtb2RhbC1mb290ZXIgZm9ybS1ob3JpZm9vdGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBpZD1cImNoYW5nZV9wcmljZV9idG5cIiB0eXBlPVwiYnV0dG9uXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBidG4tZGFuZ2VyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja1N1Y2Nlc3N9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDnoa7lrppcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja0NhbmNsZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+W5raIXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGFiLXBhbmVcIiBpZD1cIm1hbnVhbF9mYWlsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0taG9yaWZvb3RlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLW9mZnNldC0zIGNvbC1tZC04XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzTmFtZT1cImJ0biBidG4tc3VjY2VzcyBtLXJpZ2h0MTAgbS1ib3QyMFwiIG9uQ2xpY2s9e3RoaXMub25DbGlja0ZhaWxDYXJkVmFsaWR9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg572u5aSx6LSlLOWNoeacieaViFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kYW5nZXIgbS1ib3QyMFwiIG9uQ2xpY2s9e3RoaXMub25DbGlja0ZhaWxDYXJkSW52YWxpZH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDnva7lpLHotKUs5Y2h5byC5bi4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWZvb3RlciBmb3JtLWhvcmlmb290ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtZGlzbWlzcz1cIm1vZGFsXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja0NhbmNsZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg5Y+W5raIXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblJlYWN0LnJlbmRlcihcclxuICAgIDxNYWluQ29udGVudCAvPixcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWNvbnRlbnQnKVxyXG4pOyJdfQ==
