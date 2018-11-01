//汇总模块

var DataPanel = React.createClass({displayName: "DataPanel",

    render: function () {
        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement(DepositList, null)
            )
        );
    }
});

//限额列表
var DepositList = React.createClass({displayName: "DepositList",

    getInitialState: function () {
        return {
            dep_list: [],
            dep_detail: [],
            operator_id: '',
            max: 0,
        };
    },

    //check是否已授权
    doCheck: function (operator_id) {
        var request_data = {'type': 'quota'};
        $.ajax({
            url: '/api/deposit/check_auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({operator_id: operator_id});
                    $("#addWindow").modal("show");
                } else {
                    $("#authWindow").modal("show");
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //初始化check
    doInitCheck: function () {
        //check 授权
        var request_data = {'type': 'quota'};
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

    //获取列表数据
    doDepositData: function () {
        $.ajax({
            url: '/api/deposit/list',
            dataType: 'json',
            type: 'post',
            data: '',
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({dep_list: resp.dep_list});
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


    //点击单个客服 刷新下方列表
    doEachCS: function (operator_id) {
        var operator_id = operator_id;
        var page = 1;
        var size = 10;
        var request_data = {'operator_id': operator_id, 'page': page, 'size': size};
        $.ajax({
            url: '/api/deposit/list_detail',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({dep_detail: resp.dep_detail, max: resp.max, operator_id: operator_id});
                } else {
                    alert("加载详情失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //初始化列表
    componentDidMount: function () {
        this.doDepositData();
        this.doInitCheck();
    },

    render: function () {
        var dataNode = this.state.dep_list.map(function (data, index) {
                var addNode = null;
                addNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", 
                              onClick: this.doCheck.bind(this, data.operator_id)}, "加加加"));
                return (
                    React.createElement("tr", null, 
                        React.createElement("td", {onClick: this.doEachCS.bind(this, data.operator_id)}, data.operator_name), 
                        React.createElement("td", {className: "amount", 
                            onClick: this.doEachCS.bind(this, data.operator_id)}, data.value.toFixed(3)), 
                        React.createElement("td", {onClick: this.doEachCS.bind(this, data.operator_id)}, data.create_time), 
                        React.createElement("td", {className: "text-center"}, addNode)
                    )
                )
            }.bind(this)
        );

        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-search"}), "限额列表"), 
                            React.createElement("span", {className: "pull-right"}, 
                            React.createElement("a", {href: "javascript:void(0);", className: "btn btn-info mr15", 
                               onClick: this.doDepositData}, 
                                React.createElement("i", {className: "icon-time"}), React.createElement("span", null, "刷新")
                            )
                            )
                        ), 
                        React.createElement("div", {className: "panel-body"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "客服列表"), 
                                    React.createElement("th", {className: "text-center"}, "限额"), 
                                    React.createElement("th", null, "时间"), 
                                    React.createElement("th", {className: "text-center"}, "操作")
                                )
                                ), 
                                React.createElement("tbody", null, 
                                dataNode
                                )
                            )
                        )
                    ), 
                    React.createElement(AuthWindow, null), 
                    React.createElement(AddWindow, {operator_id: this.state.operator_id, 
                               doDepositData: this.doDepositData, 
                               doEachCS: this.doEachCS}), 
                    React.createElement(HisList, {dep_detail: this.state.dep_detail, 
                             operator_id: this.state.operator_id, 
                             max: this.state.max})
                )
            )
        );
    }
});


//单个客服加款历史模块
var HisList = React.createClass({displayName: "HisList",
    getInitialState: function () {
        return {
            page: 1,
            size: 10,
            dep_detail: null
        };
    },

    //获取数据
    doGetData: function (page, size) {
        var request_data = {'page': page, 'size': size, 'operator_id': this.props.operator_id};
        $.ajax({
            url: '/api/deposit/list_detail',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({dep_detail: resp.dep_detail, page: page});
                } else {
                    //this.setState({data_list: resp.data_list, max: resp.max});
                    alert("加载列表失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        return
    },

    doMoreData: function (page) {
        this.doGetData(page, this.state.size);
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
        var datas = null;
        if (this.state.dep_detail != null) {
            datas = this.state.dep_detail;
        } else {
            datas = this.props.dep_detail;
        }

        var dataNode = datas.map(function (data, index) {
                return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, data.deposit_id), 
                        React.createElement("td", null, 
                            React.createElement("div", {className: "amount"}, data.amount.toFixed(3))
                        ), 
                        React.createElement("td", null, data.create_time), 
                        React.createElement("td", null, data.type), 
                        React.createElement("td", null, 
                            React.createElement("div", {className: "amount"}, data.value.toFixed(3))
                        )
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
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "限额明细")
                        ), 
                        React.createElement("div", {className: "panel-body table-responsive"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "加款对象"), 
                                    React.createElement("th", null, "金额"), 
                                    React.createElement("th", null, "时间"), 
                                    React.createElement("th", null, "类型"), 
                                    React.createElement("th", null, "余额")
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

//授权弹窗
var AuthWindow = React.createClass({displayName: "AuthWindow",
    onAuth: function () {
        $("#authWindow").modal("hide");
        var auth_num = $('#auth_num').val();
        var request_data = {'auth_num': auth_num, 'type': 'quota'};
        $.ajax({
            url: '/api/deposit/auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    //this.props.auth_status = 'success';
                    $("#authWindow").modal("hide");
                    alert('授权成功');
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
                                React.createElement("div", {class: "col-xs-1"}, 
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


//增加限额窗口
var AddWindow = React.createClass({displayName: "AddWindow",
    onAddfund: function () {
        $('#addWindow').modal('hide');
        var amount = $('#amount').val();
        var request_data = {'amount': amount, 'operator_id': this.props.operator_id};
        if (!amount.match('^-*[0-9]+')) {
            alert('金额错误')
            return
        }
        ;
        $.ajax({
            url: '/api/deposit/adjust',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                //console.debug(JSON.stringify(resp));
                if (resp.status == 'success') {
                    alert("操作成功");
                    this.props.doDepositData();
                    this.props.doEachCS(this.props.operator_id);
                } else {
                    //alert(JSON.stringify(resp));
                    alert("操作失败:" + resp.msg);
                    return
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            React.createElement("div", {className: "modal", id: "addWindow", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "myModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog modal-dialog-min"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-hidden": "true"}, "×"), 
                            React.createElement("h5", {className: "modal-title", id: "priceModalLabel"})
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body dialog_cont"}, 
                                React.createElement("div", {className: "col-md-4 text-center"}, React.createElement("h5", null, "输入限额")), 
                                React.createElement("div", {className: "col-md-6"}, 
                                    React.createElement("input", {id: "amount", type: "text", className: "form-control input-sm"})
                                )
                            )
                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onAddfund}, "确定"), 
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