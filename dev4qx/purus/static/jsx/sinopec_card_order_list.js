// tutorial1.js
var OrderList = React.createClass({

    getInitialState: function () {
        return {
            order_list: [],
            order_count: 0,
            card_inventory_info: [],
        };
    },

    reloadOrderList: function () {
        $.ajax({
            url: '/admin/quxun_sinopec_card/api/order/unknown',
            dataType: 'json',
            success: function (data) {
                this.setState({
                    order_list: data.order_list,
                    order_count: data.order_list.length,
                    card_inventory_info: this.state.card_inventory_info,
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        $.ajax({
            url: '/admin/quxun_sinopec_card/api/card/inventory',
            dataType: 'json',
            success: function (data) {
               this.setState({
                    order_list: this.state.order_list,
                    order_count: this.state.order_list.length,
                    card_inventory_info: data.card_inventory_info,
               });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    doFinishOrder: function (order_id, result, if_release, operation) {
        this.setState({
            order_id: order_id,
            result: result,
            if_release: if_release,
            operation: operation
        });
        $('#confirmWindow').modal('show');
    },

    componentDidMount: function () {
        this.reloadOrderList();
    },

    render: function () {
        var doReload = this.reloadOrderList;
        var doFinishOrder = this.doFinishOrder;
        var orderNodes = this.state.order_list.map(function (order) {
            var t = new Date(order.create_tsp * 1000);
            var time = t.toLocaleString();
            return (
                <OrderBox
                    order={order}
                    time={time}
                    doFinishOrder={doFinishOrder}
                />
            );
        });


        return (
            <section className="wrapper">
                <div className="panel" id="quxun_card">
                    <NaviBar order_count={this.state.order_count}/>
                    <CardInventoryInfoTable card_inventory_info={this.state.card_inventory_info}/>
                </div>
                {orderNodes}
                <ConfirmWindow
                    order_id={this.state.order_id}
                    result={this.state.result}
                    if_release={this.state.if_release}
                    operation={this.state.operation}
                    doReload = {doReload}
                />
            </section>
        );
    }
});

var NaviBar = React.createClass({
    getInitialState: function () {
        return {isGetting: true, count: 0};
    },

    componentDidMount: function () {
        this.getStates(false);
    },

    getStates: function (if_switch) {

        $.ajax({
            url: '/admin/quxun_sinopec_card/api/states',
            type: 'POST',
            data: JSON.stringify({'if_switch': if_switch}),
            dataType: 'json',
            success: function (data) {
                this.setState(data);
                //alert(JSON.stringify(data));
            }.bind(this),

            error: function (xhr, status, err) {
                var if_check = !this.state.isGetting;
                this.setState({isGetting: if_check});
                console.info(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var msg = null;

        if (this.state.isGetting == true) {

            msg = <b>当前处于正常取单状态</b>;
        } else {
            msg = <b className="price_color">当前处于停止取单状态</b>;
        }

        return (
            <header className="panel-heading row">
                <span className="pull-left"><i className="icon-table"></i><span>趣讯中石化卡充平台维护 <strong
                    className="price_color">卡单总数：{this.props.order_count}</strong></span></span>
                <span className="pull-right">
                    <div className="switch round">
                        <input type="checkbox" id="get-switch" checked={this.state.isGetting}
                               onChange={this.getStates.bind(this, true)}/>
                        <label htmlFor="get-switch">
                            <span className="switch-handle-on">打开</span>
                            <span className="switch-handle-off">关闭</span>
                        </label>
                    </div>
                </span>
                <span className="pull-center">{msg}</span>
            </header>
        )
    }
});


var CardInventoryInfoTable = React.createClass({
    getCardInventory: function(){
            $.ajax({
            url: '/admin/quxun_sinopec_card/api/card/inventory',
            dataType: 'json',
            success: function (data) {
               this.setState({
                    card_inventory_info: data.card_inventory_info
               });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            card_inventory_info: [],
        };
    },

    componentDidMount: function () {
        this.getCardInventory();
    },

    render: function () {
        if(this.state.card_inventory_info.length <= 0)
        {
            return null;
        }

        var price_list = [];
        var temp = this.state.card_inventory_info[0].info.inventory;
        for(var i in temp)
        {
            price_list.push( Number(i) )
        }

        var tableHeadNodes = price_list.map(function(price, index){
            return (<td>{price}</td>);
        });

        var tableBodyNodes = this.state.card_inventory_info.map(function(card_inventory_info,index){
            var infoNodes = price_list.map(function(price, index){
                var inventory = card_inventory_info.info.inventory[price];
                var cache_inventory = card_inventory_info.info.cache_inventory[price];
                if(!cache_inventory)
                {
                    cache_inventory = 0;
                }
                return ( <td>{"(" + inventory + "," + cache_inventory  + ")"}</td>);
            });
            return (<tr>
                        <td>{card_inventory_info.card_pool}</td>
                        {infoNodes}
                    </tr>);
        });
        return (
                <div className="panel">
                    <table className="table table-bordered">
                        <thead>
                            <tr className="active">
                                <td>{"卡池名称"}</td>
                                {tableHeadNodes}
                            </tr>
                        </thead>
                        <tbody>
                            {tableBodyNodes}
                        </tbody>
                    </table>
                </div>
        )
    }
});


var OrderBox = React.createClass({
    doFinishOrder: function (order_id, result, if_release, operation) {
        this.props.doFinishOrder(order_id, result, if_release, operation);
    },


    render: function () {
        return (
            <div className="panel">
                <header className="panel-heading row">
                    <span className="pull-left"><i
                        className="icon-list-alt"></i><span>订单号: {this.props.order.order_id}</span></span>
                </header>
                <div className="panel">
                    <table className="table table-bordered">
                        <thead>
                        <tr className="active">
                            <td>卡号</td>
                            <td>充值号码</td>
                            <td>充值时间</td>
                            <td>面值</td>
                            <td>箱号</td>
                            <td>文件名</td>
                            <td>上卡时间</td>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{this.props.order.card_id}</td>
                            <td>{this.props.order.account_number}</td>
                            <td>{this.props.time}</td>
                            <td>{this.props.order.price}</td>
                            <td>{this.props.order.card_package}</td>
                            <td>{this.props.order.card_filename}</td>
                            <td>{this.props.order.card_create_time.substr(0, 19)}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div className="row col-sm-12">
                    <div className="col-sm-8">
                        <table className="table table-advance table-bordered">
                            <thead>
                            <tr className="active">
                                <td>分机</td>
                                <td>结果</td>
                                <td>数据</td>
                            </tr>
                            </thead>
                            <tbody>
                                <td>{this.props.order.agent}</td>
                                <td>{this.props.order.agent_result}</td>
                                <td>{this.props.order.agent_data}</td>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-sm-4">
                        <a href="javascript:;" className="btn btn-success mr15 mb15"
                        onClick={this.doFinishOrder.bind(this,this.props.order.order_id, '1', 'used', '订单成功')}><span>订单成功</span>
                        </a>
                        <a href="javascript:;" className="btn btn-danger mr15 mb15"
                        onClick={this.doFinishOrder.bind(this,this.props.order.order_id, '9', 'error', '订单失败，卡失效')}><span>订单失败，卡失效</span>
                        </a>
                        <a href="javascript:;" className="btn btn-danger mr15 mb15"
                        onClick={this.doFinishOrder.bind(this,this.props.order.order_id, '9', 'release', '订单失败，卡有效')}><span>订单失败，卡有效</span>
                        </a>
                    </div>
                </div>
            </div>
        );
    }
});

//弹出的操作确认窗口
var ConfirmWindow = React.createClass({
    onConfirm: function () {
        var order_id = this.props.order_id;
        var result = this.props.result;
        var if_release = this.props.if_release;

        var data = JSON.stringify({'order_id': order_id, 'result': result, 'release': if_release});

        $.ajax({
            url: '/admin/quxun_sinopec_card/api/order/finish',
            dataType: 'json',
            type: 'POST',
            data: data,
            success: function (resp) {
                if (resp.status == 'ok') {
                    alert("操作成功");
                    $("#confirmWindow").modal("hide");
                    this.props.doReload();
                    //window.location.reload();
                }
                else {
                    alert('操作失败 - ' + resp.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
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
                                <div className="col-md-8"><h4>确认操作<b className="plr5">{this.props.operation}</b>?</h4>
                                    <h5>订单号：{this.props.order_id}</h5></div>
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
    <OrderList />
    ,
    document.getElementById('main-content')
);
