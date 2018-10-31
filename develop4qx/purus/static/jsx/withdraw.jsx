var start_time = getQueryStringByName('start_time');

var React = require('react');
var ReactDOM = require('react-dom');

var MainContent = React.createClass({
    getInitialState: function(){
        return {
        };
    },
    componentDidMount: function () {
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function(){
        return (
            <div>
                <WithdrawInfoPanel />
                <WithdrawRecordPanel />
            </div>
        );
    }
});

var WithdrawInfoPanel = React.createClass({
    getInitialState: function(){
        return {
            wait_settle_money: 0,
            bank_user_name: "未知",
            bank_account: "未知",
            bank_of_deposit: "未知",
        };
    },
    componentDidMount: function () {
        this.getNotSettleMoney();
        this.getSupplierBankInfo();
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    getNotSettleMoney: function(){
        $.ajax({
            url: '/withdraw?requ_type=get_wait_settle_money',
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        wait_settle_money: resp_data.data.wait_settle_money
                    });
                } else {
                    console.error("读取账户余额出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                console.error("读取账户余额异常");
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });
    },

    getSupplierBankInfo: function(){
         $.ajax({
            url: '/withdraw?requ_type=get_supplier_bank_info',
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        bank_user_name: resp_data.data.bank_user_name,
                        bank_account: resp_data.data.bank_account,
                        bank_of_deposit: resp_data.data.bank_of_deposit,
                    });
                } else {
                    console.error("读取银行账号信息出错: " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                console.error("读取银行账号信息异常");
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });
    },

    render: function(){
        var bankInfoNode = "提现银行账户如下:" +
            "\n\n  开户名: " +  this.state.bank_user_name +
            "\n  银行账号: " + this.state.bank_account +
            "\n  开户行: " + this.state.bank_of_deposit +
            "\n\n提现账户默认为合同协议中账户，如需修改，请联系客服QQ.";

        return (
            <div>
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left m-right5"><i className="icon-file-text"/>提现说明</span>
                        <div className="col-sm-offset-1">
                            <h3 className="margin-none">
                                <span className="label label-primary m-right10">账户余额<span className="badge">{this.state.wait_settle_money}</span>元</span>
                                提示：（系统每日于 09：00 、18：00 分两次自动提现。）
                            </h3>
                        </div>
                    </header>
                    <div className="panel-body">
                        <pre className="col-md-12">
                            {bankInfoNode}
                        </pre>
                    </div>
                </section>
            </div>
        );
    }
});

