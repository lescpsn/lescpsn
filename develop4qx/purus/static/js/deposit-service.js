//汇总模块

var DataPanel = React.createClass({displayName: "DataPanel",

    render: function () {
        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement(DepositPanel, null)
            )
        );
    }
});

//客户申请sheet
var DepositPanel = React.createClass({displayName: "DepositPanel",
    getInitialState: function () {
        return {
            data_list: [],
            page: 1,
            size: 10,
            max: 0,
            status: 'apply',
            id: '',
            opt: '',
            amount: 0
        };
    },

    //弹出确认框
    doCheck: function (opt, id) {
        //check 授权
        var request_data = {'type': 'approve'};
        $.ajax({
            url: '/api/deposit/check_auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({opt: opt, id: id});
                    $("#confirmWindow").modal("show");
                } else {
                    this.setState({opt: opt, id: id});
                    $("#authWindow").modal("show");
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    doRefreshAuth: function () {
        console.info('DO_REFRESH_AUTH');

        var request_data = {'type': 'approve'};
        $.ajax({
            url: '/api/deposit/refresh_auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                console.info('DO_REFRESH_AUTH=' + resp.status);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //初始化check
    doInitCheck: function () {
        //check 授权
        var request_data = {'type': 'approve'};
        $.ajax({
            url: '/api/deposit/check_auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status != 'success') {
                    $("#authWindow").modal("show");
                }

            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //获取数据
    doGetData: function (page, size, status) {
        var request_data = {'page': page, 'size': size, 'status': status};
        $.ajax({
            url: '/api/deposit/apply_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    list_data = resp.data_list;
                    this.setState({data_list: list_data, max: resp.max, status: status});
                } else {
                    //console.debug(JSON.stringify(resp));
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
        this.state.page = page;
        this.doGetData(page, this.state.size, this.state.status);
    },

    doFlushData: function (status) {
        page = 1;
        this.doGetData(page, this.state.size, status);
    },


    componentDidMount: function () {
        this.doInitCheck();
        this.doGetData(this.state.page, this.state.size, this.state.status);
        window.setInterval(this.doRefreshAuth, 1000 * 60 * 5);
    },


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
        var actvNode = null;
        var voidNode = null;
        var dataNode = this.state.data_list.map(function (data, index) {
                if (data.status == '待审核') {
                    actvNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", 
                                   onClick: this.doCheck.bind(this, "pass", data.id)}, "批准"));
                    voidNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-danger  btn-sm btn-activate", 
                                   onClick: this.doCheck.bind(this, "reject", data.id)}, "拒绝"));
                } else {
                    actvNode = data.result;
                }

                return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, data.user_id), 
                        React.createElement("td", null, data.channel), 
                        React.createElement("td", null, data.account), 
                        React.createElement("td", null, 
                            React.createElement("div", {className: "amount"}, data.amount.toFixed(3))
                        ), 
                        React.createElement("td", null, data.time_stamp), 
                        React.createElement("td", null, data.status), 
                        React.createElement("td", null, data.operator_name), 
                        React.createElement("td", null, 
                            React.createElement("div", {className: "amount"}, actvNode, " ", voidNode)
                        )
                    )
                )
            }.bind(this)
        );

        var page_group = this.getPagination(this.state.page, this.state.max);

        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 

                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "加款历史"), 
                            React.createElement("span", {className: "pull-right"}, 
                                React.createElement("a", {href: "javascript:void(0);", className: "btn btn-info mr15", 
                                   onClick: this.doFlushData.bind(this, 'finish')}, 
                                    React.createElement("i", {className: "icon-search"}), React.createElement("span", null, "已处理")
                                )
                            ), 
                            React.createElement("span", {className: "pull-right"}, 
                                React.createElement("a", {href: "javascript:void(0);", className: "btn btn-info mr15", 
                                   onClick: this.doFlushData.bind(this, 'apply')}, 
                                    React.createElement("i", {className: "icon-search"}), React.createElement("span", null, "待处理")
                                )
                            )
                        ), 
                        React.createElement("div", {className: "panel-body table-responsive"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "用户"), 
                                    React.createElement("th", null, "加款方式"), 
                                    React.createElement("th", null, "账号"), 
                                    React.createElement("th", null, "金额"), 
                                    React.createElement("th", null, "时间"), 
                                    React.createElement("th", null, "结果"), 
                                    React.createElement("th", null, "操作人"), 
                                    React.createElement("th", {className: "text-center"}, "操作")
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
                    ), 

                    React.createElement(AuthWindow, {opt: this.state.opt, 
                                id: this.state.id}), 
                    React.createElement(ConfirmWindow, {opt: this.state.opt, 
                                   id: this.state.id, 
                                   doFlushData: this.doFlushData})
                )
            )
        );
    }
});

//授权弹窗
var AuthWindow = React.createClass({displayName: "AuthWindow",

    onAuth: function () {
        $("#authWindow").modal("hide");
        var auth_num = $('#auth_num').val();
        var request_data = {'auth_num': auth_num, 'type': 'approve'};
        $.ajax({
            url: '/api/deposit/auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    $("#authWindow").modal("hide");
                    //$("#confirmWindow").modal("show");
                    alert("授权成功");
                } else {
                    $("#authWindow").modal("show");
                    $(".hint").show();
                    $("#auth_num").foucs($(".form-control").css({"border-color": "#FF0000"}));
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },


    render: function () {
        return (
            React.createElement("div", {className: "modal", id: "authWindow", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "myModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog modal-dialog-min"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-hidden": "true"}, "×"), 
                            React.createElement("h5", {className: "modal-title", id: "priceModalLabel"})
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 

                            React.createElement("div", {className: "form-group add-pro-body dialog_cont"}, 
                                React.createElement("div", {className: "col-xs-4 text-center"}, React.createElement("h5", null, "请输入授权码")), 
                                React.createElement("div", {className: "col-xs-6"}, 
                                    React.createElement("input", {id: "auth_num", type: "text", className: "form-control input-sm"}), 
                                    React.createElement("h4", {className: "hint"}, "请输入正确的授权码")
                                ), 
                                React.createElement("div", {className: "col-xs-1"}, 
                                    React.createElement("h2", {className: "hint icon-warning-sign"})
                                )
                            )
                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onAuth}, "确定"), 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                        )
                    )
                )
            )
        )
    }
});

//确认窗口
var ConfirmWindow = React.createClass({displayName: "ConfirmWindow",
    onConfirm: function () {
        $("#confirmWindow").modal("hide");
        var request_data = {'opt': this.props.opt, id: this.props.id};
        $.ajax({
            url: '/api/deposit/approve',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    alert(resp.msg);
                    this.props.doFlushData('apply');
                } else {
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
        var cNode = null;
        if (this.props.opt == 'pass') {
            cNode = (React.createElement("h4", null, "确认批准此笔加款申请?"));
        } else if (this.props.opt == 'reject') {
            cNode = (React.createElement("h4", null, "确认拒绝此笔加款申请?"));
        } else {
            cNode = (React.createElement("h4", null, "出错啦！！！"));
        }

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
                                    cNode
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


React.render(
    React.createElement(DataPanel, null)
    ,
    document.getElementById('main-content')
);