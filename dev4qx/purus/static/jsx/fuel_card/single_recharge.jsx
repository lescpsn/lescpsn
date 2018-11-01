//显示全屏遮罩
var Showfullbg = function () {
    $("#reload_fullbg,#reload_icon").show();
};

//隐藏全屏遮罩
var Hidefullbg = function () {
    $("#reload_fullbg,#reload_icon").hide();
};

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//判断本时段是否可以充值
var is_valid_time = function () {
    var time_now = new Date().Format("hhmm");
    time_now = Number(time_now);

    if (time_now > 2240 || time_now < 100) {
        return false;
    }
    else {
        return true;
    }
};

//记录单笔充值历史
var G_ORDER_LIST = [];

var MainContent = React.createClass({
    onRecharge: function () {
        this.refs.OrderList.updateOrderList();
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        if (!is_valid_time()) {
            alert("当前时间段不能充值, 请等到凌晨1点之后");
            return null;
        }

        return (
            <div className="wrapper">
                <div id="reload_fullbg"></div>
                <div id="reload_icon"><i className="icon-spinner icon-spin icon-4x"></i></div>
                <CardInventoryInfoTable />
                <RechargePanel ref="RechargePanel"  onRecharge={this.onRecharge}/>
                <OrderList ref="OrderList"/>
            </div>
        );
    }
});


