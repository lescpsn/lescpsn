var FinanceQueryPanel = React.createClass({
    mail_pattern: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,

    getInitialState: function () {
        return {
            trans_list: [],
            filter: {},
            pag: 1,
            size: 50,
            max: 0,
            user_list: []
        };
    },

    componentDidMount: function () {
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
        filter['order_id'] = $('#form_order_id').val();
        filter['account'] = $('#form_account').val();
        filter['start'] = $('#form_range_start').val();
        filter['end'] = $('#form_range_end').val();
        filter['type'] = $('#form_type').val();
        filter['user_id'] = $('#form_user_id').val();

        filter['size'] = this.state.size;

        this.loadTransList(1, filter);
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
            'type': 'transaction'
        };

        $.ajax({
            url: '/api/export/finance',
            dataType: 'json',
            data: JSON.stringify(request),
            type: 'post',

            success: function (resp) {
                alert(resp.msg);
                console.debug('EXPORT RESP:' + JSON.stringify(resp));
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

    loadTransList: function (page, filter) {
        var _filter = filter || this.state.filter;

        _filter['page'] = page;

        $.ajax({
            url: '/api/query/finance',
            dataType: 'json',
            data: JSON.stringify(_filter),
            type: 'post',

            success: function (resp) {
                this.setState({
                    trans_list: resp.data,
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
                                onClick={this.loadTransList.bind(this, btn.index, undefined)}>
                    <i className={btn.icon}></i>
                </button>);
            } else if (btn.index == p) {
                return (<button key={'p' + i} className="btn btn-primary" type="button"
                                onClick={this.loadTransList.bind(this, btn.index, undefined)}>
                    {btn.title}
                </button>);
            } else {
                return (<button key={'p' + i} className="btn btn-default" type="button"
                                onClick={this.loadTransList.bind(this, btn.index, undefined)}>
                    {btn.title}
                </button>);
            }
        }.bind(this));

        return page_group;
    },

    render: function () {
        var adminNode = null;

        if (this.state.user_list.length > 0) {

            var userNode = this.state.user_list.map(function (u, i) {
                return (<option value={u.id} data-subtext={u.tags}>{u.id} - {u.name}</option>);
            });

            adminNode = (
                <div className="form-group has-error">
                    <label className="control-label col-md-1"><i className="icon_lock"/> 用户</label>
                    <div className="col-md-5">
                        <select className="form-control" id="form_user_id" data-live-search="true">
                            {userNode}
                            <option value="" data-subtext="">000000 - 全部</option>
                        </select>
                    </div>
                </div>
            )
        }

        var transNode = this.state.trans_list.map(function (trans, index) {
            return (
                <tr key={trans.id}>
                    <td>{trans.id}</td>
                    <td>{trans.order_id}</td>
                    <td>{trans.account}</td>
                    <td>{trans.name}</td>
                    <td className="text-right">{trans.value}</td>
                    <td>{trans.type}</td>
                    <td>{trans.time}</td>
                    <td className="text-right">{trans.balance}</td>
                    <td>{trans.notes}</td>
                </tr>);
        });

        var paginationNode = this.getPagination(this.state.page, this.state.max);

        return (
            <section className="wrapper">
                <div className="row">
                    <div className="col-lg-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-search"/>帐户查询</span>
                            </header>
                            <div className="panel-body">
                                <form className="form-horizontal" method="get">
                                    <div className="form-group">

                                        <label className="col-md-1 control-label">时间</label>

                                        <div className="col-md-5">
                                            <input id="form_range" type="text" className="form-control input-sm"/>
                                            <input id="form_range_start" type="hidden"/>
                                            <input id="form_range_end" type="hidden"/>
                                        </div>

                                        <label className="col-md-1 control-label">订单号</label>

                                        <div className="col-md-2">
                                            <input id="form_order_id" type="text" className="form-control input-sm"/>
                                        </div>

                                        <label className="col-md-1 control-label">类型</label>

                                        <div className="col-md-2">
                                            <select id="form_type" className="form-control m-bot15 input-sm">
                                                <option value="">全部</option>
                                                <option value="debit">自动扣款</option>
                                                <option value="debit-manual">人工扣款</option>
                                                <option value="refund">自动退款</option>
                                                <option value="refund-manual">人工退款</option>
                                                <option value="deposit">加款</option>
                                            </select>
                                        </div>

                                        <label className="col-md-1 control-label">手机号/账号</label>

                                        <div className="col-md-2">
                                            <input id="form_account" type="text" className="form-control input-sm"/>
                                        </div>

                                        <div className="col-md-offset-1 col-md-4">
                                            <a href="javascript:void(0);" className="btn btn-danger"
                                               onClick={this.onQuery}>
                                                <i className="icon-search"/> 查询</a>

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
                    <div className="col-md-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-table"/>帐户列表</span>
                            </header>
                            <div className="panel-body table-responsive">
                                <table id="order_result" className="table table-striped table-hover">
                                    <thead>
                                    <tr>
                                        <th>流水号</th>
                                        <th>关联订单编号</th>
                                        <th>充值帐号</th>
                                        <th>产品名称</th>
                                        <th>订单金额</th>
                                        <th>类型</th>
                                        <th>时间</th>
                                        <th>余额</th>
                                        <th>备注</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {transNode}
                                    </tbody>
                                </table>
                            </div>
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="btn-row dataTables_filter">
                                        <div id="page_group" className="btn-group">
                                            {paginationNode}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <ExportBox exportRequest={this.exportRequest}/>
            </section>
        );
    }
});


var ExportBox = React.createClass({

    onExport: function () {
        var mail = $('#form-mail').val();
        console.info('MAIL TO:' + mail);

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

React.render(<FinanceQueryPanel />, document.getElementById('main-content'));