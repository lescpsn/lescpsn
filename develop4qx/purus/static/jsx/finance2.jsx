var React = require('react');
var ReactDOM = require('react-dom');

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
        this.loadUserList();
    },

    loadUserList: function () {
        $.ajax({
            url: '/api/user/list_local',
            dataType: 'json',
            type: 'get',

            success: function (data) {
                Showfullbg();
                this.setState({
                    user_list: data
                });
                $('#form_user_id').selectpicker({});
                Hidefullbg();
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onQuery: function () {
        var filter = this.state.filter;
        filter['id'] = $('#form_id').val();
        filter['order_id'] = $('#form_order_id').val();
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
                Showfullbg();
                this.setState({
                    trans_list: resp.data,
                    filter: _filter,
                    max: resp.max,
                    page: page,
                });
                Hidefullbg();
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            <section className="wrapper">
                <QueryPanel user_list={this.state.user_list} onExport={this.onExport} onQuery={this.onQuery}/>

                <QueryResultPenal max={this.state.max} page={this.state.page} loadTransList={this.loadTransList}
                                  trans_list={this.state.trans_list} user_list={this.state.user_list}/>

                <ExportBox exportRequest={this.exportRequest}/>
            </section>
        );
    }
});

var QueryPanel = React.createClass({
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

    },

    onQuery: function () {
        this.props.onQuery();
    },

    onExport: function () {
        this.props.onExport();
    },

    render:function () {
        var adminNode = null;

        if (this.props.user_list.length > 0) {
            var userNode = this.props.user_list.map(function (u, i) {
                return (<option value={u.id} data-subtext={u.tags}>{u.id} - {u.name}</option>);
            });

            adminNode = (
                <div className="form-group">
                    <label className="col-md-1 control-label">用户</label>

                    <div className="col-md-5">
                        <select className="form-control input-sm" id="form_user_id" data-live-search="true">
                            <option value="" data-subtext="">000000 - 全部</option>
                            {userNode}
                        </select>
                    </div>
                </div>
            )
        }
        return(
            <div className="row">
                    <div className="col-lg-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-search"/>帐户查询</span>
                            </header>
                            <div className="panel-body">
                                <form className="form-horizontal" method="get">
                                    <div className="form-group row">
                                        <div className="col-md-12 row m-bot10">
                                            <label className="col-md-1 control-label">流水号</label>

                                            <div className="col-md-5">
                                                <input id="form_id" type="text" className="form-control input-sm"/>
                                            </div>

                                            <label className="col-md-1 control-label">订单编号</label>

                                            <div className="col-md-2">
                                                <input id="form_order_id" type="text" className="form-control input-sm"/>
                                            </div>

                                            <label className="col-md-1 control-label">类型</label>

                                            <div className="col-md-2">
                                                <select id="form_type" className="form-control m-bot15 selectpicker">
                                                    <option value="">全部</option>
                                                    <option value="debit">采购</option>
                                                    <option value="supply">销售</option>
                                                    <option value="withdraw">提现</option>
                                                    <option value="personal">自用</option>
                                                    <optgroup label="加款">
                                                        <option value="deposit">自动加款</option>
                                                        <option value="deposit-manual">手动加款</option>
                                                    </optgroup>
                                                    <optgroup label="退款">
                                                        <option value="refund">自动退款</option>
                                                        <option value="refund-manual">手动退款</option>
                                                    </optgroup>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="col-md-12 row">
                                            <label className="col-md-1 control-label">时间</label>

                                            <div className="col-md-5">
                                                <input id="form_range" type="text" className="form-control input-sm"/>
                                                <input id="form_range_start" type="hidden"/>
                                                <input id="form_range_end" type="hidden"/>
                                            </div>

                                            <div className="col-md-offset-1 col-md-4">
                                                <a href="javascript:void(0);" className="btn btn-danger m-right10"
                                                   onClick={this.onQuery}>
                                                    <i className="icon-search"/> 查询</a>

                                                <a href="javascript:void(0);" className="btn btn-info"
                                                   onClick={this.onExport}>
                                                    <i className="icon-download-alt" /> 导出结果</a>
                                            </div>
                                        </div>
                                    </div>
                                    {adminNode}
                                </form>
                            </div>
                        </section>
                    </div>
                </div>
        )
    }
});

