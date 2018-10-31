//汇总模块

var DataPanel = React.createClass({displayName: "DataPanel",

    render: function () {
        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement(InputPanel, null)
            )
        );
    }
});

//输入信息模块
var InputPanel = React.createClass({displayName: "InputPanel",
    getInitialState: function () {
        return {
            data_list: [],
            amount: '',
        };
    },

    componentDidMount: function () {
        this.doFlushData();
    },

    //获取数据
    doFlushData: function () {
        var request_data = {'page': 1, 'size': 10};
        $.ajax({
            url: '/api/deposit/apply_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({data_list: resp.data_list, max: resp.max});
                } else {
                    alert("加载列表失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    doConfirm: function () {
        var channel = $('#dep_channel').val();
        var account = $('#dep_account').val();
        var amount = $('#dep_amount').val();

        this.setState({amount: amount});
        if (channel != 'alipay' && channel != 'debit_card' && channel != 'account' && channel != 'busi-alipay') {
            alert('加款渠道错误')
            return
        }
        if (!account) {
            alert('账号不能为空')
            return
        }

        if (!amount.match('^[0-9]{1,7}$')) {
            alert('加款金额错误')
            return
        }

        $("#confirmWindow").modal("show");
    },

    render: function () {
        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-search"}), "加款信息")
                        ), 
                        React.createElement("div", {className: "panel-body"}, 
                            React.createElement("form", {className: "form-horizontal", method: "get"}, 

                                React.createElement("div", {className: "form-group form-border"}, 
                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "加款方式"), 

                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("select", {id: "dep_channel", className: "form-control m-bot15 input-sm"}, 
                                            React.createElement("option", {value: "alipay"}, "支付宝"), 
                                            React.createElement("option", {value: "debit_card"}, "银行卡"), 
                                            React.createElement("option", {value: "account"}, "公帐"), 
                                            React.createElement("option", {value: "busi-alipay"}, "企业支付宝")
                                        )
                                    )
                                ), 

                                React.createElement("div", {className: "form-group form-border"}, 

                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "加款账号"), 

                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("input", {id: "dep_account", type: "text", className: "form-control m-bot15 input-sm"})
                                    )
                                ), 

                                React.createElement("div", {className: "form-group form-border"}, 

                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "加款金额"), 

                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("input", {id: "dep_amount", type: "text", className: "form-control m-bot15 input-sm"})
                                    )
                                ), 

                                React.createElement("div", {className: "col-md-offset-5 col-md-5"}, 
                                    React.createElement("a", {href: "javascript:void(0);", className: "btn btn-danger", onClick: this.doConfirm}, 
                                        React.createElement("i", {className: "icon-search"}), "申请")
                                )
                            )
                        )
                    ), 
                    React.createElement(ConfirmWindow, {doFlushData: this.doFlushData, 
                                       amount: this.state.amount}), 
                    React.createElement(DataList, {data_list: this.state.data_list, 
                              max: this.state.max})
                )
            )
        );
    }
});