var WithdrawRecordPanel = React.createClass({
    getInitialState: function(){
        return {
            record_list: [],
            filter_map:{
                page_index: 1,
                page_size: 20,
            },
            page_info: null,
        };
    },
    componentDidMount: function () {
        this.onQuery({});
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    onQuery: function(filters){
        var filter_map = this.state.filter_map;
        filter_map.page_index = 1;

        for (var i in filters) {
            filter_map[i] = filters[i];
        }
        this.setState({ filter_map: filter_map });

        var argu_list = "";
        for (var i in filter_map) {
            argu_list += ("&"+i+"=" + filter_map[i]);
        }

         $.ajax({
            url: '/withdraw?requ_type=get_withdraw_record'+ argu_list,
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                Showfullbg();
                if (resp_data.status == 'ok') {
                    this.setState({
                        record_list: resp_data.data.record_list,
                        page_info: resp_data.data.page_info,
                    });
                    console.log(this.state.record_list);
                } else {
                    console.error("读取提现记录出错: " + resp_data.msg);
                }
                Hidefullbg();
            }.bind(this),

            error: function (xhr, status, err) {
                console.error("读取提现记录异常");
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });
    },

    onClickQuery: function(){
        var settle_date_range = this.refs.DateRange.getDateRange();
        var filters = {
            status: $('#form_status').val(),
            settle_start: settle_date_range.start,
            settle_end: settle_date_range.end,
        };
        this.onQuery(filters);
    },

    showImageDlg: function(withdraw_id){
        this.refs.ImageDlg.showDlg(withdraw_id);
    },

    render: function(){
        var recordNodes = this.state.record_list.map(function(record_info, index){
            var incomeMoneyBtnNode = (
                <a className="btn btn-info btn-xs" href={"/query/sinopec?withdraw_id="+record_info.withdraw_id} target="_blank">{record_info.income_money}</a>
            );

            var showImgDlg = null;
            if(record_info.withdraw_img_name != null)
            {
                showImgDlg = (
                    <a href="javascript:void(0)" onClick={this.showImageDlg.bind(this, record_info.withdraw_id)}>查看截图</a>
                );
            }

            var balance = 0;

            return (
                <tr key={"RECORD_NODE_"+index}>
                    <td>{record_info.withdraw_id}</td>
                    <td>{record_info.settle_time.substring(20)}</td>
                    <td>{record_info.bank_user_name}</td>
                    <td>{record_info.bank_account}</td>
                    <td>{record_info.bank_of_deposit}</td>
                    <td>{incomeMoneyBtnNode}</td>
                    <td>{record_info.withdraw_money}</td>
                    <td>{balance}</td>
                    <td>{record_info.status}</td>
                    <td>{showImgDlg}{record_info.notes}</td>
                </tr>
            );
        }.bind(this));

        return (
            <div>
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left"><i className="icon-table"/>提现记录</span>

                        <span className="pull-right">
                            <a className="btn btn-info m-right5" href="javascript:void(0);" onClick={this.onClickQuery}>
                                <i className="icon-refresh" /> 刷新
                            </a>
                        </span>
                    </header>
                    <div className="panel-body">
                        <div>
                            <label className="col-sm-4 col-md-1 control-label">结算时间</label>
                            <div className="col-sm-8 col-md-5">
                                <DateRange ref="DateRange"  onClickQuery={this.onClickQuery}/>
                            </div>

                            <label className="col-sm-4 col-md-1 control-label">状态</label>
                            <div className="col-sm-8 col-md-2">
                                <select id="form_status" className="form-control m-bot15 input-sm" onChange={this.onClickQuery}>
                                    <option value="">全部</option>
                                    <option value="wait_examine">未处理</option>
                                    <option value="wait_withdraw">处理中</option>
                                    <option value="success,fail">已处理</option>
                                </select>
                            </div>
                        </div>

                        <table id="order_result" className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>流水号</th>
                                    <th>提现时间</th>
                                    <th>开户名</th>
                                    <th>开户行</th>
                                    <th>银行账号</th>
                                    <th>收入(单位:元)</th>
                                    <th>提现金额(单位:元)</th>
                                    <th>账户余额</th>
                                    <th>状态</th>
                                    <th>备注</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recordNodes}
                            </tbody>
                        </table>
                        <PageIndexGroup onQuery={this.onQuery} page_info={this.state.page_info} />
                    </div>
                </section>
                <ImageDlg ref="ImageDlg"/>
            </div>
        );
    }
});

var PageIndexGroup = React.createClass({
    onClickPage: function (page_index) {
        this.props.onQuery({ page_index: page_index });
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        if (!this.props.page_info || typeof (this.props.page_info.max_page) == "undefined" || this.props.page_info.max_page <= 1) {
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
                    <button key={"PAGE_INDEX_"+index} className="btn btn-default" disabled={disabled} type="button" onClick={this.onClickPage.bind(this,i)}>
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
                            </button>{pageIndexBtnBodes}
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
            showWeekNumbers: false,
        },
        function (start, end) {
            $('#DateRangeStart').val(moment(start).format('YYYY/MM/DD HH:mm:ss'));
            $('#DateRangeEnd').val(moment(end).format('YYYY/MM/DD HH:mm:ss'));
        });

        //设置初始数据
        var startDate = moment().startOf('days').add('days', -14);
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

         $('#DateRange').on('apply.daterangepicker', function(ev, picker){
            this.props.onClickQuery();
        }.bind(this));
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        return (
          <div >
            <input id="DateRange" type="text" className="form-control input-sm"/>
            <input id="DateRangeStart" type="hidden" />
            <input id="DateRangeEnd" type="hidden" />
          </div>
        );
    }
});

var ImageDlg = React.createClass({
    getInitialState: function(){
        return {
            withdraw_id: null,
        };
    },

    showDlg:function (withdraw_id) {
        $('#image_modal').modal();
        this.setState({
            withdraw_id:withdraw_id
        });
    },

    hideDlg: function () {
        $('#image_modal').modal('hide');
    },

    render:function (){
        return(
            <div className="modal" role="dialog" tabIndex="-1" id="image_modal">
                <div className="text-center row m-top20">
                    <img src={"/withdraw?requ_type=get_withdraw_img&withdraw_id="+this.state.withdraw_id} />
                </div>
                <div className="text-center row m-top20">
                    <a className="btn btn-default" onClick={this.hideDlg}>关闭</a>
                </div>
            </div>
        )
    }
});

ReactDOM.render(
    <MainContent />
    ,
    document.getElementById('main-content')
);