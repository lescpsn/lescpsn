function getQueryStringByName(name) {
    var result = location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
    if (result == null || result.length < 1) {
        return "";
    }
    return result[1];
}
var do_query = getQueryStringByName('do_query') == '1';
var task_id = getQueryStringByName('task_id');
var start_time = getQueryStringByName('start_time');
var order_type = getQueryStringByName('order_type');

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return view;
};

var MainContent = React.createClass({
    onQuery: function (filters, requ_type) {
        var filter_map = this.state.filter_map;
        filter_map.page_index = 1;

        for (var i in filters) {
            filter_map[i] = filters[i];
        }
        //alert(JSON.stringify(filter_map));
        this.setState({ filter_map: filter_map });

        var requ_data = {
            requ_type: requ_type,
            argu_list: filter_map
        }

        var argu_list = "";
        for (var i in filter_map) {
            argu_list += _.str.sprintf('&%s=%s',
                               encodeURIComponent(i),
                               encodeURIComponent(filter_map[i])
                              )
        }

        $.ajax({
            url: _.str.sprintf('/api/sinopec_order_query?product=sinopec&requ_type=%s%s',
                                encodeURIComponent(requ_type),
                                argu_list
                                ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    if (requ_type == "fuel_card_query")
                    {
                        this.setState({
                            order_list: resp_data.data.order_list,
                            page_info: resp_data.data.page_info
                        });
                    }
                    else if(requ_type == "fuel_card_export")
                    {
                        var path = resp_data.data.path;
                        if (path)
                        {
                            window.location.assign(path);
                        }
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
                page_size: 20,
            },
            order_list: [],
            page_info: null,
        };
    },

    componentDidMount: function () {
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        return (
            <div className="wrapper">
                <QueryPanel onQuery={this.onQuery} />
                <div className="panel">
                    <OrderList 
                               order_list={this.state.order_list} 
                               onQuery={this.onQuery} 
                               page_info={this.state.page_info} />
                </div>
            </div>
        );
    }
});

var QueryPanel = React.createClass({
    onClickQuery: function (requ_type) {
        var date_range = this.refs.DateRange.getDateRange();

        var user_id = $('#form_user_id').val();
        if (typeof (user_id) == "undefined") {
            user_id = '';
        }

        var filters = {
            order_id: $('#form_order_id').val(),
            account: $('#form_account').val(),
            card_id: $('#form_card_id').val(),
            price: $('#form_price').val(),
            result: $('#form_result').val(),
            task_id: $('#form_task_id').val(),
            user_id: user_id,

            start: date_range.start,
            end: date_range.end,
        };

        this.props.onQuery(filters, requ_type);
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
        $('#form_task_id').val(task_id);
        $('#form_result').val(order_type);
        if (do_query) {
            this.onClickQuery("fuel_card_query");
        }
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        //近7天卡单
        var last_7_date = moment().startOf('days').add('days', -6).format('YYYY-MM-DD');
        var last_7_block_url = _.str.sprintf('/fuel_card/order_list?start_time=%s&order_type=%s&do_query=%s',
            encodeURIComponent(last_7_date),
            encodeURIComponent("-1"),
            encodeURIComponent("1")
            );

        return (
            <div className="panel">
                <header className="panel-heading row">
                    <span className="pull-left"><i className="icon-search"></i>订单查询</span>
                </header>

                <div className="panel-body">
                    <form className="form-horizontal">
                        <div className="form-group">
                            <label className="col-sm-4 col-md-1 control-label">订单编号</label>
                            <div className="col-sm-8 col-md-2">
                                <input id="form_order_id" type="text" className="form-control input-sm" />
                            </div>

                            <label className="col-sm-4 col-md-1 control-label">加油卡号</label>
                            <div className="col-sm-8 col-md-2">
                                <input id="form_account" type="text" className="form-control input-sm" />
                            </div>

                            <label className="col-sm-4 col-md-1 control-label">充值卡号</label>
                            <div className="col-sm-8 col-md-2">
                                <input id="form_card_id" type="text" className="form-control input-sm" />
                            </div>

                            <label className="col-sm-4 col-md-1 control-label">面值</label>
                            <div className="col-sm-8 col-md-2">
                                <select id="form_price" className="form-control m-bot15 input-sm">
                                    <option value="">全部</option>
                                    <option value="30">30</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                    <option value="500">500</option>
                                    <option value="1000">1000</option>
                                </select>
                            </div>

                            <label className="col-sm-4 col-md-1 control-label">时间范围</label>
                            <div className="col-sm-8 col-md-5">
                                <DateRange ref="DateRange" />
                            </div>

                            <label className="col-sm-4 col-md-1 control-label">任务编号</label>
                            <div className="col-sm-8 col-md-2">
                                <input id="form_task_id" type="text" className="form-control input-sm" />
                            </div>

                            <label className="col-sm-4 col-md-1 control-label">状态</label>
                            <div className="col-sm-8 col-md-2">
                                <select id="form_result" className="form-control m-bot15 input-sm">
                                    <option value="">全部</option>
                                    <option value="-1">卡单</option>
                                    <option value="1">成功</option>
                                    <option value="9">失败</option>
                                    <option value="0">充值中</option>
                                </select>
                            </div>

                            <div className="col-md-offset-1 col-md-5">
                                <a id="act_query" href="javascript:void(0);" className="btn btn-danger m-right5" onClick={this.onClickQuery.bind(this,"fuel_card_query")}>
                                    <i className="icon-search"></i> 查询
                                </a>
                                <a id="act_query" href={last_7_block_url} className="btn btn-info  m-right5">
                                    <i className="icon-wrench"></i> 近7天卡单
                                </a>
                                <a id="act_query" href="javascript:void(0);" className="btn btn-primary" onClick={this.onClickQuery.bind(this,"fuel_card_export")}>
                                    <i className="icon-download-alt"></i> 导出结果
                                </a>
                            </div>
                        </div>
                        <UserList />
                    </form>
                </div>
            </div>
        );
    }
});

var UserList = React.createClass({
    getUserList: function () {
        $.ajax({
            url: '/api/user/list_local',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({ user_list: data });

                $('#form_user_id').selectpicker({});
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            user_list: [],
        };
    },

    componentDidMount: function () {
        this.getUserList();
    },

    componentDidUpdate: function(prevProps, prevState){
    },
    
    render: function () {
        if (!this.state.user_list || !this.state.user_list.length)
        {
            return null;
        }

        var userListNodes = this.state.user_list.map(function (user_info, index) {
            return (<option value={user_info.id} data-subtext={user_info.tags} >{user_info.id} - {user_info.name}</option>);
        }.bind(this));

        return (
            <div className="form-group has-error">
                <label className="control-label col-md-1"><i className="icon_lock"></i> 用户</label>
                <div className="col-md-5">
                    <select className="form-control" id="form_user_id" data-live-search="true">
                        <option value="" data-subtext="">     - 全部</option>
                        {userListNodes}
                    </select>
                </div>
            </div>
        );
    }
});


var DateRange = React.createClass({
    getDateRange: function () {
        return {
            start: $('#DateRangeStart').val(),
            end: $('#DateRangeEnd').val(),
        };
    },

    compile: function (start_time) {
        $('#DateRange').daterangepicker({
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
            $('#DateRangeStart').val(moment(start).format('YYYY/MM/DD HH:mm:ss'));
            $('#DateRangeEnd').val(moment(end).format('YYYY/MM/DD HH:mm:ss'));
        });

        //设置初始数据
        var startDate = moment().startOf('days');
        if (start_time)
        {
            startDate = moment(start_time, "YYYY-MM-DD");
        }
        var endDate = moment().startOf('days').add('days', 1);

        $('#DateRange').data('daterangepicker').setStartDate(startDate);
        $('#DateRange').data('daterangepicker').setEndDate(endDate);
        $('#DateRangeStart').val(startDate.format('YYYY/MM/DD HH:mm:ss'));
        $('#DateRangeEnd').val(endDate.format('YYYY/MM/DD HH:mm:ss'));
    },

    getInitialState: function () {
        return {
        };
    },

    componentDidMount: function () {
        this.compile(start_time);
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        return (
          <div>
            <input id="DateRange" type="text" className="form-control input-sm" />
            <input id="DateRangeStart" type="hidden" />
            <input id="DateRangeEnd" type="hidden" />
          </div>
        );
    }
});

var OrderList = React.createClass({
    ManualOrder: function (order_info) {
        this.refs.ManualOrderDlg.showDlg(order_info);
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        //目前只有卡单的订单才会有手工处理流程
        var orderListNodes = this.props.order_list.map(function (order_info, index) {
            console.info(order_info);
            
            var operBtnNode = null;
            if (order_info.status == "卡单(需手工处理)")
            {
                operBtnNode = (
                        <a href="javascript:void(0);" 
                           className="btn btn-primary btn-xs btn-danger" 
                           onClick={this.ManualOrder.bind(this,order_info)}>
                            手工处理
                        </a>
                );
            }

            return (
                <tr>
                    <td>{order_info.order_id}</td>
                    <td>{order_info.account}</td>
                    <td>{order_info.create}</td>
                    <td>{order_info.update}</td>
                    <td>{order_info.status}</td>
                    <td>{order_info.card_id}</td>
                    <td>{order_info.price}</td>
                    <td>{order_info.account_price}</td>
                    <td>{order_info.bot_account}</td>
                    <td>{operBtnNode}</td>
                </tr>
            );
        }.bind(this));

        return (
            <div>
                <header className="panel-heading row">
                    <span className="pull-left"><i className="icon-search"></i>订单列表</span>
                </header>
                <div className="panel-body table-responsive">
                    <table id="order_result" className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>订单编号</th>
                                <th>账号</th>
                                <th>开始时间</th>
                                <th>状态时间</th>
                                <th>订单状态</th>
                                <th>充值卡号码</th>
                                <th>面值</th>
                                <th>到账金额</th>
                                <th>外挂账号</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderListNodes}
                        </tbody>
                    </table>
                    <PageIndexGroup onQuery={this.props.onQuery} page_info={this.props.page_info} />
                </div>
                <ManualOrderDlg ref="ManualOrderDlg" />
            </div>
        );
    }

});

var PageIndexGroup = React.createClass({
    onClickPage: function (page_index) {
        this.props.onQuery({ page_index: page_index }, 'fuel_card_query');
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
                    <button className="btn btn-default" disabled={disabled} type="button" onClick={this.onClickPage.bind(this,i)}>
                        {i}
                    </button>
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
            <div className="row">
                <div className="col-sm-12">
                    <div className="btn-row dataTables_filter">
                        <div id="page_group" className="btn-group">
                            <button className="btn btn-default" type="button" disabled={fastBackwardDisabled} onClick={this.onClickPage.bind(this,1)}>
                                <i className="icon-fast-backward" />
                            </button>
                            <button className="btn btn-default" type="button" disabled={backwardDisabled} onClick={this.onClickPage.bind(this,page_index-1)}>
                                <i className="icon-backward" />
                            </button>
                            {pageIndexBtnBodes}
                            <button className="btn btn-default" type="button" disabled={forwardDisabled} onClick={this.onClickPage.bind(this,page_index+1)}>
                                <i className="icon-forward" />
                            </button>
                            <button className="btn btn-default" type="button" disabled={fastForwardDisabled} onClick={this.onClickPage.bind(this,max_page)}>
                                <i className="icon-fast-forward" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});


//订单手工处理弹窗
var ManualOrderDlg = React.createClass({
    //发送单笔订单的手工处理
    sendManualOrder: function (requ_type, argu_list) {
        var requ_data = {
            requ_type: requ_type,
            argu_list: argu_list
        }

        $.ajax({
            url: '/fuel_card/modem_forrestal/api/order/finish2',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    alert("手动处理成功");
                } else {
                    alert("手动处理订单出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("手动处理订单异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),

            complete: function (XMLHttpRequest, textStatus) {
                this.hideDlg();
            }.bind(this),
        });
    },

    //取消按钮
    onClickCancle: function () {
        this.hideDlg();
    },

    //订单成功
    onClickSuccess: function () {
        var account_price = parseInt($("#form_account_price").val());
        if (!account_price || account_price <= 0)
        {
            alert("请选择正确的金额");
            return;
        }

        if (!confirm(_.str.sprintf('把订单 %s 设为成功，订单金额 %s 元?',
            this.state.order_info.order_id, account_price)
            ))
        {
            return;
        }

        this.sendManualOrder('order_success', {
            order_id: this.state.order_info.order_id,
            account_price: account_price,
        });
    },

    //订单失败，卡有效
    onClickFailCardValid: function () {
        if (!confirm(_.str.sprintf('把订单 %s 设为失败， 充值卡 %s 有效?',
            this.state.order_info.order_id, this.state.order_info.card_id)
            ))
        {
            return;
        }

        this.sendManualOrder('order_fail_card_valid', {
            order_id: this.state.order_info.order_id,
        });
    },

    //订单失败,卡失效
    onClickFailCardInvalid: function () {
        if (!confirm(_.str.sprintf('把订单 %s 设为失败， 充值卡 %s 异常?',
            this.state.order_info.order_id,this.state.order_info.card_id)
            ))
        {
            return;
        }

        this.sendManualOrder('order_fail_card_invalid', {
            order_id: this.state.order_info.order_id,
        });
    },

    showDlg: function (order_info) {
        order_info.err_info = order_info.err_data;
        this.setState({ order_info: order_info });
        $('#ManualOrderDlg').modal('show');
    },

    hideDlg: function () {
        this.clearInput();
        $('#ManualOrderDlg').modal('hide');
    },

    clearInput: function () {
        this.setState({order_info: {}});
    },

    getInitialState: function () {
        return { order_info: {} };
    },

    render: function () {
        return (
            <div className="modal" id="ManualOrderDlg" tabIndex="-1" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title"> 卡单<b>{this.state.order_info.order_id}</b>手工处理</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="row"><strong>订单号:</strong> {this.state.order_info.order_id}</div>
                            <div className="row"><strong>充值卡号:</strong> {this.state.order_info.card_id}</div>
                            <div className="row"><strong>面值:</strong> {this.state.order_info.price}</div>
                            <div className="row"><strong>卡单原因:</strong> {this.state.order_info.err_info}</div>
                            <div className="row price_color">注意:卡单处理的结果在本页面会有所延迟</div>
                            <div className="form-group add-pro-body">
                                <ul className="nav nav-tabs m-bot15">
                                    <li className="active"><a href="#manual_success" data-toggle="tab">置成功</a></li>
                                    <li><a href="#manual_fail" data-toggle="tab">置失败</a></li>
                                </ul>
                                <div id="myTabContent" className="tab-content m-bot15">
                                    <div className="tab-pane active" id="manual_success">
                                        <div className="row">
                                            <label className="col-sm-4 col-md-2 control-label">金额</label>
                                            <div className="col-sm-8 col-md-9">
                                                <select id="form_account_price" className="form-control m-bot15 input-sm">
                                                    <option value="">(无)</option>
                                                    <option value="30">30</option>
                                                    <option value="50">50</option>
                                                    <option value="100">100</option>
                                                    <option value="200">200</option>
                                                    <option value="500">500</option>
                                                    <option value="1000">1000</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="modal-footer form-horifooter">
                                            <button id="change_price_btn" type="button"
                                                    className="btn btn-danger"
                                                    onClick={this.onClickSuccess}>
                                                确定
                                            </button>
                                            <button type="button"
                                                    className="btn btn-default"
                                                    data-dismiss="modal"
                                                    onClick={this.onClickCancle}
                                                    >
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                    <div className="tab-pane" id="manual_fail">
                                        <div className="form-horifooter">
                                            <div className="col-md-offset-3 col-md-8">
                                                <button type="button" className="btn btn-success m-right10 m-bot20" onClick={this.onClickFailCardValid}>
                                                    置失败,卡有效
                                                </button>
                                                <button type="button" className="btn btn-danger m-bot20" onClick={this.onClickFailCardInvalid}>
                                                    置失败,卡异常
                                                </button>
                                            </div>
                                        </div>
                                        <div className="modal-footer form-horifooter">
                                            <button type="button"
                                                    className="btn btn-default"
                                                    data-dismiss="modal"
                                                    onClick={this.onClickCancle}
                                                    >
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

React.render(
    <MainContent />
    ,
    document.getElementById('main-content')
);
