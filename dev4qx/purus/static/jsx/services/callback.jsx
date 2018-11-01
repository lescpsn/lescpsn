var React = require('react');
var ReactDOM = require('react-dom');

var CallbackPanel = React.createClass({

    getInitialState: function () {
        return {
            filter: {},
            user_list: [],
            order_list: [],
            current_callback: null
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

    onQuery: function () {
        var filter = this.state.filter;
        filter['start'] = $('#form_range_start').val();
        filter['end'] = $('#form_range_end').val();
        filter['user_id'] = $('#form_user_id').val();
        filter['id_list'] = $('#form_id_list').val();
        filter['carrier'] = $('#form_carrier').val();
        filter['area'] = $('#form_area').val();

        this.loadOrderList(filter);
    },

    loadOrderList: function (filter) {
        var _filter = filter || this.state.filter;

        $.ajax({
            url: '/api/services/callback/filter',
            dataType: 'json',
            data: JSON.stringify(_filter),
            type: 'post',

            success: function (resp) {
                this.setState({
                    order_list: resp.data,
                    'filter': _filter
                });
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    toggleCallback: function () {
        if (this.state.current_callback) {
            clearTimeout(this.state.current_callback);
            this.setState({'current_callback': null});
        } else {
            /* found last */
            var order_list = this.state.order_list;
            var n = -1;
            for (var i = 0; i < order_list.length; i++) {
                if (!order_list[i].status) {
                    n = i;
                    break;
                }
            }

            if (n >= 0) {
                var t = setTimeout(this.sendCallback.bind(this, n), 1000);
                this.setState({'current_callback': t});
                console.info('TIMEOUT' + t);
            }
        }
    },

    sendCallback: function (index) {
        var order_id = this.state.order_list[index]['id'];
        var req = JSON.stringify({order_id: order_id});

        console.debug(req);

        $.ajax({
            url: '/api/services/callback/send',
            dataType: 'json',
            data: req,
            type: 'post',

            success: function (data) {
                var order_list = this.state.order_list;
                order_list[index]['status'] = 'finish';

                this.setState({'user_list': order_list});

                if (index < order_list.length) {
                    var t = setTimeout(this.sendCallback.bind(this, index + 1), 1000);
                    this.setState({'current_callback': t});
                    console.info('TIMEOUT' + t);
                } else {
                    this.setState({'current_callback': null});
                    console.info('TIMEOUT OVER');
                }

            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

    },

    render: function () {
        var orderNode = this.state.order_list.map(function (order, index) {
            return (
                <tr key={order.id}>
                    <td>{index}</td>
                    <td>{order.user_id}</td>
                    <td>{order.id}</td>
                    <td>{order.sp_order_id}</td>
                    <td>{order.mobile}</td>
                    <td>{order.area}</td>
                    <td className="text-right">{order.price}</td>
                    <td>{order.result}</td>
                    <td>{order.status}</td>
                </tr>);
        });


        var userNode = this.state.user_list.map(function (u, i) {
            return (<option value={u.id} data-subtext={u.tags}>{u.id} - {u.name}</option>);
        });


        return (
            <section className="wrapper">
                <div className="row">
                    <div className="col-lg-4">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i
                                    className="icon-search"></i>过滤订单</span>
                            </header>

                            <div className="panel-body">
                                <form className="form-horizontal" method="get">
                                    <div className="form-group">
                                        <label className="col-md-2 control-label">订单号/手机号/上游订单号</label>

                                        <div className="col-md-10">
                                            <textarea id="form_id_list" className="form-control m-bot15"
                                                      style={{'height': '150px'}}/>
                                        </div>

                                        <label className="col-md-2 control-label">时间范围</label>

                                        <div className="col-md-10">
                                            <input id="form_range" type="text"
                                                   className="form-control input-sm m-bot15"/>
                                            <input id="form_range_start" type="hidden"/>
                                            <input id="form_range_end" type="hidden"/>
                                        </div>

                                        <label className="control-label col-md-2">用户</label>

                                        <div className="col-md-10 m-bot15">
                                            <select className="form-control m-bot15" id="form_user_id"
                                                    data-live-search="true">
                                                {userNode}
                                                <option value="" data-subtext="">000000 - 全部
                                                </option>
                                            </select>
                                        </div>

                                        <label className="col-md-2 control-label">运营商</label>

                                        <div className="col-md-4">
                                            <select id="form_carrier"
                                                    className="form-control m-bot15 input-sm">
                                                <option value="">全部</option>
                                                <option value="3">电信</option>
                                                <option value="2">联通</option>
                                                <option value="1">移动</option>
                                            </select>
                                        </div>

                                        <label className="col-md-2 control-label">省份</label>

                                        <div className="col-md-4">

                                            <select id="form_area"
                                                    className="form-control m-bot15 input-sm">

                                                <option value="">全国</option>
                                                <option value="BJ">北京</option>
                                                <option value="TJ">天津</option>
                                                <option value="HE">河北</option>
                                                <option value="SX">山西</option>
                                                <option value="NM">内蒙古</option>
                                                <option value="LN">辽宁</option>
                                                <option value="JL">吉林</option>
                                                <option value="HL">黑龙江</option>
                                                <option value="SH">上海</option>
                                                <option value="JS">江苏</option>
                                                <option value="ZJ">浙江</option>
                                                <option value="AH">安徽</option>
                                                <option value="FJ">福建</option>
                                                <option value="JX">江西</option>
                                                <option value="SD">山东</option>
                                                <option value="HA">河南</option>
                                                <option value="HB">湖北</option>
                                                <option value="HN">湖南</option>
                                                <option value="GD">广东</option>
                                                <option value="GX">广西</option>
                                                <option value="HI">海南</option>
                                                <option value="CQ">重庆</option>
                                                <option value="SC">四川</option>
                                                <option value="GZ">贵州</option>
                                                <option value="YN">云南</option>
                                                <option value="XZ">西藏</option>
                                                <option value="SN">陕西</option>
                                                <option value="GS">甘肃</option>
                                                <option value="QH">青海</option>
                                                <option value="NX">宁夏</option>
                                                <option value="XJ">新疆</option>
                                                <option value="TW">台湾</option>
                                                <option value="HK">香港</option>
                                            </select>
                                        </div>

                                        <div className="col-md-offset-2 col-md-4">
                                            <a href="javascript:void(0);" className="btn btn-danger"
                                               onClick={this.onQuery}>
                                                <i className="icon-search"></i> 过滤</a>
                                        </div>
                                    </div>

                                </form>
                            </div>
                        </section>
                    </div>

                    <div className="col-lg-8">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-table"></i>订单列表</span>
                                <span className="pull-right">
                                    <a className="btn btn-info" onClick={this.toggleCallback}
                                       href="javascript:void(0);">回调</a></span>
                            </header>
                            <div className="panel-body table-responsive">
                                <table id="order_result"
                                       className="table table-striped table-hover">
                                    <thead>
                                    <tr>
                                        <th>序号</th>
                                        <th>用户</th>
                                        <th>订单编号</th>
                                        <th>代理商订单编号</th>
                                        <th>手机号</th>
                                        <th>运营商</th>
                                        <th className="text-right">面值</th>
                                        <th>订单结果</th>
                                        <th>处理状态</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {orderNode}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </div>

            </section>
        );
    }
});


ReactDOM.render(<CallbackPanel />, document.getElementById('main-content'));