var OrderQueryPanel = React.createClass({
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
                return (<button key={'p' + i} className="btn btn-default disabled" type="button">
                    <i className={btn.icon}></i>
                </button>);
            } else if (btn['icon']) {
                return (<button key={'p' + i} className="btn btn-default" type="button"
                                onClick={this.loadOrderList.bind(this, btn.index, undefined)}>
                    <i className={btn.icon}></i>
                </button>);
            } else if (btn.index == p) {
                return (<button key={'p' + i} className="btn btn-primary" type="button"
                                onClick={this.loadOrderList.bind(this, btn.index, undefined)}>
                    {btn.title}
                </button>);
            } else {
                return (<button key={'p' + i} className="btn btn-default" type="button"
                                onClick={this.loadOrderList.bind(this, btn.index, undefined)}>
                    {btn.title}
                </button>);
            }
        }.bind(this));

        return page_group;
    },

    render: function () {
        var orderNode = this.state.order_list.map(function (order, index) {
            return (
                <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.sp_id}</td>
                    <td>{order.account}</td>
                    <td>{order.name}</td>
                    <td>{order.carrier}</td>
                    <td>{order.create}</td>
                    <td>{order.result}</td>
                    <td>{order.update}</td>
                    <td className="text-right">{order.price}</td>
                    <td className="text-right">{order.value}</td>
                    <td className="text-right">{order.balance}</td>
                </tr>);
        });

        var paginationNode = this.getPagination(this.state.page, this.state.max);

        var adminNode = null;
        if (this.state.user_list.length > 0) {

            var userNode = this.state.user_list.map(function (u, i) {
                return (<option value={u.id} data-subtext={u.tags}>{u.id} - {u.name}</option>);
            });

            adminNode = (
                <div className="form-group has-error">
                    <label className="control-label col-md-1"><i
                        className="icon_lock"></i> 用户</label>

                    <div className="col-md-5">
                        <select className="form-control" id="form_user_id" data-live-search="true">
                            {userNode}
                            <option value="" data-subtext="">000000 - 全部
                            </option>
                        </select>
                    </div>
                </div>
            )
        }

        return (
            <section className="wrapper">
                <div className="row">
                    <div className="col-lg-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i
                                    className="icon-search"></i>查询</span>
                            </header>

                            <div className="panel-body">
                                <form className="form-horizontal" method="get">
                                    <div className="form-group">
                                        <label className="col-md-1 control-label">订单号</label>

                                        <div className="col-md-2">
                                            <input id="form_order_id" type="text" className="form-control input-sm"/>
                                        </div>

                                        <label className="col-md-1 control-label">代理商订单</label>

                                        <div className="col-md-2">
                                            <input id="form_sp_order_id" type="text" className="form-control input-sm"/>
                                        </div>

                                        <label className="col-md-1 control-label">手机号</label>

                                        <div className="col-md-2">
                                            <input id="form_account" type="text"
                                                   className="form-control input-sm"
                                                   maxLength="11"/>
                                        </div>

                                        <label className="col-md-1 control-label">状态</label>

                                        <div className="col-md-2">
                                            <select id="form_result"
                                                    className="form-control m-bot15 input-sm">
                                                <option value="">全部</option>
                                                <option value="success">成功</option>
                                                <option value="fail">失败</option>
                                                <option value="processing">充值中</option>
                                            </select>
                                        </div>

                                        <label className="col-md-1 control-label">时间范围</label>

                                        <div className="col-md-5">
                                            <input id="form_range" type="text"
                                                   className="form-control input-sm"/>
                                            <input id="form_range_start" type="hidden"/>
                                            <input id="form_range_end" type="hidden"/>
                                        </div>

                                        <label className="col-md-1 control-label">运营商</label>

                                        <div className="col-md-2">
                                            <select id="form_carrier"
                                                    className="form-control m-bot15 input-sm">
                                                <option value="">全部</option>
                                                <option value="3">电信</option>
                                                <option value="2">联通</option>
                                                <option value="1">移动</option>
                                            </select>
                                        </div>

                                        <label className="col-md-1 control-label">省份</label>

                                        <div className="col-md-2">

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

                                        <div className="col-md-offset-1 col-md-5">
                                            <a href="javascript:void(0);" className="btn btn-danger"
                                               onClick={this.onQuery}>
                                                <i className="icon-search"></i> 查询</a>

                                            <a href="javascript:void(0);" className="btn btn-info"
                                               onClick={this.onExport}>
                                                <i className="icon-download-alt"></i> 导出结果</a>
                                        </div>
                                    </div>

                                    {adminNode}
                                </form>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-table"></i>列表</span>
                            </header>
                            <div className="panel-body table-responsive">
                                <table id="order_result"
                                       className="table table-striped table-hover">
                                    <thead>
                                    <tr>
                                        <th>订单编号</th>
                                        <th>代理商订单编号</th>
                                        <th>手机号</th>
                                        <th>产品名称</th>
                                        <th>运营商</th>
                                        <th>开始时间</th>
                                        <th>订单状态</th>
                                        <th>状态时间</th>
                                        <th className="text-right">面值</th>
                                        <th className="text-right">采购金额</th>
                                        <th className="text-right">余额</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {orderNode}
                                    </tbody>
                                </table>
                            </div>
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="btn-row dataTables_filter">
                                        总数{this.state.count}
                                        <div id="page_group" className="btn-group">
                                            {paginationNode}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <AddMaintainBox exportRequest={this.exportRequest}/>

            </section>
        );
    }
});


var AddMaintainBox = React.createClass({

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
            <div className="modal fade" id="addModal" tabIndex="-1" role="dialog" aria-labelledby="addModalLabel"
                 aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="addModalLabel">导出</h4>
                        </div>

                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">

                                <label className="col-md-2 control-label">邮件地址</label>

                                <div className="col-md-10">
                                    <input id="form-mail" className="form-control" type='text'
                                           placeholder='导出文件将发送到您指定的邮件'/>
                                </div>

                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger" onClick={this.onExport}>导出</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

React.render(<OrderQueryPanel />, document.getElementById('main-content'));
