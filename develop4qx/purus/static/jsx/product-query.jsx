var React = require('react');
var ReactDOM = require('react-dom');
//汇总模块

var carrier_value_map = {
    '1': '移动',
    '2': '联通',
    '3': '电信',
    'sinopec': '中石化'
}

function get_carrier_value(value){
    if (carrier_value_map[value])
    {
        return carrier_value_map[value];
    }
    else
    {
        return "未知" + "("+value+")";
    }    
}

var bool_value_map = {
    '0': '否',
    '1': '是'
    
}

function get_bool_value(value){
    if (bool_value_map[value])
    {
        return bool_value_map[value];
    }
    else
    {
        return "未知" + "("+value+")";
    }    
}

var status_value_map = {
    'enabled': '开通',
    'disabled': '关闭'
}

function get_status_value(value){
    if (status_value_map[value])
    {
        return status_value_map[value];
    }
    else
    {
        return "未知" + "("+value+")";
    }    
}





var productcatalog_value_map = {

    'MAP': '移动前向(卓望)通用流量',
    'MGD': '广东移动(全国)通用流量',
    'MHA': '河南移动(全国)通用流量',
    'MJS': '江苏移动(全国)通用流量',
    'MSN': '陕西移动(全国)通用流量',
    'MZJ': '浙江移动(全国)通用流量',
    'MSC': '四川移动(全国)通用流量',
    'MAH': '安徽移动(全国)通用流量',
    'MFJ': '福建移动(全国)通用流量',
    'MBJ': '北京移动(全国)通用流量',
    'MJS5':'江苏移动(全国)通用流量(分省编码)',
    'MGXB':'广西移动(全国)通用流量(新版等级)',
    'MGDB':'广东移动(全国)通用流量(新版等级)',
    'MGD5':'广东移动(全国)通用流量(分省编码)',
    'MHB':	'湖北移动(全国)通用流量',
    'MCN':	'移动(全国)通用流量',
    'UCN':	'联通流量包',
    'CCN':	'电信(全国)流量包',
    'CGD':	'电信(广东)流量包',
    'CJS':	'电信(江苏)流量包',
    'CJS5':	'电信(江苏)流量包(分省编码)',
    'SINOCN':	'中石化直充'   
}

function get_productcatalog_value(value){
    if (productcatalog_value_map[value])
    {
        return productcatalog_value_map[value];
    }
    else
    {
        return "未知" + "("+value+")";
    }    
}

