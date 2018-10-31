var CardPanel = React.createClass({displayName: "CardPanel",

    getInitialState: function () {
        return {
            card_list: [],
            page: 1,
            max: 0,
            size: 20
        };
    },

    componentDidMount: function () {
        this.loadCardList('测试用户');
    },


    loadCardList: function (user_id) {
        var data = JSON.stringify({
            'user_id': user_id,
            'request_type': 'query',
            'argument_list': {'serial_num':'测试用户000007'}
        });
        $.ajax({
            url: '/admin/quxun_data_card/manage/data_card_list',
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
                React.createElement(QueryPanel, {onLoad: this.loadCardList}), 
                React.createElement(CardList, {card_list: this.state.card_list, 
                            onSetStatus: this.onSetStatus, 
                             page: this.state.page, 
                             max: this.state.max, 
                             loadCardList: this.loadCardList}
                    )
            )
        );
    }
});

var QueryPanel = React.createClass({displayName: "QueryPanel",

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
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-search"}), "卡密查询")
                        ), 
                        React.createElement("div", {className: "panel-body"}, 
                            React.createElement("form", {className: "form-horizontal", method: "get"}, 
                                React.createElement("div", {className: "form-group form-border"}, 
                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "批次号"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("input", {id: "form_id", type: "text", className: "form-control input-sm", 
                                               maxLength: "11"})
                                    ), 

                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "卡号"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("input", {id: "form_id", type: "text", className: "form-control input-sm", 
                                               maxLength: "11"})
                                    ), 

                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "密码"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("input", {id: "form_id", type: "text", className: "form-control input-sm", 
                                               maxLength: "11"})
                                    ), 

                                    React.createElement("label", {className: "col-sm-2 col-md-1 control-label"}, "手机号"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("input", {id: "form_id", type: "text", className: "form-control input-sm", 
                                               maxLength: "11"})
                                    )
                                ), 
                                React.createElement("div", {className: "form-group"}, 
                                    React.createElement("label", {className: "col-sm-4 col-md-1 control-label"}, "状态"), 
                                    React.createElement("div", {className: "col-sm-8 col-md-2"}, 
                                        React.createElement("select", {className: "form-control m-bot15 input-sm", id: "open_end_date"}, 
                                            React.createElement("option", {value: "1"}, "未使用"), 
                                            React.createElement("option", {value: "2"}, "使用中")
                                        )
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
    // onEditLevel: function () {
    //     $('#openModal').modal('show');
    // }, 
    // onChangeLevel: function () {

    //     $('#ChangeModal').modal('show');
    // },     

    setStatus: function (serial_num,card_id,request_type) {
        this.setState({
            serial_num:serial_num,
             card_id: card_id,
             request_type: request_type

        });
        $('#openWindow').modal('show');
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
             card_id: '',
             serial_num:''
        };
    },

    render: function () {
        var cardNode = this.props.card_list.map(function (card, index) {
                var actvNode = null;
                var voidNode = null;

                //  edit mode
                if (card.is_destroy =='') {
                    actvNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate", onClick: this.setStatus.bind(this,card.serial_num, card.card_id,'destroy')}, "作废"));
                } else{
                    actvNode=(React.createElement("span", {className: "btn btn-sm color_99 btn-destroy"}, "已作废"));
                } 

                if (card.is_used =='已使用') {
                    voidNode = (React.createElement("a", {href: "javascript:void(0);", className: "btn btn-primary btn-sm btn-activate"}, "查看"));
                } else {
                    voidNode=(React.createElement("span", {className: "btn btn-activate"}, "/"));
                } 
                return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, card.serial_num), 
                        React.createElement("td", null, card.card_id), 
                        React.createElement("td", null, card.data_packet_name), 
                        React.createElement("td", null, card.carrier_list), 
                        React.createElement("td", null, card.validity_month, " 个月"), 
                        React.createElement("td", null, card.recharge_max_time, " 次"), 
                        React.createElement("td", null, card.recharge_frequency), 
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
                                    React.createElement("th", null, "有效期"), 
                                    React.createElement("th", null, "充值次数"), 
                                    React.createElement("th", null, "充值频率"), 
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
                    React.createElement(OpenSettingBox, {
                        user_id: this.user_id, 
                        loadCardList: this.props.loadCardList}), 
                    React.createElement(OpenWindowBox, {
                        request_type: this.state.request_type, 
                        card_id: this.state.card_id, 
                        serial_num: this.state.serial_num, 
                        loadCardList: this.props.loadCardList})
                )
            )
        );
    }
});



var OpenSettingBox = React.createClass({displayName: "OpenSettingBox",

    onUpdate: function () {     

        var  open_count = $('#open_count').val();
        packet_name = $('#packet_name').val();
        carrier_name_list = '';
        month = $('#month').val();
        recharge_frequency = $('#recharge_frequency').val();
        recharge_max_time = $('#recharge_max_time').val();

        //alert(carrier_name_list);

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
                    alert("开卡成功 ！"); 
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
             //return (<option value={index}>{packet.name}</option>);
        });

        return (
            React.createElement("div", {className: "modal", id: "openModal", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "priceModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title", id: "priceModalLabel"})
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 
                                React.createElement("input", {type: "hidden", id: "to_product"}), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "开卡数量"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_count"})
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


//作废确认窗口
var OpenWindowBox = React.createClass({displayName: "OpenWindowBox",

    onConfirm: function () {
        card_id = this.props.card_id;
        serial_num = this.props.serial_num;
        request_type = this.props.request_type;
        var data = JSON.stringify({'user_id':'测试用户', 'serial_num':serial_num, 'card_id': card_id,'request_type':request_type});
        $.ajax({
            url: '/admin/quxun_data_card/manage/data_card',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    if(request_type == 'activate')
                    {
                        alert("作废成功");
                    }
                    this.props.loadCardList('测试用户');
                }
                else
                {
                    alert('作废失败 - ' + resp.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
        $("#openWindow").modal("hide");
    },


    render: function () {
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
                                    React.createElement("h1", {className: "icon-ok-sign"}), React.createElement("h4", null, "确定作废此卡？"), React.createElement("p", null, "卡号：", this.props.card_id)
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