//弹出的操作确认窗口
var ConfirmWindow = React.createClass({displayName: "ConfirmWindow",
    onConfirm: function () {

        $("#confirmWindow").modal("hide");

        var channel = $('#dep_channel').val();
        var account = $('#dep_account').val();
        var amount = $('#dep_amount').val();


        this.setState({amount: amount});
        request_data = {'channel': channel, 'account': account, 'amount': amount};

        $.ajax({
            url: '/api/deposit/apply',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                //console.debug(JSON.stringify(resp));
                if (resp.status == 'success') {
                    alert("操作成功,请等待审核...")
                    this.props.doFlushData();
                } else {
                    //alert(JSON.stringify(resp));
                    alert("操作失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var amount = this.props.amount;
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
                                React.createElement("div", {className: "col-md-3 text-right"}, React.createElement("h1", {className: "icon-ok-sign"})), 
                                React.createElement("div", {className: "col-md-9"}, 
                                    React.createElement("h4", null, "请确认加款金额为 ", React.createElement("b", {style: {color: "red"}}, amount), " 元")
                                )
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


//加款历史模块
var DataList = React.createClass({displayName: "DataList",
    getInitialState: function () {
        return {
            data_list: [],
            page: 1,
            size: 10,
            max: 0
        };
    },

    //获取数据
    doGetData: function (page, size) {
        var request_data = {'page': page, 'size': size};
        $.ajax({
            url: '/api/deposit/apply_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    if (this.props.data_list != null) {
                        this.props.data_list = null;
                    }
                    this.setState({data_list: resp.data_list, max: resp.max});
                    //this.props.data_list = null;
                } else {
                    alert("加载列表失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    doMoreData: function (page) {
        this.setState({page: page});
        //this.state.page = page;
        this.doGetData(page, this.state.size);
    },

    doFlushData: function () {
        page = 1;
        this.doGetData(page, this.state.size);
    },

    /*componentDidMount: function () {
        this.doGetData(this.state.page, this.state.size);
    },*/


    getPagination: function (p, max) {
        var start = p > 5 ? p - 5 : 1;
        var end = p + 5 > max ? max : p + 5;

        page_list = [];

        if (p > 1) {
            page_list.push({disable: false, index: 1, icon: "icon-fast-backward"});
            page_list.push({disable: false, index: p - 1, icon: "icon-backward"});
        } else {
            page_list.push({disable: true, icon: "icon-fast-backward"});
            page_list.push({disable: true, icon: "icon-backward"});
        }

        for (var i = start; i <= end; i++) {
            page_list.push({disable: false, index: i, title: i});
        }

        if (p < max) {
            page_list.push({disable: false, index: p + 1, icon: "icon-forward"});
            page_list.push({disable: false, index: max, icon: "icon-fast-forward"});
        } else {
            page_list.push({disable: true, icon: "icon-forward"});
            page_list.push({disable: true, icon: "icon-fast-forward"});
        }

        var page_group = page_list.map(function (btn, i) {
            if (btn.disable) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default disabled", type: "button"}, 
                    React.createElement("i", {className: btn.icon})
                ));
            } else if (btn['icon']) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default", type: "button", 
                                onClick: this.doMoreData.bind(this, btn.index)}, 
                    React.createElement("i", {className: btn.icon})
                ));
            } else if (btn.index == p) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-primary", type: "button", 
                                onClick: this.doMoreData.bind(this, btn.index)}, 
                    btn.title
                ));
            } else {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default", type: "button", 
                                onClick: this.doMoreData.bind(this, btn.index)}, 
                    btn.title
                ));
            }
        }.bind(this));

        return page_group;
    },

    render: function () {
        var datas = null;
        if (this.props.data_list != null) {
            datas = this.props.data_list;
            this.state.data_list = this.props.data_list;
        } else {
            datas = this.state.data_list;
        }
        var dataNode = datas.map(function (data, index) {
                return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, data.channel), 
                        React.createElement("td", null, data.account), 
                        React.createElement("td", null, React.createElement("div", {className: "amount"}, data.amount.toFixed(3))), 
                        React.createElement("td", null, data.time_stamp), 
                        React.createElement("td", null, data.status)
                    )
                )
            }.bind(this)
        );

        var page_group = this.getPagination(this.state.page, this.props.max);

        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "加款历史"), 
                            React.createElement("span", {className: "pull-right"}, 
                                React.createElement("a", {href: "javascript:void(0);", className: "btn btn-info mr15", 
                                   onClick: this.doFlushData}, 
                                    React.createElement("i", {className: "icon-time"}), React.createElement("span", null, "刷新")
                                )
                            )
                        ), 
                        React.createElement("div", {className: "panel-body table-responsive"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "加款方式"), 
                                    React.createElement("th", null, "账号"), 
                                    React.createElement("th", null, "金额"), 
                                    React.createElement("th", null, "时间"), 
                                    React.createElement("th", null, "结果")
                                )
                                ), 
                                React.createElement("tbody", null, 
                                dataNode
                                )
                            )
                        ), 
                        React.createElement("div", {className: "row"}, 
                            React.createElement("div", {className: "col-sm-12"}, 
                                React.createElement("div", {className: "btn-row dataTables_filter"}, 
                                    React.createElement("div", {id: "page_group", className: "btn-group"}, 
                                        page_group
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

React.render(
    React.createElement(DataPanel, null)
    ,
    document.getElementById('main-content')
);