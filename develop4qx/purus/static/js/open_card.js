var CardPanel = React.createClass({displayName: "CardPanel",

    getInitialState: function () {
        return {
            card_list: []
        };
    },
    componentDidMount: function () {
        this.loadCardList('测试用户');
    },

    loadCardList: function (user_id) {
        var data = JSON.stringify({
            'user_id': user_id,
            'request_type': 'query',
            'argument_list': null
        });
        $.ajax({
            url: '/admin/quxun_data_card/manage/shipment_list',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    this.setState({card_list: resp.data})   
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement(CardSearch, {onLoad: this.loadCardList}), 
                React.createElement(CardList, {card_list: this.state.card_list, 
                            onSetStatus: this.onSetStatus, 
                            loadCardList: this.loadCardList}
                    )
            )
        );
    }
});

var CardSearch = React.createClass({displayName: "CardSearch",
    doFilter: function () {
        var filter = {
            'id': $('#form_id').val(),
            'type': $('#form_type').val(),
            'flow': $('#form_flow').val(),
            'date': $('#form_date').val()
        };

        this.props.onLoad(filter, 1);
    },
    render: function () {
        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-search"}), "开卡查询")
                        ), 
                        React.createElement("div", {className: "panel-body"}, 
                            React.createElement("form", {className: "form-horizontal", method: "get"}, 
                                React.createElement("div", {className: "form-group form-border"}, 
                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "批次号"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("input", {id: "form_id", type: "text", className: "form-control input-sm", 
                                               maxLength: "11"})
                                    ), 

                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "状态"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("select", {id: "form_type", className: "form-control m-bot15 input-sm"}, 
                                            React.createElement("option", {value: ""}, "全部"), 
                                            React.createElement("option", {value: "data"}, "已提卡"), 
                                            React.createElement("option", {value: "fee"}, "已注销")
                                        )
                                    ), 

                                    React.createElement("label", {className: "col-sm-4 col-md-1 control-label"}, "流量包"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                            React.createElement("label", {id: "form_qr_mobile", className: "checkbox-inline"}, React.createElement("input", {type: "checkbox"}), " 移动"), 
                                            React.createElement("label", {id: "form_qr_unicom", className: "checkbox-inline"}, React.createElement("input", {type: "checkbox"}), " 联通"), 
                                            React.createElement("label", {id: "form_qr_telecom", className: "checkbox-inline"}, React.createElement("input", {type: "checkbox"}), " 电信"), 
                                            React.createElement("select", {id: "form_flow", className: "form-control m-bot15 input-sm"}, 
                                                React.createElement("option", {value: "data"}, "5M"), 
                                                React.createElement("option", {value: "data"}, "10M"), 
                                                React.createElement("option", {value: "data"}, "100M"), 
                                                React.createElement("option", {value: "data"}, "200M")
                                            )
                                    ), 

                                    React.createElement("label", {className: "col-sm-4 col-md-1 control-label"}, "有效期"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("input", {id: "form_date", type: "text", className: "form-control input-sm", 
                                               maxLength: "11"})
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

var CardList = React.createClass({displayName: "CardList",
    onEditLevel: function () {
        $('#openModal').modal('show');
    }, 
    onChangeLevel: function () {
        $('#ChangeModal').modal('show');
    },     
    setStatus: function (serial_num, request_type) {
        this.setState({
             request_type: request_type,
             serial_num: serial_num
        });
        $('#openWindow').modal('show');
    },

    getInitialState: function () {
        return {
             request_type: '',
             serial_num: ''
        };
    },

    render: function () {
        var cardNode = this.props.card_list.map(function (card, index) {
                var actvNode = null;
                var voidNode = null;
                var tokenNode = null;
                //  edit mode
                if (card.status == '已开卡') {
                    actvNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", onClick: this.setStatus.bind(this, card.serial_num,'activate')}, "激活"));
                    voidNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", onClick: this.setStatus.bind(this, card.serial_num,'destroy')}, "作废"));
                    tokenNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", onClick: this.setStatus.bind(this, card.serial_num,'take')}, "提卡"));
                } else if (card.status == '已激活') {
                    actvNode=(React.createElement("span", {className: "btn btn-sm color_99"}, "激活"));
                    voidNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", onClick: this.setStatus.bind(this, card.serial_num,'destroy')}, "作废"));
                    tokenNode =  (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", onClick: this.setStatus.bind(this, card.serial_num,'take')}, "提卡"));
                } else {
                    actvNode=(React.createElement("span", {className: "btn btn-sm color_99"}, "激活"));
                    voidNode=(React.createElement("span", {className: "btn btn-sm color_99"}, "作废"));
                    tokenNode=(React.createElement("span", {className: "btn btn-sm color_99"}, "提卡"));
                }

                return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, React.createElement("input", {type: "checkbox"})), 
                        React.createElement("td", null, card.serial_num), 
                        React.createElement("td", null, card.data_packet_name), 
                        React.createElement("td", null, card.carrier_list), 
                        React.createElement("td", null, card.open_count), 
                        React.createElement("td", null, card.open_time), 
                        React.createElement("td", null, card.validity_month, " 个月"), 
                        React.createElement("td", null, card.recharge_max_time, " 次"), 
                        React.createElement("td", null, card.recharge_frequency), 
                        React.createElement("td", null, card.status), 
                        React.createElement("td", {className: "text-center"}, 
                            actvNode, "  ", voidNode
                        ), 
                        React.createElement("td", {className: "text-center"}, tokenNode), 
                        React.createElement("td", null, card.last_take_time)
                    )
                )
            }.bind(this)
        );

        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "开卡列表"), 
                            React.createElement("span", {className: "pull-right"}, 
                                React.createElement("a", {href: "javascript:;", className: "btn btn-primary mr15", onClick: this.onEditLevel}, React.createElement("i", {className: "icon-credit-card"}), React.createElement("span", null, " 批次开卡")), 
                                React.createElement("a", {href: "javascript:;", className: "btn btn-danger", onClick: this.onChangeLevel}, React.createElement("i", {className: "icon-legal"}), React.createElement("span", null, " 充值页面"))
                            )
                        ), 
                        React.createElement("div", {className: "panel-body table-responsive"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null), 
                                    React.createElement("th", null, "批次号"), 
                                    React.createElement("th", null, "流量包"), 
                                    React.createElement("th", null, "运营商"), 
                                    React.createElement("th", null, "开卡数量"), 
                                    React.createElement("th", null, "开卡日期"), 
                                    React.createElement("th", null, "有效期"), 
                                    React.createElement("th", null, "充值次数"), 
                                    React.createElement("th", null, "充值频率"), 
                                    React.createElement("th", null, "状态"), 
                                    React.createElement("th", {className: "text-center"}, "操作"), 
                                    React.createElement("th", {className: "text-center"}, "卡密提取"), 
                                    React.createElement("th", null, "最近提取时间")
                                )
                                ), 
                                React.createElement("tbody", null, 
                                cardNode
                                )
                            )
                        )
                    ), 
                    React.createElement(OpenSettingBox, {
                        user_id: this.user_id, 
                        loadCardList: this.props.loadCardList}
                    ), 
                    React.createElement(OpenChargeBox, {
                        user_id: this.user_id, 
                        loadCardList: this.props.loadCardList}
                    ), 
                    React.createElement(OpenWindowBox, {
                        request_type: this.state.request_type, 
                        serial_num: this.state.serial_num, 
                        loadCardList: this.props.loadCardList}
                    )
                )
            )
        );
    }
});


