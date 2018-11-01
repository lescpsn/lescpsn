var MainContent = React.createClass({
    //获取列表
    getUpStreamList: function () {
        $.ajax({
            url: '/api/upstream/list_all',
            dataType: 'json',
            type: 'post',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        upstream_list: resp_data.data
                    });
                } else {
                    alert("上游接口列表加载错误 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("上游接口列表加载异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //充值和校对
    changeUpStreamValue: function (upstream_id, value, type, notes) {
        var requ_data = {
            upstream_id: upstream_id,
            value: value,
            type: type,
            notes: notes,
        };
        
        var key = "充值";
        if (type == "adjust") {
            key = "校对";
        }

        $.ajax({
            url: '/api/upstream/adjust',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getUpStreamList();
                    alert(key + "成功")
                } else {
                    alert(key + "错误 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert(key + "异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onFilter: function(){
        this.setState({
            filter: "filter"
        });
    },

    onAllList: function(){
        this.setState({
            filter: "alllist"
        });
    },

    getInitialState: function () {
        return {
            upstream_list: [],
            log_list: [],
            filter: "alllist"
        };
    },

    componentDidMount: function () {
        this.getUpStreamList();
    },

    render: function () {
        var upstreamlist = this.state.upstream_list.map(function (upstream_info, index) {
            var upstream_id = upstream_info.upstream_id;
            var upstream_name = upstream_info.upstream_name;
            var value = upstream_info.value;
            var last = upstream_info.last;

            var deposit_btn = (
                <button type="button" className="btn btn-xs btn-primary m-right5" onClick={this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "deposit")}><i className="icon-usd" /> 充值</button>
            );

            var adjust_btn = (
                <button type="button" className="btn btn-xs btn-danger m-right5" onClick={this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "adjust")}><i className="icon-edit" /> 校对</button>
            );

            var warning_btn = (
                <button type="button" className="btn btn-xs btn-warning disabled" onClick={this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "warning")}><i className="icon-warning-sign" /> 预警</button>
            );
                        
            return (
            <tr>
                <td>{upstream_id}</td>
                <td>{upstream_name}</td>
                <td className="text-right">{value}</td>
                <td className="text-right">{last}</td>
                <td className="text-center">{deposit_btn}{adjust_btn}{warning_btn}</td>
            </tr>
            );
        }.bind(this));

        if (this.state.filter == "filter") {
            upstreamlist = this.state.upstream_list.map(function (upstream_info, index) {
                var upstream_id = upstream_info.upstream_id;
                var upstream_name = upstream_info.upstream_name;
                var value = upstream_info.value;
                var last = upstream_info.last;

                var deposit_btn = (
                    <button type="button" className="btn btn-xs btn-primary m-right5" onClick={this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "deposit")}><i className="icon-usd" /> 充值</button>
                );

                var adjust_btn = (
                    <button type="button" className="btn btn-xs btn-danger m-right5" onClick={this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "adjust")}><i className="icon-edit" /> 校对</button>
                    );

                var warning_btn = (
                    <button type="button" className="btn btn-xs btn-warning disabled" onClick={this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "warning")}><i className="icon-warning-sign" /> 预警</button>
                );
               
                if (value != "0.000") {
                    return (
                        <tr>
                            <td>{upstream_id}</td>
                            <td>{upstream_name}</td>
                            <td className="text-right">{value}</td>
                            <td className="text-right">{last}</td>
                            <td className="text-center">{deposit_btn}{adjust_btn}{warning_btn}</td>
                        </tr>
                    );
                } else {
                    return ("");
                }
            }.bind(this));
        }

        return (
                <div className="wrapper">
                    <div className="col-md-12">
                       <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>上游余额管理</span>
                            <a id="filter_btn" className="btn btn-info pull-right" href="javascript:void(0);" onClick={this.onFilter}><i className="icon-filter" /> 去零</a>
                            <a id="reply_btn" className="btn btn-info pull-right m-right5" href="javascript:void(0);" onClick={this.onAllList}><i className="icon-list-alt" /> 全部</a>
                        </header>
                        <div className="panel-body">
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>接口名称</th>
                                        <th>名称</th>
                                        <th className="text-right">余额</th>
                                        <th className="text-right">上次加款</th>
                                        <th className="text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {upstreamlist}
                                </tbody>
                            </table>
                        </div>
                       </section>
                    </div>
                    <UpStreamDlg ref="UpStreamDlg" 
                                 changeUpStreamValue={this.changeUpStreamValue}
                                 />
                </div>
         );
    }
});

