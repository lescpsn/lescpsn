//显示全屏遮罩
var Showfullbg = function () {
    $("#reload_fullbg,#reload_icon").show();
};

//隐藏全屏遮罩
var Hidefullbg = function () {
    $("#reload_fullbg,#reload_icon").hide();
};

var MainContent = React.createClass({
    getTaskInfo: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s',
                               encodeURIComponent('get_task_info')
                              ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        checked: true,
                        task_info: resp_data.data,
                    });
                }
                else {
                    alert("读取当前任务信息出错 " + resp_data.msg);
                    window.location.reload();
                }
            }.bind(this),

            error: function (xhr, status, err) {
                //alert("读取当前任务信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });
    },

    getInitialState: function () {
        return {
            checked: false,
            running_task_id: null,//当前正在运行的任务ID
        };
    },

    componentDidMount: function () {
        this.getTaskInfo();
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {

        var taskPanelNode = null;
        if (this.state.checked) {
            if (!this.state.task_info) {
                taskPanelNode = (<NewTaskPanel reloadTaskPage={this.getTaskInfo} />);
            }
            else {
                taskPanelNode = (<TaskStatusPanel reloadTaskPage={this.getTaskInfo} />);
            }
        }
        return (
            <div className="wrapper">
                <div id="reload_fullbg"></div>
                <div id="reload_icon"><i className="icon-spinner icon-spin icon-4x"></i></div>
                <CardInventoryInfoTable />
                {taskPanelNode}
                <TaskList />
            </div>
        );
    }
});