//批次开卡
var OpenSettingBox = React.createClass({displayName: "OpenSettingBox",

    onUpdate: function () {     
        var  open_count = $('#open_count').val();
        packet_name = $('#packet_name').val();
        carrier_name_list = '';
        month = $('#month').val();
        recharge_frequency = $('#recharge_frequency').val();
        recharge_max_time = $('#recharge_max_time').val();

        if( $('#form_mobile').is( ":checked" ))
        {
            carrier_name_list += "移动,"
        }
        if( $('#form_unicom').is( ":checked" ))
        {
            carrier_name_list += "联通,"
        }
        if( $('#form_telecom').is( ":checked" ))
        {
            carrier_name_list += "电信,"
        }

        if (open_count.length < 1) {
            alert('请输入开卡数量');
            return;
        }

        if (open_count <= 0 || open_count > 1000) {
            alert('开卡数量必须在1-1000之间');
            return;
        }
        if (carrier_name_list< 1) {
            alert('请选择运营商');
            return;
        }
        var data = JSON.stringify({
            'user_id': '测试用户',
            'request_type': 'open',
            'argument_list': {
                'open_count': open_count,                 //开卡数量, 只能大于0
                'packet_name': packet_name,               //流量包名称, 只能通过后台获取，然后通过下拉框选项获得这个值
                'carrier_list': carrier_name_list,        //运营商列表, 可以选(移动 联通 电信)， 如果选了多个运营商,请用逗号隔开
                'month': month,                           //有效期，取值范围 1-12
                'recharge_frequency': recharge_frequency, //充值频率,可以选(每月 每季度 每半年 不限)
                'recharge_max_time': recharge_max_time,   //充值次数,必须大于0
            }
        });
        $.ajax({
            url: '/admin/quxun_data_card/manage/shipment_list',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if (resp.status == 'success') 
                {
                    $('#openModal').modal('hide');
                    this.props.loadCardList('测试用户');
                }
                else
                {
                    alert("开卡失败 - " + resp.msg); 
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            packets_name_list: [],
        };
    },
    componentDidMount: function () {
        this.get_packets_name_list();
    },

    get_packets_name_list: function () {
        var data = JSON.stringify({
            'user_id': '测试用户',
            'request_type': 'argument_info',
            'argument_list':'packets_name_list'
        });

        $.ajax({
            url: '/admin/quxun_data_card/manage/shipment_list',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    this.setState({packets_name_list: resp.data})   
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var packetsNode = this.state.packets_name_list.map(function (packet_name, index) {
             return (React.createElement("option", {value: packet_name}, packet_name));
        });

        return (
            React.createElement("div", {className: "modal", id: "openModal", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "priceModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h5", {className: "modal-title", id: "priceModalLabel"}, "开卡")
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 
                                React.createElement("input", {type: "hidden", id: "to_product"}), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "开卡数量"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_count", placeholder: "大于0，小于1000"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "流量包"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {className: "form-control m-bot15 input-sm", id: "packet_name"}, 
                                       packetsNode
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "运营商"), 
                                React.createElement("div", {className: "col-md-10 mb15"}, 
                                    React.createElement("label", {className: "checkbox-inline"}, React.createElement("input", {id: "form_mobile", type: "checkbox", value: "移动"}), " 移动"), 
                                    React.createElement("label", {className: "checkbox-inline"}, React.createElement("input", {id: "form_unicom", type: "checkbox", value: "联通"}), " 联通"), 
                                    React.createElement("label", {className: "checkbox-inline"}, React.createElement("input", {id: "form_telecom", type: "checkbox", value: "电信"}), " 电信")
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "有效日期"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {className: "form-control m-bot15 input-sm", id: "month"}, 
                                        React.createElement("option", {value: "1"}, "1月"), 
                                        React.createElement("option", {value: "2"}, "2月"), 
                                        React.createElement("option", {value: "3"}, "3月"), 
                                        React.createElement("option", {value: "4"}, "4月"), 
                                        React.createElement("option", {value: "5"}, "5月"), 
                                        React.createElement("option", {value: "6"}, "6月"), 
                                        React.createElement("option", {value: "7"}, "7月"), 
                                        React.createElement("option", {value: "8"}, "8月"), 
                                        React.createElement("option", {value: "9"}, "9月"), 
                                        React.createElement("option", {value: "10"}, "10月"), 
                                        React.createElement("option", {value: "11"}, "11月"), 
                                        React.createElement("option", {value: "12"}, "12月")
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "充值次数"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {className: "form-control m-bot15 input-sm", id: "recharge_max_time"}, 
                                        React.createElement("option", {value: "1"}, "1次"), 
                                        React.createElement("option", {value: "2"}, "2次"), 
                                        React.createElement("option", {value: "3"}, "3次"), 
                                        React.createElement("option", {value: "4"}, "4次")
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "充值频率"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {className: "form-control m-bot15 input-sm", id: "recharge_frequency"}, 
                                        React.createElement("option", {value: "不限"}, "不限"), 
                                        React.createElement("option", {value: "每月"}, "每月")
                                    )
                                )

                            )
                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onUpdate}, "开卡"), 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                        )
                    )
                )
            )
        )
    }
});

