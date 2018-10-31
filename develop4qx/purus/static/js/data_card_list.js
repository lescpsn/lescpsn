//汇总模块
var DataPanel = React.createClass({displayName: "DataPanel",
    loadShipmentList: function(){
        request_data = {
            'request_type':'query_card_shipment_list',
        };
        $.ajax({
            url: '/api/data_card/manage/data_card_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),

            success: function (resp) {
                if (resp.status == 'success')
                {
                    this.setState({
                        data_list:  this.state.data_list,
                        page:  this.state.page,
                        max: this.state.max,
                        filter: this.state.filter,
                        shipment_list:  resp.data
                    });

                    $('#form_serial_num').multiselect({maxHeight: 180,buttonContainer: '<div class="btn-group form_serial_num" />'});

                    //这里读取链接上的参数
                    var re_user = new RegExp("serial_num=(.+)");
                    var result = re_user.exec(location.search);
                    if (result)
                    {
                        $('#form_serial_num').multiselect('select', result[1]);
                    }
                }else{
                    alert("查询失败,"+resp.msg);
                }
                $("#loadingWindow").modal("hide");
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            shipment_list: [],
            data_list: [],
            filter: {},
            page: 1,
            max: 0,
            size: 20
        };
    },

    componentDidMount: function () {
        this.loadDataList({}, 1);
    },

    loadDataList: function (filter, page) {
        if (!filter) {
            filter = this.state.filter;
        }
        filter['page'] = page || this.state.page;
        filter['size'] = this.state.size;

        request_data = {
            'request_type':'query',
            'argument_list':filter
        }

        //console.debug(JSON.stringify(filter));

        $.ajax({
            url: '/api/data_card/manage/data_card_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),

            success: function (resp) {
                if (resp.status == 'success')
                {
                    this.setState({
                        data_list: resp.data.data_list,
                        page: resp.data.page,
                        max: resp.data.max,
                        filter: filter,
                        shipment_list: this.state.shipment_list,
                        size: this.state.size
                    });
                }else{
                    alert("查询失败,"+resp.msg);
                }

                $("#loadingWindow").modal("hide");
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function () {
        this.loadShipmentList();
    },

    render: function () {
        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement(QueryPanel, {loadDataList: this.loadDataList, shipment_list: this.state.shipment_list}), 
                React.createElement(DataList, {data_list: this.state.data_list, 
                          loadDataList: this.loadDataList, 
                           page: this.state.page, 
                           max: this.state.max})
            )

        );
    }
});


//查询模块
var QueryPanel = React.createClass({displayName: "QueryPanel",

    doFilter: function () {
        var filter = {
            'serial_num': $('#form_serial_num').val(),
            'card_id': $('#form_card_id').val(),
            'password': $('#form_password').val(),
            'mobile': $('#form_mobile').val(),
            'status': $('#form_status').val()
        };
        $("#loadingWindow").modal("show");
        this.props.loadDataList(filter);
    },

    render: function () {
        var shipmentNodes = this.props.shipment_list.map(function (shipment, index) {
             return (React.createElement("option", {value: shipment.serial_num}, shipment.serial_num));
        });

        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-search"}), "卡密查询")
                        ), 
                        React.createElement("div", {className: "panel-body"}, 
                            React.createElement("form", {className: "form-horizontal", method: "get"}, 
                                React.createElement("div", {className: "form-group"}, 
                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "批次号"), 
                                    React.createElement("div", {className: "col-sm-3 col-md-2 example"}, 
                                        React.createElement("select", {id: "form_serial_num"}, 
                                            shipmentNodes
                                        )
                                    ), 

                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "卡号"), 
                                    React.createElement("div", {className: "col-sm-3 col-md-2"}, 
                                        React.createElement("input", {id: "form_card_id", type: "text", className: "form-control input-sm", maxLength: "45"})
                                    ), 

                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "手机号"), 
                                    React.createElement("div", {className: "col-sm-3 col-md-2"}, 
                                        React.createElement("input", {id: "form_mobile", type: "text", className: "form-control input-sm", maxLength: "15"})
                                    )
                                ), 
                                React.createElement("div", {className: "col-md-offset-1 col-md-5"}, 
                                    React.createElement("a", {href: "javascript:void(0);", className: "btn btn-danger", onClick: this.doFilter}, 
                                        React.createElement("i", {className: "icon-search"}), "搜索")
                                )
                            )
                        )
                    )
                )
            )
        );
    }

});