//弹窗
var UpStreamDlg = React.createClass({
    onOk: function () {
        var upstream_id = this.state.upstream_info.upstream_id;
        var value = $('#value').val();
        var type = this.state.key;
        var notes = $('#notes').val();

        this.props.changeUpStreamValue(upstream_id, value, type, notes);
        this.hideDlg();
    },

    onInputKeyUp: function () {
        $('#value').keydown(
            function (e) {
                if (!e) var e = window.event;
                if (((e.keyCode >= 48) && (e.keyCode <= 57)) ||
                ((e.keyCode >= 96) && (e.keyCode <= 105)) ||
                e.keyCode == 9 || e.keyCode == 8 || e.keyCode == 37 ||
                e.keyCode == 39 || e.keyCode == 110 || e.keyCode == 190) {
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                };
            });
        var value = $('#value').val();
        if (value != null || value != "" || value != "null") {
            $('#upstream_btn').removeClass('disabled');
        } else {
            $('#upstream_btn').addClass('disabled');
        }
    },

    showDlg: function (upstream_info, key) {
        this.setState({
            upstream_info: upstream_info,
            key: key,
        });

        this.getHistoryLog(upstream_info.upstream_id, key);
        this.hideHistoryLog();

        $('#upstream_dlg').modal('show');
        $('#upstream_dlg input').val('');
        $('#upstream_btn').addClass('disabled');
    },

    hideDlg: function () {
        $('#upstream_dlg').modal('hide');
    },

    getInitialState: function () {
        return {
            upstream_info: [],
            key: "",
            log_info: []
        };
    },

    // 获取查询结果
    getHistoryLog: function (upstream_id, key) {
        var requ_data = {
            upstream_id: upstream_id,
        };

        var title = "充值";
        if (key == "adjust") {
            title = "校对";
        }

        $.ajax({
            url: '/api/upstream/detail',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        log_list: resp_data.data
                    });
                    console.log(this.state.log_list);

                } else {
                    alert(title + "记录查询错误 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert(title + "记录查询异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //显示查询列表
    showHistoryLog: function (){
    	$('#history_table,#hide_history_link').removeClass('hide');
    	$('#show_history_link').addClass('hide');
    },

    //隐藏查询列表
    hideHistoryLog: function (){
    	$('#history_table,#hide_history_link').addClass('hide');
    	$('#show_history_link').removeClass('hide');
    },

    render: function () {
    	var key = this.state.key;
        console.log(this.state.key);
        var title = '';
        if (this.state.key == "adjust") {
            title = "校对";
        } else if (this.state.key == "deposit") {
            title = "充值";
        }
        
        if (this.state.log_list === null || this.state.log_list === undefined || this.state.log_list == []) {
            var history_log = "";
        } else {
            history_log = this.state.log_list.map(function (log_info, index) {
                var create_date = log_info.create_date;
                var type = log_info.type;
                var operator_name = log_info.operator_name;
                var value = log_info.value;
                var notes = log_info.notes;

                if (type == key) {
                	return (
                		<tr>
                            <td>{create_date}</td>
                            <td>{operator_name}</td>
                            <td>{value}</td>
                            <td>{notes}</td>
                        </tr>
                    );
                }
            });
        }

        var value = 0;
        if (this.state.upstream_info.value > 0) {
            value = this.state.upstream_info.value;
        }

        return (
            <div className="modal fade" id="upstream_dlg" tabIndex="-1" role="dialog" aria-labelledby="addModalLabel"
                 aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">{this.state.upstream_info.upstream_name} - {title}</h4>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <div className="row">
                                    <label className="col-sm-3 col-md-3 control-label">{this.state.upstream_info.upstream_name}: </label>
                                    <div className="col-sm-9 col-md-7">
                                        <span className="form-control border-1 m-bot10 alert-danger text-center">当前余额 <b>{value}</b> 元</span>
                                    </div>
                                </div>
                                      
                                <div className="row">
                                    <label className="col-sm-3 col-md-3 control-label">{title}金额(元): </label>
                                    <div className="col-sm-9 col-md-7">
                                        <input className="m-bot10 form-control input-sm" id="value"
                                               onKeyUp={this.onInputKeyUp} />
                                    </div>
                                </div>

                                <div className="row">
                                    <label className="col-sm-3 col-md-3 control-label">备注</label>
                                    <div className="col-sm-9 col-md-7">
                                        <input className="form-control input-sm" id="notes"
                                               placeholder='可为空' />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group add-pro-body">
                                <div className="text-primary col-sm-12 col-md-12 text-center m-bot10">
                                    <a id="show_history_link" className="" href="javascript:void(0);" onClick={this.showHistoryLog}><h4>上次记录</h4></a>
                                    <a id="hide_history_link" className="hide" href="javascript:void(0);" onClick={this.hideHistoryLog}><h4>隐藏记录</h4></a>
                                </div>
                                <div className="col-sm-12 col-md-12">
                                    <table id="history_table" className="table table-bordered table-striped hide">
						                <thead>
						                    <tr>
						                        <th>日期</th>
						                        <th>操作人</th>
						                        <th>金额</th>
						                        <th>备注</th>
						                    </tr>
						                </thead>
						                <tbody>
						                    {history_log}
						                </tbody>
						            </table>
                                </div>
                            </div>
                        </div>
                           
                        <div className="modal-footer form-horifooter">
                            <button id="upstream_btn" type="button" className="btn btn-danger" onClick={this.onOk}>{title}</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
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