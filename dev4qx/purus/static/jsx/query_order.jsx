var React = require('react');
var ReactDOM = require('react-dom');

var withdraw_id = getQueryStringByName('withdraw_id');
var user_id = getQueryStringByName('user_id');

var MainContentPanel = React.createClass({
    getInitialState: function () {
        return {
            order_list: [],
            filter: {},
            count: 0,
            page: 1,
            max: 0,
            product: undefined,
            order_type_list: [],
            user_list:[]
        };
    },

    componentDidMount: function () {
        // if (window.location.pathname == '/query/data') {
        //     this.setState({product: 'data'})
        // } else if (window.location.pathname == '/query/fee') {
        //     this.setState({product: 'fee'})
        // } else if (window.location.pathname == '/query/sinopec') {
        //     this.setState({product: 'sinopec'})
        // }
        this.loadOrderType();
        this.loadUserList();
        if (withdraw_id){
            var filter ={
                order_type: 'get_query',
                user_id:user_id,
                withdraw_id: withdraw_id,
                size:20
            };
            this.loadOrderList(1,filter);
        }
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

    // 加载订单类型
    loadOrderType:function(){
        $.ajax({
            url: _.str.sprintf('/api/sinopec_order_query?requ_type=%s&product=%s',
                encodeURIComponent('get_order_type_list'),
                //encodeURIComponent(this.state.product)
                encodeURIComponent('sinopec')
            ),
            dataType: 'json',
            type: 'get',

            success: function (resp) {
                if(resp.status == 'ok'){
                    this.setState({
                    order_type_list: resp.data.order_list
                    });
                }else{
                    alert('加载订单类型错误' + resq.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert('加载订单类型异常' + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    exportRequest: function (mail, filter) {
        var mail_pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!mail_pattern.test(mail)) {
            alert('请检查你输入的邮箱地址(' + mail + ')是否有效？');
            return false;
        }

        var a_filter = filter;

        var argu_list = "";
        for (var i in a_filter) {
            argu_list += _.str.sprintf('&%s=%s',
                               encodeURIComponent(i),
                               encodeURIComponent(a_filter[i])
                              )
        }

        $.ajax({
            url: _.str.sprintf('/api/sinopec_order_query?requ_type=%s&product=%s&mail=%s&type=%s%s',
                encodeURIComponent('get_export'),
                // encodeURIComponent(this.state.product),
                encodeURIComponent('sinopec'),
                encodeURIComponent(mail),
                encodeURIComponent('order2'),
                argu_list
            ),
            dataType: 'json',
            type: 'get',

            success: function (resp) {
                Showfullbg();
                alert(resp.msg);
                if (resp.status == 'ok') {
                    $('#addModal').modal('hide');
                }
                Hidefullbg();
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
        return true;
    },

    loadOrderList: function (page, filter) {
        var a_filter = filter || this.state.filter;
        a_filter['page'] = page || this.state.page;

        var argu_list = "";
        for (var i in a_filter) {
            argu_list += _.str.sprintf('&%s=%s',
                               encodeURIComponent(i),
                               encodeURIComponent(a_filter[i])
                              )
        }

        $.ajax({
            url: _.str.sprintf('/api/sinopec_order_query?requ_type=%s&product=%s%s',
                encodeURIComponent('get_query'),
                // encodeURIComponent(this.state.product),
                encodeURIComponent('sinopec'),
                argu_list
            ),
            dataType: 'json',
            type: 'get',

            success: function (resp) {
                Showfullbg();
                if(resp.status == 'ok'){
                    this.setState({
                        count: resp.count,
                        order_list: resp.data.data,
                        filter: a_filter,
                        max: resp.data.max,
                        page: page
                    });
                }else{
                    alert('查询错误' + resp.msg);
                }
                Hidefullbg();
            }.bind(this),

            error: function (xhr, status, err) {
                alert('查询异常' + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
       return (
            <section className="wrapper">
                <QueryPanel max={this.state.max} filter={this.state.filter} order_type_list={this.state.order_type_list}
                            loadOrderList={this.loadOrderList} user_list={this.state.user_list}
                />

                <QueryResultPanel page={this.state.page} max={this.state.max} order_list={this.state.order_list}
                                  order_type_list={this.state.order_type_list} loadOrderList={this.loadOrderList}/>

                <AddMaintainBox exportRequest={this.exportRequest}/>
            </section>
        );
    }
});

var QueryPanel = React.createClass({
    getInitialState: function () {
        return {
            size: 30
        };
    },

    onQuery: function () {
        var filter = this.props.filter;
        filter['order_id'] = $('#form_order_id').val();
        filter['mobile'] = $('#form_mobile').val();
        filter['result'] = $('#form_result').val();
        filter['price'] = $('#form_product').val();
        filter['area'] = $('#form_area').val();
        filter['order_type'] = $('#form_order_type').val();
        filter['start'] = $('#form_range_start').val();
        filter['end'] = $('#form_range_end').val();
        filter['size'] = this.state.size;
        filter['withdraw_id'] = '';
        filter['user_id'] = $('#form_user_id').val();

        this.props.loadOrderList(1, filter);
    },

    // 输入框Enter绑定
    onInputKeyUp: function (e) {
        if (!e) var e = window.event;
        if (e.keyCode == 13) {
            this.onQuery();
        }
    },

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

    onExport: function () {
        if (this.props.max == 0 || $.isEmptyObject(this.props.filter)) {
            alert('请先进行查询');
            return;
        }

        $('#addModal').modal('show');
    },

    render: function () {
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
                            <option value="000000" data-subtext="">000000 - 全部</option>
                            {userNode}
                        </select>
                    </div>
                </div>
            )
        }
        
        var order_typeNode = (<select id="form_order_type" className="form-control m-bot15 input-sm" disabled>
                                    <option value="sell_order">采购订单</option>
                            </select>);
        if (this.props.order_type_list.length > 1){
            order_typeNode = (<select id="form_order_type" className="form-control m-bot15 input-sm">
                                <option value="sell_order">采购订单</option>
                                <option value="supply_order">供应订单</option>
                            </select>);
            }

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-search" />订单查询</span>
                        </header>

                        <div className="panel-body">
                            <form className="form-horizontal" method="get">
                                <div className="form-group row">
                                    <label className="col-md-1 control-label">订单编号</label>

                                    <div className="col-md-2">
                                        <input id="form_order_id" type="text" className="form-control input-sm"
                                               onKeyDown={this.onInputKeyUp} />
                                    </div>

                                    <label className="col-md-1 control-label">充值账号</label>

                                    <div className="col-md-2">
                                        <input id="form_mobile" type="text" className="form-control input-sm"
                                               onKeyDown={this.onInputKeyUp}/>
                                    </div>

                                    <label className="col-md-1 control-label">订单状态</label>

                                    <div className="col-md-2">
                                        <select id="form_result" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="finish">成功</option>
                                            <option value="fail">失败</option>
                                            <option value="processing">充值中</option>
                                        </select>
                                    </div>

                                   <label className="col-md-1 control-label">产品名称</label>

                                    <div className="col-md-2">
                                        <select id="form_product" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="30">30元</option>
                                            <option value="50">50元</option>
                                            <option value="100">100元</option>
                                            <option value="200">200元</option>
                                            <option value="500">500元</option>
                                            <option value="1000">1000元</option>
                                        </select>
                                    </div>

                                    <label className="col-md-1 control-label">运营商</label>

                                    <div className="col-md-2">
                                        <select id="form_area" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="sinopec:CN">中石化(全国)</option>
                                            <option value="sinopec:JS">中石化(江苏)</option>
                                        </select>
                                    </div>

                                    <label className="col-md-1 control-label">订单类型</label>
                                    <div className="col-md-2">
                                        {order_typeNode}
                                    </div>

                                    <label className="col-md-1 control-label">时间范围</label>

                                    <div className="col-md-2">
                                        <input id="form_range" type="text"
                                               className="form-control input-sm"/>
                                        <input id="form_range_start" type="hidden"/>
                                        <input id="form_range_end" type="hidden"/>
                                    </div>

                                    <div className="col-md-3 text-right">
                                        <a href="javascript:void(0);" className="btn btn-danger m-right10" onClick={this.onQuery}>
                                            <i className="icon-search" /> 查询
                                        </a>
                                        <a href="javascript:void(0);" className="btn btn-info" onClick={this.onExport}>
                                            <i className="icon-download-alt" /> 导出
                                        </a>
                                    </div>
                                </div>
                                {adminNode}
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

var QueryResultPanel = React.createClass({
    getProductStr:function(product){
        var product_map = {
            'sinopec':'中石化',
            'CNPC':'中石油',
            'cmcc':'移动',
            'cucc':'联通',
            'ctcc':'电信'
        };
        return product_map[product];
    },

    getOrderTypeStr:function(order_type){
        var order_type_map ={
            'sell_order':'采购订单',
            'supply_order':'供货订单'
        };
        return order_type_map[order_type];
    },

        getCarrierStr:function(i){
        var i_map ={
            '1': '移动',
            '2': '联通',
            '3': '电信',
            'sinopec': '中石化',
            'SINOPEC': '中石化'
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

    render:function(){
        var sell_price = (<th>采购价格</th>);
        if (this.props.order_type_list.length > 1){
            sell_price = (<th>供应价格</th>);
        }

        var orderNode = this.props.order_list.map(function (order, i) {
            var area = null;
            if(order.area){
                var n = order.area.split(':');
                if(n.length == 2){
                    var c = this.getCarrierStr(n[0]);
                    var p = n[1] ? this.getAreaStr(n[1]) : '';
                    area = c+p;
                }
            }

            return (
                <tr key={order.id}>
                    <td>{order.order_id}</td>
                    <td>{order.mobile}</td>
                    <td>{this.getProductStr(order.product)}</td>
                    <td>{order.result}</td>
                    <td>{order.back_time}</td>
                    <td>{area}</td>
                    <td className="text-center">{order.req_time}</td>
                    <td>{this.getOrderTypeStr(order.order_type)}</td>
                    <td>{order.price}</td>
                    <td>{(order.value / 10000).toFixed(2)}</td>
                    <td>{(order.balance/ 10000).toFixed(2)}</td>
                </tr>);
        }.bind(this));

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table" />列表</span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result"
                                   className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>订单编号</th>
                                    <th>充值帐号</th>
                                    <th>产品名称</th>
                                    <th>订单状态</th>
                                    <th>状态时间</th>
                                    <th>运营商</th>
                                    <th className="text-center">创建时间</th>
                                    <th>订单类型</th>
                                    <th>面值</th>
                                    {sell_price}
                                    <th>余额</th>
                                </tr>
                                </thead>
                                <tbody>
                                {orderNode}
                                </tbody>
                            </table>
                        </div>
                        <PageIndexGroup onQuery={this.props.loadOrderList}
                                        page={this.props.page}
                                        max={this.props.max} />
                    </section>
                </div>
            </div>
        );
    }
});

var AddMaintainBox = React.createClass({
    onExport: function () {
        var mail = $('#form-mail').val();
        var filter ={
        order_id : $('#form_order_id').val(),
        mobile: $('#form_mobile').val(),
        result: $('#form_result').val(),
        price: $('#form_product').val(),
        area: $('#form_area').val(),
        order_type: $('#form_order_type').val(),
        start: $('#form_range_start').val(),
        end: $('#form_range_end').val(),
        user_id: $('#form_user_id').val()
        };
        this.props.exportRequest(mail, filter);
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

// 分页
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


ReactDOM.render(
    <MainContentPanel />,
    document.getElementById('main-content')
);
