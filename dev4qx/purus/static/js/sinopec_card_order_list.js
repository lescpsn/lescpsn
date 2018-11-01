// tutorial1.js
var OrderList = React.createClass({displayName: "OrderList",

    getInitialState: function () {
        return {
            order_list: [],
            order_count: 0,
            card_inventory_info: [],
        };
    },

    reloadOrderList: function () {
        $.ajax({
            url: '/admin/quxun_sinopec_card/api/order/unknown',
            dataType: 'json',
            success: function (data) {
                this.setState({
                    order_list: data.order_list,
                    order_count: data.order_list.length,
                    card_inventory_info: this.state.card_inventory_info,
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        $.ajax({
            url: '/admin/quxun_sinopec_card/api/card/inventory',
            dataType: 'json',
            success: function (data) {
               this.setState({
                    order_list: this.state.order_list,
                    order_count: this.state.order_list.length,
                    card_inventory_info: data.card_inventory_info,
               });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    doFinishOrder: function (order_id, result, if_release, operation) {
        this.setState({
            order_id: order_id,
            result: result,
            if_release: if_release,
            operation: operation
        });
        $('#confirmWindow').modal('show');
    },

    componentDidMount: function () {
        this.reloadOrderList();
    },

    render: function () {
        var doReload = this.reloadOrderList;
        var doFinishOrder = this.doFinishOrder;
        var orderNodes = this.state.order_list.map(function (order) {
            var t = new Date(order.create_tsp * 1000);
            var time = t.toLocaleString();
            return (
                React.createElement(OrderBox, {
                    order: order, 
                    time: time, 
                    doFinishOrder: doFinishOrder}
                )
            );
        });


        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement("div", {className: "panel", id: "quxun_card"}, 
                    React.createElement(NaviBar, {order_count: this.state.order_count}), 
                    React.createElement(CardInventoryInfoTable, {card_inventory_info: this.state.card_inventory_info})
                ), 
                orderNodes, 
                React.createElement(ConfirmWindow, {
                    order_id: this.state.order_id, 
                    result: this.state.result, 
                    if_release: this.state.if_release, 
                    operation: this.state.operation, 
                    doReload: doReload}
                )
            )
        );
    }
});

var NaviBar = React.createClass({displayName: "NaviBar",
    getInitialState: function () {
        return {isGetting: true, count: 0};
    },

    componentDidMount: function () {
        this.getStates(false);
    },

    getStates: function (if_switch) {

        $.ajax({
            url: '/admin/quxun_sinopec_card/api/states',
            type: 'POST',
            data: JSON.stringify({'if_switch': if_switch}),
            dataType: 'json',
            success: function (data) {
                this.setState(data);
                //alert(JSON.stringify(data));
            }.bind(this),

            error: function (xhr, status, err) {
                var if_check = !this.state.isGetting;
                this.setState({isGetting: if_check});
                console.info(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var msg = null;

        if (this.state.isGetting == true) {

            msg = React.createElement("b", null, "当前处于正常取单状态");
        } else {
            msg = React.createElement("b", {className: "price_color"}, "当前处于停止取单状态");
        }

        return (
            React.createElement("header", {className: "panel-heading row"}, 
                React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), React.createElement("span", null, "趣讯中石化卡充平台维护 ", React.createElement("strong", {
                    className: "price_color"}, "卡单总数：", this.props.order_count))), 
                React.createElement("span", {className: "pull-right"}, 
                    React.createElement("div", {className: "switch round"}, 
                        React.createElement("input", {type: "checkbox", id: "get-switch", checked: this.state.isGetting, 
                               onChange: this.getStates.bind(this, true)}), 
                        React.createElement("label", {htmlFor: "get-switch"}, 
                            React.createElement("span", {className: "switch-handle-on"}, "打开"), 
                            React.createElement("span", {className: "switch-handle-off"}, "关闭")
                        )
                    )
                ), 
                React.createElement("span", {className: "pull-center"}, msg)
            )
        )
    }
});


var CardInventoryInfoTable = React.createClass({displayName: "CardInventoryInfoTable",
    getCardInventory: function(){
            $.ajax({
            url: '/admin/quxun_sinopec_card/api/card/inventory',
            dataType: 'json',
            success: function (data) {
               this.setState({
                    card_inventory_info: data.card_inventory_info
               });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            card_inventory_info: [],
        };
    },

    componentDidMount: function () {
        this.getCardInventory();
    },

    render: function () {
        if(this.state.card_inventory_info.length <= 0)
        {
            return null;
        }

        var price_list = [];
        var temp = this.state.card_inventory_info[0].info.inventory;
        for(var i in temp)
        {
            price_list.push( Number(i) )
        }

        var tableHeadNodes = price_list.map(function(price, index){
            return (React.createElement("td", null, price));
        });

        var tableBodyNodes = this.state.card_inventory_info.map(function(card_inventory_info,index){
            var infoNodes = price_list.map(function(price, index){
                var inventory = card_inventory_info.info.inventory[price];
                var cache_inventory = card_inventory_info.info.cache_inventory[price];
                if(!cache_inventory)
                {
                    cache_inventory = 0;
                }
                return ( React.createElement("td", null, "(" + inventory + "," + cache_inventory  + ")"));
            });
            return (React.createElement("tr", null, 
                        React.createElement("td", null, card_inventory_info.card_pool), 
                        infoNodes
                    ));
        });
        return (
                React.createElement("div", {className: "panel"}, 
                    React.createElement("table", {className: "table table-bordered"}, 
                        React.createElement("thead", null, 
                            React.createElement("tr", {className: "active"}, 
                                React.createElement("td", null, "卡池名称"), 
                                tableHeadNodes
                            )
                        ), 
                        React.createElement("tbody", null, 
                            tableBodyNodes
                        )
                    )
                )
        )
    }
});


var OrderBox = React.createClass({displayName: "OrderBox",
    doFinishOrder: function (order_id, result, if_release, operation) {
        this.props.doFinishOrder(order_id, result, if_release, operation);
    },


    render: function () {
        return (
            React.createElement("div", {className: "panel"}, 
                React.createElement("header", {className: "panel-heading row"}, 
                    React.createElement("span", {className: "pull-left"}, React.createElement("i", {
                        className: "icon-list-alt"}), React.createElement("span", null, "订单号: ", this.props.order.order_id))
                ), 
                React.createElement("div", {className: "panel"}, 
                    React.createElement("table", {className: "table table-bordered"}, 
                        React.createElement("thead", null, 
                        React.createElement("tr", {className: "active"}, 
                            React.createElement("td", null, "卡号"), 
                            React.createElement("td", null, "充值号码"), 
                            React.createElement("td", null, "充值时间"), 
                            React.createElement("td", null, "面值"), 
                            React.createElement("td", null, "箱号"), 
                            React.createElement("td", null, "文件名"), 
                            React.createElement("td", null, "上卡时间")
                        )
                        ), 
                        React.createElement("tbody", null, 
                        React.createElement("tr", null, 
                            React.createElement("td", null, this.props.order.card_id), 
                            React.createElement("td", null, this.props.order.account_number), 
                            React.createElement("td", null, this.props.time), 
                            React.createElement("td", null, this.props.order.price), 
                            React.createElement("td", null, this.props.order.card_package), 
                            React.createElement("td", null, this.props.order.card_filename), 
                            React.createElement("td", null, this.props.order.card_create_time.substr(0, 19))
                        )
                        )
                    )
                ), 

                React.createElement("div", {className: "row col-sm-12"}, 
                    React.createElement("div", {className: "col-sm-8"}, 
                        React.createElement("table", {className: "table table-advance table-bordered"}, 
                            React.createElement("thead", null, 
                            React.createElement("tr", {className: "active"}, 
                                React.createElement("td", null, "分机"), 
                                React.createElement("td", null, "结果"), 
                                React.createElement("td", null, "数据")
                            )
                            ), 
                            React.createElement("tbody", null, 
                                React.createElement("td", null, this.props.order.agent), 
                                React.createElement("td", null, this.props.order.agent_result), 
                                React.createElement("td", null, this.props.order.agent_data)
                            )
                        )
                    ), 
                    React.createElement("div", {className: "col-sm-4"}, 
                        React.createElement("a", {href: "javascript:;", className: "btn btn-success mr15 mb15", 
                        onClick: this.doFinishOrder.bind(this,this.props.order.order_id, '1', 'used', '订单成功')}, React.createElement("span", null, "订单成功")
                        ), 
                        React.createElement("a", {href: "javascript:;", className: "btn btn-danger mr15 mb15", 
                        onClick: this.doFinishOrder.bind(this,this.props.order.order_id, '9', 'error', '订单失败，卡失效')}, React.createElement("span", null, "订单失败，卡失效")
                        ), 
                        React.createElement("a", {href: "javascript:;", className: "btn btn-danger mr15 mb15", 
                        onClick: this.doFinishOrder.bind(this,this.props.order.order_id, '9', 'release', '订单失败，卡有效')}, React.createElement("span", null, "订单失败，卡有效")
                        )
                    )
                )
            )
        );
    }
});

//弹出的操作确认窗口
var ConfirmWindow = React.createClass({displayName: "ConfirmWindow",
    onConfirm: function () {
        var order_id = this.props.order_id;
        var result = this.props.result;
        var if_release = this.props.if_release;

        var data = JSON.stringify({'order_id': order_id, 'result': result, 'release': if_release});

        $.ajax({
            url: '/admin/quxun_sinopec_card/api/order/finish',
            dataType: 'json',
            type: 'POST',
            data: data,
            success: function (resp) {
                if (resp.status == 'ok') {
                    alert("操作成功");
                    $("#confirmWindow").modal("hide");
                    this.props.doReload();
                    //window.location.reload();
                }
                else {
                    alert('操作失败 - ' + resp.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            React.createElement("div", {className: "modal", id: "confirmWindow", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "myModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog modal-dialog-min"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-hidden": "true"}, "×"), 
                            React.createElement("h5", {className: "modal-title", id: "priceModalLabel"})
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body dialog_cont"}, 
                                React.createElement("div", {className: "col-md-4 text-right"}, React.createElement("h1", {className: "icon-ok-sign"})), 
                                React.createElement("div", {className: "col-md-8"}, React.createElement("h4", null, "确认操作", React.createElement("b", {className: "plr5"}, this.props.operation), "?"), 
                                    React.createElement("h5", null, "订单号：", this.props.order_id))
                            )

                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onConfirm}, "确定"), 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                        )
                    )
                )
            )
        )
    }
});

React.render(
    React.createElement(OrderList, null)
    ,
    document.getElementById('main-content')
);
