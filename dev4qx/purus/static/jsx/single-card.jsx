var React = require('react');
var ReactDOM = require('react-dom');

//汇总模块
var DataPanel = React.createClass({
    getInitialState: function () {
        return {
            data_list: [],
            interface_list: [],
            user_list: [],
            filter: {},
            page: 1,
            max: 0,
            size: 20
        };
    },

    componentDidMount: function () {
        this.loadUserList();
        this.loadInterfaceList();

        $('#fid_date').daterangepicker({
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
                $('#fid_date_start').val(moment(start).format('YYYY/MM/DD HH:mm:ss'));
                $('#fid_date_end').val(moment(end).format('YYYY/MM/DD HH:mm:ss'));
            });

        // init
        var startDate = moment().startOf('days');
        var endDate = moment().startOf('days').add('days', 1);
        $('#fid_date').data('daterangepicker').setStartDate(startDate);
        $('#fid_date').data('daterangepicker').setEndDate(endDate);
        $('#fid_date_start').val(startDate.format('YYYY/MM/DD HH:mm:ss'));
        $('#fid_date_end').val(endDate.format('YYYY/MM/DD HH:mm:ss'));
        $("#idnumform").niceScroll({
            styler: "fb",
            cursorcolor: "#007AFF",
            cursorwidth: '3',
            cursorborderradius: '10px',
            background: '#F7F7F7',
            cursorborder: ''
        });
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
                $('#fid_supply_user').selectpicker({});

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
                this.setState({
                    'interface_list': data
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadDataList: function (page, filter) {
        var _filter = filter || this.state.filter;

        _filter['page'] = page || this.state.page;
        _filter['size'] = this.state.size;

        $.ajax({
            url: '/api/services/order',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(_filter),

            success: function (resp) {
                //console.log(JSON.stringify(resp));
                if (resp.status == 'fail') {
                    alert("查询失败," + resp.msg);
                    Hidefullbg();
                    return;
                } else {
                    this.setState({
                        page: resp.page,
                        max: resp.max,
                        filter: _filter,
                        data_list: resp.data
                    });
                }
                Hidefullbg();
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
                Hidefullbg();
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
                />
                <DataList data_list={this.state.data_list}
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
            'phone': $('#fix_phone').val(),
            'id': $('#fix_id').val(),
            'start': $('#fid_date_start').val(),
            'end': $('#fid_date_end').val(),
            'supply_type':$('#fid_supply_type').val(),
            //'result': $('#fid_result').val(),
            'state': $('#fid_state').val(),
            'product': $('#fid_product').val(),
            'area': $('#fid_area').val(),
            'carrier': $('#fid_carrier').val(),
            'user_id': $('#fid_user').val(),
            'supply_user_id': $('#fid_supply_user').val(),
            'route': $('#fid_route').val()
        };
        Showfullbg();
        this.props.loadDataList(1,filter);
    },

    // 输入框Enter绑定
    onInputKeyUp: function (e) {
        if (!e) var e = window.event;
        if (e.keyCode == 13) {
            this.doFilter();
        }
    },

    render: function () {

        var userNode = this.props.user_list.map(function (u, i) {
            return (<option key={"userNode_"+i} value={u.master}>{u.master} - {u.name}</option>);
        });

        var interfaceNode = this.props.interface_list.map(function (u, i) {
            return (<option key={"interfaceNode"+i} value={u.id}>{u.name}</option>);
        });

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <div className="panel-body">
                            <form className="form-horizontal" method="get">
                                <div className="form-group row">
                                    <div className="col-md-12 row m-bot10">
                                        <label className="col-sm-2 col-md-1 control-label">订单类型</label>

                                        <div className="col-sm-8 col-md-2">
                                            <select id="fid_supply_type" className="form-control input-sm">
                                                <option value="">采购订单</option>
                                                <option value="platform_use">供应订单</option>
                                                <option value="self_use">自用订单</option>
                                            </select>
                                        </div>

                                        <label className="col-sm-2 col-md-1 control-label">订单编号</label>

                                        <div className="col-sm-8 col-md-2">
                                            <input id="fix_id" type="text" className="form-control input-sm"
                                                   onKeyDown={this.onInputKeyUp}/>
                                        </div>

                                        <label className="col-sm-2 col-md-1 control-label">订单状态</label>

                                        <div className="col-sm-8 col-md-2">
                                            <select id="fid_state" className="form-control input-sm">
                                                <option value="">全部</option>
                                                <option value="success">成功</option>
                                                <option value="fail">失败</option>
                                                <option value="processing">充值中</option>
                                            </select>
                                        </div>

                                        <label className="col-sm-2 col-md-1 control-label">产品类型</label>

                                        <div className="col-sm-8 col-md-2">
                                            <select id="fid_product" className="form-control input-sm">
                                                <option value="data">流量</option>
                                                <option value="fee">话费</option>
                                                <option value="sinopec">油卡</option>
                                                <option value="">全部</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-12 row">
                                        <label className="col-sm-2 col-md-1 control-label">手机号</label>
                                        <div className="col-sm-8 col-md-2">
                                            <input id="fix_phone" type="text" className="form-control m-bot15 input-sm"
                                                onKeyDown={this.onInputKeyUp}/>
                                        </div>

                                        <label className="col-sm-2 col-md-1 control-label">运营商</label>
                                        <div className="col-sm-8 col-md-2">
                                            <select id="fid_carrier" className="form-control input-sm">
                                                <option value="">全部</option>
                                                <option value="1">移动</option>
                                                <option value="2">联通</option>
                                                <option value="3">电信</option>
                                            </select>
                                        </div>

                                        <label className="col-sm-2 col-md-1 control-label">省份</label>

                                        <div className="col-sm-8 col-md-2">
                                            <select id="fid_area" className="form-control input-sm">
                                                <option value="">全部</option>
                                                <option value="BJ">北京</option>
                                                <option value="TJ">天津</option>
                                                <option value="HE">河北</option>
                                                <option value="SX">山西</option>
                                                <option value="NM">内蒙古</option>
                                                <option value="LN">辽宁</option>
                                                <option value="JL">吉林</option>
                                                <option value="HL">黑龙江</option>
                                                <option value="SH">上海</option>
                                                <option value="JS">江苏</option>
                                                <option value="ZJ">浙江</option>
                                                <option value="AH">安徽</option>
                                                <option value="FJ">福建</option>
                                                <option value="JX">江西</option>
                                                <option value="SD">山东</option>
                                                <option value="HA">河南</option>
                                                <option value="HB">湖北</option>
                                                <option value="HN">湖南</option>
                                                <option value="GD">广东</option>
                                                <option value="GX">广西</option>
                                                <option value="HI">海南</option>
                                                <option value="CQ">重庆</option>
                                                <option value="SC">四川</option>
                                                <option value="GZ">贵州</option>
                                                <option value="YN">云南</option>
                                                <option value="XZ">西藏</option>
                                                <option value="SN">陕西</option>
                                                <option value="GS">甘肃</option>
                                                <option value="QH">青海</option>
                                                <option value="NX">宁夏</option>
                                                <option value="XJ">新疆</option>
                                                <option value="TW">台湾</option>
                                                <option value="HK">香港</option>
                                            </select>
                                        </div>

                                        <lable className='control-label col-sm-1 col-md-1'>上游接口</lable>
                                        <div className='col-sm-2 col-md-2'>
                                            <select className='form-control m-bot15 input-sm'
                                                    id='fid_route' data-live-search="true">
                                                <option value=''>全部</option>
                                                {interfaceNode}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-12 row">
                                        <label className="col-sm-2 col-md-1 control-label">状态时间</label>

                                        <div className="col-sm-8 col-md-5">
                                            <input id="fid_date" type="text" className="form-control m-bot15 input-sm"/>
                                            <input id="fid_date_start" type="hidden"/>
                                            <input id="fid_date_end" type="hidden"/>
                                        </div>

                                        <lable className='control-label col-sm-1 col-md-1'>下游用户</lable>
                                        <div className='col-sm-2 col-md-5'>
                                            <select className='form-control m-bot15 input-sm'
                                                    id='fid_user' data-live-search="true">
                                                <option value=''>全部</option>
                                                {userNode}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="col-md-12 row m-bot10">
                                        <lable className='control-label col-sm-1 col-md-1'>供货商</lable>
                                        <div className='col-sm-2 col-md-5'>
                                            <select className='form-control m-bot15 input-sm'
                                                    id='fid_supply_user' data-live-search="true">
                                                <option value=''>全部</option>
                                                {userNode}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-12 row">
                                        <div className="col-md-offset-1 col-md-2">
                                            <a href="javascript:void(0);" className="btn btn-danger"
                                               onClick={this.doFilter}><i className="icon-search" />搜索</a>
                                        </div>
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
    onIdNodeOperation: function (id_num, sp_id, phone, up_detail, card_detail) {
        var request_data = {"id": id_num};

        //console.debug(JSON.stringify(request_data));
        $.ajax({
            url: '/api/services/ups',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),
            success: function (resp) {
                if (resp.status == 'fail') {
                    alert("查询失败," + resp.msg);
                    return;
                } else {
                    this.setState({
                        id_num: id_num,
                        sp_id: sp_id,
                        phone: phone,
                        loadUpdetail: resp.up_detail,
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
        Showfullbg();
        this.props.loadDataList(1,filter);
    },

    getOrderTypeStr:function(i){
        var i_map ={
            'sell_order' : '采购订单',
            'supply_order': '供应订单'
        };
        return i_map[i];
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
            var actvNode = null;
            var voidNode = null;
            var idNode = (<a href="javascript:void(0);"
                         onClick={this.onIdNodeOperation.bind(this, data.id, data.sp_id, data.phone,data.up_detail,data.card_detail)}>{data.id}</a>);

            if (data.result == '充值中') {
                actvNode = (<a href="javascript:void(0);" className="btn btn-primary btn-sm btn-activate"
                               onClick={this.onConfirmNodeOperation.bind(this, data.id,"ok")}>置成功</a>);
                voidNode = (<a href="javascript:void(0);" className="btn btn-danger  btn-sm btn-activate"
                               onClick={this.onConfirmNodeOperation.bind(this, data.id,"fail")}>置失败</a>);

            }

            return (
                <tr key={"dataNode_"+index}>
                    <td>{idNode}</td>
                    <td>{data.user_name}</td>
                    <td>{data.supply_user_name}</td>
                    <td>{data.phone}</td>
                    <td>{data.price}</td>
                    <td>{data.name}</td>
                    <td>{data.carrier}</td>
                    <td>{data.create}</td>
                    <td>{data.result}</td>
                    <td>{data.update}</td>
                    <td>{data.route}</td>
                    <td className="text-center">{actvNode} {voidNode}</td>
                </tr>
            )
        }.bind(this));

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table" />订单列表</span>
                            <span className="pull-right">
                                <a href="javascript:void(0);" className="btn btn-info mr15" onClick={this.cardFilter.bind(this,"12")}>
                                    <i className="icon-time" /><span> 12小时卡单</span>
                                </a>
                                <a href="javascript:void(0);" className="btn btn-info" onClick={this.cardFilter.bind(this,"24")}>
                                    <i className="icon-time" /><span> 24小时卡单</span>
                                </a>
                            </span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>订单编号</th>
                                    <th>代理商名称</th>
                                    <th>供货商名称</th>
                                    <th>手机号</th>
                                    <th>面值</th>
                                    <th>产品名称</th>
                                    <th>运营商</th>
                                    <th>创建时间</th>
                                    <th>订单状态</th>
                                    <th>状态时间</th>
                                    <th>上游</th>
                                    <th className="text-center">操作</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dataNode}
                                </tbody>
                            </table>
                        </div>
                        <PageIndexGroup onQuery={this.props.loadDataList}
                                        page={this.props.page}
                                        max={this.props.max} />
                    </section>
                    <IdnumWindow id_num={this.state.id_num}
                                 sp_id = {this.state.sp_id}
                                 phone={this.state.phone}
                                 loadUpdetail={this.state.loadUpdetail}/>

                    <ConfirmWindow id_num={this.state.id_num}
                                   request_type={this.state.request_type}
                                   loadDataList={this.props.loadDataList}/>
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

        var spNodes = null;
        if (this.props.sp_id){
            spNodes = (
                <div className="panel">
                    <div className="modal-header"><h5 className="modal-title">代理商订单</h5></div>
                    <div className="modal-body">
                        <div className="form-group col-md-12">
                            <h5 className="form-group col-md-12">
                                <label className="col-sm-3">订单编号 :</label>
                                <span className="col-sm-9">{this.props.sp_id}</span>
                            </h5>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="modal" id="idnumWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="priceModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="idnumtitle">订单编号 : {this.props.id_num}</h5>
                        </div>
                        <div className="modal-body form-horizontal" id="idnumform">
                            {spNodes}
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
                            <i className="modal-title" id="priceModalLabel" />
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body dialog_cont">
                                <div className="col-md-3 text-right"><i className="icon-ok-sign" /></div>
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
                    <button key={"pageIndexBtnBodes_"+index} className="btn btn-default" disabled={disabled} type="button" onClick={this.onClickPage.bind(this,i)}>
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


ReactDOM.render(
    <DataPanel />
    ,
    document.getElementById('main-content')
);