//数据列表模块
var DataList = React.createClass({displayName: "DataList",

    onDataNodeOperation: function (serial_num, card_id, request_type) {
        this.setState({
             request_type: request_type,
             serial_num: serial_num,
             card_id: card_id,
             recharge_record_list: this.state.recharge_record_list
        });
        $('#confirmWindow').modal('show');
    },

    onLoadPage: function (page) {
        this.props.loadDataList(undefined,page);
    },

    onShowCardRechargeRecord: function(serial_num, card_id){
        recharge_record_list = [];

        request_data = {
            "request_type": "query_recharge_record",
            "serial_num": serial_num,
            "card_id": card_id,
        }

        console.debug(JSON.stringify(request_data));

        $.ajax({
            url: '/api/data_card/manage/data_card',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),

            success: function (resp) {

                if(resp.status == "success")
                {
                    this.setState({
                        request_type: this.state.request_type,
                        serial_num: serial_num,
                        card_id: card_id,
                        recharge_record_list: resp.data
                    });
                    $('#recordWindow').modal('show');
                }
                else
                {
                    alert('查询失败,'+resp.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert('['+ status + ']' + err.toString())
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
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
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    React.createElement("i", {className: btn.icon})
                ));
            } else if (btn.index == p) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-primary", type: "button", 
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    btn.title
                ));
            } else {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default", type: "button", 
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    btn.title
                ));
            }
        }.bind(this));

        return page_group;
    },

    getInitialState: function () {
        return {
             request_type: '',
             serial_num: '',
             card_id: '',
             recharge_record_list: []
        };
    },

    render: function () {
            var cardNode = this.props.data_list.map(function (card, index) {
                var actvNode = null;
                var voidNode = null;

                //  edit mode
                if (card.is_destroy =='') {
                    actvNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-danger btn-sm btn-activate", onClick: this.onDataNodeOperation.bind(this,card.serial_num, card.card_id,'destroy')}, "作废"));
                } else{
                    actvNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-success btn-sm btn-activate", onClick: this.onDataNodeOperation.bind(this,card.serial_num, card.card_id,'recover')}, "恢复"));
                }

                if (card.is_used =='已使用') {
                    voidNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", onClick: this.onShowCardRechargeRecord.bind(this,card.serial_num, card.card_id)}, "查看"));
                } else {
                    voidNode=(React.createElement("span", {className: "btn btn-activate"}, "/"));
                }
                return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, card.serial_num), 
                        React.createElement("td", null, card.card_id), 
                        React.createElement("td", null, card.data_packet_name), 
                        React.createElement("td", null, card.carrier_list), 
                        React.createElement("td", null, card.open_time), 
                        React.createElement("td", null, card.end_time), 
                        React.createElement("td", null, card.recharge_max_time), 
                        React.createElement("td", null, card.is_used), 
                        React.createElement("td", {className: "text-center"}, actvNode), 
                        React.createElement("td", {className: "text-center"}, voidNode)
                    )
                )
            }.bind(this)
        );

        var page_group = this.getPagination(this.props.page, this.props.max);

        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "卡密列表")
                        ), 
                        React.createElement("div", {className: "panel-body table-responsive"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "批次号"), 
                                    React.createElement("th", null, "卡号"), 
                                    React.createElement("th", null, "流量包名称"), 
                                    React.createElement("th", null, "运营商"), 
                                    React.createElement("th", null, "开卡日期"), 
                                    React.createElement("th", null, "截止日期"), 
                                    React.createElement("th", null, "充值方案"), 
                                    React.createElement("th", null, "状态"), 
                                    React.createElement("th", {className: "text-center"}, "操作"), 
                                    React.createElement("th", {className: "text-center"}, "充值记录")
                                )
                                ), 
                                React.createElement("tbody", null, 
                                cardNode
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
                    React.createElement(ConfirmWindow, {
                        request_type: this.state.request_type, 
                        card_id: this.state.card_id, 
                        serial_num: this.state.serial_num, 
                        loadDataList: this.props.loadDataList}), 
                    React.createElement(RecordWindow, {
                        card_id: this.state.card_id, 
                        serial_num: this.state.serial_num, 
                        recharge_record_list: this.state.recharge_record_list}), 
                    React.createElement(LoadingWindow, null)
                )
            )
        );
    }
});

