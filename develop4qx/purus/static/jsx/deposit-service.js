//汇总模块

var DataPanel = React.createClass({

    render: function () {
        return (
            <section className="wrapper">
                <DepositPanel />
            </section>
        );
    }
});

//客户申请sheet
var DepositPanel = React.createClass({
    getInitialState: function () {
        return {
            data_list: [],
            page: 1,
            size: 10,
            max: 0,
            status: 'apply',
            id: '',
            opt: '',
            amount: 0
        };
    },

    //弹出确认框
    doCheck: function (opt, id) {
        //check 授权
        var request_data = {'type': 'approve'};
        $.ajax({
            url: '/api/deposit/check_auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({opt: opt, id: id});
                    $("#confirmWindow").modal("show");
                } else {
                    this.setState({opt: opt, id: id});
                    $("#authWindow").modal("show");
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    doRefreshAuth: function () {
        console.info('DO_REFRESH_AUTH');

        var request_data = {'type': 'approve'};
        $.ajax({
            url: '/api/deposit/refresh_auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                console.info('DO_REFRESH_AUTH=' + resp.status);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //初始化check
    doInitCheck: function () {
        //check 授权
        var request_data = {'type': 'approve'};
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

    //获取数据
    doGetData: function (page, size, status) {
        var request_data = {'page': page, 'size': size, 'status': status};
        $.ajax({
            url: '/api/deposit/apply_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    list_data = resp.data_list;
                    this.setState({data_list: list_data, max: resp.max, status: status});
                } else {
                    //console.debug(JSON.stringify(resp));
                    alert("加载列表失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    doMoreData: function (page) {
        this.state.page = page;
        this.doGetData(page, this.state.size, this.state.status);
    },

    doFlushData: function (status) {
        page = 1;
        this.doGetData(page, this.state.size, status);
    },


    componentDidMount: function () {
        this.doInitCheck();
        this.doGetData(this.state.page, this.state.size, this.state.status);
        window.setInterval(this.doRefreshAuth, 1000 * 60 * 5);
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
        var actvNode = null;
        var voidNode = null;
        var dataNode = this.state.data_list.map(function (data, index) {
                if (data.status == '待审核') {
                    actvNode = (<a href="javascript:void(0);" className="btn btn-primary btn-sm btn-activate"
                                   onClick={this.doCheck.bind(this, "pass", data.id)}>批准</a>);
                    voidNode = (<a href="javascript:void(0);" className="btn btn-danger  btn-sm btn-activate"
                                   onClick={this.doCheck.bind(this, "reject", data.id)}>拒绝</a>);
                } else {
                    actvNode = data.result;
                }

                return (
                    <tr>
                        <td>{data.user_id}</td>
                        <td>{data.channel}</td>
                        <td>{data.account}</td>
                        <td>
                            <div className="amount">{data.amount.toFixed(3)}</div>
                        </td>
                        <td>{data.time_stamp}</td>
                        <td>{data.status}</td>
                        <td>{data.operator_name}</td>
                        <td>
                            <div className="amount">{actvNode} {voidNode}</div>
                        </td>
                    </tr>
                )
            }.bind(this)
        );

        var page_group = this.getPagination(this.state.page, this.state.max);

        return (
            <div className="row">
                <div className="col-lg-12">

                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>加款历史</span>
                            <span className="pull-right">
                                <a href="javascript:void(0);" className="btn btn-info mr15"
                                   onClick={this.doFlushData.bind(this, 'finish')}>
                                    <i className="icon-search"></i><span>已处理</span>
                                </a>
                            </span>
                            <span className="pull-right">
                                <a href="javascript:void(0);" className="btn btn-info mr15"
                                   onClick={this.doFlushData.bind(this, 'apply')}>
                                    <i className="icon-search"></i><span>待处理</span>
                                </a>
                            </span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>用户</th>
                                    <th>加款方式</th>
                                    <th>账号</th>
                                    <th>金额</th>
                                    <th>时间</th>
                                    <th>结果</th>
                                    <th>操作人</th>
                                    <th className="text-center">操作</th>
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

                    <AuthWindow opt={this.state.opt}
                                id={this.state.id}/>
                    <ConfirmWindow opt={this.state.opt}
                                   id={this.state.id}
                                   doFlushData={this.doFlushData}/>
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
        var request_data = {'auth_num': auth_num, 'type': 'approve'};
        $.ajax({
            url: '/api/deposit/auth',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    $("#authWindow").modal("hide");
                    //$("#confirmWindow").modal("show");
                    alert("授权成功");
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
                                <div className="col-xs-1">
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

//确认窗口
var ConfirmWindow = React.createClass({
    onConfirm: function () {
        $("#confirmWindow").modal("hide");
        var request_data = {'opt': this.props.opt, id: this.props.id};
        $.ajax({
            url: '/api/deposit/approve',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    alert(resp.msg);
                    this.props.doFlushData('apply');
                } else {
                    alert("操作失败:" + resp.msg);
                    return;
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var cNode = null;
        if (this.props.opt == 'pass') {
            cNode = (<h4>确认批准此笔加款申请?</h4>);
        } else if (this.props.opt == 'reject') {
            cNode = (<h4>确认拒绝此笔加款申请?</h4>);
        } else {
            cNode = (<h4>出错啦！！！</h4>);
        }

        return (
            <div className="modal" id="confirmWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-min">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h5 className="modal-title" id="priceModalLabel"></h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body dialog_cont">
                                <div className="col-md-3 text-right"><h1 className="icon-ok-sign"></h1></div>
                                <div className="col-md-9">
                                    {cNode}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onConfirm}>确定</button>
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