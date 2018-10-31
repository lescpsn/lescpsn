(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//显示全屏遮罩
var Showfullbg = function () {
    $("#reload_fullbg,#reload_icon").show();
};

//隐藏全屏遮罩
var Hidefullbg = function () {
    $("#reload_fullbg,#reload_icon").hide();
};

var MainContent = React.createClass({
    displayName: "MainContent",

    getTaskInfo: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s', encodeURIComponent('get_task_info')),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        checked: true,
                        task_info: resp_data.data
                    });
                } else {
                    alert("读取当前任务信息出错 " + resp_data.msg);
                    window.location.reload();
                }
            }.bind(this),

            error: function (xhr, status, err) {
                //alert("读取当前任务信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            checked: false,
            running_task_id: null };
    },

    //当前正在运行的任务ID
    componentDidMount: function () {
        this.getTaskInfo();
    },

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {

        var taskPanelNode = null;
        if (this.state.checked) {
            if (!this.state.task_info) {
                taskPanelNode = React.createElement(NewTaskPanel, { reloadTaskPage: this.getTaskInfo });
            } else {
                taskPanelNode = React.createElement(TaskStatusPanel, { reloadTaskPage: this.getTaskInfo });
            }
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
            taskPanelNode,
            React.createElement(TaskList, null)
        );
    }
});

