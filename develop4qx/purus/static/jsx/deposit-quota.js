//汇总模块

var DataPanel = React.createClass({

    render: function () {
        return (
            <section className="wrapper">
                <DepositList />
            </section>
        );
    }
});

//限额列表
var DepositList = React.createClass({

    getInitialState: function () {
        return {
            dep_list: [],
            dep_detail: [],
            operator_id: '',
            max: 0,
        };
    },

    //check是否已授权
    doCheck: function (operator_id) {
        var request_data = {'type': 'quota'};
        $.ajax({
            url: '/api/deposit/check_auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({operator_id: operator_id});
                    $("#addWindow").modal("show");
                } else {
                    $("#authWindow").modal("show");
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //初始化check
    doInitCheck: function () {
        //check 授权
        var request_data = {'type': 'quota'};
        $.ajax({
            url: '/api/deposit/check_auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status != 'success') {
                    $("#authWindow").modal("show");
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //获取列表数据
    doDepositData: function () {
        $.ajax({
            url: '/api/deposit/list',
            dataType: 'json',
            type: 'post',
            data: '',
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({dep_list: resp.dep_list});
                } else {
                    alert("加载列表失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },


    //点击单个客服 刷新下方列表
    doEachCS: function (operator_id) {
        var operator_id = operator_id;
        var page = 1;
        var size = 10;
        var request_data = {'operator_id': operator_id, 'page': page, 'size': size};
        $.ajax({
            url: '/api/deposit/list_detail',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({dep_detail: resp.dep_detail, max: resp.max, operator_id: operator_id});
                } else {
                    alert("加载详情失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //初始化列表
    componentDidMount: function () {
        this.doDepositData();
        this.doInitCheck();
    },

    render: function () {
        var dataNode = this.state.dep_list.map(function (data, index) {
                var addNode = null;
                addNode = (<a href="javascript:void(0);" className="btn btn-primary btn-sm btn-activate"
                              onClick={this.doCheck.bind(this, data.operator_id)}>加加加</a>);
                return (
                    <tr>
                        <td onClick={this.doEachCS.bind(this, data.operator_id)}>{data.operator_name}</td>
                        <td className="amount"
                            onClick={this.doEachCS.bind(this, data.operator_id)}>{data.value.toFixed(3)}</td>
                        <td onClick={this.doEachCS.bind(this, data.operator_id)}>{data.create_time}</td>
                        <td className="text-center">{addNode}</td>
                    </tr>
                )
            }.bind(this)
        );

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-search"></i>限额列表</span>
                            <span className="pull-right">
                            <a href="javascript:void(0);" className="btn btn-info mr15"
                               onClick={this.doDepositData}>
                                <i className="icon-time"></i><span>刷新</span>
                            </a>
                            </span>
                        </header>
                        <div className="panel-body">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>客服列表</th>
                                    <th className="text-center">限额</th>
                                    <th>时间</th>
                                    <th className="text-center">操作</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dataNode}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <AuthWindow />
                    <AddWindow operator_id={this.state.operator_id}
                               doDepositData={this.doDepositData}
                               doEachCS={this.doEachCS}/>
                    <HisList dep_detail={this.state.dep_detail}
                             operator_id={this.state.operator_id}
                             max={this.state.max}/>
                </div>
            </div>
        );
    }
});


//单个客服加款历史模块
var HisList = React.createClass({
    getInitialState: function () {
        return {
            page: 1,
            size: 10,
            dep_detail: null
        };
    },

    //获取数据
    doGetData: function (page, size) {
        var request_data = {'page': page, 'size': size, 'operator_id': this.props.operator_id};
        $.ajax({
            url: '/api/deposit/list_detail',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({dep_detail: resp.dep_detail, page: page});
                } else {
                    //this.setState({data_list: resp.data_list, max: resp.max});
                    alert("加载列表失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        return
    },

    doMoreData: function (page) {
        this.doGetData(page, this.state.size);
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
                return (<button key={'p' + i} className="btn btn-default disabled" type="button">
                    <i className={btn.icon}></i>
                </button>);
            } else if (btn['icon']) {
                return (<button key={'p' + i} className="btn btn-default" type="button"
                                onClick={this.doMoreData.bind(this, btn.index)}>
                    <i className={btn.icon}></i>
                </button>);
            } else if (btn.index == p) {
                return (<button key={'p' + i} className="btn btn-primary" type="button"
                                onClick={this.doMoreData.bind(this, btn.index)}>
                    {btn.title}
                </button>);
            } else {
                return (<button key={'p' + i} className="btn btn-default" type="button"
                                onClick={this.doMoreData.bind(this, btn.index)}>
                    {btn.title}
                </button>);
            }
        }.bind(this));

        return page_group;
    },

    render: function () {
        var datas = null;
        if (this.state.dep_detail != null) {
            datas = this.state.dep_detail;
        } else {
            datas = this.props.dep_detail;
        }

        var dataNode = datas.map(function (data, index) {
                return (
                    <tr>
                        <td>{data.deposit_id}</td>
                        <td>
                            <div className="amount">{data.amount.toFixed(3)}</div>
                        </td>
                        <td>{data.create_time}</td>
                        <td>{data.type}</td>
                        <td>
                            <div className="amount">{data.value.toFixed(3)}</div>
                        </td>
                    </tr>
                )
            }.bind(this)
        );

        var page_group = this.getPagination(this.state.page, this.props.max);

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>限额明细</span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>加款对象</th>
                                    <th>金额</th>
                                    <th>时间</th>
                                    <th>类型</th>
                                    <th>余额</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dataNode}
                                </tbody>
                            </table>
                        </div>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="btn-row dataTables_filter">
                                    <div id="page_group" className="btn-group">
                                        {page_group}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

//授权弹窗
var AuthWindow = React.createClass({
    onAuth: function () {
        $("#authWindow").modal("hide");
        var auth_num = $('#auth_num').val();
        var request_data = {'auth_num': auth_num, 'type': 'quota'};
        $.ajax({
            url: '/api/deposit/auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    //this.props.auth_status = 'success';
                    $("#authWindow").modal("hide");
                    alert('授权成功');
                } else {
                    $("#authWindow").modal("show");
                    $(".hint").show();
                    $("#auth_num").foucs($(".form-control").css({"border-color": "#FF0000"}));
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            <div className="modal" id="authWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-min">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h5 className="modal-title" id="priceModalLabel"></h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body dialog_cont">
                                <div className="col-xs-4 text-center"><h5>请输入授权码</h5></div>
                                <div className="col-xs-6">
                                    <input id="auth_num" type="text" className="form-control input-sm"/>
                                    <h4 className="hint">请输入正确的授权码</h4>
                                </div>
                                <div class="col-xs-1">
                                    <h2 className="hint icon-warning-sign"></h2>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onAuth}>确定</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});


//增加限额窗口
var AddWindow = React.createClass({
    onAddfund: function () {
        $('#addWindow').modal('hide');
        var amount = $('#amount').val();
        var request_data = {'amount': amount, 'operator_id': this.props.operator_id};
        if (!amount.match('^-*[0-9]+')) {
            alert('金额错误')
            return
        }
        ;
        $.ajax({
            url: '/api/deposit/adjust',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                //console.debug(JSON.stringify(resp));
                if (resp.status == 'success') {
                    alert("操作成功");
                    this.props.doDepositData();
                    this.props.doEachCS(this.props.operator_id);
                } else {
                    //alert(JSON.stringify(resp));
                    alert("操作失败:" + resp.msg);
                    return
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            <div className="modal" id="addWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-min">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h5 className="modal-title" id="priceModalLabel"></h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body dialog_cont">
                                <div className="col-md-4 text-center"><h5>输入限额</h5></div>
                                <div className="col-md-6">
                                    <input id="amount" type="text" className="form-control input-sm"/>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onAddfund}>确定</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});


React.render(
    <DataPanel />
    ,
    document.getElementById('main-content')
);