var DataPanel = React.createClass({
    getInitialState: function () {
        return {
            data_list: [],
            interface_list: [],
            interface_list_map:{},
            user_list: [],
            product_catalog_list:[],
            product_catalog_list_map:{},
            filter: {},
            page: 1,
            max: 0,
            size: 20
        };
    },
    
    componentDidMount: function () {
        this.loadUserList();
        this.loadInterfaceList();
        this.loadProductList();


    },

    loadUserList: function () {
        $.ajax({
            url: '/api/user/list',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                //console.info('USER:' + JSON.stringify(data));
                this.setState({
                    'user_list': data
                });

                $('#fid_user').selectpicker({});

            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },


    loadProductList: function () {
        $.ajax({

            url: '/api/services/product/catalog',
            dataType: 'json',
            type: 'post',
            success: function (resp) {
                //console.info('PRODUCT:' + JSON.stringify(resp));
                
                var product_catalog_list_map = {}
                for (var i in resp.data) {
                    product_catalog_list_map[resp.data[i].catalog_id] = resp.data[i].name;
                }
                this.setState({ 'product_catalog_list': resp.data,
                    'product_catalog_list_map': product_catalog_list_map}); 
                $('#fid_productcatalog').selectpicker({});

            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    
    
    
    loadInterfaceList: function () {
        $.ajax({
            url: '/api/interface/list_local',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                interface_list_map={}
                for (var i in data) {
                    interface_list_map[data[i].id] = data[i].name;
                }                
                
                this.setState({
                    'interface_list': data,
                    'interface_list_map': interface_list_map,
                    
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadDataList: function (filter, page) {
        if (!filter) {
            filter = this.state.filter;
        }

        filter['page'] = page || this.state.page;
        filter['size'] = this.state.size;

        $.ajax({
            url: '/api/services/product/list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(filter),

            success: function (resp) {
                console.log(JSON.stringify(resp));
                if (resp.status == 'ok') {
                    //alert("查询成功," + resp.data);
                    this.setState({
                        page: resp.page,
                        max: resp.max,
                        filter: filter,
                        data_list: resp.data
                    });                  
                }
                else{
                this.setState({
                    'data_list': []
                });
                }
                $("#loadingWindow").modal("hide");
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            <section className="wrapper">
                <QueryPanel
                    loadDataList={this.loadDataList}
                    user_list={this.state.user_list}
                    interface_list={this.state.interface_list}
                    product_catalog_list={this.state.product_catalog_list}
                />
                <DataList data_list={this.state.data_list}
                          product_catalog_list_map={this.state.product_catalog_list_map}
                          interface_list_map={this.state.interface_list_map}
                          page={this.state.page}
                          max={this.state.max}
                          loadDataList={this.loadDataList}/>
            </section>

        );
    }
});

//查询模块
var QueryPanel = React.createClass({
    doFilter: function () {
        var filter = {
            'userid': $('#fid_userid').val(),
            'productcatalog': $('#fid_productcatalog').val(),
            'status': $('#fid_status').val(),
            'route': $('#fid_route').val(), 
            'carrier': $('#fid_carrier').val(),
        };
        $("#loadingWindow").modal("show");

        this.props.loadDataList(filter, 1);
    },

    render: function () {

        var userNode = this.props.user_list.map(function (u, i) {
            return (<option value={u.master}>{u.master} - {u.name}</option>);
        });


        var productcatalogNode = this.props.product_catalog_list.map(function (u, i) { 
            return (<option value={u.catalog_id}>{u.catalog_id} - {u.name}</option>);
        });
        
        
        var interfaceNode = this.props.interface_list.map(function (u, i) {
            return (<option value={u.id}>{u.id} -> {u.name}</option>);
        });

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <div className="panel-body">
                            <form className="form-horizontal" method="get">
                                <div className="form-group form-border">


                                    <lable className='control-label col-sm-1 col-md-1'>用户</lable>
                                    <div className='col-sm-2 col-md-3'>
                                        <select className='form-control m-bot15 input-sm'
                                                id='fid_userid' data-live-search="true">
                                            {userNode}
                                        </select>
                                    </div>


                                    <lable className='control-label col-sm-1 col-md-1'>产品名称</lable>
                                    <div className='col-sm-2 col-md-3'>
                                        <select className='form-control m-bot15 input-sm'
                                                id='fid_productcatalog' data-live-search="true">
                                            <option value=''>全部</option>
                                            {productcatalogNode}
                                        </select>
                                    </div>

                                    <lable className='control-label col-sm-1 col-md-1'>路由</lable>
                                    <div className='col-sm-2 col-md-3'>
                                        <select className='form-control m-bot15 input-sm'
                                                id='fid_route' data-live-search="true">
                                            <option value=''>全部</option>
                                            {interfaceNode}
                                        </select>
                                    </div>
                                    
                                    <label className="col-sm-2 col-md-1 control-label">运营商</label>
                                    <div className="col-sm-8 col-md-3">
                                        <select id="fid_carrier" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="1">移动</option>
                                            <option value="2">联通</option>
                                            <option value="3">电信</option>
                                            <option value="sinopec">中石化</option>
                                        </select>
                                    </div>
                                                                        

                                    <div className="col-md-offset-1 col-md-2">
                                        <a href="javascript:void(0);" className="btn btn-danger"
                                           onClick={this.doFilter}>
                                            <i className="icon-search"></i>查询</a>
                                    </div>

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
    //操作事件
    onConfirmNodeOperation: function (id_num, request_type) {
        this.setState({
            request_type: request_type,
            id_num: id_num,
            phone: this.state.phone,
            up_detail: this.state.up_detail,
            loadIdnumList: this.state.loadIdnumList
        });
        $('#confirmWindow').modal('show');
    },

    //订单号事件
    onIdNodeOperation: function (id_num, phone, up_detail, card_detail) {
        var loadUpdetail = [];
        var loadCarddetail = [];

        var request_data = {"id": id_num};

        //console.debug(JSON.stringify(request_data));
        $.ajax({
            url: '/api/services/ups',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
//                    console.debug(JSON.stringify(resp));

                if (resp.status == 'fail') {
                    alert("查询失败," + resp.msg);
                    return;
                } else {
//                        alert(JSON.stringify(resp));

                    this.setState({
                        id_num: id_num,
                        phone: phone,
                        loadUpdetail: resp.up_detail,
                        //loadCarddetail: resp.card_detail
                    });
                }
                $('#idnumWindow').modal('show');
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

    },

    //快速检索事件
    cardFilter: function (datatime) {

        var startDate = moment().startOf('days').subtract('day', 30);
        var endDate_12 = moment().subtract('hour', 12);
        var endDate_24 = moment().subtract('hour', 24);

        $('#fid_date').data('daterangepicker').setStartDate(startDate);
        $('#fid_date_start').val(startDate.format('YYYY/MM/DD HH:mm:ss'));

        $('#fid_state').val("processing");
        if (datatime == "12") {
            $('#fid_date').data('daterangepicker').setEndDate(endDate_12);
            $('#fid_date_end').val(endDate_12.format('YYYY/MM/DD HH:mm:ss'));
        }
        else if (datatime == "24") {
            $('#fid_date').data('daterangepicker').setEndDate(endDate_24);
            $('#fid_date_end').val(endDate_24.format('YYYY/MM/DD HH:mm:ss'));
        }
        var filter = {
            'phone': $('#fix_phone').val(),
            'id': $('#fix_id').val(),
            'start': $('#fid_date_start').val(),
            'end': $('#fid_date_end').val(),
            //'result': $('#fid_result').val(),
            'state': $('#fid_state').val(),
            'product': $('#fid_product').val(),
            'area': $('#fid_area').val(),
            'carrier': $('#fid_carrier').val(),
        };
        $("#loadingWindow").modal("show");
        this.props.loadDataList(filter, 1);
    },

    onLoadPage: function (page) {
        this.props.loadDataList(undefined, page);
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
            id_num: '',
            phone: '',
            up_detail: '',
            loadUpdetail: [],
            loadCarddetail: []
        };
    },

    render: function () {
        var dataNode = this.props.data_list.map(function (data, index) {
                var idNode = null;
                var actvNode = null;
                var voidNode = null;               
                idNode = (<a href="javascript:void(0);"
                             onClick={this.onIdNodeOperation.bind(this, data.id, data.phone,data.up_detail,data.card_detail)}>{data.id}</a>);                    
                var interface_name='';
                for (var i in data.routing) {
                    if (interface_name != ''){
                        interface_name += ','
                    }
                    if (this.props.interface_list_map[data.routing[i]] ) {
                        interface_name += this.props.interface_list_map[data.routing[i]]
                    } else{
                        interface_name += data.routing[i]
                    }                    
                }
                return (
                    <tr>
                        <td>{data.user_id}</td>
                        <td>{this.props.product_catalog_list_map[data.catalog_id]}</td>
                        <td>{get_carrier_value(data.carrier)}</td>
                        <td>{get_bool_value(data.cn_tag)}</td>
                        <td>{data.price}</td>
                        <td>{data.status_time}</td>
                        <td>{data.value}</td>
                        <td>{interface_name}</td>
                        <td>{data.supply_time}</td>
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
                            <span className="pull-left"><i className="icon-table"></i>产品列表</span>

                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>用户名</th>
                                    <th>产品名称</th>
                                    <th>运营商</th>
                                    <th>全国包</th>
                                    <th>面值</th>
                                    <th>状态时间</th>
                                    <th>密价</th>
                                    <th>上游接口</th>
                                    <th>切换时间</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dataNode}
                                </tbody>
                            </table>
                        </div>

                    </section>
                    <IdnumWindow id_num={this.state.id_num}
                                 phone={this.state.phone}
                                 loadUpdetail={this.state.loadUpdetail}/>

                    <ConfirmWindow id_num={this.state.id_num}
                                   request_type={this.state.request_type}
                                   loadDataList={this.props.loadDataList}/>
                    <LoadingWindow />
                </div>
            </div>
        );
    }
});

//订单编号窗口
var IdnumWindow = React.createClass({

    render: function () {

        var upDetailNodes = this.props.loadUpdetail.map(function (up, index) {

            var up_list = up.content.map(function (up_content, index) {
                return (
                    <h5 key={"up"+index} className="form-group col-md-12">
                        <label className="col-sm-3">{up_content.k} :</label>
                        <span className="col-sm-9">{up_content.v}</span>
                    </h5>
                );
            });

            return (
                <div key={"detail"+index} className="panel">
                    <div className="modal-header"><h5 className="modal-title">{up.title}</h5></div>
                    <div className="modal-body">
                        <div className="form-group col-md-12">
                            {up_list}
                        </div>
                    </div>
                </div>
            );
        });

        return (
            <div className="modal" id="idnumWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="priceModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="idnumtitle">订单编号 : {this.props.id_num}</h5>
                        </div>
                        <div className="modal-body form-horizontal" id="idnumform">
                            {upDetailNodes}
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

//弹出的操作确认窗口
var ConfirmWindow = React.createClass({
    onConfirm: function () {

        var data = {
            'order_id': this.props.id_num,
            'notes': $('#notes').val()
        };

        if (this.props.request_type == 'ok') {
            data.result_code = '1'
        } else if (this.props.request_type == 'fail') {
            data.result_code = '9'
        }
        alert(JSON.stringify(data));

        $.ajax({
            url: '/api/services/manual',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(data),

            success: function (resp) {
                //console.log(JSON.stringify(resp));
                alert(resp.msg);
                $("#confirmWindow").modal("hide");
            }.bind(this),

            error: function (xhr, status, err) {
                alert('手工回单失败');
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var msg = null;
        var notes = null;

        if (this.props.request_type == "ok") {
            msg = '确定置成功此订单?';
            notes = (
                <select id='notes'>
                    <option>上游未回</option>
                    <option>接口异常</option>
                </select>
            );
        } else if (this.props.request_type == "fail") {
            msg = '确定置失败此订单?';
            notes = (
                <select id='notes'>
                    <option>上游未回</option>
                    <option>超时</option>
                </select>
            );
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
                                    <h4>{msg}</h4>
                                    <h5>订单编号：{this.props.id_num}</h5>

                                    <label>错误原因：</label>
                                    {notes}
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


//等待窗口
var LoadingWindow = React.createClass({
    render: function () {
        return (
            <div className="modal" id="loadingWindow" backdrop="false">
                <h1 className="icon-spinner icon-spin loading-icon"></h1>
            </div>
        )
    }
});

ReactDOM.render(
    <DataPanel />,
    document.getElementById('main-content')
);