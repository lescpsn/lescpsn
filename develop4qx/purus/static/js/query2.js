var OrderQueryPanel = React.createClass({displayName: "OrderQueryPanel",
    mail_pattern: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

    getInitialState: function () {
        return {
            order_list: [],
            filter: {},
            count: 0,
            pag: 1,
            size: 50,
            max: 0,
            product: undefined,
            user_list: []
        };
    },

    componentDidMount: function () {
        if (window.location.pathname == '/query/data') {
            this.setState({product: 'data'})
        } else if (window.location.pathname == '/query/fee') {
            this.setState({product: 'fee'})
        } else if (window.location.pathname == '/query/sinopec') {
            this.setState({product: 'sinopec'})
        }

        var sel_range = $('#form_range');
        sel_range.daterangepicker({
                ranges: {
                    '今天': [moment().startOf('days'), moment().startOf('days').add('days', 1)],
                    '昨天': [moment().startOf('days').subtract('days', 1), moment().startOf('days')],
                    '最近7天': [moment().startOf('days').subtract('days', 6), moment().startOf('days').add('days', 1)],
                    '最近30天': [moment().startOf('days').subtract('days', 29), moment().startOf('days').add('days', 1)],
                    '本月': [moment().startOf('month'), moment().startOf('month').add('month', 1)],
                    '上月': [moment().subtract('month', 1).startOf('month'), moment().startOf('month')]
                },
                opens: 'left',
                format: 'YYYY/MM/DD HH:mm:ss',
                separator: ' - ',
                startDate: moment().add('days', -29),
                endDate: moment(),
                minDate: '2014/01/01',
                maxDate: '2025/12/31',
                timePicker: true,
                timePickerIncrement: 10,
                timePicker12Hour: false,
                locale: {
                    applyLabel: '确认',
                    cancelLabel: '取消',
                    fromLabel: '从',
                    toLabel: '至',
                    customRangeLabel: '自定义',
                    daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
                    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                    firstDay: 1
                },
                showWeekNumbers: false
            },
            function (start, end) {
                //alert(typeof(start))
                $('#form_range_start').val(moment(start).format('YYYY/MM/DD HH:mm:ss'));
                $('#form_range_end').val(moment(end).format('YYYY/MM/DD HH:mm:ss'));
            });

        // init
        var startDate = moment().startOf('days');
        var endDate = moment().startOf('days').add('days', 1);
        sel_range.data('daterangepicker').setStartDate(startDate);
        sel_range.data('daterangepicker').setEndDate(endDate);

        $('#form_range_start').val(startDate.format('YYYY/MM/DD HH:mm:ss'));
        $('#form_range_end').val(endDate.format('YYYY/MM/DD HH:mm:ss'));

        this.loadUserList();
    },

    loadUserList: function () {
        $.ajax({
            url: '/api/user/list_local',
            dataType: 'json',
            type: 'get',

            success: function (data) {
                this.setState({'user_list': data});
                $('#form_user_id').selectpicker({});
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onExport: function () {
        if (this.state.max == 0 || $.isEmptyObject(this.state.filter)) {
            alert('请先进行查询');
            return;
        }

        $('#addModal').modal('show');
    },

    exportRequest: function (mail) {
        if (!this.mail_pattern.test(mail)) {
            alert('请检查你输入的邮箱地址(' + mail + ')是否有效？');
            return false;
        }

        var request = {
            'mail': mail,
            'criteria': this.state.filter,
            'type': 'order'
        };

        $.ajax({
            url: '/api/export/' + this.state.product,
            dataType: 'json',
            data: JSON.stringify(request),
            type: 'post',

            success: function (resp) {
                alert(resp.msg);
                if (resp.status == 'ok') {
                    $('#addModal').modal('hide');
                }
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
        return true;
    },

    onQuery: function () {
        var filter = this.state.filter;
        filter['start'] = $('#form_range_start').val();
        filter['end'] = $('#form_range_end').val();
        filter['id'] = $('#form_order_id').val();
        filter['sp_id'] = $('#form_sp_order_id').val();
        filter['account'] = $('#form_account').val();
        filter['carrier'] = $('#form_carrier').val();
        filter['area'] = $('#form_area').val();
        filter['result'] = $('#form_result').val();
        filter['user_id'] = $('#form_user_id').val();

        filter['size'] = this.state.size;

        this.loadOrderList(1, filter);
    },

    loadOrderList: function (page, filter) {
        var _filter = filter || this.state.filter;

        _filter['page'] = page;

        $.ajax({
            url: '/api/query/' + this.state.product,
            dataType: 'json',
            data: JSON.stringify(_filter),
            type: 'post',

            success: function (resp) {
                this.setState({
                	  'count': resp.count,
                    order_list: resp.data,
                    'filter': _filter,
                    'max': resp.max,
                    'page': page
                });
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getPagination: function (p, max) {
        var start = p > 5 ? p - 5 : 1;
        var end = p + 5 > max ? max : p + 5;

        var page_list = [];

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
                                onClick: this.loadOrderList.bind(this, btn.index, undefined)}, 
                    React.createElement("i", {className: btn.icon})
                ));
            } else if (btn.index == p) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-primary", type: "button", 
                                onClick: this.loadOrderList.bind(this, btn.index, undefined)}, 
                    btn.title
                ));
            } else {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default", type: "button", 
                                onClick: this.loadOrderList.bind(this, btn.index, undefined)}, 
                    btn.title
                ));
            }
        }.bind(this));

        return page_group;
    },

    render: function () {
        var orderNode = this.state.order_list.map(function (order, index) {
            return (
                React.createElement("tr", {key: order.id}, 
                    React.createElement("td", null, order.id), 
                    React.createElement("td", null, order.sp_id), 
                    React.createElement("td", null, order.account), 
                    React.createElement("td", null, order.name), 
                    React.createElement("td", null, order.carrier), 
                    React.createElement("td", null, order.create), 
                    React.createElement("td", null, order.result), 
                    React.createElement("td", null, order.update), 
                    React.createElement("td", {className: "text-right"}, order.price), 
                    React.createElement("td", {className: "text-right"}, order.value), 
                    React.createElement("td", {className: "text-right"}, order.balance)
                ));
        });

        var paginationNode = this.getPagination(this.state.page, this.state.max);

        var adminNode = null;
        if (this.state.user_list.length > 0) {

            var userNode = this.state.user_list.map(function (u, i) {
                return (React.createElement("option", {value: u.id, "data-subtext": u.tags}, u.id, " - ", u.name));
            });

            adminNode = (
                React.createElement("div", {className: "form-group has-error"}, 
                    React.createElement("label", {className: "control-label col-md-1"}, React.createElement("i", {
                        className: "icon_lock"}), " 用户"), 

                    React.createElement("div", {className: "col-md-5"}, 
                        React.createElement("select", {className: "form-control", id: "form_user_id", "data-live-search": "true"}, 
                            userNode, 
                            React.createElement("option", {value: "", "data-subtext": ""}, "000000 - 全部"
                            )
                        )
                    )
                )
            )
        }

        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-lg-12"}, 
                        React.createElement("section", {className: "panel"}, 
                            React.createElement("header", {className: "panel-heading row"}, 
                                React.createElement("span", {className: "pull-left"}, React.createElement("i", {
                                    className: "icon-search"}), "查询")
                            ), 

                            React.createElement("div", {className: "panel-body"}, 
                                React.createElement("form", {className: "form-horizontal", method: "get"}, 
                                    React.createElement("div", {className: "form-group"}, 
                                        React.createElement("label", {className: "col-md-1 control-label"}, "订单号"), 

                                        React.createElement("div", {className: "col-md-2"}, 
                                            React.createElement("input", {id: "form_order_id", type: "text", className: "form-control input-sm"})
                                        ), 

                                        React.createElement("label", {className: "col-md-1 control-label"}, "代理商订单"), 

                                        React.createElement("div", {className: "col-md-2"}, 
                                            React.createElement("input", {id: "form_sp_order_id", type: "text", className: "form-control input-sm"})
                                        ), 

                                        React.createElement("label", {className: "col-md-1 control-label"}, "手机号"), 

                                        React.createElement("div", {className: "col-md-2"}, 
                                            React.createElement("input", {id: "form_account", type: "text", 
                                                   className: "form-control input-sm", 
                                                   maxLength: "11"})
                                        ), 

                                        React.createElement("label", {className: "col-md-1 control-label"}, "状态"), 

                                        React.createElement("div", {className: "col-md-2"}, 
                                            React.createElement("select", {id: "form_result", 
                                                    className: "form-control m-bot15 input-sm"}, 
                                                React.createElement("option", {value: ""}, "全部"), 
                                                React.createElement("option", {value: "success"}, "成功"), 
                                                React.createElement("option", {value: "fail"}, "失败"), 
                                                React.createElement("option", {value: "processing"}, "充值中")
                                            )
                                        ), 

                                        React.createElement("label", {className: "col-md-1 control-label"}, "时间范围"), 

                                        React.createElement("div", {className: "col-md-5"}, 
                                            React.createElement("input", {id: "form_range", type: "text", 
                                                   className: "form-control input-sm"}), 
                                            React.createElement("input", {id: "form_range_start", type: "hidden"}), 
                                            React.createElement("input", {id: "form_range_end", type: "hidden"})
                                        ), 

                                        React.createElement("label", {className: "col-md-1 control-label"}, "运营商"), 

                                        React.createElement("div", {className: "col-md-2"}, 
                                            React.createElement("select", {id: "form_carrier", 
                                                    className: "form-control m-bot15 input-sm"}, 
                                                React.createElement("option", {value: ""}, "全部"), 
                                                React.createElement("option", {value: "3"}, "电信"), 
                                                React.createElement("option", {value: "2"}, "联通"), 
                                                React.createElement("option", {value: "1"}, "移动")
                                            )
                                        ), 

                                        React.createElement("label", {className: "col-md-1 control-label"}, "省份"), 

                                        React.createElement("div", {className: "col-md-2"}, 

                                            React.createElement("select", {id: "form_area", 
                                                    className: "form-control m-bot15 input-sm"}, 

                                                React.createElement("option", {value: ""}, "全国"), 
                                                React.createElement("option", {value: "BJ"}, "北京"), 
                                                React.createElement("option", {value: "TJ"}, "天津"), 
                                                React.createElement("option", {value: "HE"}, "河北"), 
                                                React.createElement("option", {value: "SX"}, "山西"), 
                                                React.createElement("option", {value: "NM"}, "内蒙古"), 
                                                React.createElement("option", {value: "LN"}, "辽宁"), 
                                                React.createElement("option", {value: "JL"}, "吉林"), 
                                                React.createElement("option", {value: "HL"}, "黑龙江"), 
                                                React.createElement("option", {value: "SH"}, "上海"), 
                                                React.createElement("option", {value: "JS"}, "江苏"), 
                                                React.createElement("option", {value: "ZJ"}, "浙江"), 
                                                React.createElement("option", {value: "AH"}, "安徽"), 
                                                React.createElement("option", {value: "FJ"}, "福建"), 
                                                React.createElement("option", {value: "JX"}, "江西"), 
                                                React.createElement("option", {value: "SD"}, "山东"), 
                                                React.createElement("option", {value: "HA"}, "河南"), 
                                                React.createElement("option", {value: "HB"}, "湖北"), 
                                                React.createElement("option", {value: "HN"}, "湖南"), 
                                                React.createElement("option", {value: "GD"}, "广东"), 
                                                React.createElement("option", {value: "GX"}, "广西"), 
                                                React.createElement("option", {value: "HI"}, "海南"), 
                                                React.createElement("option", {value: "CQ"}, "重庆"), 
                                                React.createElement("option", {value: "SC"}, "四川"), 
                                                React.createElement("option", {value: "GZ"}, "贵州"), 
                                                React.createElement("option", {value: "YN"}, "云南"), 
                                                React.createElement("option", {value: "XZ"}, "西藏"), 
                                                React.createElement("option", {value: "SN"}, "陕西"), 
                                                React.createElement("option", {value: "GS"}, "甘肃"), 
                                                React.createElement("option", {value: "QH"}, "青海"), 
                                                React.createElement("option", {value: "NX"}, "宁夏"), 
                                                React.createElement("option", {value: "XJ"}, "新疆"), 
                                                React.createElement("option", {value: "TW"}, "台湾"), 
                                                React.createElement("option", {value: "HK"}, "香港")
                                            )
                                        ), 

                                        React.createElement("div", {className: "col-md-offset-1 col-md-5"}, 
                                            React.createElement("a", {href: "javascript:void(0);", className: "btn btn-danger", 
                                               onClick: this.onQuery}, 
                                                React.createElement("i", {className: "icon-search"}), " 查询"), 

                                            React.createElement("a", {href: "javascript:void(0);", className: "btn btn-info", 
                                               onClick: this.onExport}, 
                                                React.createElement("i", {className: "icon-download-alt"}), " 导出结果")
                                        )
                                    ), 

                                    adminNode
                                )
                            )
                        )
                    )
                ), 

                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-lg-12"}, 
                        React.createElement("section", {className: "panel"}, 
                            React.createElement("header", {className: "panel-heading row"}, 
                                React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "列表")
                            ), 
                            React.createElement("div", {className: "panel-body table-responsive"}, 
                                React.createElement("table", {id: "order_result", 
                                       className: "table table-striped table-hover"}, 
                                    React.createElement("thead", null, 
                                    React.createElement("tr", null, 
                                        React.createElement("th", null, "订单编号"), 
                                        React.createElement("th", null, "代理商订单编号"), 
                                        React.createElement("th", null, "手机号"), 
                                        React.createElement("th", null, "产品名称"), 
                                        React.createElement("th", null, "运营商"), 
                                        React.createElement("th", null, "开始时间"), 
                                        React.createElement("th", null, "订单状态"), 
                                        React.createElement("th", null, "状态时间"), 
                                        React.createElement("th", {className: "text-right"}, "面值"), 
                                        React.createElement("th", {className: "text-right"}, "采购金额"), 
                                        React.createElement("th", {className: "text-right"}, "余额")
                                    )
                                    ), 
                                    React.createElement("tbody", null, 
                                    orderNode
                                    )
                                )
                            ), 
                            React.createElement("div", {className: "row"}, 
                                React.createElement("div", {className: "col-sm-12"}, 
                                    React.createElement("div", {className: "btn-row dataTables_filter"}, 
                                        "总数", this.state.count, 
                                        React.createElement("div", {id: "page_group", className: "btn-group"}, 
                                            paginationNode
                                        )
                                    )
                                )
                            )
                        )
                    )
                ), 

                React.createElement(AddMaintainBox, {exportRequest: this.exportRequest})

            )
        );
    }
});


var AddMaintainBox = React.createClass({displayName: "AddMaintainBox",

    onExport: function () {
        var mail = $('#form-mail').val();
        //alert(request);
        this.props.exportRequest(mail);
    },

    onDismiss: function () {
        $('#addModal').modal('hide');
    },

    render: function () {

        return (
            React.createElement("div", {className: "modal fade", id: "addModal", tabIndex: "-1", role: "dialog", "aria-labelledby": "addModalLabel", 
                 "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title", id: "addModalLabel"}, "导出")
                        ), 

                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 

                                React.createElement("label", {className: "col-md-2 control-label"}, "邮件地址"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {id: "form-mail", className: "form-control", type: "text", 
                                           placeholder: "导出文件将发送到您指定的邮件"})
                                )

                            )
                        ), 

                        React.createElement("div", {className: "modal-footer"}, 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onExport}, "导出"), 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                        )
                    )
                )
            )
        )
    }
});

React.render(React.createElement(OrderQueryPanel, null), document.getElementById('main-content'));