var RechargePanel = React.createClass({
    //卡号变更事件
    onAccountInput: function () {

        var new_value = $('#form_account').val();

        if (new_value.length < 19) {

            $("#form_account").addClass('error');
            $('#form_account_error').removeClass('hidden');
            $('#form_account_error,#customer_msg').addClass('hidden');
        } else {
            $("#form_account").removeClass('error');
        }
        if (new_value.length == 0) {
            $('#show_number').text('请输入加油卡号');
            $("#show_carrier").text('');
            $("#prod").hide();
            $("#act_charge").attr({ 'disabled': 'disabled' });
        }
        $('#show_number').text(new_value);
        if (new_value.length >= 10) {
            this.getProductList(new_value);
            $("#prod").show();
        } else if (new_value.length < 10) {
            this.setState({
                carrier: '',
                prod_list: [],
            });
            $("#show_carrier").text('');
            $("#prod").hide();
            $("#act_charge").attr({ 'disabled': 'disabled' });
        }
        if (new_value.length == 19) {
            $("#form_account").removeClass('error');
            $('#form_account_error').addClass('hidden');
            this.getProductList(new_value);
        }      
    },

    //读取产品列表
    getProductList: function (new_value) {

        $.ajax({
            url: _.str.sprintf('/charge/sinopec/single/product?account_number=%s',
                               encodeURIComponent(new_value)
                              ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {

                if (resp_data.status == 'ok') {
                    this.setState({
                        last_account_10: new_value.substr(0, 10),
                        carrier: resp_data.name,
                        prod_list: resp_data.prod,
                    });
                    $("#prod").show();
                    $('#act_charge').removeAttr('disabled');
                } else {
                    $("#form_account_error").removeClass('hidden');
                }
            }.bind(this),

            error: function (xhr, status, err) {
                $("#prod").hide();
                alert("读取产品列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //设置产品列表
    setProd: function (prod_list) {
        $("#prod").html("");
        for (var i = 0; i < prod_list.length; i++) {
            $("#prod").append("<li><input type='hidden' value='" + prod_list[i]['offer'] + "'/><strong>" + prod_list[i]['name'] + "</strong><span>采购价格<b class='price'>" + prod_list[i]['value'] + "</b> 元</span></li>");
        }
        $("#show_carrier").text(this.state.carrier);
        $("#prod li").bind("click", function () {
            $(this).addClass("prod_hover").siblings().removeClass("prod_hover");
        });
    },

    //发送充值请求
    onClickRechargeRequ: function () {
        var onRecharge = this.props.onRecharge;
        if (!is_valid_time()) {
            alert("当前时间段不能充值, 请等到凌晨1点之后");
            return null;
        }

        var account = $("#form_account").val();
        if (account.length != 19) {
            alert('卡号不正确');
            return;
        }
        var prod = $('#prod li.prod_hover input').val();
        if (!prod || prod.length == 0) {
            alert("请选择充值产品");
            return;
        }


        $("#act_charge").attr({ 'disabled': 'disabled' });
        var data = { number: account, prod: prod };
        $.post('/api/latest_check', JSON.stringify(data)).done(function (check) {
            if (check.status && check.status == 'fail') {
                if (!confirm(check.msg)) {

                    $("#act_charge").removeAttr('disabled');
                    return;
                }
            }
            Showfullbg();
            $.post('/charge/sinopec/single', JSON.stringify(data)).done(function (data) {
                console.debug(data);

                var m = JSON.parse(data);

                var create_time = moment().startOf('second').format('YYYY-MM-DD HH:mm:ss');

                //alert(m.msg);
                if (m.status == 'ok') {
                    G_ORDER_LIST.unshift({ create_time: create_time, account: account, order_id: m.order_id, processing: true, result: false, order_data: {} });
                    alert("充值请求发送成功,\n" + "订单编号为:" + m.order_id + "\n您稍后可以在订单记录查询这笔订单!");
                    $("#show_carrier").text('');
                    $("#act_charge").attr({ 'disabled': 'disabled' });
                    $('#customer_msg').addClass('hidden');
                    $("#form_account").val('');
                    $("#prod").hide();
                    $('#show_number').text('请输入加油卡号');
                } else if (m.status == 'fail') {
                    G_ORDER_LIST.unshift({ create_time: create_time, account: account, order_id: m.order_id, processing: false, result: true });
                    alert('充值失败!\n'+m.msg);
                    $("#act_charge").removeAttr('disabled');
                    return;
                }

                //window.setTimeout(query_order.bind(this, m.sp_order_id, 1), 3000);

            }).always(function () {
                onRecharge();
                $("#act_charge").attr('disabled');
            }.bind(onRecharge));
            Hidefullbg();
        });

    },

    //显示常用客户列表弹窗
    onClickCustomerDlg: function () {
        this.refs.CustomerDlg.showDlg(this.getProductList);
    },

    getInitialState: function () {
        return {
            last_account_10: null,
            carrier: null,
            prod_list: [],
        };

    },

    //在dom构建之后可以使用jquery进行事件绑定
    componentDidMount: function () {
        $('#form_account').keydown(
        function (e) {
            if (!e) var e = window.event;

            if (((e.keyCode >= 48) && (e.keyCode <= 57)) || ((e.keyCode >= 96) && (e.keyCode <= 105)) || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 37 || e.keyCode == 39) {
            } else {

                return false;
            };
        });
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {

        var prodListNodes = this.setProd(this.state.prod_list);

        return (
            <section className="panel">
                <header className="panel-heading row">
                    <span className="pull-left">
                    <i className="icon-edit" />
                        加油卡单笔充值
                    </span>
                    <b className="price_color">(每日22：50至次日凌晨00:50为系统结算时间，此段时间中石化网站暂停充值。)</b>
                </header>
                <div className="panel-body">
                    <form className="form-validate form-horizontal " method="get">
                        <div className="form-group">
                            <label className="col-sm-2 col-md-2 control-label">账号</label>
                            <div className="col-sm-6 col-md-5">

                                <input id="form_account" className="form-control" autocomplete="off" placeholder="请输入19位中石化加油卡卡号"
                                       maxLength="19" onChange={this.onAccountInput} />
                            </div>
                            <button type="button" className="btn btn-danger m-bot10" onClick={this.onClickCustomerDlg}>常用客户列表</button>

                            <div className="col-sm-8 col-md-offset-2 col-md-5">
                                <span className="form-control alert alert-danger padding-5 m-bot-none hidden"
                                      id="form_account_error">
                                    请输入正确的19位中石化加油卡卡号
                                </span>
                                <span className="form-control alert alert-info padding-5 m-bot-none hidden"
                                      id="customer_msg">
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="col-sm-2 col-md-2 control-label"> </label>

                            <div className="col-sm-4">
                                <h1 id="show_number">请输入加油卡号</h1>
                            </div>
                            <div className="col-sm-4">
                                <h2 id="show_carrier"></h2>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="col-sm-2 col-md-2 control-label">充值产品</label>
                            <ul id="prod" className="col-sm-8">
                                {prodListNodes}
                            </ul>
                        </div>
                        <div className="form-group">
                            <div className="col-lg-offset-2 col-lg-10">

                            <a id="act_charge" href="javascript:void(0);" className="btn btn-danger" disabled="disabled" onClick={this.onClickRechargeRequ}><i className="icon-ok-circle"></i> 确定</a>
                            </div>
                        </div>
                    </form>
                </div>
                <CustomerDlg ref="CustomerDlg" />
            </section>
        );
    }

});

//常用用户列表弹窗
var CustomerDlg = React.createClass({
    //读取常用客户列表
    getCustomerList: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/customer_list?&requ_type=%s',
                               encodeURIComponent('get_customer_list')
                              ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        customer_list: resp_data.data.customer_list,
                    });
                } else {
                    alert("读取客户列表出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("读取客户列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function () {
        this.getCustomerList();
    },

    getInitialState: function () {
        return {
            customer_list: [],
            getProductList: null,
        };
    },

    showDlg: function (getProductList) {
        this.setState({
            getProductList: getProductList,
        });
        this.getCustomerList();
        $('#CustomerDlg').modal('show');
    },

    hideDlg: function () {
        this.clear();
        $('#CustomerDlg').modal('hide');
    },

    clear: function () {
        this.setState({
            customer_list: [],
            getProductList: null,
        });
    },

    SelectCardId: function () {
        var card_id = $('#form_customer_id').val();
        var card_name = $('#form_customer_id').find("option:selected").attr("title");
        $('#show_number').text(card_id);
        $('#form_account').val(card_id).removeClass('error');
        $('#form_account_error').addClass('hidden');

        $('#act_charge').removeAttr('disabled');
        this.state.getProductList(card_id);
        $("#prod").show();
        $('#customer_msg').removeClass("hidden");
        $('#customer_msg').text("当前选择的客户为: " + card_name);
        this.hideDlg();
    },

    render: function () {
        var customerListNodes = this.state.customer_list.map(function (customer_info, index) {
            return (<option value={customer_info.card_id} data-subtext={customer_info.card_id} title={customer_info.name}>{customer_info.card_id} - {customer_info.name}</option>)
        })

        return (
            <div className="modal" id="CustomerDlg" tabIndex="-1" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">选择常用客户账号</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <div className="col-sm-8 col-lg-12">
                                    <select className="form-control m-bot15" id="form_customer_id"
                                            data-live-search="true">
                                        {customerListNodes}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" id="add_account_btn" className="btn btn-danger" onClick={this.SelectCardId}>选择</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
            )
    }
});


//库存信息
var CardInventoryInfoTable = React.createClass({
    getCardInventory: function () {
        $.ajax({
            url: '/fuel_card/card_inventory?requ_type=get_user_inventory&card_type=SINOPEC',
            dataType: 'json',
            type: 'get',

            success: function (resp_data) {
                console.info("库存信息", resp_data);
                if(resp_data.status == 'ok')
                {
                    var price_list = [];
                    for(var price in resp_data.data.price_inventory)
                    {
                        price_list.push({
                            price: price,
                            count: resp_data.data.price_inventory[price],
                        });
                    }

                    this.setState({price_list: price_list, error_msg: null});
                }
                else
                {
                    this.setState({price_list:[], error_msg: "库存信息读取失败"});
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            price_list: [],
            error_msg: "等待读取",
        };
    },

    componentDidMount: function () {
        this.getCardInventory();
    },

    render: function () {
        var priceCountNodes = this.state.price_list.map(function (price_info, index) {
            return (<span key={"priceCountNodes_"+index} className="label label-primary m-right10">{price_info.price}元 剩余<span className="badge">{price_info.count}</span></span>);
        }.bind(this));

        return (
            <section className="panel">
                <header className="panel-heading row">
                    <span className="pull-left">
                        <i className="icon-briefcase" />
                        库存信息
                    </span>
                    <span className="pull-right">
                        <a className="btn btn-info m-right5" href="javascript:void(0);" onClick={this.getCardInventory}>
                            <i className="icon-refresh" /> 刷新
                        </a>
                    </span>
                    <div className="col-sm-offset-1">
                        <h3 className="margin-none">
                            {priceCountNodes}
                        </h3>
                    </div>
                </header>
            </section>
        )
    }
});


var OrderList = React.createClass({
    ManualOrder: function (order_info) {
        this.refs.ManualOrderDlg.showDlg(order_info);
    },

    updateOrderList: function () {
        if (this.state.in_query)
        {
            return;
        }
        this.setState({ order_list: G_ORDER_LIST, in_query: true });

        for(var i in G_ORDER_LIST)
        {
            if (!G_ORDER_LIST[i].result)
            {
                $.ajax({
                    url: _.str.sprintf('/api/sinopec_order_query?product=sinopec&requ_type=%s&order_id=%s',
                                       encodeURIComponent('fuel_card_query'),
                                       encodeURIComponent(G_ORDER_LIST[i].order_id)
                                      ),
                    type: 'get',
                    dataType: 'json',
                    async: false,

                    success: function (resp_data) {
                        if (resp_data.status == 'ok') {
                            var result_info = resp_data.data.order_list[0];
                            if(result_info)
                            {
                                G_ORDER_LIST[i].order_data = result_info;
                                if (result_info.status == "充值中" || result_info.status == "卡单(需手工处理)")
                                {
                                    G_ORDER_LIST[i].result = false;
                                }
                                else
                                {
                                    G_ORDER_LIST[i].result = true;
                                }
                            }
                        } else {
                            //alert("查询出错 " + resp_data.msg);
                            console.error(this.props.url, "查询出错");
                        }
                    }.bind(this),

                    error: function (xhr, status, err) {
                        //alert("查询异常 " + err.toString());
                        console.error(this.props.url, status, err.toString());
                    }.bind(this)
                });
            }
        }

        this.setState({ order_list: G_ORDER_LIST, in_query: false});
    },

    getInitialState: function () {
        return {
            order_list: [],
            in_query: false,
        };
    },

    componentDidMount: function () {
        setInterval(this.updateOrderList, 10 * 1000);
    },

    componentDidUpdate: function (updateOrderList, prevState) {
    },

    render: function () {

        var orderListNodes = this.state.order_list.map(function (order_info, index) {
            if (!order_info.order_data.status)
            {
                order_info.order_data.status = "充值中";
            }

            var operBtnNode = null;
            if (order_info.order_data.status == "卡单(需手工处理)")
            {
                operBtnNode = (
                        <a href="javascript:void(0);" 
                           className="btn btn-primary btn-xs btn-danger" 
                           onClick={this.ManualOrder.bind(this,order_info.order_data)}>
                            手工处理
                        </a>
                );
            }

            return (
                <tr>
                    <td>{order_info.create_time}</td>
                    <td>{order_info.account}</td>
                    <td>{order_info.processing ? order_info.order_data.status : "充值失败"}</td>
                    <td>{order_info.order_id}</td>
                    <td>{order_info.order_data.card_id}</td>
                    <td>{order_info.order_data.price}</td>
                    <td>{order_info.order_data.account_price}</td>
                    <td>{order_info.order_data.account_price ? order_info.order_data.update : null}</td>
                    <td>{order_info.order_data.bot_account}</td>
                    <td>{operBtnNode}</td>
                </tr>
            );
        }.bind(this));

        return (
            <section className="panel">
                <header className="panel-heading row">
                    <span className="pull-left"><i className="icon-search"></i>充值记录</span>
                    <b className="price_color">(大概会有十秒左右的延迟。)</b>

                    <span className="pull-right">
                        <a className="btn btn-info m-right5" href="javascript:void(0);" onClick={this.updateOrderList}>
                            <i className="icon-refresh" /> 刷新
                        </a>
                    </span>
                </header>
                <div className="panel-body table-responsive">
                    <table id="order_result" className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>创建时间</th>
                                <th>账号</th>
                                <th>状态</th>
                                <th>订单号</th>
                                <th>卡号</th>
                                <th>面值</th>
                                <th>到账面值</th>
                                <th>到账时间</th>
                                <th>外挂账号</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderListNodes}
                        </tbody>
                    </table>
                </div>
                <ManualOrderDlg ref="ManualOrderDlg"/>
            </section>
         );
    }
});



//订单手工处理弹窗
var ManualOrderDlg = React.createClass({
    //发送单笔订单的手工处理
    sendManualOrder: function (requ_type, argu_list) {
        var requ_data = {
            requ_type: requ_type,
            argu_list: argu_list
        }

        $.ajax({
            url: '/fuel_card/modem_forrestal/api/order/finish2',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    alert("手动处理成功");
                } else {
                    alert("手动处理订单出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("手动处理订单异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),

            complete: function (XMLHttpRequest, textStatus) {
                this.hideDlg();
            }.bind(this),
        });
    },

    //取消按钮
    onClickCancle: function () {
        this.hideDlg();
    },

    //订单成功
    onClickSuccess: function () {
        var account_price = parseInt($("#form_account_price").val());
        if (!account_price || account_price <= 0)
        {
            alert("请选择正确的金额");
            return;
        }

        if (!confirm(_.str.sprintf('把订单 %s 设为成功，订单金额 %s 元?',
            this.state.order_info.order_id, account_price)
            ))
        {
            return;
        }

        this.sendManualOrder('order_success', {
            order_id: this.state.order_info.order_id,
            account_price: account_price,
        });
    },

    //订单失败，卡有效
    onClickFailCardValid: function () {
        if (!confirm(_.str.sprintf('把订单 %s 设为失败， 充值卡 %s 有效?',
            this.state.order_info.order_id, this.state.order_info.card_id)
            ))
        {
            return;
        }

        this.sendManualOrder('order_fail_card_valid', {
            order_id: this.state.order_info.order_id,
        });
    },

    //订单失败,卡失效
    onClickFailCardInvalid: function () {
        if (!confirm(_.str.sprintf('把订单 %s 设为失败， 充值卡 %s 异常?',
            this.state.order_info.order_id,this.state.order_info.card_id)
            ))
        {
            return;
        }

        this.sendManualOrder('order_fail_card_invalid', {
            order_id: this.state.order_info.order_id,
        });
    },

    showDlg: function (order_info) {
        order_info.err_info = order_info.err_data;
        this.setState({ order_info: order_info });
        $('#ManualOrderDlg').modal('show');
    },

    hideDlg: function () {
        this.clearInput();
        $('#ManualOrderDlg').modal('hide');
    },

    clearInput: function () {
        this.setState({order_info: {}});
    },

    getInitialState: function () {
        return { order_info: {} };
    },

    render: function () {
        return (
            <div className="modal" id="ManualOrderDlg" tabIndex="-1" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title"> 卡单<b>{this.state.order_info.order_id}</b>手工处理</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="row"><strong>订单号:</strong> {this.state.order_info.order_id}</div>
                            <div className="row"><strong>充值卡号:</strong> {this.state.order_info.card_id}</div>
                            <div className="row"><strong>面值:</strong> {this.state.order_info.price}</div>
                            <div className="row"><strong>卡单原因:</strong> {this.state.order_info.err_info}</div>
                            <div className="row price_color">注意:卡单处理的结果在本页面会有所延迟</div>
                            <div className="form-group add-pro-body">
                                <ul className="nav nav-tabs m-bot15">
                                    <li className="active"><a href="#manual_success" data-toggle="tab">置成功</a></li>
                                    <li><a href="#manual_fail" data-toggle="tab">置失败</a></li>
                                </ul>
                                <div id="myTabContent" className="tab-content m-bot15">
                                    <div className="tab-pane active" id="manual_success">
                                        <div className="row">
                                            <label className="col-sm-4 col-md-2 control-label">金额</label>
                                            <div className="col-sm-8 col-md-9">
                                                <select id="form_account_price" className="form-control m-bot15 input-sm">
                                                    <option value="">(无)</option>
                                                    <option value="30">30</option>
                                                    <option value="50">50</option>
                                                    <option value="100">100</option>
                                                    <option value="200">200</option>
                                                    <option value="500">500</option>
                                                    <option value="1000">1000</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="modal-footer form-horifooter">
                                            <button id="change_price_btn" type="button"
                                                    className="btn btn-danger"
                                                    onClick={this.onClickSuccess}>
                                                确定
                                            </button>
                                            <button type="button"
                                                    className="btn btn-default"
                                                    data-dismiss="modal"
                                                    onClick={this.onClickCancle}
                                                    >
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                    <div className="tab-pane" id="manual_fail">
                                        <div className="form-horifooter">
                                            <div className="col-md-offset-3 col-md-8">
                                                <button type="button" className="btn btn-success m-right10 m-bot20" onClick={this.onClickFailCardValid}>
                                                    置失败,卡有效
                                                </button>
                                                <button type="button" className="btn btn-danger m-bot20" onClick={this.onClickFailCardInvalid}>
                                                    置失败,卡异常
                                                </button>
                                            </div>
                                        </div>
                                        <div className="modal-footer form-horifooter">
                                            <button type="button"
                                                    className="btn btn-default"
                                                    data-dismiss="modal"
                                                    onClick={this.onClickCancle}
                                                    >
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

React.render(
    <MainContent />,
    document.getElementById('main-content')
);