//自定义一个新的任务
var NewTaskPanel = React.createClass({
    displayName: "NewTaskPanel",

    //启动批量充值任务
    onClickStartTask: function () {
        var total_price = 0;
        var price_list_msg = "";

        var account = $('#form_customer_id').val();
        var price_list = [];
        for (var i in this.state.price_list) {
            var price = parseInt(this.state.price_list[i].price);
            var price_count = parseInt(this.state.price_list[i].count);
            var count = $("#price_" + price).val();
            if (count != '') //监测输入的数字是否合法
                {
                    count = parseInt(count);
                } else {
                count = 0;
            }

            //卡数量判断 对比库存信息
            if (count > price_count || count < 0) {
                alert("超出库存数量,创建任务失败！！！");
                return;
            }

            if (count > 0) {
                price_list.push({ price: price, count: count });
                total_price += price * count;
                price_list_msg += _.str.sprintf(' %s(%s元)', price, price * count);
            }
        }

        //账号合法性判断
        if (!account || account == 1) {
            alert("充值账号错误");
            return;
        }

        //充值金额合法性判断
        if (!(total_price > 0)) {
            alert("充值金额错误");
            return;
        }

        //弹窗判断是否继续
        var msg = _.str.sprintf('将会给 %s 充入 %s元\n %s', account, total_price, price_list_msg);
        if (!confirm(msg)) {
            return;
        }

        var requ_data = {
            requ_type: "add_task",
            argu_list: {
                account: account,
                price_list: price_list
            }
        };

        $.ajax({
            url: '/fuel_card/big_recharge',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (data) {
                if (data.status == 'ok') {
                    alert("新增任务成功");
                    //this.props.getTaskInfo();
                    window.location.reload();
                } else {
                    Showfullbg();
                    alert("新增任务出错\n" + data.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                alert("新增充值任务异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),
            complete: function (XMLHttpRequest, textStatus) {
                Hidefullbg();
            }.bind(this)
        });
    },

    getCardInventory: function () {
        $.ajax({
            url: '/fuel_card/card_inventory?requ_type=get_user_inventory&card_type=SINOPEC',
            dataType: 'json',
            type: 'get',

            success: function (resp_data) {
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

    //读取常用客户信息
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

    //实时显示金额
    getSumPrice: function (price_info) {
        var price_list = [];
        var count = $("#price_" + price_info.price).val();
        //检测count是否合法,并计算单个面值的金额
        if (count > price_info.count) {
            $("#sum_" + price_info.price).addClass("text-danger").text("超出库存数量");
        } else if (count == 0) {
            $("#sum_" + price_info.price).removeClass("text-danger").text("金额: 0 元");
        } else if (count <= price_info.count && count > 0) {
            var price = price_info.price * count;
            $("#sum_" + price_info.price).removeClass("text-danger").text("金额: " + price + "元");
        }

        var total_price = 0;
        for (var i in this.state.price_list) {
            var price = parseInt(this.state.price_list[i].price);
            var count = $("#price_" + price).val();
            if (count != '') //监测输入的数字是否合法
                {
                    count = parseInt(count);
                } else {
                count = 0;
            }

            if (count > this.state.price_list[i].count) {
                $("#total").text("超出库存数量");
                return;
            }

            if (count > 0) {
                total_price += price * count;
            }
        }

        $("#total").text("合计总金额: " + total_price + " 元");
    },

    //
    onPriceCountKeyDown: function (e) {
        if (!e) var e = window.event;

        if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 96 && e.keyCode <= 105 || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 37 || e.keyCode == 39) {} else {

            return false;
        };
    },

    getInitialState: function () {
        return {
            card_inventory_info: [],
            price_list: [],
            customer_list: []
        };
    },

    componentDidMount: function () {
        this.getCardInventory();
        this.getCustomerList();
        $('#form_customer_id').change(function () {
            var card_id = $('#form_customer_id').val();
            var card_name = $('#form_customer_id').find("option:selected").attr("title");
            console.log(card_id, card_name);
            if (card_id == 1) {
                $('#show_number').text('');
                $('#show_name').text('');
            } else {
                $('#show_number').text(card_id);
                $('#show_name').text(card_name);
            }
        });
    },

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        var priceListNodes = this.state.price_list.map(function (price_info, index) {
            if (price_info.count <= 0) {
                return null;
            }

            var price_id = "price_" + price_info.price;
            var sum_price = "sum_" + price_info.price;

            return React.createElement(
                "div",
                { className: "row m-bot15", key: "priceListNodes_" + index },
                React.createElement(
                    "h4",
                    { className: "col-sm-2 col-md-2 control-label text-info" },
                    "面值: ",
                    price_info.price
                ),
                React.createElement(
                    "div",
                    { className: "col-md-2 col-sm-8" },
                    React.createElement("input", { id: price_id, type: "text", className: "form-control form_count", maxLength: "5",
                        onKeyUp: this.getSumPrice.bind(this, price_info), onKeyDown: this.onPriceCountKeyDown })
                ),
                React.createElement(
                    "h5",
                    { className: "col-md-1 col-sm-2 control-label text-danger" },
                    "可用",
                    price_info.count
                ),
                React.createElement(
                    "h3",
                    { className: "col-md-3 col-sm-2 control-label", id: sum_price },
                    "统计金额: 0 元"
                )
            );
        }.bind(this));

        var customerListNodes = this.state.customer_list.map(function (customer_info, index) {
            return React.createElement(
                "option",
                { key: "customerListNodes_" + index, value: customer_info.card_id, "data-subtext": customer_info.card_id, title: customer_info.name },
                customer_info.card_id,
                " - ",
                customer_info.name
            );
        });

        return React.createElement(
            "section",
            { className: "panel" },
            React.createElement(
                "header",
                { className: "panel-heading row" },
                React.createElement(
                    "span",
                    { className: "pull-left" },
                    React.createElement("i", { className: "icon-table" }),
                    "新的充值任务"
                )
            ),
            React.createElement(
                "div",
                { className: "panel-body" },
                React.createElement(
                    "div",
                    { className: "modal-body form-horizontal" },
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement(
                            "div",
                            { className: "row" },
                            React.createElement(
                                "h4",
                                { className: "col-sm-2 col-md-2 control-label" },
                                "账号"
                            ),
                            React.createElement(
                                "div",
                                { className: "col-md-5 col-sm-8" },
                                React.createElement(
                                    "select",
                                    { className: "form-control", id: "form_customer_id",
                                        "data-live-search": "true" },
                                    React.createElement(
                                        "option",
                                        { value: "1" },
                                        "-=请选择帐号=-"
                                    ),
                                    customerListNodes
                                )
                            ),
                            React.createElement(
                                "div",
                                { className: "col-md-offset-2 col-md-4 col-sm-4" },
                                React.createElement("h1", { id: "show_number" })
                            ),
                            React.createElement(
                                "div",
                                { className: "col-sm-4" },
                                React.createElement("h2", { id: "show_name" })
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        priceListNodes
                    ),
                    React.createElement(
                        "div",
                        { className: "form-group" },
                        React.createElement("h3", { className: "col-md-3 col-sm-4 text-danger margin-5", id: "total" }),
                        React.createElement(
                            "div",
                            { className: "col-md-5 col-sm-4" },
                            React.createElement(
                                "a",
                                { id: "act_query", href: "javascript:;", className: "btn btn-info", onClick: this.onClickStartTask },
                                React.createElement("i", { className: "icon-play" }),
                                " 创建"
                            )
                        )
                    )
                )
            )
        );
    }
});

//任务状态
var TaskStatusPanel = React.createClass({
    displayName: "TaskStatusPanel",

    getTaskInfo: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s', encodeURIComponent('get_task_info')),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        task_info: resp_data.data
                    });
                } else {
                    alert("读取当前任务信息出错 " + resp_data.msg);
                    window.location.reload();
                }
            }.bind(this),

            error: function (xhr, status, err) {
                //alert("读取当前任务信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getTaskStatus: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s', encodeURIComponent('get_task_status')),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        task_status: resp_data.data
                    });
                } else {
                    alert("读取当前任务信息出错 " + resp_data.msg);
                    window.location.reload();
                }
            }.bind(this),

            error: function (xhr, status, err) {
                //alert("读取当前任务信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getTaskStatusHistory: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s', encodeURIComponent('get_status_history')),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        task_history_list: resp_data.data.task_history_list
                    });
                } else {
                    alert("读取当前任务信息出错 " + resp_data.msg);
                    window.location.reload();
                }
            }.bind(this),

            error: function (xhr, status, err) {
                //alert("读取当前任务信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickStartTask: function () {
        var requ_data = {
            requ_type: "start_task",
            argu_list: {
                task_id: this.state.task_info.task_id
            }
        };

        $.ajax({
            url: '/fuel_card/big_recharge',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (data) {
                if (data.status == 'ok') {
                    this.getTaskInfo();
                    alert("任务启动成功");
                } else {
                    alert("任务启动出错\n" + data.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                //alert("任务启动异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickStopTask: function () {
        var requ_data = {
            requ_type: "stop_task",
            argu_list: {
                task_id: this.state.task_info.task_id
            }
        };

        $.ajax({
            url: '/fuel_card/big_recharge',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (data) {
                if (data.status == 'ok') {
                    this.getTaskInfo();
                    alert("任务暂停成功");
                } else {
                    alert("任务暂停出错\n" + data.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                alert("任务暂停异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickFinishTask: function () {
        var requ_data = {
            requ_type: "finish_task",
            argu_list: {
                task_id: this.state.task_info.task_id
            }
        };

        $.ajax({
            url: '/fuel_card/big_recharge',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (data) {
                if (data.status == 'ok') {
                    this.getTaskInfo();
                    alert("任务结束成功");
                    //this.props.getTaskInfo();
                    document.location.reload();
                } else {
                    alert("任务结束出错\n" + data.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                alert("任务结束异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //启动自动刷新
    startInterval: function () {
        //alert("已启动自动刷新");
        var task_info_interval = setInterval(this.getTaskInfo, 1 * 1000);
        var task_status_interval = setInterval(this.getTaskStatusHistory, 1 * 1000);
        this.setState({ task_info_interval: task_info_interval, task_status_interval: task_status_interval });
    },

    //停止自动刷新
    stopInterval: function () {
        //alert("自动刷新已关闭");
        if (this.state.task_info_interval) {
            clearInterval(this.state.task_info_interval);
        }

        if (this.state.task_status_interval) {
            clearInterval(this.state.task_status_interval);
        }
        this.setState({ task_info_interval: null, task_status_interval: null });
    },

    getInitialState: function () {
        return {
            task_info_interval: null, //定时刷新的任务ID
            task_status_interval: null, //定时刷新的任务ID
            task_info: {},
            task_history_list: []
        };
    },

    componentDidMount: function () {
        this.getTaskInfo();
        this.getTaskStatusHistory();

        setInterval(this.getTaskInfo, 10 * 1000);
        setInterval(this.getTaskStatusHistory, 10 * 1000);
    },

    componentDidUpdate: function (prevProps, prevState) {
        if (prevState.task_info != this.state.task_info) {
            if (prevState.task_info.task_status != this.state.task_info.task_status) {
                if (this.state.task_info.task_status == '1') {
                    this.startInterval();
                } else {
                    this.stopInterval();
                }
            }
        }
    },

    render: function () {
        var startBtnNode = null;
        var stopBtnNode = null;
        var taskState = null;
        //-1:未知状态  0:停止 1:运行中  2:结束
        if (this.state.task_info.task_status == '0') {
            startBtnNode = React.createElement(
                "button",
                { className: "btn btn-success", href: "javascript:void(0);", onClick: this.onClickStartTask },
                React.createElement("i", { className: "icon-play" }),
                " 启动"
            );
            taskState = React.createElement(
                "div",
                { className: "col-md-offset-1 col-md-2 col-xs-4 poolalert alert-danger text-center" },
                "任务已停止"
            );
        } else if (this.state.task_info.task_status == '1') {
            taskState = React.createElement(
                "div",
                { className: "col-md-offset-1 col-md-2 col-xs-4 poolalert alert-info text-center" },
                "任务运行中..."
            );
            stopBtnNode = React.createElement(
                "button",
                { className: "btn btn-info", href: "javascript:void(0);", onClick: this.onClickStopTask },
                React.createElement("i", { className: "icon-pause" }),
                " 暂停"
            );
        }

        var finishBtnNode = React.createElement(
            "button",
            { className: "btn btn-danger", href: "javascript:void(0);", onClick: this.onClickFinishTask },
            React.createElement("i", { className: "icon-stop" }),
            " 结束"
        );

        //历史记录
        var historyListNodes = this.state.task_history_list.map(function (history_info, index) {
            var h = history_info + "\n";
            return { h };
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
                    React.createElement("i", { className: "icon-tasks" }),
                    "当前任务 ",
                    this.state.task_info.task_id,
                    " "
                ),
                React.createElement(
                    "div",
                    { className: "row center-block" },
                    taskState,
                    React.createElement(
                        "div",
                        { className: "col-md-5 m-left10 btn-group btn-group-sm" },
                        startBtnNode,
                        stopBtnNode,
                        finishBtnNode
                    ),
                    React.createElement(
                        "span",
                        null,
                        "总面值:",
                        this.state.task_info.total_price,
                        " 已充入:",
                        this.state.task_info.success_price
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "panel-body" },
                React.createElement(
                    "pre",
                    { className: "col-md-12" },
                    historyListNodes
                )
            )
        );
    }
});

//任务历史
var TaskList = React.createClass({
    displayName: "TaskList",

    onQuery: function (filters) {
        var filter_map = this.state.filter_map;
        filter_map.page_index = 1;

        for (var i in filters) {
            filter_map[i] = filters[i];
        }
        //alert(JSON.stringify(filter_map));
        this.setState({ filter_map: filter_map, task_list: [], page_info: null });

        var argu_list = "";
        for (var i in filter_map) {
            argu_list += _.str.sprintf('&%s=%s', encodeURIComponent(i), encodeURIComponent(filter_map[i]));
        }

        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s%s', encodeURIComponent('get_task_list'), argu_list),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({ task_list: resp_data.data.task_list, page_info: resp_data.data.page_info });
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

    onClickExport: function (task_id) {
        $.ajax({
            url: _.str.sprintf('/fuel_card/order_list?&requ_type=%s&task_id=%s', encodeURIComponent('fuel_card_export'), encodeURIComponent(task_id)),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    var path = resp_data.data.path;
                    if (path) {
                        window.location.assign(path);
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
            task_list: [],
            page_info: null
        };
    },

    componentDidMount: function () {
        this.onQuery({});
    },

    componentDidUpdate: function (prevProps, prevState) {},

    render: function () {
        var taskListNodes = this.state.task_list.map(function (task_info, index) {
            var url = _.str.sprintf('/fuel_card/order_list?&task_id=%s&start_time=%s&do_query=%s', encodeURIComponent(task_info.task_id), encodeURIComponent(task_info.create_time), encodeURIComponent("1"));

            var block_url = _.str.sprintf('/fuel_card/order_list?&task_id=%s&start_time=%s&order_type=%s&do_query=%s', encodeURIComponent(task_info.task_id), encodeURIComponent(task_info.create_time), encodeURIComponent("-1"), encodeURIComponent("1"));

            return React.createElement(
                "tr",
                { key: "taskListNodes_" + index },
                React.createElement(
                    "td",
                    null,
                    task_info.task_id
                ),
                React.createElement(
                    "td",
                    null,
                    task_info.account
                ),
                React.createElement(
                    "td",
                    null,
                    task_info.create_time
                ),
                React.createElement(
                    "td",
                    null,
                    task_info.finish_time
                ),
                React.createElement(
                    "td",
                    null,
                    task_info.status
                ),
                React.createElement(
                    "td",
                    null,
                    task_info.status_time
                ),
                React.createElement(
                    "td",
                    null,
                    task_info.total_price
                ),
                React.createElement(
                    "td",
                    null,
                    task_info.success_price
                ),
                React.createElement(
                    "td",
                    null,
                    task_info.notes
                ),
                React.createElement(
                    "td",
                    null,
                    React.createElement(
                        "a",
                        { href: url,
                            target: "_blank",
                            className: "btn btn-xs btn-danger  m-right5" },
                        React.createElement("i", { className: "icon-search" }),
                        " 查询订单"
                    ),
                    React.createElement(
                        "a",
                        { href: block_url,
                            target: "_blank",
                            className: "btn btn-xs btn-info  m-right5" },
                        React.createElement("i", { className: "icon-wrench" }),
                        " 卡单查询"
                    ),
                    React.createElement(
                        "a",
                        { href: "javascript:void(0);",
                            onClick: this.onClickExport.bind(this, task_info.task_id),
                            className: "btn btn-xs btn-primary " },
                        React.createElement("i", { className: "icon-download-alt" }),
                        " 导出记录"
                    )
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
                    React.createElement("i", { className: "icon-table" }),
                    "批量充值历史"
                )
            ),
            React.createElement(
                "div",
                { className: "panel-body" },
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
                                "任务编号"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "充值账号"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "创建时间"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "结束时间"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "状态"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "状态时间"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "总金额"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "已充入金额"
                            ),
                            React.createElement(
                                "th",
                                null,
                                "备注"
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
                        taskListNodes
                    )
                ),
                React.createElement(PageIndexGroup, { onQuery: this.onQuery, page_info: this.state.page_info })
            )
        );
    }
});

var PageIndexGroup = React.createClass({
    displayName: "PageIndexGroup",

    onClickPage: function (page_index) {
        this.props.onQuery({ page_index: page_index });
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
                { key: "pageIndexBtnBodes_" + index, className: "btn btn-default", disabled: disabled, type: "button", onClick: this.onClickPage.bind(this, i) },
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

React.render(React.createElement(MainContent, null), document.getElementById('main-content'));

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWNcXGpzeFxcZnVlbF9jYXJkXFxiaWdfcmVjaGFyZ2UuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0NBLElBQUksYUFBYSxZQUFZO0FBQ3pCLE1BQUUsNkJBQUYsRUFBaUMsSUFBakMsR0FEeUI7Q0FBWjs7O0FBS2pCLElBQUksYUFBYSxZQUFZO0FBQ3pCLE1BQUUsNkJBQUYsRUFBaUMsSUFBakMsR0FEeUI7Q0FBWjs7QUFJakIsSUFBSSxjQUFjLE1BQU0sV0FBTixDQUFrQjs7O0FBQ2hDLGlCQUFhLFlBQVk7QUFDckIsVUFBRSxJQUFGLENBQU87QUFDSCxpQkFBSyxFQUFFLEdBQUYsQ0FBTSxPQUFOLENBQWMsdUNBQWQsRUFDYyxtQkFBbUIsZUFBbkIsQ0FEZCxDQUFMO0FBR0Esa0JBQU0sS0FBTjtBQUNBLHNCQUFVLE1BQVY7O0FBRUEscUJBQVMsVUFBVSxTQUFWLEVBQXFCO0FBQzFCLG9CQUFJLFVBQVUsTUFBVixJQUFvQixJQUFwQixFQUEwQjtBQUMxQix5QkFBSyxRQUFMLENBQWM7QUFDVixpQ0FBUyxJQUFUO0FBQ0EsbUNBQVcsVUFBVSxJQUFWO3FCQUZmLEVBRDBCO2lCQUE5QixNQU1LO0FBQ0QsMEJBQU0sZ0JBQWdCLFVBQVUsR0FBVixDQUF0QixDQURDO0FBRUQsMkJBQU8sUUFBUCxDQUFnQixNQUFoQixHQUZDO2lCQU5MO2FBREssQ0FXUCxJQVhPLENBV0YsSUFYRSxDQUFUOztBQWFBLG1CQUFPLFVBQVUsR0FBVixFQUFlLE1BQWYsRUFBdUIsR0FBdkIsRUFBNEI7O0FBRS9CLHdCQUFRLEtBQVIsQ0FBYyxLQUFLLEtBQUwsQ0FBVyxHQUFYLEVBQWdCLE1BQTlCLEVBQXNDLElBQUksUUFBSixFQUF0QyxFQUYrQjthQUE1QixDQUdMLElBSEssQ0FHQSxJQUhBLENBQVA7U0FwQkosRUFEcUI7S0FBWjs7QUE0QmIscUJBQWlCLFlBQVk7QUFDekIs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VCxDQUF3QixjQUF4QixDQUhKIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIu+7vy8v5pi+56S65YWo5bGP6YGu572pXHJcbnZhciBTaG93ZnVsbGJnID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJChcIiNyZWxvYWRfZnVsbGJnLCNyZWxvYWRfaWNvblwiKS5zaG93KCk7XHJcbn07XHJcblxyXG4vL+makOiXj+WFqOWxj+mBrue9qVxyXG52YXIgSGlkZWZ1bGxiZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoXCIjcmVsb2FkX2Z1bGxiZywjcmVsb2FkX2ljb25cIikuaGlkZSgpO1xyXG59O1xyXG5cclxudmFyIE1haW5Db250ZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgZ2V0VGFza0luZm86IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IF8uc3RyLnNwcmludGYoJy9mdWVsX2NhcmQvYmlnX3JlY2hhcmdlPyZyZXF1X3R5cGU9JXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KCdnZXRfdGFza19pbmZvJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgdHlwZTogJ2dldCcsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcF9kYXRhLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhc2tfaW5mbzogcmVzcF9kYXRhLmRhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIuivu+WPluW9k+WJjeS7u+WKoeS/oeaBr+WHuumUmSBcIiArIHJlc3BfZGF0YS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAvL2FsZXJ0KFwi6K+75Y+W5b2T5YmN5Lu75Yqh5L+h5oGv5byC5bi4IFwiICsgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLnByb3BzLnVybCwgc3RhdHVzLCBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgY2hlY2tlZDogZmFsc2UsXHJcbiAgICAgICAgICAgIHJ1bm5pbmdfdGFza19pZDogbnVsbCwvL+W9k+WJjeato+WcqOi/kOihjOeahOS7u+WKoUlEXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmdldFRhc2tJbmZvKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgdGFza1BhbmVsTm9kZSA9IG51bGw7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUuY2hlY2tlZCkge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGUudGFza19pbmZvKSB7XHJcbiAgICAgICAgICAgICAgICB0YXNrUGFuZWxOb2RlID0gKDxOZXdUYXNrUGFuZWwgcmVsb2FkVGFza1BhZ2U9e3RoaXMuZ2V0VGFza0luZm99IC8+KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRhc2tQYW5lbE5vZGUgPSAoPFRhc2tTdGF0dXNQYW5lbCByZWxvYWRUYXNrUGFnZT17dGhpcy5nZXRUYXNrSW5mb30gLz4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwid3JhcHBlclwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBpZD1cInJlbG9hZF9mdWxsYmdcIj48L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgaWQ9XCJyZWxvYWRfaWNvblwiPjxpIGNsYXNzTmFtZT1cImljb24tc3Bpbm5lciBpY29uLXNwaW4gaWNvbi00eFwiPjwvaT48L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxDYXJkSW52ZW50b3J5SW5mb1RhYmxlIC8+XHJcbiAgICAgICAgICAgICAgICB7dGFza1BhbmVsTm9kZX1cclxuICAgICAgICAgICAgICAgIDxUYXNrTGlzdCAvPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8v6Ieq5a6a5LmJ5LiA5Liq5paw55qE5Lu75YqhXHJcbnZhciBOZXdUYXNrUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICAvL+WQr+WKqOaJuemHj+WFheWAvOS7u+WKoVxyXG4gICAgb25DbGlja1N0YXJ0VGFzazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0b3RhbF9wcmljZSA9IDA7XHJcbiAgICAgICAgdmFyIHByaWNlX2xpc3RfbXNnID0gXCJcIjtcclxuXHJcbiAgICAgICAgdmFyIGFjY291bnQgPSAkKCcjZm9ybV9jdXN0b21lcl9pZCcpLnZhbCgpO1xyXG4gICAgICAgIHZhciBwcmljZV9saXN0ID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgaSBpbiB0aGlzLnN0YXRlLnByaWNlX2xpc3QpIHtcclxuICAgICAgICAgICAgdmFyIHByaWNlID0gcGFyc2VJbnQodGhpcy5zdGF0ZS5wcmljZV9saXN0W2ldLnByaWNlKTtcclxuICAgICAgICAgICAgdmFyIHByaWNlX2NvdW50ID0gcGFyc2VJbnQodGhpcy5zdGF0ZS5wcmljZV9saXN0W2ldLmNvdW50KTtcclxuICAgICAgICAgICAgdmFyIGNvdW50ID0gJChcIiNwcmljZV9cIiArIHByaWNlKS52YWwoKTtcclxuICAgICAgICAgICAgaWYgKGNvdW50ICE9ICcnKS8v55uR5rWL6L6T5YWl55qE5pWw5a2X5piv5ZCm5ZCI5rOVXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoY291bnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY291bnQgPSAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL+WNoeaVsOmHj+WIpOaWrSDlr7nmr5TlupPlrZjkv6Hmga9cclxuICAgICAgICAgICAgaWYgKGNvdW50ID4gcHJpY2VfY291bnQgfHwgY291bnQgPCAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIui2heWHuuW6k+WtmOaVsOmHjyzliJvlu7rku7vliqHlpLHotKXvvIHvvIHvvIFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKGNvdW50ID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcHJpY2VfbGlzdC5wdXNoKHsgcHJpY2U6IHByaWNlLCBjb3VudDogY291bnQgfSk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbF9wcmljZSArPSBwcmljZSAqIGNvdW50O1xyXG4gICAgICAgICAgICAgICAgcHJpY2VfbGlzdF9tc2cgKz0gXy5zdHIuc3ByaW50ZignICVzKCVz5YWDKScsIHByaWNlLCBwcmljZSAqIGNvdW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy/otKblj7flkIjms5XmgKfliKTmlq1cclxuICAgICAgICBpZiAoIWFjY291bnQgfHwgYWNjb3VudCA9PSAxKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwi5YWF5YC86LSm5Y+36ZSZ6K+vXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL+WFheWAvOmHkemineWQiOazleaAp+WIpOaWrVxyXG4gICAgICAgIGlmICghKHRvdGFsX3ByaWNlID4gMCkpIHtcclxuICAgICAgICAgICAgYWxlcnQoXCLlhYXlgLzph5Hpop3plJnor69cIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvL+W8ueeql+WIpOaWreaYr+WQpue7p+e7rVxyXG4gICAgICAgIHZhciBtc2cgPSBfLnN0ci5zcHJpbnRmKCflsIbkvJrnu5kgJXMg5YWF5YWlICVz5YWDXFxuICVzJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgYWNjb3VudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgdG90YWxfcHJpY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIHByaWNlX2xpc3RfbXNnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgaWYgKCFjb25maXJtKG1zZykpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlcXVfZGF0YSA9IHtcclxuICAgICAgICAgICAgcmVxdV90eXBlOiBcImFkZF90YXNrXCIsXHJcbiAgICAgICAgICAgIGFyZ3VfbGlzdDoge1xyXG4gICAgICAgICAgICAgICAgYWNjb3VudDogYWNjb3VudCxcclxuICAgICAgICAgICAgICAgIHByaWNlX2xpc3Q6IHByaWNlX2xpc3QsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAnL2Z1ZWxfY2FyZC9iaWdfcmVjaGFyZ2UnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICB0eXBlOiAncG9zdCcsXHJcbiAgICAgICAgICAgIGRhdGE6IChKU09OLnN0cmluZ2lmeShyZXF1X2RhdGEpKSxcclxuXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi5paw5aKe5Lu75Yqh5oiQ5YqfXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vdGhpcy5wcm9wcy5nZXRUYXNrSW5mbygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIFNob3dmdWxsYmcoKTtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIuaWsOWinuS7u+WKoeWHuumUmVxcblwiICsgZGF0YS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwi5paw5aKe5YWF5YC85Lu75Yqh5byC5bi4XFxuXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKFhNTEh0dHBSZXF1ZXN0LCB0ZXh0U3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICBIaWRlZnVsbGJnKCk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRDYXJkSW52ZW50b3J5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAnL2Z1ZWxfY2FyZC9jYXJkX2ludmVudG9yeT9yZXF1X3R5cGU9Z2V0X3VzZXJfaW52ZW50b3J5JmNhcmRfdHlwZT1TSU5PUEVDJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgdHlwZTogJ2dldCcsXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZihyZXNwX2RhdGEuc3RhdHVzID09ICdvaycpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByaWNlX2xpc3QgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIHByaWNlIGluIHJlc3BfZGF0YS5kYXRhLnByaWNlX2ludmVudG9yeSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlX2xpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogcHJpY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogcmVzcF9kYXRhLmRhdGEucHJpY2VfaW52ZW50b3J5W3ByaWNlXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwcmljZV9saXN0OiBwcmljZV9saXN0LCBlcnJvcl9tc2c6IG51bGx9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwcmljZV9saXN0OltdLCBlcnJvcl9tc2c6IFwi5bqT5a2Y5L+h5oGv6K+75Y+W5aSx6LSlXCJ9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy/or7vlj5bluLjnlKjlrqLmiLfkv6Hmga9cclxuICAgIGdldEN1c3RvbWVyTGlzdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXy5zdHIuc3ByaW50ZignL2Z1ZWxfY2FyZC9jdXN0b21lcl9saXN0PyZyZXF1X3R5cGU9JXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KCdnZXRfY3VzdG9tZXJfbGlzdCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BfZGF0YS5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21lcl9saXN0OiByZXNwX2RhdGEuZGF0YS5jdXN0b21lcl9saXN0LFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIuivu+WPluWuouaIt+WIl+ihqOWHuumUmSBcIiArIHJlc3BfZGF0YS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksXHJcblxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwi6K+75Y+W5a6i5oi35YiX6KGo5byC5bi4IFwiICsgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLnByb3BzLnVybCwgc3RhdHVzLCBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvL+WunuaXtuaYvuekuumHkeminVxyXG4gICAgZ2V0U3VtUHJpY2U6IGZ1bmN0aW9uIChwcmljZV9pbmZvKSB7XHJcbiAgICAgICAgdmFyIHByaWNlX2xpc3QgPSBbXTtcclxuICAgICAgICB2YXIgY291bnQgPSAkKFwiI3ByaWNlX1wiICsgcHJpY2VfaW5mby5wcmljZSkudmFsKCk7XHJcbiAgICAgICAgLy/mo4DmtYtjb3VudOaYr+WQpuWQiOazlSzlubborqHnrpfljZXkuKrpnaLlgLznmoTph5Hpop1cclxuICAgICAgICBpZiAoY291bnQgPiBwcmljZV9pbmZvLmNvdW50KSB7XHJcbiAgICAgICAgICAgICQoXCIjc3VtX1wiICsgcHJpY2VfaW5mby5wcmljZSkuYWRkQ2xhc3MoXCJ0ZXh0LWRhbmdlclwiKS50ZXh0KFwi6LaF5Ye65bqT5a2Y5pWw6YePXCIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY291bnQgPT0gMCkge1xyXG4gICAgICAgICAgICAkKFwiI3N1bV9cIiArIHByaWNlX2luZm8ucHJpY2UpLnJlbW92ZUNsYXNzKFwidGV4dC1kYW5nZXJcIikudGV4dChcIumHkeminTogMCDlhYNcIik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjb3VudCA8PSBwcmljZV9pbmZvLmNvdW50ICYmIGNvdW50ID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgcHJpY2UgPSBwcmljZV9pbmZvLnByaWNlICogY291bnQ7XHJcbiAgICAgICAgICAgICQoXCIjc3VtX1wiICsgcHJpY2VfaW5mby5wcmljZSkucmVtb3ZlQ2xhc3MoXCJ0ZXh0LWRhbmdlclwiKS50ZXh0KFwi6YeR6aKdOiBcIiArIHByaWNlICsgXCLlhYNcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdG90YWxfcHJpY2UgPSAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgaW4gdGhpcy5zdGF0ZS5wcmljZV9saXN0KSB7XHJcbiAgICAgICAgICAgIHZhciBwcmljZSA9IHBhcnNlSW50KHRoaXMuc3RhdGUucHJpY2VfbGlzdFtpXS5wcmljZSk7XHJcbiAgICAgICAgICAgIHZhciBjb3VudCA9ICQoXCIjcHJpY2VfXCIgKyBwcmljZSkudmFsKCk7XHJcbiAgICAgICAgICAgIGlmIChjb3VudCAhPSAnJykvL+ebkea1i+i+k+WFpeeahOaVsOWtl+aYr+WQpuWQiOazlVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb3VudCA9IHBhcnNlSW50KGNvdW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvdW50ID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNvdW50ID4gdGhpcy5zdGF0ZS5wcmljZV9saXN0W2ldLmNvdW50KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkKFwiI3RvdGFsXCIpLnRleHQoXCLotoXlh7rlupPlrZjmlbDph49cIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKGNvdW50ID4gMClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdG90YWxfcHJpY2UgKz0gcHJpY2UgKiBjb3VudDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJChcIiN0b3RhbFwiKS50ZXh0KFwi5ZCI6K6h5oC76YeR6aKdOiBcIiArIHRvdGFsX3ByaWNlICsgXCIg5YWDXCIpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvL1xyXG4gICAgb25QcmljZUNvdW50S2V5RG93bjogZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBpZiAoIWUpIHZhciBlID0gd2luZG93LmV2ZW50O1xyXG5cclxuICAgICAgICBpZiAoKChlLmtleUNvZGUgPj0gNDgpICYmIChlLmtleUNvZGUgPD0gNTcpKSB8fCAoKGUua2V5Q29kZSA+PSA5NikgJiYgKGUua2V5Q29kZSA8PSAxMDUpKSB8fCBlLmtleUNvZGUgPT0gOCB8fCBlLmtleUNvZGUgPT0gOSB8fCBlLmtleUNvZGUgPT0gMzcgfHwgZS5rZXlDb2RlID09IDM5KSB7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBjYXJkX2ludmVudG9yeV9pbmZvOiBbXSxcclxuICAgICAgICAgICAgcHJpY2VfbGlzdDogW10sXHJcbiAgICAgICAgICAgIGN1c3RvbWVyX2xpc3Q6IFtdLFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5nZXRDYXJkSW52ZW50b3J5KCk7XHJcbiAgICAgICAgdGhpcy5nZXRDdXN0b21lckxpc3QoKTtcclxuICAgICAgICAkKCcjZm9ybV9jdXN0b21lcl9pZCcpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBjYXJkX2lkID0gJCgnI2Zvcm1fY3VzdG9tZXJfaWQnKS52YWwoKTtcclxuICAgICAgICAgICAgdmFyIGNhcmRfbmFtZSA9ICQoJyNmb3JtX2N1c3RvbWVyX2lkJykuZmluZChcIm9wdGlvbjpzZWxlY3RlZFwiKS5hdHRyKFwidGl0bGVcIik7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNhcmRfaWQsIGNhcmRfbmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChjYXJkX2lkID09IDEpIHtcclxuICAgICAgICAgICAgICAgICQoJyNzaG93X251bWJlcicpLnRleHQoJycpO1xyXG4gICAgICAgICAgICAgICAgJCgnI3Nob3dfbmFtZScpLnRleHQoJycpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJCgnI3Nob3dfbnVtYmVyJykudGV4dChjYXJkX2lkKTtcclxuICAgICAgICAgICAgICAgICQoJyNzaG93X25hbWUnKS50ZXh0KGNhcmRfbmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHByaWNlTGlzdE5vZGVzID0gdGhpcy5zdGF0ZS5wcmljZV9saXN0Lm1hcChmdW5jdGlvbiAocHJpY2VfaW5mbywgaW5kZXgpIHtcclxuICAgICAgICAgICAgaWYocHJpY2VfaW5mby5jb3VudCA8PSAwIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwcmljZV9pZCA9IFwicHJpY2VfXCIgKyBwcmljZV9pbmZvLnByaWNlO1xyXG4gICAgICAgICAgICB2YXIgc3VtX3ByaWNlID0gXCJzdW1fXCIgKyBwcmljZV9pbmZvLnByaWNlO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93IG0tYm90MTVcIiBrZXk9e1wicHJpY2VMaXN0Tm9kZXNfXCIraW5kZXh9PlxyXG4gICAgICAgICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJjb2wtc20tMiBjb2wtbWQtMiBjb250cm9sLWxhYmVsIHRleHQtaW5mb1wiPumdouWAvDoge3ByaWNlX2luZm8ucHJpY2V9PC9oND5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0yIGNvbC1zbS04XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD17cHJpY2VfaWR9IHR5cGU9XCJ0ZXh0XCIgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sIGZvcm1fY291bnRcIiBtYXhMZW5ndGg9XCI1XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uS2V5VXA9e3RoaXMuZ2V0U3VtUHJpY2UuYmluZCh0aGlzLHByaWNlX2luZm8pfSBvbktleURvd249e3RoaXMub25QcmljZUNvdW50S2V5RG93bn0gLz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8aDUgY2xhc3NOYW1lPVwiY29sLW1kLTEgY29sLXNtLTIgY29udHJvbC1sYWJlbCB0ZXh0LWRhbmdlclwiPntcIuWPr+eUqFwifXtwcmljZV9pbmZvLmNvdW50fTwvaDU+XHJcbiAgICAgICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cImNvbC1tZC0zIGNvbC1zbS0yIGNvbnRyb2wtbGFiZWxcIiBpZD17c3VtX3ByaWNlfT7nu5/orqHph5Hpop06IDAg5YWDPC9oMz5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHZhciBjdXN0b21lckxpc3ROb2RlcyA9IHRoaXMuc3RhdGUuY3VzdG9tZXJfbGlzdC5tYXAoZnVuY3Rpb24gKGN1c3RvbWVyX2luZm8sIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoPG9wdGlvbiBrZXk9e1wiY3VzdG9tZXJMaXN0Tm9kZXNfXCIraW5kZXh9IHZhbHVlPXtjdXN0b21lcl9pbmZvLmNhcmRfaWR9IGRhdGEtc3VidGV4dD17Y3VzdG9tZXJfaW5mby5jYXJkX2lkfSB0aXRsZT17Y3VzdG9tZXJfaW5mby5uYW1lfT57Y3VzdG9tZXJfaW5mby5jYXJkX2lkfSAtIHtjdXN0b21lcl9pbmZvLm5hbWV9PC9vcHRpb24+KVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJwYW5lbFwiPlxyXG4gICAgICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJwYW5lbC1oZWFkaW5nIHJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB1bGwtbGVmdFwiPjxpIGNsYXNzTmFtZT1cImljb24tdGFibGVcIj48L2k+5paw55qE5YWF5YC85Lu75YqhPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhbmVsLWJvZHlcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1vZGFsLWJvZHkgZm9ybS1ob3Jpem9udGFsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwiY29sLXNtLTIgY29sLW1kLTIgY29udHJvbC1sYWJlbFwiPui0puWPtzwvaDQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtNSBjb2wtc20tOFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPVwiZm9ybS1jb250cm9sXCIgaWQ9XCJmb3JtX2N1c3RvbWVyX2lkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtbGl2ZS1zZWFyY2g9XCJ0cnVlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIxXCI+LT3or7fpgInmi6nluJDlj7c9LTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y3VzdG9tZXJMaXN0Tm9kZXN9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtb2Zmc2V0LTIgY29sLW1kLTQgY29sLXNtLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgxIGlkPVwic2hvd19udW1iZXJcIj48L2gxPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNtLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGgyIGlkPVwic2hvd19uYW1lXCI+PC9oMj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cHJpY2VMaXN0Tm9kZXN9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvcm0tZ3JvdXBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJjb2wtbWQtMyBjb2wtc20tNCB0ZXh0LWRhbmdlciBtYXJnaW4tNVwiIGlkPVwidG90YWxcIj48L2gzPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtNSBjb2wtc20tNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGlkPVwiYWN0X3F1ZXJ5XCIgaHJlZj1cImphdmFzY3JpcHQ6O1wiIGNsYXNzTmFtZT1cImJ0biBidG4taW5mb1wiIG9uQ2xpY2s9e3RoaXMub25DbGlja1N0YXJ0VGFza30+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tcGxheVwiPjwvaT4g5Yib5bu6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8v5Lu75Yqh54q25oCBXHJcbnZhciBUYXNrU3RhdHVzUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICBnZXRUYXNrSW5mbzogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXy5zdHIuc3ByaW50ZignL2Z1ZWxfY2FyZC9iaWdfcmVjaGFyZ2U/JnJlcXVfdHlwZT0lcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoJ2dldF90YXNrX2luZm8nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICB0eXBlOiAnZ2V0JyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwX2RhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNwX2RhdGEuc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGFza19pbmZvOiByZXNwX2RhdGEuZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi6K+75Y+W5b2T5YmN5Lu75Yqh5L+h5oGv5Ye66ZSZIFwiICsgcmVzcF9kYXRhLm1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksXHJcblxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIC8vYWxlcnQoXCLor7vlj5blvZPliY3ku7vliqHkv6Hmga/lvILluLggXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRUYXNrU3RhdHVzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBfLnN0ci5zcHJpbnRmKCcvZnVlbF9jYXJkL2JpZ19yZWNoYXJnZT8mcmVxdV90eXBlPSVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCgnZ2V0X3Rhc2tfc3RhdHVzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgdHlwZTogJ2dldCcsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcF9kYXRhLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhc2tfc3RhdHVzOiByZXNwX2RhdGEuZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi6K+75Y+W5b2T5YmN5Lu75Yqh5L+h5oGv5Ye66ZSZIFwiICsgcmVzcF9kYXRhLm1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksXHJcblxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIC8vYWxlcnQoXCLor7vlj5blvZPliY3ku7vliqHkv6Hmga/lvILluLggXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRUYXNrU3RhdHVzSGlzdG9yeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogXy5zdHIuc3ByaW50ZignL2Z1ZWxfY2FyZC9iaWdfcmVjaGFyZ2U/JnJlcXVfdHlwZT0lcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoJ2dldF9zdGF0dXNfaGlzdG9yeScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BfZGF0YS5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXNrX2hpc3RvcnlfbGlzdDogcmVzcF9kYXRhLmRhdGEudGFza19oaXN0b3J5X2xpc3QsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIuivu+WPluW9k+WJjeS7u+WKoeS/oeaBr+WHuumUmSBcIiArIHJlc3BfZGF0YS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAvL2FsZXJ0KFwi6K+75Y+W5b2T5YmN5Lu75Yqh5L+h5oGv5byC5bi4IFwiICsgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLnByb3BzLnVybCwgc3RhdHVzLCBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgb25DbGlja1N0YXJ0VGFzazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByZXF1X2RhdGEgPSB7XHJcbiAgICAgICAgICAgIHJlcXVfdHlwZTogXCJzdGFydF90YXNrXCIsXHJcbiAgICAgICAgICAgIGFyZ3VfbGlzdDoge1xyXG4gICAgICAgICAgICAgICAgdGFza19pZDogdGhpcy5zdGF0ZS50YXNrX2luZm8udGFza19pZCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6ICcvZnVlbF9jYXJkL2JpZ19yZWNoYXJnZScsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdwb3N0JyxcclxuICAgICAgICAgICAgZGF0YTogKEpTT04uc3RyaW5naWZ5KHJlcXVfZGF0YSkpLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZXRUYXNrSW5mbygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwi5Lu75Yqh5ZCv5Yqo5oiQ5YqfXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCLku7vliqHlkK/liqjlh7rplJlcXG5cIiArIGRhdGEubXNnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAvL2FsZXJ0KFwi5Lu75Yqh5ZCv5Yqo5byC5bi4XFxuXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIG9uQ2xpY2tTdG9wVGFzazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciByZXF1X2RhdGEgPSB7XHJcbiAgICAgICAgICAgIHJlcXVfdHlwZTogXCJzdG9wX3Rhc2tcIixcclxuICAgICAgICAgICAgYXJndV9saXN0OiB7XHJcbiAgICAgICAgICAgICAgICB0YXNrX2lkOiB0aGlzLnN0YXRlLnRhc2tfaW5mby50YXNrX2lkLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogJy9mdWVsX2NhcmQvYmlnX3JlY2hhcmdlJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgdHlwZTogJ3Bvc3QnLFxyXG4gICAgICAgICAgICBkYXRhOiAoSlNPTi5zdHJpbmdpZnkocmVxdV9kYXRhKSksXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFRhc2tJbmZvKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCLku7vliqHmmoLlgZzmiJDlip9cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIuS7u+WKoeaaguWBnOWHuumUmVxcblwiICsgZGF0YS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBzdGF0dXMsIGVycikge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCLku7vliqHmmoLlgZzlvILluLhcXG5cIiArIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgb25DbGlja0ZpbmlzaFRhc2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcmVxdV9kYXRhID0ge1xyXG4gICAgICAgICAgICByZXF1X3R5cGU6IFwiZmluaXNoX3Rhc2tcIixcclxuICAgICAgICAgICAgYXJndV9saXN0OiB7XHJcbiAgICAgICAgICAgICAgICB0YXNrX2lkOiB0aGlzLnN0YXRlLnRhc2tfaW5mby50YXNrX2lkLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogJy9mdWVsX2NhcmQvYmlnX3JlY2hhcmdlJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgdHlwZTogJ3Bvc3QnLFxyXG4gICAgICAgICAgICBkYXRhOiAoSlNPTi5zdHJpbmdpZnkocmVxdV9kYXRhKSksXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuc3RhdHVzID09ICdvaycpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdldFRhc2tJbmZvKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCLku7vliqHnu5PmnZ/miJDlip9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLnByb3BzLmdldFRhc2tJbmZvKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIuS7u+WKoee7k+adn+WHuumUmVxcblwiICsgZGF0YS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwi5Lu75Yqh57uT5p2f5byC5bi4XFxuXCIgKyBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8v5ZCv5Yqo6Ieq5Yqo5Yi35pawXHJcbiAgICBzdGFydEludGVydmFsOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy9hbGVydChcIuW3suWQr+WKqOiHquWKqOWIt+aWsFwiKTtcclxuICAgICAgICB2YXIgdGFza19pbmZvX2ludGVydmFsID0gc2V0SW50ZXJ2YWwodGhpcy5nZXRUYXNrSW5mbywgMSAqIDEwMDApO1xyXG4gICAgICAgIHZhciB0YXNrX3N0YXR1c19pbnRlcnZhbCA9IHNldEludGVydmFsKHRoaXMuZ2V0VGFza1N0YXR1c0hpc3RvcnksIDEgKiAxMDAwKTtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKHsgdGFza19pbmZvX2ludGVydmFsOiB0YXNrX2luZm9faW50ZXJ2YWwsIHRhc2tfc3RhdHVzX2ludGVydmFsOiB0YXNrX3N0YXR1c19pbnRlcnZhbCB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgLy/lgZzmraLoh6rliqjliLfmlrBcclxuICAgIHN0b3BJbnRlcnZhbDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vYWxlcnQoXCLoh6rliqjliLfmlrDlt7LlhbPpl61cIik7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudGFza19pbmZvX2ludGVydmFsKSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5zdGF0ZS50YXNrX2luZm9faW50ZXJ2YWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUudGFza19zdGF0dXNfaW50ZXJ2YWwpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnN0YXRlLnRhc2tfc3RhdHVzX2ludGVydmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHRhc2tfaW5mb19pbnRlcnZhbDogbnVsbCwgdGFza19zdGF0dXNfaW50ZXJ2YWw6IG51bGwgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRhc2tfaW5mb19pbnRlcnZhbDogbnVsbCwgICAgLy/lrprml7bliLfmlrDnmoTku7vliqFJRFxyXG4gICAgICAgICAgICB0YXNrX3N0YXR1c19pbnRlcnZhbDogbnVsbCwgIC8v5a6a5pe25Yi35paw55qE5Lu75YqhSURcclxuICAgICAgICAgICAgdGFza19pbmZvOiB7fSxcclxuICAgICAgICAgICAgdGFza19oaXN0b3J5X2xpc3Q6IFtdLFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5nZXRUYXNrSW5mbygpO1xyXG4gICAgICAgIHRoaXMuZ2V0VGFza1N0YXR1c0hpc3RvcnkoKTtcclxuXHJcbiAgICAgICAgc2V0SW50ZXJ2YWwodGhpcy5nZXRUYXNrSW5mbywgMTAgKiAxMDAwKTtcclxuICAgICAgICBzZXRJbnRlcnZhbCh0aGlzLmdldFRhc2tTdGF0dXNIaXN0b3J5LCAxMCAqIDEwMDApO1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRVcGRhdGU6IGZ1bmN0aW9uIChwcmV2UHJvcHMsIHByZXZTdGF0ZSkge1xyXG4gICAgICAgIGlmIChwcmV2U3RhdGUudGFza19pbmZvICE9IHRoaXMuc3RhdGUudGFza19pbmZvKSB7XHJcbiAgICAgICAgICAgIGlmIChwcmV2U3RhdGUudGFza19pbmZvLnRhc2tfc3RhdHVzICE9IHRoaXMuc3RhdGUudGFza19pbmZvLnRhc2tfc3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGF0ZS50YXNrX2luZm8udGFza19zdGF0dXMgPT0gJzEnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydEludGVydmFsKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0b3BJbnRlcnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgc3RhcnRCdG5Ob2RlID0gbnVsbDtcclxuICAgICAgICB2YXIgc3RvcEJ0bk5vZGUgPSBudWxsO1xyXG4gICAgICAgIHZhciB0YXNrU3RhdGUgPSBudWxsO1xyXG4gICAgICAgIC8vLTE65pyq55+l54q25oCBICAwOuWBnOatoiAxOui/kOihjOS4rSAgMjrnu5PmnZ9cclxuICAgICAgICBpZiAodGhpcy5zdGF0ZS50YXNrX2luZm8udGFza19zdGF0dXMgPT0gJzAnKSB7XHJcbiAgICAgICAgICAgIHN0YXJ0QnRuTm9kZSA9ICg8YnV0dG9uIGNsYXNzTmFtZT0nYnRuIGJ0bi1zdWNjZXNzJyBocmVmPSdqYXZhc2NyaXB0OnZvaWQoMCk7JyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tTdGFydFRhc2t9PjxpIGNsYXNzTmFtZT1cImljb24tcGxheVwiIC8+IOWQr+WKqDwvYnV0dG9uPik7XHJcbiAgICAgICAgICAgIHRhc2tTdGF0ZSA9ICg8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC1vZmZzZXQtMSBjb2wtbWQtMiBjb2wteHMtNCBwb29sYWxlcnQgYWxlcnQtZGFuZ2VyIHRleHQtY2VudGVyXCI+5Lu75Yqh5bey5YGc5q2iPC9kaXY+KTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuc3RhdGUudGFza19pbmZvLnRhc2tfc3RhdHVzID09ICcxJykge1xyXG4gICAgICAgICAgICB0YXNrU3RhdGUgPSAoPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtb2Zmc2V0LTEgY29sLW1kLTIgY29sLXhzLTQgcG9vbGFsZXJ0IGFsZXJ0LWluZm8gdGV4dC1jZW50ZXJcIj7ku7vliqHov5DooYzkuK0uLi48L2Rpdj4pO1xyXG4gICAgICAgICAgICBzdG9wQnRuTm9kZSA9ICg8YnV0dG9uIGNsYXNzTmFtZT0nYnRuIGJ0bi1pbmZvJyBocmVmPSdqYXZhc2NyaXB0OnZvaWQoMCk7JyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tTdG9wVGFza30+PGkgY2xhc3NOYW1lPVwiaWNvbi1wYXVzZVwiIC8+IOaaguWBnDwvYnV0dG9uPik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZmluaXNoQnRuTm9kZSA9ICg8YnV0dG9uIGNsYXNzTmFtZT0nYnRuIGJ0bi1kYW5nZXInIGhyZWY9J2phdmFzY3JpcHQ6dm9pZCgwKTsnIG9uQ2xpY2s9e3RoaXMub25DbGlja0ZpbmlzaFRhc2t9PjxpIGNsYXNzTmFtZT1cImljb24tc3RvcFwiIC8+IOe7k+adnzwvYnV0dG9uPik7XHJcblxyXG5cclxuICAgICAgICAvL+WOhuWPsuiusOW9lVxyXG4gICAgICAgIHZhciBoaXN0b3J5TGlzdE5vZGVzID0gdGhpcy5zdGF0ZS50YXNrX2hpc3RvcnlfbGlzdC5tYXAoZnVuY3Rpb24gKGhpc3RvcnlfaW5mbywgaW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIGggPSBoaXN0b3J5X2luZm8gKyBcIlxcblwiO1xyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIHtofVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicGFuZWxcIj5cclxuICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGluZyByb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwdWxsLWxlZnRcIj48aSBjbGFzc05hbWU9XCJpY29uLXRhc2tzXCI+PC9pPuW9k+WJjeS7u+WKoSB7dGhpcy5zdGF0ZS50YXNrX2luZm8udGFza19pZH0gPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm93IGNlbnRlci1ibG9ja1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7dGFza1N0YXRlfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC01IG0tbGVmdDEwIGJ0bi1ncm91cCBidG4tZ3JvdXAtc21cIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtzdGFydEJ0bk5vZGV9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7c3RvcEJ0bk5vZGV9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7ZmluaXNoQnRuTm9kZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPuaAu+mdouWAvDp7dGhpcy5zdGF0ZS50YXNrX2luZm8udG90YWxfcHJpY2V9IOW3suWFheWFpTp7dGhpcy5zdGF0ZS50YXNrX2luZm8uc3VjY2Vzc19wcmljZX08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFuZWwtYm9keVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwcmUgY2xhc3NOYW1lPVwiY29sLW1kLTEyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtoaXN0b3J5TGlzdE5vZGVzfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvcHJlPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICApO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG4vL+S7u+WKoeWOhuWPslxyXG52YXIgVGFza0xpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICBvblF1ZXJ5OiBmdW5jdGlvbiAoZmlsdGVycykge1xyXG4gICAgICAgIHZhciBmaWx0ZXJfbWFwID0gdGhpcy5zdGF0ZS5maWx0ZXJfbWFwO1xyXG4gICAgICAgIGZpbHRlcl9tYXAucGFnZV9pbmRleCA9IDE7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgaW4gZmlsdGVycykge1xyXG4gICAgICAgICAgICBmaWx0ZXJfbWFwW2ldID0gZmlsdGVyc1tpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9hbGVydChKU09OLnN0cmluZ2lmeShmaWx0ZXJfbWFwKSk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IGZpbHRlcl9tYXA6IGZpbHRlcl9tYXAsIHRhc2tfbGlzdDogW10sIHBhZ2VfaW5mbzogbnVsbCB9KTtcclxuXHJcbiAgICAgICAgdmFyIGFyZ3VfbGlzdCA9IFwiXCI7XHJcbiAgICAgICAgZm9yICh2YXIgaSBpbiBmaWx0ZXJfbWFwKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYXJndV9saXN0ICs9IF8uc3RyLnNwcmludGYoJyYlcz0lcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoaSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoZmlsdGVyX21hcFtpXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBfLnN0ci5zcHJpbnRmKCcvZnVlbF9jYXJkL2JpZ19yZWNoYXJnZT8mcmVxdV90eXBlPSVzJXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KCdnZXRfdGFza19saXN0JyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmd1X2xpc3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgdHlwZTogJ2dldCcsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcF9kYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcF9kYXRhLnN0YXR1cyA9PSAnb2snKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7IHRhc2tfbGlzdDogcmVzcF9kYXRhLmRhdGEudGFza19saXN0LCBwYWdlX2luZm86IHJlc3BfZGF0YS5kYXRhLnBhZ2VfaW5mbyB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCLmn6Xor6Llh7rplJkgXCIgKyByZXNwX2RhdGEubXNnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIuafpeivouW8guW4uCBcIiArIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgb25DbGlja0V4cG9ydDogZnVuY3Rpb24gKHRhc2tfaWQpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IF8uc3RyLnNwcmludGYoJy9mdWVsX2NhcmQvb3JkZXJfbGlzdD8mcmVxdV90eXBlPSVzJnRhc2tfaWQ9JXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCgnZnVlbF9jYXJkX2V4cG9ydCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh0YXNrX2lkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BfZGF0YS5zdGF0dXMgPT0gJ29rJykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXRoID0gcmVzcF9kYXRhLmRhdGEucGF0aDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocGF0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKHBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCLmn6Xor6Llh7rplJkgXCIgKyByZXNwX2RhdGEubXNnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIuafpeivouW8guW4uCBcIiArIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG5cclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBmaWx0ZXJfbWFwOiB7XHJcbiAgICAgICAgICAgICAgICBwYWdlX2luZGV4OiAxLFxyXG4gICAgICAgICAgICAgICAgcGFnZV9zaXplOiAyMCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGFza19saXN0OiBbXSxcclxuICAgICAgICAgICAgcGFnZV9pbmZvOiBudWxsLFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5vblF1ZXJ5KHt9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkVXBkYXRlOiBmdW5jdGlvbiAocHJldlByb3BzLCBwcmV2U3RhdGUpIHtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhc2tMaXN0Tm9kZXMgPSB0aGlzLnN0YXRlLnRhc2tfbGlzdC5tYXAoZnVuY3Rpb24gKHRhc2tfaW5mbywgaW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIHVybCA9IF8uc3RyLnNwcmludGYoJy9mdWVsX2NhcmQvb3JkZXJfbGlzdD8mdGFza19pZD0lcyZzdGFydF90aW1lPSVzJmRvX3F1ZXJ5PSVzJyxcclxuICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudCh0YXNrX2luZm8udGFza19pZCksXHJcbiAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQodGFza19pbmZvLmNyZWF0ZV90aW1lKSxcclxuICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChcIjFcIilcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICB2YXIgYmxvY2tfdXJsID0gXy5zdHIuc3ByaW50ZignL2Z1ZWxfY2FyZC9vcmRlcl9saXN0PyZ0YXNrX2lkPSVzJnN0YXJ0X3RpbWU9JXMmb3JkZXJfdHlwZT0lcyZkb19xdWVyeT0lcycsXHJcbiAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQodGFza19pbmZvLnRhc2tfaWQpLFxyXG4gICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHRhc2tfaW5mby5jcmVhdGVfdGltZSksXHJcbiAgICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQoXCItMVwiKSxcclxuICAgICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChcIjFcIilcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgPHRyIGtleT17XCJ0YXNrTGlzdE5vZGVzX1wiK2luZGV4fT5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e3Rhc2tfaW5mby50YXNrX2lkfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPnt0YXNrX2luZm8uYWNjb3VudH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57dGFza19pbmZvLmNyZWF0ZV90aW1lfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPnt0YXNrX2luZm8uZmluaXNoX3RpbWV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e3Rhc2tfaW5mby5zdGF0dXN9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e3Rhc2tfaW5mby5zdGF0dXNfdGltZX08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57dGFza19pbmZvLnRvdGFsX3ByaWNlfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPnt0YXNrX2luZm8uc3VjY2Vzc19wcmljZX08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57dGFza19pbmZvLm5vdGVzfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPXt1cmx9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldD1cIl9ibGFua1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJ0biBidG4teHMgYnRuLWRhbmdlciAgbS1yaWdodDVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tc2VhcmNoXCI+PC9pPiDmn6Xor6LorqLljZVcclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPXtibG9ja191cmx9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ9XCJfYmxhbmtcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4taW5mbyAgbS1yaWdodDVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24td3JlbmNoXCI+PC9pPiDljaHljZXmn6Xor6JcclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBocmVmPVwiamF2YXNjcmlwdDp2b2lkKDApO1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja0V4cG9ydC5iaW5kKHRoaXMsIHRhc2tfaW5mby50YXNrX2lkKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYnRuIGJ0bi14cyBidG4tcHJpbWFyeSBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tZG93bmxvYWQtYWx0XCI+PC9pPiDlr7zlh7rorrDlvZVcclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInBhbmVsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJwYW5lbC1oZWFkaW5nIHJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwdWxsLWxlZnRcIj48aSBjbGFzc05hbWU9XCJpY29uLXRhYmxlXCI+PC9pPuaJuemHj+WFheWAvOWOhuWPsjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2hlYWRlcj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhbmVsLWJvZHlcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRhYmxlIGlkPVwib3JkZXJfcmVzdWx0XCIgY2xhc3NOYW1lPVwidGFibGUgdGFibGUtc3RyaXBlZCB0YWJsZS1ob3ZlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPuS7u+WKoee8luWPtzwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7lhYXlgLzotKblj7c8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5Yib5bu65pe26Ze0PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPue7k+adn+aXtumXtDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7nirbmgIE8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+54q25oCB5pe26Ze0PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPuaAu+mHkeminTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7lt7LlhYXlhaXph5Hpop08L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5aSH5rOoPC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPuaTjeS9nDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGJvZHk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3Rhc2tMaXN0Tm9kZXN9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8UGFnZUluZGV4R3JvdXAgb25RdWVyeT17dGhpcy5vblF1ZXJ5fSBwYWdlX2luZm89e3RoaXMuc3RhdGUucGFnZV9pbmZvfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbnZhciBQYWdlSW5kZXhHcm91cCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuICAgIG9uQ2xpY2tQYWdlOiBmdW5jdGlvbiAocGFnZV9pbmRleCkge1xyXG4gICAgICAgIHRoaXMucHJvcHMub25RdWVyeSh7cGFnZV9pbmRleDogcGFnZV9pbmRleH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge307XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZFVwZGF0ZTogZnVuY3Rpb24gKHByZXZQcm9wcywgcHJldlN0YXRlKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBhZ2VfaW5mbyA9PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBwYWdlX2luZGV4ID0gdGhpcy5wcm9wcy5wYWdlX2luZm8ucGFnZV9pbmRleDtcclxuICAgICAgICB2YXIgbWF4X3BhZ2UgPSB0aGlzLnByb3BzLnBhZ2VfaW5mby5tYXhfcGFnZTtcclxuXHJcbiAgICAgICAgdmFyIHBhZ2Vfc3RhcnQgPSBwYWdlX2luZGV4IC0gNCA+IDAgPyBwYWdlX2luZGV4IC0gNCA6IDE7XHJcbiAgICAgICAgdmFyIHBhZ2VfZW5kID0gcGFnZV9pbmRleCArIDQgPiBtYXhfcGFnZSA/IG1heF9wYWdlIDogcGFnZV9pbmRleCArIDQ7XHJcblxyXG4gICAgICAgIHZhciBwYWdlX2luZGV4X2xpc3QgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBpID0gcGFnZV9zdGFydDsgaSA8PSBwYWdlX2VuZDsgKytpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcGFnZV9pbmRleF9saXN0LnB1c2goaSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcGFnZUluZGV4QnRuQm9kZXMgPSBwYWdlX2luZGV4X2xpc3QubWFwKGZ1bmN0aW9uIChpLCBpbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgZGlzYWJsZWQgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAoaSA9PSB0aGlzLnByb3BzLnBhZ2VfaW5mby5wYWdlX2luZGV4KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZCA9IFwiZGlzYWJsZWRcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24ga2V5PXtcInBhZ2VJbmRleEJ0bkJvZGVzX1wiK2luZGV4fSBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHRcIiBkaXNhYmxlZD17ZGlzYWJsZWR9IHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tQYWdlLmJpbmQodGhpcyxpKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtpfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIHZhciBmYXN0QmFja3dhcmREaXNhYmxlZCA9IG51bGw7XHJcbiAgICAgICAgdmFyIGJhY2t3YXJkRGlzYWJsZWQgPSBudWxsO1xyXG4gICAgICAgIGlmIChwYWdlX2luZGV4IDw9IDEpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgZmFzdEJhY2t3YXJkRGlzYWJsZWQgPSBcImRpc2FibGVkXCI7XHJcbiAgICAgICAgICAgIGJhY2t3YXJkRGlzYWJsZWQgPSBcImRpc2FibGVkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGZvcndhcmREaXNhYmxlZCA9IG51bGw7XHJcbiAgICAgICAgdmFyIGZhc3RGb3J3YXJkRGlzYWJsZWQgPSBudWxsO1xyXG4gICAgICAgIGlmIChwYWdlX2luZGV4ID49IG1heF9wYWdlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvcndhcmREaXNhYmxlZCA9IFwiZGlzYWJsZWRcIjtcclxuICAgICAgICAgICAgZmFzdEZvcndhcmREaXNhYmxlZCA9IFwiZGlzYWJsZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtc20tMTJcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJ0bi1yb3cgZGF0YVRhYmxlc19maWx0ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBpZD1cInBhZ2VfZ3JvdXBcIiBjbGFzc05hbWU9XCJidG4tZ3JvdXBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCIgdHlwZT1cImJ1dHRvblwiIGRpc2FibGVkPXtmYXN0QmFja3dhcmREaXNhYmxlZH0gb25DbGljaz17dGhpcy5vbkNsaWNrUGFnZS5iaW5kKHRoaXMsMSl9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tZmFzdC1iYWNrd2FyZFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCIgdHlwZT1cImJ1dHRvblwiIGRpc2FibGVkPXtiYWNrd2FyZERpc2FibGVkfSBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tQYWdlLmJpbmQodGhpcyxwYWdlX2luZGV4LTEpfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJpY29uLWJhY2t3YXJkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3BhZ2VJbmRleEJ0bkJvZGVzfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHRcIiB0eXBlPVwiYnV0dG9uXCIgZGlzYWJsZWQ9e2ZvcndhcmREaXNhYmxlZH0gb25DbGljaz17dGhpcy5vbkNsaWNrUGFnZS5iaW5kKHRoaXMscGFnZV9pbmRleCsxKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiaWNvbi1mb3J3YXJkXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHRcIiB0eXBlPVwiYnV0dG9uXCIgZGlzYWJsZWQ9e2Zhc3RGb3J3YXJkRGlzYWJsZWR9IG9uQ2xpY2s9e3RoaXMub25DbGlja1BhZ2UuYmluZCh0aGlzLG1heF9wYWdlKX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiaWNvbi1mYXN0LWZvcndhcmRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuXHJcbi8v5bqT5a2Y5L+h5oGvXHJcbnZhciBDYXJkSW52ZW50b3J5SW5mb1RhYmxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgZ2V0Q2FyZEludmVudG9yeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogJy9mdWVsX2NhcmQvY2FyZF9pbnZlbnRvcnk/cmVxdV90eXBlPWdldF91c2VyX2ludmVudG9yeSZjYXJkX3R5cGU9U0lOT1BFQycsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BfZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwi5bqT5a2Y5L+h5oGvXCIsIHJlc3BfZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBpZihyZXNwX2RhdGEuc3RhdHVzID09ICdvaycpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByaWNlX2xpc3QgPSBbXTtcclxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIHByaWNlIGluIHJlc3BfZGF0YS5kYXRhLnByaWNlX2ludmVudG9yeSlcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByaWNlX2xpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmljZTogcHJpY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogcmVzcF9kYXRhLmRhdGEucHJpY2VfaW52ZW50b3J5W3ByaWNlXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwcmljZV9saXN0OiBwcmljZV9saXN0LCBlcnJvcl9tc2c6IG51bGx9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtwcmljZV9saXN0OltdLCBlcnJvcl9tc2c6IFwi5bqT5a2Y5L+h5oGv6K+75Y+W5aSx6LSlXCJ9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcHJpY2VfbGlzdDogW10sXHJcbiAgICAgICAgICAgIGVycm9yX21zZzogXCLnrYnlvoXor7vlj5ZcIixcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuZ2V0Q2FyZEludmVudG9yeSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcHJpY2VDb3VudE5vZGVzID0gdGhpcy5zdGF0ZS5wcmljZV9saXN0Lm1hcChmdW5jdGlvbiAocHJpY2VfaW5mbywgaW5kZXgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICg8c3BhbiBrZXk9e1wicHJpY2VDb3VudE5vZGVzX1wiK2luZGV4fSBjbGFzc05hbWU9XCJsYWJlbCBsYWJlbC1wcmltYXJ5IG0tcmlnaHQxMFwiPntwcmljZV9pbmZvLnByaWNlfeWFgyDliankvZk8c3BhbiBjbGFzc05hbWU9XCJiYWRnZVwiPntwcmljZV9pbmZvLmNvdW50fTwvc3Bhbj48L3NwYW4+KTtcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJwYW5lbFwiPlxyXG4gICAgICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJwYW5lbC1oZWFkaW5nIHJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB1bGwtbGVmdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aSBjbGFzc05hbWU9XCJpY29uLWJyaWVmY2FzZVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIOW6k+WtmOS/oeaBr1xyXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImJ0biBidG4taW5mbyBtLXJpZ2h0NVwiIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCIgb25DbGljaz17dGhpcy5nZXRDYXJkSW52ZW50b3J5fT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tcmVmcmVzaFwiIC8+IOWIt+aWsFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNtLW9mZnNldC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJtYXJnaW4tbm9uZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3ByaWNlQ291bnROb2Rlc31cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9oMz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgKVxyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG5SZWFjdC5yZW5kZXIoXHJcbiAgICA8TWFpbkNvbnRlbnQgLz5cclxuICAgICxcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWNvbnRlbnQnKVxyXG4pOyJdfQ==