//自定义一个新的任务
var NewTaskPanel = React.createClass({
    //启动批量充值任务
    onClickStartTask: function () {
        var total_price = 0;
        var price_list_msg = "";

        var account = $('#form_customer_id').val();
        var price_list = [];
        for (var i in this.state.price_list) {
            var price = parseInt(this.state.price_list[i].price);
            var price_count = parseInt(this.state.price_list[i].count);
            var count = $("#price_" + price).val();
            if (count != '')//监测输入的数字是否合法
            {
                count = parseInt(count);
            }
            else
            {
                count = 0;
            }

            //卡数量判断 对比库存信息
            if (count > price_count || count < 0)
            {
                alert("超出库存数量,创建任务失败！！！");
                return;
            }

            if(count > 0)
            {
                price_list.push({ price: price, count: count });
                total_price += price * count;
                price_list_msg += _.str.sprintf(' %s(%s元)', price, price * count);
            }
        }

        //账号合法性判断
        if (!account || account == 1) {
            alert("充值账号错误");
            return;
        }

        //充值金额合法性判断
        if (!(total_price > 0)) {
            alert("充值金额错误");
            return;
        }


        //弹窗判断是否继续
        var msg = _.str.sprintf('将会给 %s 充入 %s元\n %s'
                                , account
                                , total_price
                                , price_list_msg
                              );
        if (!confirm(msg)) {
            return;
        }

        var requ_data = {
            requ_type: "add_task",
            argu_list: {
                account: account,
                price_list: price_list,
            },
        };

        $.ajax({
            url: '/fuel_card/big_recharge',
            dataType: 'json',
            type: 'post',
            data: (JSON.stringify(requ_data)),

            success: function (data) {
                if (data.status == 'ok') {
                    alert("新增任务成功");
                    //this.props.getTaskInfo();
                    window.location.reload();
                }
                else {
                    Showfullbg();
                    alert("新增任务出错\n" + data.msg);
                }

            }.bind(this),
            error: function (xhr, status, err) {
                alert("新增充值任务异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),
            complete: function (XMLHttpRequest, textStatus) {
                Hidefullbg();
            }.bind(this)
        });
    },

    getCardInventory: function () {
        $.ajax({
            url: '/fuel_card/card_inventory?requ_type=get_user_inventory&card_type=SINOPEC',
            dataType: 'json',
            type: 'get',

            success: function (resp_data) {
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

    //读取常用客户信息
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

    //实时显示金额
    getSumPrice: function (price_info) {
        var price_list = [];
        var count = $("#price_" + price_info.price).val();
        //检测count是否合法,并计算单个面值的金额
        if (count > price_info.count) {
            $("#sum_" + price_info.price).addClass("text-danger").text("超出库存数量");
        } else if (count == 0) {
            $("#sum_" + price_info.price).removeClass("text-danger").text("金额: 0 元");
        } else if (count <= price_info.count && count > 0) {
            var price = price_info.price * count;
            $("#sum_" + price_info.price).removeClass("text-danger").text("金额: " + price + "元");
        }

        var total_price = 0;
        for (var i in this.state.price_list) {
            var price = parseInt(this.state.price_list[i].price);
            var count = $("#price_" + price).val();
            if (count != '')//监测输入的数字是否合法
            {
                count = parseInt(count);
            }
            else
            {
                count = 0;
            }

            if (count > this.state.price_list[i].count)
            {
                $("#total").text("超出库存数量");
                return;
            }

            if(count > 0)
            {
                total_price += price * count;
            }
        }

        $("#total").text("合计总金额: " + total_price + " 元");
    },

    //
    onPriceCountKeyDown: function (e) {
        if (!e) var e = window.event;

        if (((e.keyCode >= 48) && (e.keyCode <= 57)) || ((e.keyCode >= 96) && (e.keyCode <= 105)) || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 37 || e.keyCode == 39) {
        } else {

            return false;
        };
    },

    getInitialState: function () {
        return {
            card_inventory_info: [],
            price_list: [],
            customer_list: [],
        };
    },

    componentDidMount: function () {
        this.getCardInventory();
        this.getCustomerList();
        $('#form_customer_id').change(function () {
            var card_id = $('#form_customer_id').val();
            var card_name = $('#form_customer_id').find("option:selected").attr("title");
            console.log(card_id, card_name);
            if (card_id == 1) {
                $('#show_number').text('');
                $('#show_name').text('');
            } else {
                $('#show_number').text(card_id);
                $('#show_name').text(card_name);
            }
        });
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        var priceListNodes = this.state.price_list.map(function (price_info, index) {
            if(price_info.count <= 0 )
            {
                return null;
            }

            var price_id = "price_" + price_info.price;
            var sum_price = "sum_" + price_info.price;

            return (
                <div className="row m-bot15" key={"priceListNodes_"+index}>
                    <h4 className="col-sm-2 col-md-2 control-label text-info">面值: {price_info.price}</h4>
                    <div className="col-md-2 col-sm-8">
                        <input id={price_id} type="text" className="form-control form_count" maxLength="5"
                               onKeyUp={this.getSumPrice.bind(this,price_info)} onKeyDown={this.onPriceCountKeyDown} />
                    </div>
                    <h5 className="col-md-1 col-sm-2 control-label text-danger">{"可用"}{price_info.count}</h5>
                    <h3 className="col-md-3 col-sm-2 control-label" id={sum_price}>统计金额: 0 元</h3>
                </div>
            );
        }.bind(this));

        var customerListNodes = this.state.customer_list.map(function (customer_info, index) {
            return (<option key={"customerListNodes_"+index} value={customer_info.card_id} data-subtext={customer_info.card_id} title={customer_info.name}>{customer_info.card_id} - {customer_info.name}</option>)
        });

        return (
            <section className="panel">
                <header className="panel-heading row">
                    <span className="pull-left"><i className="icon-table"></i>新的充值任务</span>
                </header>
                <div className="panel-body">
                    <div className="modal-body form-horizontal">
                        <div className="form-group">
                            <div className="row">
                                <h4 className="col-sm-2 col-md-2 control-label">账号</h4>
                                <div className="col-md-5 col-sm-8">
                                <select className="form-control" id="form_customer_id"
                                        data-live-search="true">
                                    <option value="1">-=请选择帐号=-</option>
                                    {customerListNodes}
                                </select>
                                </div>
                                <div className="col-md-offset-2 col-md-4 col-sm-4">
                                    <h1 id="show_number"></h1>
                                </div>
                                <div className="col-sm-4">
                                    <h2 id="show_name"></h2>
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            {priceListNodes}
                        </div>
                        <div className="form-group">
                            <h3 className="col-md-3 col-sm-4 text-danger margin-5" id="total"></h3>
                            <div className="col-md-5 col-sm-4">
                                <a id="act_query" href="javascript:;" className="btn btn-info" onClick={this.onClickStartTask}>
                                    <i className="icon-play"></i> 创建
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
});

//任务状态
var TaskStatusPanel = React.createClass({
    getTaskInfo: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s',
                               encodeURIComponent('get_task_info')
                              ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        task_info: resp_data.data,
                    });
                }
                else {
                    alert("读取当前任务信息出错 " + resp_data.msg);
                    window.location.reload();
                }
            }.bind(this),

            error: function (xhr, status, err) {
                //alert("读取当前任务信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });
    },

    getTaskStatus: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s',
                               encodeURIComponent('get_task_status')
                              ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        task_status: resp_data.data,
                    });
                }
                else {
                    alert("读取当前任务信息出错 " + resp_data.msg);
                    window.location.reload();
                }
            }.bind(this),

            error: function (xhr, status, err) {
                //alert("读取当前任务信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });
    },

    getTaskStatusHistory: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s',
                               encodeURIComponent('get_status_history')
                              ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        task_history_list: resp_data.data.task_history_list,
                    });
                }
                else {
                    alert("读取当前任务信息出错 " + resp_data.msg);
                    window.location.reload();
                }
            }.bind(this),

            error: function (xhr, status, err) {
                //alert("读取当前任务信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });
    },

    onClickStartTask: function () {
        var requ_data = {
            requ_type: "start_task",
            argu_list: {
                task_id: this.state.task_info.task_id,
            },
        };

        $.ajax({
            url: '/fuel_card/big_recharge',
            dataType: 'json',
            type: 'post',
            data: (JSON.stringify(requ_data)),

            success: function (data) {
                if (data.status == 'ok') {
                    this.getTaskInfo();
                    alert("任务启动成功");
                }
                else {
                    alert("任务启动出错\n" + data.msg);
                }

            }.bind(this),
            error: function (xhr, status, err) {
                //alert("任务启动异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickStopTask: function () {
        var requ_data = {
            requ_type: "stop_task",
            argu_list: {
                task_id: this.state.task_info.task_id,
            },
        };

        $.ajax({
            url: '/fuel_card/big_recharge',
            dataType: 'json',
            type: 'post',
            data: (JSON.stringify(requ_data)),

            success: function (data) {
                if (data.status == 'ok') {
                    this.getTaskInfo();
                    alert("任务暂停成功");
                }
                else {
                    alert("任务暂停出错\n" + data.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                alert("任务暂停异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickFinishTask: function () {
        var requ_data = {
            requ_type: "finish_task",
            argu_list: {
                task_id: this.state.task_info.task_id,
            },
        };

        $.ajax({
            url: '/fuel_card/big_recharge',
            dataType: 'json',
            type: 'post',
            data: (JSON.stringify(requ_data)),

            success: function (data) {
                if (data.status == 'ok') {
                    this.getTaskInfo();
                    alert("任务结束成功");
                    //this.props.getTaskInfo();
                    document.location.reload();
                }
                else {
                    alert("任务结束出错\n" + data.msg);
                }

            }.bind(this),
            error: function (xhr, status, err) {
                alert("任务结束异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //启动自动刷新
    startInterval: function () {
        //alert("已启动自动刷新");
        var task_info_interval = setInterval(this.getTaskInfo, 1 * 1000);
        var task_status_interval = setInterval(this.getTaskStatusHistory, 1 * 1000);
        this.setState({ task_info_interval: task_info_interval, task_status_interval: task_status_interval });
    },

    //停止自动刷新
    stopInterval: function () {
        //alert("自动刷新已关闭");
        if (this.state.task_info_interval) {
            clearInterval(this.state.task_info_interval);
        }

        if (this.state.task_status_interval) {
            clearInterval(this.state.task_status_interval);
        }
        this.setState({ task_info_interval: null, task_status_interval: null });
    },

    getInitialState: function () {
        return {
            task_info_interval: null,    //定时刷新的任务ID
            task_status_interval: null,  //定时刷新的任务ID
            task_info: {},
            task_history_list: [],
        };
    },

    componentDidMount: function () {
        this.getTaskInfo();
        this.getTaskStatusHistory();

        setInterval(this.getTaskInfo, 10 * 1000);
        setInterval(this.getTaskStatusHistory, 10 * 1000);
    },

    componentDidUpdate: function (prevProps, prevState) {
        if (prevState.task_info != this.state.task_info) {
            if (prevState.task_info.task_status != this.state.task_info.task_status) {
                if (this.state.task_info.task_status == '1') {
                    this.startInterval();
                }
                else {
                    this.stopInterval();
                }
            }
        }
    },

    render: function () {
        var startBtnNode = null;
        var stopBtnNode = null;
        var taskState = null;
        //-1:未知状态  0:停止 1:运行中  2:结束
        if (this.state.task_info.task_status == '0') {
            startBtnNode = (<button className='btn btn-success' href='javascript:void(0);' onClick={this.onClickStartTask}><i className="icon-play" /> 启动</button>);
            taskState = (<div className="col-md-offset-1 col-md-2 col-xs-4 poolalert alert-danger text-center">任务已停止</div>);

        }
        else if (this.state.task_info.task_status == '1') {
            taskState = (<div className="col-md-offset-1 col-md-2 col-xs-4 poolalert alert-info text-center">任务运行中...</div>);
            stopBtnNode = (<button className='btn btn-info' href='javascript:void(0);' onClick={this.onClickStopTask}><i className="icon-pause" /> 暂停</button>);
        }

        var finishBtnNode = (<button className='btn btn-danger' href='javascript:void(0);' onClick={this.onClickFinishTask}><i className="icon-stop" /> 结束</button>);


        //历史记录
        var historyListNodes = this.state.task_history_list.map(function (history_info, index) {
            var h = history_info + "\n";
            return (
                    {h}
                    );
        }.bind(this));

        return (
            <section className="panel">
                <header className="panel-heading row">
                    <span className="pull-left"><i className="icon-tasks"></i>当前任务 {this.state.task_info.task_id} </span>
                    <div className="row center-block">
                        {taskState}
                        <div className="col-md-5 m-left10 btn-group btn-group-sm">
                            {startBtnNode}
                            {stopBtnNode}
                            {finishBtnNode}
                        </div>
                        <span>总面值:{this.state.task_info.total_price} 已充入:{this.state.task_info.success_price}</span>
                    </div>
                </header>
                <div className="panel-body">
                    <pre className="col-md-12">
                        {historyListNodes}
                    </pre>
                </div>
            </section>
        );
    }
});


//任务历史
var TaskList = React.createClass({
    onQuery: function (filters) {
        var filter_map = this.state.filter_map;
        filter_map.page_index = 1;

        for (var i in filters) {
            filter_map[i] = filters[i];
        }
        //alert(JSON.stringify(filter_map));
        this.setState({ filter_map: filter_map, task_list: [], page_info: null });

        var argu_list = "";
        for (var i in filter_map)
        {
            argu_list += _.str.sprintf('&%s=%s',
                               encodeURIComponent(i),
                               encodeURIComponent(filter_map[i])
                              )
        }

        $.ajax({
            url: _.str.sprintf('/fuel_card/big_recharge?&requ_type=%s%s',
                               encodeURIComponent('get_task_list'),
                               argu_list
                              ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({ task_list: resp_data.data.task_list, page_info: resp_data.data.page_info });
                } else {
                    alert("查询出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("查询异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onClickExport: function (task_id) {
        $.ajax({
            url: _.str.sprintf('/fuel_card/order_list?&requ_type=%s&task_id=%s',
                                encodeURIComponent('fuel_card_export'),
                                encodeURIComponent(task_id)
                                ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    var path = resp_data.data.path;
                    if (path) {
                        window.location.assign(path);
                    }
                } else {
                    alert("查询出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("查询异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },



    getInitialState: function () {
        return {
            filter_map: {
                page_index: 1,
                page_size: 20,
            },
            task_list: [],
            page_info: null,
        };
    },

    componentDidMount: function () {
        this.onQuery({});
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        var taskListNodes = this.state.task_list.map(function (task_info, index) {
            var url = _.str.sprintf('/fuel_card/order_list?&task_id=%s&start_time=%s&do_query=%s',
                encodeURIComponent(task_info.task_id),
                encodeURIComponent(task_info.create_time),
                encodeURIComponent("1")
                );

            var block_url = _.str.sprintf('/fuel_card/order_list?&task_id=%s&start_time=%s&order_type=%s&do_query=%s',
                encodeURIComponent(task_info.task_id),
                encodeURIComponent(task_info.create_time),
                encodeURIComponent("-1"),
                encodeURIComponent("1")
                );

            return (
                <tr key={"taskListNodes_"+index}>
                    <td>{task_info.task_id}</td>
                    <td>{task_info.account}</td>
                    <td>{task_info.create_time}</td>
                    <td>{task_info.finish_time}</td>
                    <td>{task_info.status}</td>
                    <td>{task_info.status_time}</td>
                    <td>{task_info.total_price}</td>
                    <td>{task_info.success_price}</td>
                    <td>{task_info.notes}</td>
                    <td>
                        <a href={url}
                           target="_blank"
                           className="btn btn-xs btn-danger  m-right5">
                            <i className="icon-search"></i> 查询订单
                        </a>
                        <a href={block_url}
                            target="_blank"
                            className="btn btn-xs btn-info  m-right5">
                            <i className="icon-wrench"></i> 卡单查询
                        </a>
                        <a href="javascript:void(0);"
                           onClick={this.onClickExport.bind(this, task_info.task_id)}
                           className="btn btn-xs btn-primary ">
                            <i className="icon-download-alt"></i> 导出记录
                        </a>
                    </td>
               </tr>
            );
        }.bind(this));

        return (
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left"><i className="icon-table"></i>批量充值历史</span>
                    </header>
                    <div className="panel-body">
                        <table id="order_result" className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>任务编号</th>
                                    <th>充值账号</th>
                                    <th>创建时间</th>
                                    <th>结束时间</th>
                                    <th>状态</th>
                                    <th>状态时间</th>
                                    <th>总金额</th>
                                    <th>已充入金额</th>
                                    <th>备注</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taskListNodes}
                            </tbody>
                        </table>
                        <PageIndexGroup onQuery={this.onQuery} page_info={this.state.page_info} />
                    </div>
                </section>
        );
    }
});


var PageIndexGroup = React.createClass({
    onClickPage: function (page_index) {
        this.props.onQuery({page_index: page_index});
    },

    getInitialState: function () {
        return {};
    },

    componentDidMount: function () {
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        if (this.props.page_info == null)
        {
            return null;
        }
        var page_index = this.props.page_info.page_index;
        var max_page = this.props.page_info.max_page;

        var page_start = page_index - 4 > 0 ? page_index - 4 : 1;
        var page_end = page_index + 4 > max_page ? max_page : page_index + 4;

        var page_index_list = [];
        for (var i = page_start; i <= page_end; ++i)
        {
            page_index_list.push(i);
        }

        var pageIndexBtnBodes = page_index_list.map(function (i, index) {
            var disabled = null;
            if (i == this.props.page_info.page_index)
            {
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
        if (page_index <= 1)
                        {
            fastBackwardDisabled = "disabled";
            backwardDisabled = "disabled";
                        }

        var forwardDisabled = null;
        var fastForwardDisabled = null;
        if (page_index >= max_page)
                        {
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


React.render(
    <MainContent />
    ,
    document.getElementById('main-content')
);