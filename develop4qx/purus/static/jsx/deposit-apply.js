//汇总模块

var DataPanel = React.createClass({

    render: function () {
        return (
            <section className="wrapper">
                <InputPanel />
            </section>
        );
    }
});

//输入信息模块
var InputPanel = React.createClass({
    getInitialState: function () {
        return {
            data_list: [],
            amount: '',
        };
    },

    componentDidMount: function () {
        this.doFlushData();
    },

    //获取数据
    doFlushData: function () {
        var request_data = {'page': 1, 'size': 10};
        $.ajax({
            url: '/api/deposit/apply_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    this.setState({data_list: resp.data_list, max: resp.max});
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

    doConfirm: function () {
        var channel = $('#dep_channel').val();
        var account = $('#dep_account').val();
        var amount = $('#dep_amount').val();

        this.setState({amount: amount});
        if (channel != 'alipay' && channel != 'debit_card' && channel != 'account' && channel != 'busi-alipay') {
            alert('加款渠道错误')
            return
        }
        if (!account) {
            alert('账号不能为空')
            return
        }

        if (!amount.match('^[0-9]{1,7}$')) {
            alert('加款金额错误')
            return
        }

        $("#confirmWindow").modal("show");
    },

    render: function () {
        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-search"></i>加款信息</span>
                        </header>
                        <div className="panel-body">
                            <form className="form-horizontal" method="get">

                                <div className="form-group form-border">
                                    <label className="col-sm-2 col-md-1 control-label">加款方式</label>

                                    <div className="col-sm-8 col-md-2">
                                        <select id="dep_channel" className="form-control m-bot15 input-sm">
                                            <option value="alipay">支付宝</option>
                                            <option value="debit_card">银行卡</option>
                                            <option value="account">公帐</option>
                                            <option value="busi-alipay">企业支付宝</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group form-border">

                                    <label className="col-sm-2 col-md-1 control-label">加款账号</label>

                                    <div className="col-sm-8 col-md-2">
                                        <input id="dep_account" type="text" className="form-control m-bot15 input-sm"/>
                                    </div>
                                </div>

                                <div className="form-group form-border">

                                    <label className="col-sm-2 col-md-1 control-label">加款金额</label>

                                    <div className="col-sm-8 col-md-2">
                                        <input id="dep_amount" type="text"  className="form-control m-bot15 input-sm"/>
                                    </div>
                                </div>

                                <div className="col-md-offset-5 col-md-5">
                                    <a href="javascript:void(0);" className="btn btn-danger" onClick={this.doConfirm}>
                                        <i className="icon-search"></i>申请</a>
                                </div>
                            </form>
                        </div>
                    </section>
                    <ConfirmWindow doFlushData={this.doFlushData}
                                       amount={this.state.amount}/>
                    <DataList data_list={this.state.data_list}
                              max={this.state.max}/>
                </div>
            </div>
        );
    }
});

//弹出的操作确认窗口
var ConfirmWindow = React.createClass({
    onConfirm: function () {

        $("#confirmWindow").modal("hide");

        var channel = $('#dep_channel').val();
        var account = $('#dep_account').val();
        var amount = $('#dep_amount').val();


        this.setState({amount: amount});
        request_data = {'channel': channel, 'account': account, 'amount': amount};

        $.ajax({
            url: '/api/deposit/apply',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                //console.debug(JSON.stringify(resp));
                if (resp.status == 'success') {
                    alert("操作成功,请等待审核...")
                    this.props.doFlushData();
                } else {
                    //alert(JSON.stringify(resp));
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
        var amount = this.props.amount;
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
                                    <h4>请确认加款金额为 <b style={{color: "red"}}>{amount}</b> 元</h4>
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


//加款历史模块
var DataList = React.createClass({
    getInitialState: function () {
        return {
            data_list: [],
            page: 1,
            size: 10,
            max: 0
        };
    },

    //获取数据
    doGetData: function (page, size) {
        var request_data = {'page': page, 'size': size};
        $.ajax({
            url: '/api/deposit/apply_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'success') {
                    if (this.props.data_list != null) {
                        this.props.data_list = null;
                    }
                    this.setState({data_list: resp.data_list, max: resp.max});
                    //this.props.data_list = null;
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

    doMoreData: function (page) {
        this.setState({page: page});
        //this.state.page = page;
        this.doGetData(page, this.state.size);
    },

    doFlushData: function () {
        page = 1;
        this.doGetData(page, this.state.size);
    },

    /*componentDidMount: function () {
        this.doGetData(this.state.page, this.state.size);
    },*/


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
        if (this.props.data_list != null) {
            datas = this.props.data_list;
            this.state.data_list = this.props.data_list;
        } else {
            datas = this.state.data_list;
        }
        var dataNode = datas.map(function (data, index) {
                return (
                    <tr>
                        <td>{data.channel}</td>
                        <td>{data.account}</td>
                        <td><div className="amount">{data.amount.toFixed(3)}</div></td>
                        <td>{data.time_stamp}</td>
                        <td>{data.status}</td>
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
                            <span className="pull-left"><i className="icon-table"></i>加款历史</span>
                            <span className="pull-right">
                                <a href="javascript:void(0);" className="btn btn-info mr15"
                                   onClick={this.doFlushData}>
                                    <i className="icon-time"></i><span>刷新</span>
                                </a>
                            </span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>加款方式</th>
                                    <th>账号</th>
                                    <th>金额</th>
                                    <th>时间</th>
                                    <th>结果</th>
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

React.render(
    <DataPanel />
    ,
    document.getElementById('main-content')
);