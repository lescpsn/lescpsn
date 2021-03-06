// tutorial1.js
var OrderList = React.createClass({displayName: "OrderList",
    reloadOrderList: function () {
        $.ajax({
            url: '/admin/quxun_card/api/order/unknown',
            dataType: 'json',
            success: function (data) {
                this.setState({
                    order_list: data.order_list,
                    order_count: data.order_list.length,
                    count_904_area: data.count_904_area,
                });

                this.onQuery(1);
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

    onQuery: function(page_index){
        var page_index = parseInt(page_index);
        var page_size = 20;
        if(page_index <= 0)
        {
            page_index = 1;
        }

        var max_page = Math.ceil( this.state.order_list.length/page_size );
        var page_index = page_index > max_page ? max_page : page_index;

        var start_index = (page_index-1)*page_size;
        var show_order_list = this.state.order_list.slice(start_index, start_index+page_size);

        this.setState({page_info:{page_index: page_index, max_page: max_page},
            show_order_list: show_order_list,
        });
    },

    getInitialState: function () {
        return {
            order_list: [],
            order_count: 0,
            count_904_area: [],
            show_order_list: [],
            page_info: {},
        };
    },

    componentDidMount: function () {
        this.reloadOrderList();
    },

    render: function () {
        var doFinishOrder = this.doFinishOrder;
        var reload = this.reloadOrderList;

        var orderNodes = this.state.show_order_list.map(function (order) {
            var t = new Date(order.tsp * 1000);
            var time = t.toLocaleString();

            return (
                React.createElement(OrderBox, {order: order, time: time, doReload: reload, 
                          doFinishOrder: doFinishOrder}, order.call)
            );
        });

        var areaNodes = this.state.count_904_area.map(function (data_area) {
            return (
                React.createElement("td", null, data_area.area)
            );
        });
        var countNodes = this.state.count_904_area.map(function (data_count) {
            return (
                React.createElement("td", null, data_count.count)
            );
        });
        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement("div", {className: "panel", id: "quxun_card"}, 
                    React.createElement(NaviBar, {order_count: this.state.order_count}), 
                    React.createElement(CardInventoryInfoTable, null), 
                    React.createElement("div", {className: "panel"}, 
                        React.createElement("table", {className: "table table-bordered"}, 
                            React.createElement("thead", null, 
                            React.createElement("tr", {className: "active"}, 
                                areaNodes
                            )
                            ), 
                            React.createElement("tbody", null, 
                            React.createElement("tr", null, 
                                countNodes
                            )
                            )
                        )
                    )
                ), 
                React.createElement(PageIndexGroup, {onQuery: this.onQuery, page_info: this.state.page_info}), 
                orderNodes, 
                React.createElement(ConfirmWindow, {
                    order_id: this.state.order_id, 
                    result: this.state.result, 
                    if_release: this.state.if_release, 
                    operation: this.state.operation, 
                    doReload: reload})
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
            url: '/admin/quxun_card/api/states',
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
                //console.info(this.props.url, status, err.toString());
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
                React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), React.createElement("span", null, "趣讯中移动卡充平台维护 ", React.createElement("strong", {
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
            url: '/admin/quxun_card/api/card/inventory',
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

    doRetryOrder: function () {
        var msg = "确认对订单 " + this.props.order.order_id + " 进行再来一次操作吗?";
        if (!window.confirm(msg)) {
            return;
        }
        $.ajax({
            url: '/admin/quxun_card/api/order/retry',
            type: 'POST',
            data: JSON.stringify({'order_id': this.props.order.order_id}),
            dataType: 'json',

            success: function (data) {
                //alert("Success");
                //this.props.doReload();
                window.location.reload();
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getResultDesc: function (result) {
        return {
                '1': {'face': 'label-success label', name: '手工成功(1)'},
                '9': {'face': 'label-info label', name: '手工失败(9)'},

                '101': {'face': 'label-success label', name: '成功充值(101)'},
                '102': {'face': 'label-success label', name: '成功充值(102)'},

                '900': {'face': 'label-info label', name: '其他未知状态(900)'},
                '901': {'face': 'label-info label', name: '充值卡密码有误(901)'},
                '902': {'face': 'label-info label', name: '充值卡已失效(902)'},
                '903': {'face': 'label-info label', name: '输入有误(903)'},
                '904': {'face': 'label-info label', name: '目前暂不能充值(904)'},
                '905': {'face': 'label-info label', name: '输入超时(905)'},
                '906': {'face': 'label-info label', name: '操作失败(906)'},
                '907': {'face': 'label-info label', name: '手机号码有误(907)'},
                '908': {'face': 'label-info label', name: '您不能为该用户充值(908)'},
                '909': {'face': 'label-info label', name: '其他服务请按1(909)'},
                '910': {'face': 'label-info label', name: '充值失败(910)'},

                '991': {'face': 'label-warning label', name: '通话一接通就挂断(991)'},
                '992': {'face': 'label-warning label', name: '通话时间过长(992)'},
                '993': {'face': 'label-warning label', name: '输完卡密之前挂断(993)'},
                '994': {'face': 'label-warning label', name: '输完卡密之后挂断(994)'},
                '995': {'face': 'label-warning label', name: '充值超时(995)'}

            }[result] || {'face': 'label-success label', name: '未知'}
    },

    render: function () {
        var callNodes = this.props.children.map(function (call, i) {
            var t = new Date(call.tsp * 1000);
            var m = '' + (t.getMonth() + 1);
            if (m.length == 1) m = "0" + m;
            var y = '' + t.getFullYear();
            var d = '' + t.getDate();
            if (d.length == 1) d = "0" + d;

            var path = y + m + '/' + d;

            var wav = 'http://112.25.220.13:9004/data/' + path + '/' + call.agent + '/' + this.props.order.order_id + '_' + (i + 1) + '_ALL.wav';
            var mp3 = 'http://112.25.220.13:9004/data/' + path + '/' + call.agent + '/' + this.props.order.order_id + '_' + (i + 1) + '_ALL.mp3';
            var msg = this.getResultDesc(call.result);

            return (
                React.createElement("tr", null, 
                    React.createElement("td", null, i + 1), 
                    React.createElement("td", null, 
                        React.createElement("span", {className: msg.face}, msg.name)
                    ), 
                    React.createElement("td", null, call.agent), 
                    React.createElement("td", null, 
                        React.createElement("audio", {controls: true}, 
                            React.createElement("source", {src: wav, type: "audio/wav"}), 
                            React.createElement("source", {src: mp3, type: "audio/mp3"})
                        )
                    )
                )
            );
        }.bind(this));

        return (
            React.createElement("div", {className: "panel", id: "quxun_card"}, 
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
                            React.createElement("td", null, "充值区域"), 
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
                            React.createElement("td", null, this.props.order.mobile), 
                            React.createElement("td", null, this.props.order.area), 
                            React.createElement("td", null, this.props.time), 
                            React.createElement("td", null, this.props.order.price), 
                            React.createElement("td", null, this.props.order.card_package), 
                            React.createElement("td", null, this.props.order.card_file_name), 
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
                                React.createElement("td", null, "序号"), 
                                React.createElement("td", null, "结果"), 
                                React.createElement("td", null, "分机"), 
                                React.createElement("td", null, "语音")
                            )
                            ), 
                            React.createElement("tbody", null, 
                            callNodes
                            )
                        )
                    ), 
                    React.createElement("div", {className: "col-sm-4"}, 
                        React.createElement("a", {href: "javascript:;", className: "btn btn-success mr15 mb15", 
                           onClick: this.doFinishOrder.bind(this,this.props.order.order_id, '1', 'used', '置成功')}, React.createElement("span", null, " 置成功")), 
                        React.createElement("a", {href: "javascript:;", className: "btn btn-danger mr15 mb15", 
                           onClick: this.doFinishOrder.bind(this,this.props.order.order_id, '9', 'error', '置失败，卡失效')}, React.createElement("span", null, " 置失败，卡失效")), 
                        React.createElement("a", {href: "javascript:;", className: "btn btn-danger mr15 mb15", 
                           onClick: this.doFinishOrder.bind(this,this.props.order.order_id, '9', 'release', '置失败，卡释放')}, React.createElement("span", null, " 置失败，卡释放")), 
                        React.createElement("a", {href: "javascript:;", className: "btn btn-primary mr15 mb15", 
                           onClick: this.doRetryOrder.bind(this)}, React.createElement("span", null, " 再来一次"))
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
            url: '/admin/quxun_card/api/order/finish',
            dataType: 'json',
            type: 'POST',
            data: data,
            success: function (resp) {
                if (resp.status == 'ok') {
                    alert("操作成功");
                    $("#confirmWindow").modal("hide");
                    //this.props.doReload();
                    window.location.reload();
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


var PageIndexGroup = React.createClass({displayName: "PageIndexGroup",
    onClickPage: function (page_index) {
        this.props.onQuery(page_index);
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

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
            return (
                    React.createElement("button", {className: "btn btn-default", disabled: disabled, type: "button", onClick: this.onClickPage.bind(this,i)}, 
                        i
                    )
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

        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-sm-12"}, 
                    React.createElement("div", {className: "btn-row dataTables_filter"}, 
                        React.createElement("div", {id: "page_group", className: "btn-group"}, 
                            React.createElement("button", {className: "btn btn-default", type: "button", disabled: fastBackwardDisabled, onClick: this.onClickPage.bind(this,1)}, 
                                React.createElement("i", {className: "icon-fast-backward"})
                            ), 
                            React.createElement("button", {className: "btn btn-default", type: "button", disabled: backwardDisabled, onClick: this.onClickPage.bind(this,page_index-1)}, 
                                React.createElement("i", {className: "icon-backward"})
                            ), 
                            pageIndexBtnBodes, 
                            React.createElement("button", {className: "btn btn-default", type: "button", disabled: forwardDisabled, onClick: this.onClickPage.bind(this,page_index+1)}, 
                                React.createElement("i", {className: "icon-forward"})
                            ), 
                            React.createElement("button", {className: "btn btn-default", type: "button", disabled: fastForwardDisabled, onClick: this.onClickPage.bind(this,max_page)}, 
                                React.createElement("i", {className: "icon-fast-forward"})
                            )
                        )
                    )
                )
            )
        );
    }
});

React.render(
    React.createElement(OrderList, null)
    ,
    document.getElementById('main-content')
);