//弹出的操作确认窗口
//作废确认窗口
var ConfirmWindow = React.createClass({displayName: "ConfirmWindow",

    onConfirm: function () {
        card_id = this.props.card_id;
        serial_num = this.props.serial_num;
        request_type = this.props.request_type;
        var data = JSON.stringify({'serial_num':serial_num, 'card_id': card_id,'request_type':request_type});
        $.ajax({
            url: '/api/data_card/manage/data_card',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    if(request_type == 'destroy')
                    {
                        alert("操作成功");
                    }
                    this.props.loadDataList();
                    $("#confirmWindow").modal("hide");
                }
                else
                {
                    alert('操作失败 - ' + resp.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },


    render: function () {
        msg = null;
        if(this.props.request_type == 'destroy')
        {
            msg = "确认作废此卡？？？"
        }
        else if(this.props.request_type == 'recover')
        {
            msg = "真的要恢复这张卡吗？？？？？"
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
                                React.createElement("div", {className: "col-md-4 text-right"}, React.createElement("h1", {className: "icon-ok-sign"})), 
                                React.createElement("div", {className: "col-md-8"}, React.createElement("h4", null, msg), React.createElement("h5", null, "卡号：", this.props.card_id))
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


//弹出的充值记录窗口
var RecordWindow = React.createClass({displayName: "RecordWindow",
    render: function () {
        var rechargeRecordNodes = this.props.recharge_record_list.map(function (record, index) {
             return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, record.mobile), 
                        React.createElement("td", null, record.child_packet_name), 
                        React.createElement("td", null, record.order_id), 
                        React.createElement("td", null, record.status), 
                        React.createElement("td", null, record.req_time)
                    )
                )
        });
        return (
            React.createElement("div", {className: "modal", id: "recordWindow", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "myModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog modal-dialog-max"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "充值记录 ", React.createElement("b", null, "(批次号：", this.props.serial_num, "， 卡号：", this.props.card_id, ")")), 
                            React.createElement("button", {type: "button", className: "close", "data-dismiss": "modal", "aria-hidden": "true"}, "×")
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "手机"), 
                                    React.createElement("th", null, "流量子包"), 
                                    React.createElement("th", null, "订单号"), 
                                    React.createElement("th", null, "充值状态"), 
                                    React.createElement("th", null, "充值时间")
                                )
                                ), 
                                React.createElement("tbody", null, 
                                    rechargeRecordNodes
                                )
                            )
                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "关闭")
                        )
                    )
                )
            )
        )
    }
});


//等待窗口
var LoadingWindow = React.createClass({displayName: "LoadingWindow",
    render: function (){
        return(
            React.createElement("div", {className: "modal", id: "loadingWindow", backdrop: "false"}, 
                 React.createElement("h1", {className: "icon-spinner icon-spin loading-icon"})
            )
        )
    }
});

React.render(
    React.createElement(DataPanel, null)
    ,
    document.getElementById('main-content')
);