//充值页面
var OpenChargeBox = React.createClass({displayName: "OpenChargeBox",
    pageUpdate: function () {
        var  name = $('#open_name').val();

        open_num = $('#open_num').val();
        open_bag = $('#open_bag').val();
        open_end_date = $('#open_end_date').val();
        open_time = $('#open_time').val();
        form_rate = $('#form_rate').val();

        var data = JSON.stringify({
            'user_id': '测试用户',
            'request_type': 'open',
            'argument_list': {
                'name': name
            }
        });
        $.ajax({
            url: '/admin/quxun_data_card/manage/shipment_list',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (data) {
                if (data.status == 'success') {
                    $('#ChangeModal').modal('hide');
                    this.props.loadCardList('测试用户');
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {

        return (
            React.createElement("div", {className: "modal", id: "ChangeModal", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "priceModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h5", {className: "modal-title", id: "priceModalLabel"}, "充值页面绑定")
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 
                                React.createElement("input", {type: "hidden", id: "to_product"}), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "开卡名称"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_name"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "客户名称"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_num"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "批次号"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_num"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "已有页面"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {className: "form-control m-bot15 input-sm", id: "open_end_date"}, 
                                        React.createElement("option", {value: "1"}, "小米充值页面"), 
                                        React.createElement("option", {value: "2"}, "小米充值页面2"), 
                                        React.createElement("option", {value: "3"}, "小米充值页面3")
                                    )
                                ), 
                                React.createElement("label", {className: "col-md-2"}, " "), 
                                React.createElement("div", {className: "col-md-10"}, "没有想要页面？", React.createElement("a", {href: "#"}, "新建页面"))
                            )

                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.pageUpdate}, "确定"), 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                        )
                    )
                )
            )
        )
    }

});