var QueryResultPenal = React.createClass({
    getNoteStr:function(i){
        var i_map ={
            'supply':'供货',
            'withdraw':'提现',
            'personal':'自用'
        };
        if(i_map[i]){
            return i_map[i];
        }else{
            return i;
        }
    },

    getCarrierStr:function(i){
        var i_map ={
            'data' : '流量',
            'fee' : '话费',
            'sinopec': '中石化',
            'SINOPEC': '中石化'
        };
        return i_map[i];
    },
    
    getISPStr:function (i) {
        var i_map ={
            '1': '移动',
            '2': '联通',
            '3': '电信',
            'sinopec': '加油卡',
            'SINOPEC': '加油卡'
        };
        return i_map[i];
    },

    getAreaStr:function(i){
        var i_map ={
            'BJ': '北京',
            'TJ': '天津',
            'HE': '河北',
            'SX': '山西',
            'NM': '内蒙古',
            'LN': '辽宁',
            'JL': '吉林',
            'HL': '黑龙江',
            'SH': '上海',
            'JS': '江苏',
            'ZJ': '浙江',
            'AH': '安徽',
            'FJ': '福建',
            'JX': '江西',
            'SD': '山东',
            'HA': '河南',
            'HB': '湖北',
            'HN': '湖南',
            'GD': '广东',
            'GX': '广西',
            'HI': '海南',
            'CQ': '重庆',
            'SC': '四川',
            'GZ': '贵州',
            'YN': '云南',
            'XZ': '西藏',
            'SN': '陕西',
            'GS': '甘肃',
            'QH': '青海',
            'NX': '宁夏',
            'XJ': '新疆',
            'TW': '台湾',
            'HK': '香港',
            'CN': '全国'
        };
        return i_map[i];
    },

    render:function () {
        var transNode = this.props.trans_list.map(function (trans, index) {
            var income = null;
            var expend = null;
            if (trans.value > 0){
                income = "+"+trans.value;
            }else{
                expend = trans.value
            }

            var name = null;
            if(trans.name){
                var n = trans.name.split(':');
                if(n.length == 4){
                    var c = n[0] ? this.getCarrierStr(n[0])+' - '  : '';
                    var s = n[0] ? this.getISPStr(n[1]) : '';
                    var p = n[2] ? '('+ this.getAreaStr(n[2]) + ')' : '';
                    var v = n[3] ? n[3]+'元' : '';
                    name = c+s+p+v;
                }
            }

            var td_user_id = null;
            if (this.props.user_list.length > 0 ) {
                this.props.user_list.map(function (x) {
                     if (x.id == trans.user_id) {
                        td_user_id = (<td>{x.name} - {trans.user_id}</td>);
                    }
                })
            }

            return (
                <tr key={trans.id}>
                    <td>{trans.id}</td>
                    <td>{trans.order_id}</td>
                    <td>{name}</td>
                    <td>{trans.account}</td>
                    <td>{Math.abs(trans.value).toFixed(3)}</td>
                    {td_user_id}
                    <td>{trans.time}</td>
                    <td>{this.getNoteStr(trans.type)}</td>
                    <td className="text-danger">{income}</td>
                    <td className="text-success">{expend}</td>
                    <td>{trans.balance}</td>
                    <td>{this.getNoteStr(trans.type)}{trans.notes}</td>
                </tr>);
        }.bind(this));

        var th_user_id= null;
        if (this.props.user_list.length > 0 ){
            th_user_id = (<th className="text-center">用户</th>);
        }
        return(
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
                                    <th>订单编号</th>
                                    <th>产品名称</th>
                                    <th>充值帐号</th>
                                    <th>订单金额</th>
                                    {th_user_id}
                                    <th>日期</th>
                                    <th>收支类型</th>
                                    <th>收入</th>
                                    <th>支出</th>
                                    <th>账户余额</th>
                                    <th>备注</th>
                                </tr>
                                </thead>
                                <tbody>
                                {transNode}
                                </tbody>
                            </table>
                        </div>
                        <PageIndexGroup onQuery={this.props.loadTransList}
                                    page={this.props.page}
                                    max={this.props.max} />
                    </section>
                </div>
            </div>
        )
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

//分页
var PageIndexGroup = React.createClass({
    onClickPage: function (page_index) {
        this.props.onQuery(page_index,undefined);
    },

    render: function () {
        if (this.props.page == null || this.props.max == null) {
            return null;
        }
        var page_index = this.props.page;
        var max_page = this.props.max;

        var page_start = page_index - 4 > 0 ? page_index - 4 : 1;
        var page_end = page_index + 4 > max_page ? max_page : page_index + 4;

        var page_index_list = [];
        for (var i = page_start; i <= page_end; ++i) {
            page_index_list.push(i);
        }

        var pageIndexBtnBodes = page_index_list.map(function (i, index) {
            var disabled = null;
            if (i == this.props.page) {
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

ReactDOM.render(<FinanceQueryPanel />, document.getElementById('main-content'));