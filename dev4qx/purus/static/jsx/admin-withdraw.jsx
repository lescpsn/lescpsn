var start_time = getQueryStringByName('start_time');

var React = require('react');
var ReactDOM = require('react-dom');

var MainContent = React.createClass({
    getInitialState: function(){
        return {
            filter_map: {
                page_index: 1,
                page_size: 20,
            },
            record_list: [],
            page_info: null,
        };
    },
    componentDidMount: function () {
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
            argu_list += ("&"+i+"=" + encodeURIComponent(filter_map[i]) );
        }

        $.ajax({
            url: '/admin/withdraw?requ_type=get_withdraw_record'+ argu_list,
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                Showfullbg();
                if (resp_data.status == 'ok') {
                    this.setState({
                        record_list: resp_data.data.record_list,
                        page_info: resp_data.data.page_info,
                    });
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


    render: function(){
        return (
            <div>
                <QueryPanel onQuery={this.onQuery} />
                <WithdrawRecordPanel  onQuery={this.onQuery} record_list={this.state.record_list} page_info={this.state.page_info}/>
            </div>
        );
    }
});

var QueryPanel = React.createClass({
    getInitialState: function(){
        return {
            user_list: [],
        };
    },
    componentDidMount: function () {
        this.loadUserList();
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    loadUserList: function () {
        $.ajax({
            url: '/api/user/list_local',
            dataType: 'json',
            type: 'get',

            success: function (data) {
                this.setState({
                    user_list: data
                });

                $('#form_user_id').selectpicker({});
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickQuery: function(){
        var settle_date_range = this.refs.SettleDateRange.getDateRange();
        var filters = {
            withdraw_id: $('#form_withdraw_id').val(),
            bank_user_name: $('#form_bank_user_name').val(),
            bank_account: $('#form_bank_account').val(),
            bank_of_deposit: $('#form_bank_of_deposit').val(),
            status: $('#form_status').val(),
            user_id: $('#form_user_id').val(),

            settle_start: settle_date_range.start,
            settle_end: settle_date_range.end,
        };
        this.props.onQuery(filters);
    },


    render: function(){
        var userNodes = this.state.user_list.map(function (u, i) {
            return (<option key={"USER_ID_"+i} value={u.id} data-subtext={u.tags}>{u.id} - {u.name}</option>);
        });

        return (
            <div>
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left"><i className="icon-search"/>查询</span>
                    </header>
                    <div className="panel-body">
                        <form className="form-horizontal">
                            <div className="form-group row">

                                <label className="col-sm-4 col-md-1 control-label">流水号</label>
                                <div className="col-sm-8 col-md-2">
                                    <input id="form_withdraw_id" type="text" className="form-control input-sm" />
                                </div>

                                <label className="col-sm-4 col-md-1 control-label">开户名</label>
                                <div className="col-sm-8 col-md-2">
                                    <input id="form_bank_user_name" type="text" className="form-control input-sm" />
                                </div>

                                <label className="col-sm-4 col-md-1 control-label">银行账号</label>
                                <div className="col-sm-8 col-md-2">
                                    <input id="form_bank_account" type="text" className="form-control input-sm" />
                                </div>

                                <label className="col-sm-4 col-md-1 control-label">开户行</label>
                                <div className="col-sm-8 col-md-2">
                                    <select id="form_bank_of_deposit" className="form-control m-bot15 input-sm">
                                        <option value="">全部</option>
                                        <option value="">银行1</option>
                                        <option value="">银行2</option>
                                        <option value="">银行3</option>
                                        <option value="">银行4</option>
                                        <option value="">银行5</option>
                                    </select>
                                </div>

                                <label className="col-sm-4 col-md-1 control-label">结算时间</label>
                                <div className="col-sm-8 col-md-5">
                                    <DateRange ref="SettleDateRange" />
                                </div>

                                <label className="col-sm-4 col-md-1 control-label">状态</label>
                                <div className="col-sm-8 col-md-2">
                                    <select id="form_status" className="form-control m-bot15 input-sm">
                                        <option value="">全部</option>
                                        <option value="wait_examine">未处理</option>
                                        <option value="wait_withdraw">处理中</option>
                                        <option value="success,fail">已处理</option>
                                    </select>
                                </div>

                                <div className="col-md-offset-1 col-md-5">
                                    <a id="act_query" href="javascript:void(0);" className="btn btn-danger m-right5" onClick={this.onClickQuery}>
                                        <i className="icon-search" /> 查询
                                    </a>
                                </div>

                            </div>

                            <div className="form-group">
                                <label className="control-label col-md-1">用户</label>
                                <div className="col-md-5">
                                    <select className='form-control m-bot15 input-sm' id='form_user_id' data-live-search="true">
                                        <option value=''>全部</option>
                                        {userNodes}
                                    </select>
                                </div>
                            </div>

                        </form>
                    </div>
                </section>
            </div>
        );
    }
});


var WithdrawRecordPanel = React.createClass({
    getInitialState: function(){
        return {};
    },
    componentDidMount: function () {
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    onClickStart: function(record_info){
        if (!confirm("确定开始提现操作吗？"))
        {
            return;
        }

        var requ_data = {
            requ_type: 'start_withdraw',
            argu_list: {
                withdraw_id: record_info.withdraw_id
            }
        }

        $.ajax({
            url: '/admin/withdraw',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                Showfullbg();
                if (resp_data.status == 'ok') {
                    this.props.onQuery({});
                    alert("状态修改成功");
                }
                else {
                    alert("状态修改出错:\n" + resp_data.msg);
                }
                Hidefullbg();
            }.bind(this),
            error: function (xhr, status, err) {
                alert("状态修改异常:\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickSuccess: function(record_info){
        this.refs.SetSuccessDlg.showDlg(record_info);
    },

    onClickFail: function(record_info){
        this.refs.SetFailDlg.showDlg(record_info);
    },

    showImageDlg: function(withdraw_id){
        this.refs.ImageDlg.showDlg(withdraw_id);
    },

    render: function(){
        var recordNodes = this.props.record_list.map(function(record_info, index){
            var startWithdrawBtnNode = null;
            if(record_info.status == '未处理')
            {
                startWithdrawBtnNode =  (
                    <a href="javascript:void(0);"
                       className="btn btn-primary btn-xs btn-warning"
                        onClick={this.onClickStart.bind(this,record_info)}
                    >
                        开始
                    </a>
                 );
            }

            var successBtnNode = null;
            var failBtnNode = null;
            if(record_info.status == '未处理' || record_info.status == '处理中')
            {
                successBtnNode =  (
                    <a href="javascript:void(0);"
                       className="btn btn-primary btn-xs btn-info m-right5"
                       onClick={this.onClickSuccess.bind(this,record_info)}
                    >
                        成功
                    </a>
                 );


                failBtnNode =  (
                    <a href="javascript:void(0);"
                       className="btn btn-primary btn-xs btn-danger"
                      onClick={this.onClickFail.bind(this,record_info)}
                    >
                        失败
                    </a>
                 );
            }

            var withdrawImgNode = null;
            if(record_info.withdraw_img_name != null)
            {
                withdrawImgNode = (
                    <a className="btn btn-info btn-xs" onClick={this.showImageDlg.bind(this, record_info.withdraw_id)}>
                        查看
                    </a>
                );
            }

            var operationBtnNodes1 = null;
            var operationBtnNodes2 = null;
            var timeNode = (<td>{record_info.settle_time.substring(20)}</td>);

            if(location.pathname == "/admin/withdraw")
            {
                operationBtnNodes1 =(
                    <td>{startWithdrawBtnNode}</td>
                );
                operationBtnNodes2 =(
                    <td>{successBtnNode}{failBtnNode}</td>
                );
                timeNode = (<td>{record_info.settle_time}</td>);

            }

            var incomeMoneyBtnNode = (
                <a className="btn btn-info btn-xs" href={"/query/sinopec?withdraw_id="+record_info.withdraw_id} target="_blank">{record_info.income_money}</a>
            );

            return (
                <tr key={"RECORD_NODE_"+index}>
                    <td>{record_info.withdraw_id}</td>
                    <td>{record_info.user_id} - {record_info.user}</td>
                    {timeNode}
                    <td>{record_info.bank_user_name}</td>
                    <td>{record_info.bank_account}</td>
                    <td>{record_info.bank_of_deposit}</td>
                    <td>{incomeMoneyBtnNode}</td>
                    <td>{record_info.withdraw_money}</td>
                    <td>{record_info.status}</td>
                    {operationBtnNodes1}
                    {operationBtnNodes2}
                    <td>{withdrawImgNode}</td>
                    <td>{record_info.notes_for_user}</td>
                </tr>
            );
        }.bind(this));


        var operationBtnNodes1 = null;
        var operationBtnNodes2 = null;
        var timeNode = (
            <th>提现时间</th>
        );

        if(location.pathname == "/admin/withdraw")
        {
            operationBtnNodes1 =(
                <th>提现操作</th>
            );
            operationBtnNodes2 =(
                <th>操作</th>
            );
            timeNode = (
                <th>统计时段</th>
            );
        }


        return (
            <div>
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left"><i className="icon-table"/>查询结果</span>
                    </header>
                    <div className="panel-body">
                        <table id="order_result" className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>流水号</th>
                                    <th>用户</th>
                                    {timeNode}
                                    <th>开户名</th>
                                    <th>开户行</th>
                                    <th>银行账号</th>
                                    <th>收入</th>
                                    <th>提现金额</th>
                                    <th>状态</th>
                                    {operationBtnNodes1}
                                    {operationBtnNodes2}
                                    <th>截图</th>
                                    <th>备注</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recordNodes}
                            </tbody>
                        </table>
                        <PageIndexGroup onQuery={this.props.onQuery} page_info={this.props.page_info} />
                    </div>
                </section>
                <SetSuccessDlg ref="SetSuccessDlg" onQuery={this.props.onQuery} showImageDlg={this.showImageDlg}/>
                <SetFailDlg ref="SetFailDlg" onQuery={this.props.onQuery}/>
                <ImageDlg ref="ImageDlg"/>
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

var SetSuccessDlg = React.createClass({
    onOk: function () {
        var notes_for_user = $('#SetSuccessDlg_notes_for_user').val();

        var requ_data = {
            requ_type: 'set_withdraw_success',
            argu_list: {
                withdraw_id: this.state.record_info.withdraw_id,
                notes_for_user: notes_for_user,
            }
        };

        $.ajax({
            url: '/admin/withdraw',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.props.onQuery({});
                    alert("状态修改成功");
                    this.hideDlg();
                }
                else {
                    alert("状态修改出错:\n" + resp_data.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                alert("状态修改异常:\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickAddImage: function(){
    },

    showDlg: function (record_info) {
        this.setState({record_info: record_info});
        $('#SetSuccessDlg').modal({ backdrop: 'static', keyboard: false });
    },

    clearData: function () {
        this.setState({record_info: null});
    },

    hideDlg: function () {
        this.clearData();
        $('#SetSuccessDlg').modal('hide');
    },

    getInitialState: function () {
        return ({
            record_info: null
        });
    },

    componentDidMount: function () {

        $('#image_upload').fileupload({
            url: '/admin/withdraw',
            dataType: 'json',

            add: function (e, data) {
                console.info(data);
                var file_name = data.originalFiles[0].name;
                var file_size = data.originalFiles[0].size;
                var file_type = data.originalFiles[0].type;
                if(file_size > 200*1024)
                {
                    alert('图片大小不能超过200k');
                    return false;
                }
                var acceptFileTypes = /^image\/(gif|jpe?g|png)$/i;
                if(!acceptFileTypes.test(file_type))
                {
                    alert('不支持的文件格式,只能上传(gif, jpeg, jpg, png)');
                    return false;
                }
                data.submit();
            },

            submit: function (e, data) {


                data.formData = {
                    requ_type: "upload_withdraw_img",
                    withdraw_id: this.state.record_info.withdraw_id,
                };

            }.bind(this),

            change: function (e, data) {
            }.bind(this),

            done: function (e, data) {
                var file_name = data.originalFiles[0].name;
                var resp_data = data.result;
                if(resp_data.status == 'ok')
                {
                    var record_info = this.state.record_info;
                    record_info.withdraw_img_name = file_name;
                    this.setState({record_info: record_info});
                    this.props.onQuery({});
                    alert('上传成功');

                }
                else
                {
                    alert('上传失败:\n' + resp_data.msg)
                }
            }.bind(this)
        });
    },

    showImageDlg: function(withdraw_id){
        this.props.showImageDlg(withdraw_id);
    },

    render: function () {
        var withdrawImgNode = null;
        if(this.state.record_info != null && this.state.record_info.withdraw_img_name != null)
        {
            var record_info = this.state.record_info;
            withdrawImgNode = (
                <div className="row">
                    <label className="col-xs-2 control-label">流水截图</label>
                    <div className="col-xs-6">
                        <a className="btn btn-info btn-xs"
                            onClick={this.showImageDlg.bind(this, this.state.record_info.withdraw_id)}>
                            查看
                        </a>
                    </div>
                </div>
            );
        }

        return (
            <div className="modal" id="SetSuccessDlg" tabIndex="-1" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">确定提现成功</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <div className="row">
                                    <label className="col-xs-2 control-label">备注</label>
                                    <div className="col-xs-6">
                                        <input maxLength="15" className="m-bot15 form-control input-sm" id="SetSuccessDlg_notes_for_user" placeholder="请输入备注" />
                                    </div>
                                </div>

                                {withdrawImgNode}

                                <div className="row">
                                    <label className="col-xs-2 control-label">修改截图</label>
                                    <div className="col-xs-6" style={{border:"1px dashed #CACACA", padding: "0 20px"}}>
                                        <input className="btn btn-defalut"
                                           id="image_upload"
                                           name="withdraw_img"
                                           type="file"
                                           accept="image/gif,image/jpeg,image/jpg,image/png,"
                                           >
                                        </input>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onOk}>确定</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal" onClick={this.hideDlg}>取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

var SetFailDlg = React.createClass({
    onOk: function () {
        var notes_for_user = $('#SetFailDlg_notes_for_user').val();

        var requ_data = {
            requ_type: 'set_withdraw_fail',
            argu_list: {
                withdraw_id: this.state.record_info.withdraw_id,
                notes_for_user: notes_for_user,
            }
        };

        $.ajax({
            url: '/admin/withdraw',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.props.onQuery({});
                    alert("状态修改成功");
                    this.hideDlg();
                }
                else {
                    alert("状态修改出错:\n" + resp_data.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                alert("状态修改异常:\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    showDlg: function (record_info) {
        this.setState({record_info: record_info});
        $('#SetFailDlg').modal({ backdrop: 'static', keyboard: false });
    },

    clearData: function () {
        $('#SetFailDlg_notes_for_user').val('');
        this.setState({record_info: null});
    },

    hideDlg: function () {
        this.clearData();
        $('#SetFailDlg').modal('hide');
    },

    getInitialState: function () {
        return ({
            record_info: null
        });
    },

    componentDidMount: function () {
    },

    render: function () {
        return (
            <div className="modal" id="SetFailDlg" tabIndex="-1" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">确定提现失败</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">

                                <div className="row">
                                    <label className="col-xs-2 control-label">备注</label>
                                    <div className="col-xs-6">
                                        <input maxLength="15" className="m-bot15 form-control input-sm" id="SetFailDlg_notes_for_user" placeholder="请输入备注" />
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onOk}>确定</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal" onClick={this.hideDlg}>取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
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