//激活/作废/提取 确认窗口
var OpenWindowBox = React.createClass({displayName: "OpenWindowBox",

    onConfirm: function () {
        serial_num = this.props.serial_num;
        request_type = this.props.request_type;
        var data = JSON.stringify({'user_id':'测试用户', 'serial_num':serial_num,'request_type':request_type});

        $.ajax({
            url: '/admin/quxun_data_card/manage/shipment',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    if(request_type == 'take')
                    {
                        window.location.assign('http://10.0.0.29:8976/'+ resp.data);
                    }
                    this.props.loadCardList('测试用户');
                }
                else
                {
                    alert('激活失败 - ' + resp.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
        $("#openWindow").modal("hide");
    },


    render: function () {
        var msg = null;
        var msg1 = '确定激活此批次卡?';
        var msg2 = '确定作废此批次卡?';
        var msg3 = '确定提取此批次卡?';

        if( this.props.request_type == "activate")
        {
            msg= msg1;
        }
        else if (this.props.request_type == "destroy")
        {
            msg = msg2;
        }
        else if (this.props.request_type == "take")
        {
            msg = msg3;
        }

        return (
            React.createElement("div", {className: "modal", id: "openWindow", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "myModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title", id: "priceModalLabel"})
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 
                                React.createElement("div", {className: "col-md-12 text-center"}, 
                                    React.createElement("h1", {className: "icon-ok-sign"}), React.createElement("h4", null, msg), React.createElement("p", null, "批次号：", this.props.serial_num)
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
    React.createElement(CardPanel, null)
    ,
    document.getElementById('main-content')
);
