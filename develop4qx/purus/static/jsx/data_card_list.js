//汇总模块
var DataPanel = React.createClass({
    loadShipmentList: function(){
        request_data = {
            'request_type':'query_card_shipment_list',
        };
        $.ajax({
            url: '/api/data_card/manage/data_card_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),

            success: function (resp) {
                if (resp.status == 'success')
                {
                    this.setState({
                        data_list:  this.state.data_list,
                        page:  this.state.page,
                        max: this.state.max,
                        filter: this.state.filter,
                        shipment_list:  resp.data
                    });

                    $('#form_serial_num').multiselect({maxHeight: 180,buttonContainer: '<div class="btn-group form_serial_num" />'});

                    //这里读取链接上的参数
                    var re_user = new RegExp("serial_num=(.+)");
                    var result = re_user.exec(location.search);
                    if (result)
                    {
                        $('#form_serial_num').multiselect('select', result[1]);
                    }
                }else{
                    alert("查询失败,"+resp.msg);
                }
                $("#loadingWindow").modal("hide");
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            shipment_list: [],
            data_list: [],
            filter: {},
            page: 1,
            max: 0,
            size: 20
        };
    },

    componentDidMount: function () {
        this.loadDataList({}, 1);
    },

    loadDataList: function (filter, page) {
        if (!filter) {
            filter = this.state.filter;
        }
        filter['page'] = page || this.state.page;
        filter['size'] = this.state.size;

        request_data = {
            'request_type':'query',
            'argument_list':filter
        }

        //console.debug(JSON.stringify(filter));

        $.ajax({
            url: '/api/data_card/manage/data_card_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),

            success: function (resp) {
                if (resp.status == 'success')
                {
                    this.setState({
                        data_list: resp.data.data_list,
                        page: resp.data.page,
                        max: resp.data.max,
                        filter: filter,
                        shipment_list: this.state.shipment_list,
                        size: this.state.size
                    });
                }else{
                    alert("查询失败,"+resp.msg);
                }

                $("#loadingWindow").modal("hide");
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function () {
        this.loadShipmentList();
    },

    render: function () {
        return (
            <section className="wrapper">
                <QueryPanel loadDataList={this.loadDataList} shipment_list={this.state.shipment_list}/>
                <DataList data_list={this.state.data_list}
                          loadDataList={this.loadDataList}
                           page={this.state.page}
                           max={this.state.max}/>
            </section>

        );
    }
});


//查询模块
var QueryPanel = React.createClass({

    doFilter: function () {
        var filter = {
            'serial_num': $('#form_serial_num').val(),
            'card_id': $('#form_card_id').val(),
            'password': $('#form_password').val(),
            'mobile': $('#form_mobile').val(),
            'status': $('#form_status').val()
        };
        $("#loadingWindow").modal("show");
        this.props.loadDataList(filter);
    },

    render: function () {
        var shipmentNodes = this.props.shipment_list.map(function (shipment, index) {
             return (<option value={shipment.serial_num}>{shipment.serial_num}</option>);
        });

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-search"></i>卡密查询</span>
                        </header>
                        <div className="panel-body">
                            <form className="form-horizontal" method="get">
                                <div className="form-group">
                                    <label className="col-sm-2 col-md-1 control-label">批次号</label>
                                    <div className="col-sm-3 col-md-2 example">
                                        <select id="form_serial_num">
                                            {shipmentNodes}
                                        </select>
                                    </div>

                                    <label className="col-sm-2 col-md-1 control-label">卡号</label>
                                    <div className="col-sm-3 col-md-2">
                                        <input id="form_card_id" type="text" className="form-control input-sm" maxLength="45"/>
                                    </div>

                                    <label className="col-sm-2 col-md-1 control-label">手机号</label>
                                    <div className="col-sm-3 col-md-2">
                                        <input id="form_mobile" type="text" className="form-control input-sm" maxLength="15"/>
                                    </div>
                                </div>
                                <div className="col-md-offset-1 col-md-5">
                                    <a href="javascript:void(0);" className="btn btn-danger" onClick={this.doFilter}>
                                        <i className="icon-search"></i>搜索</a>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

});

//数据列表模块
var DataList = React.createClass({

    onDataNodeOperation: function (serial_num, card_id, request_type) {
        this.setState({
             request_type: request_type,
             serial_num: serial_num,
             card_id: card_id,
             recharge_record_list: this.state.recharge_record_list
        });
        $('#confirmWindow').modal('show');
    },

    onLoadPage: function (page) {
        this.props.loadDataList(undefined,page);
    },

    onShowCardRechargeRecord: function(serial_num, card_id){
        recharge_record_list = [];

        request_data = {
            "request_type": "query_recharge_record",
            "serial_num": serial_num,
            "card_id": card_id,
        }

        console.debug(JSON.stringify(request_data));

        $.ajax({
            url: '/api/data_card/manage/data_card',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),

            success: function (resp) {

                if(resp.status == "success")
                {
                    this.setState({
                        request_type: this.state.request_type,
                        serial_num: serial_num,
                        card_id: card_id,
                        recharge_record_list: resp.data
                    });
                    $('#recordWindow').modal('show');
                }
                else
                {
                    alert('查询失败,'+resp.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert('['+ status + ']' + err.toString())
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
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
                                onClick={this.onLoadPage.bind(this, btn.index)}>
                    <i className={btn.icon}></i>
                </button>);
            } else if (btn.index == p) {
                return (<button key={'p' + i} className="btn btn-primary" type="button"
                                onClick={this.onLoadPage.bind(this, btn.index)}>
                    {btn.title}
                </button>);
            } else {
                return (<button key={'p' + i} className="btn btn-default" type="button"
                                onClick={this.onLoadPage.bind(this, btn.index)}>
                    {btn.title}
                </button>);
            }
        }.bind(this));

        return page_group;
    },

    getInitialState: function () {
        return {
             request_type: '',
             serial_num: '',
             card_id: '',
             recharge_record_list: []
        };
    },

    render: function () {
            var cardNode = this.props.data_list.map(function (card, index) {
                var actvNode = null;
                var voidNode = null;

                //  edit mode
                if (card.is_destroy =='') {
                    actvNode = (<a href="javascript:void(0);"  className="btn btn-danger btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this,card.serial_num, card.card_id,'destroy')}>作废</a>);
                } else{
                    actvNode = (<a href="javascript:void(0);"  className="btn btn-success btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this,card.serial_num, card.card_id,'recover')}>恢复</a>);
                }

                if (card.is_used =='已使用') {
                    voidNode = (<a href="javascript:void(0);"  className="btn btn-primary btn-sm btn-activate" onClick={this.onShowCardRechargeRecord.bind(this,card.serial_num, card.card_id)}>查看</a>);
                } else {
                    voidNode=(<span className="btn btn-activate">/</span>);
                }
                return (
                    <tr>
                        <td>{card.serial_num}</td>
                        <td>{card.card_id}</td>
                        <td>{card.data_packet_name}</td>
                        <td>{card.carrier_list}</td>
                        <td>{card.open_time}</td>
                        <td>{card.end_time}</td>
                        <td>{card.recharge_max_time}</td>
                        <td>{card.is_used}</td>
                        <td className="text-center">{actvNode}</td>
                        <td className="text-center">{voidNode}</td>
                    </tr>
                )
            }.bind(this)
        );

        var page_group = this.getPagination(this.props.page, this.props.max);

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>卡密列表</span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>批次号</th>
                                    <th>卡号</th>
                                    <th>流量包名称</th>
                                    <th>运营商</th>
                                    <th>开卡日期</th>
                                    <th>截止日期</th>
                                    <th>充值方案</th>
                                    <th>状态</th>
                                    <th className="text-center">操作</th>
                                    <th className="text-center">充值记录</th>
                                </tr>
                                </thead>
                                <tbody>
                                {cardNode}
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
                    <ConfirmWindow
                        request_type = {this.state.request_type}
                        card_id = {this.state.card_id}
                        serial_num = {this.state.serial_num}
                        loadDataList = {this.props.loadDataList}/>
                    <RecordWindow
                        card_id = {this.state.card_id}
                        serial_num = {this.state.serial_num}
                        recharge_record_list = {this.state.recharge_record_list} />
                    <LoadingWindow />
                </div>
            </div>
        );
    }
});

//弹出的操作确认窗口
//作废确认窗口
var ConfirmWindow = React.createClass({

    onConfirm: function () {
        card_id = this.props.card_id;
        serial_num = this.props.serial_num;
        request_type = this.props.request_type;
        var data = JSON.stringify({'serial_num':serial_num, 'card_id': card_id,'request_type':request_type});
        $.ajax({
            url: '/api/data_card/manage/data_card',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    if(request_type == 'destroy')
                    {
                        alert("操作成功");
                    }
                    this.props.loadDataList();
                    $("#confirmWindow").modal("hide");
                }
                else
                {
                    alert('操作失败 - ' + resp.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },


    render: function () {
        msg = null;
        if(this.props.request_type == 'destroy')
        {
            msg = "确认作废此卡？？？"
        }
        else if(this.props.request_type == 'recover')
        {
            msg = "真的要恢复这张卡吗？？？？？"
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
                                <div className="col-md-4 text-right"><h1 className="icon-ok-sign"></h1></div>
                                <div className="col-md-8"><h4>{msg}</h4><h5>卡号：{this.props.card_id}</h5></div>
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


//弹出的充值记录窗口
var RecordWindow = React.createClass({
    render: function () {
        var rechargeRecordNodes = this.props.recharge_record_list.map(function (record, index) {
             return (
                    <tr>
                        <td>{record.mobile}</td>
                        <td>{record.child_packet_name}</td>
                        <td>{record.order_id}</td>
                        <td>{record.status}</td>
                        <td>{record.req_time}</td>
                    </tr>
                )
        });
        return (
            <div className="modal" id="recordWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-max">
                    <div className="modal-content">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>充值记录 <b>(批次号：{this.props.serial_num}， 卡号：{this.props.card_id})</b></span>
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                        </header>
                        <div className="modal-body form-horizontal">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>手机</th>
                                    <th>流量子包</th>
                                    <th>订单号</th>
                                    <th>充值状态</th>
                                    <th>充值时间</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {rechargeRecordNodes}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-default" data-dismiss="modal">关闭</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});


//等待窗口
var LoadingWindow = React.createClass({
    render: function (){
        return(
            <div className="modal" id="loadingWindow" backdrop="false">
                 <h1 className="icon-spinner icon-spin loading-icon"></h1>
            </div>
        )
    }
});

React.render(
    <DataPanel />
    ,
    document.getElementById('main-content')
);