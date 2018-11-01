//显示全屏遮罩
var Showfullbg = function () {
    $("#reload_fullbg,#reload_icon").show();
};

//隐藏全屏遮罩
var Hidefullbg = function () {
    $("#reload_fullbg,#reload_icon").hide();
};

var re_order = /^Q[0-9]{22}$/;
var re_card = /^\d{17}$/;

var MainContent = React.createClass({
    getInitialState: function () {
        return {
            order_list: [],
        };
    },

    componentDidMount: function () {
    },

    componentDidUpdate: function(prevProps, prevState){
    },

    //订单查询按钮
    onClickFormOrderId: function () {
        var order_id = $("#form_order_id").val();
        if (!re_order.test(order_id)) {
            alert("请检查您输入的订单号\n订单号为大写字母Q开头加22位数字\n例如: Q2015031812355001871025");
            return;
        }

        $("#order_id_btn").addClass('disabled');
        Showfullbg();

        $.ajax({
            url: _.str.sprintf('/forrestal_query/cmcc_fee/query_order?&requ_type=%s&order_id=%s',
                   encodeURIComponent('by_order_id'),
                   encodeURIComponent(order_id)
                  ),

            type: 'GET',
            dataType: 'json',

            success: function (resp_data) {
                if(resp_data.status == 'ok')
                {
                    this.setState({
                        order_list: resp_data.data.order_list
                    });
                }
                else
                {
                    alert("查询出错\n" + resp_data.msg);
                }

            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this),

            complete: function (XMLHttpRequest, textStatus) {
                Hidefullbg();
                $("#order_id_btn").removeClass('disabled');
            }.bind(this)
        });
    },

    //卡号查询按钮
    onClickFormCardId: function () {
        var card_id = $("#form_card_id").val();
        if (!re_card.test(card_id)) {
            alert("请检查您输入的卡号\n卡号为17位数字\n例如: 14606104111331409");
            return;
        }

        $("#card_id_btn").addClass('disabled');
        Showfullbg();

        $.ajax({
            url: _.str.sprintf('/forrestal_query/cmcc_fee/query_order?&requ_type=%s&card_id=%s',
                   encodeURIComponent('by_card_id'),
                   encodeURIComponent(card_id)
                  ),

            type: 'GET',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        order_list: resp_data.data.order_list
                    });
                }
                else {
                    alert("查询出错\n" + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this),

            complete: function (XMLHttpRequest, textStatus) {
                Hidefullbg();
                $("#card_id_btn").removeClass('disabled');
            }.bind(this)
        });
    },

    render: function () {
        var OrderNodes = this.state.order_list.map(function (order) {
            var t = new Date(order.create_time);
            var time = t.toLocaleString();
            var agent_t = new Date(order.agents[0].tsp);
            var agent_time = agent_t.toLocaleString();
            console.log(agent_time);
            return (
                <OrderBox order={order} time={time} agent_time={agent_time}>{order.agents}</OrderBox>
            );
        });

        return (
            <div className="wrapper">
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left"><i className="icon-search"></i>卡充查询</span>
                    </header>
                    <div className="panel-body">
                        <div className="form-group row">
                            <h4 className="col-md-1 col-md-offset-1 control-label">订单号</h4>
                            <div className="col-md-6">
                                <input id="form_order_id" maxLength="30" type="text" className="form-control m-bot15" placeholder="请输入要查询的订单号" />
                            </div>
                            <div className="col-md-2">
                                <a id="order_id_btn" onClick={this.onClickFormOrderId} href="javascript:" className="btn btn-info"><i className="icon-search"></i><span> 订单查询</span></a>
                            </div>
                        </div>
                        <div className="form-group row">
                            <h4 className="col-md-1 col-md-offset-1 control-label">卡号</h4>
                            <div className="col-md-6">
                                <input id="form_card_id"  maxLength="20" type="text" className="form-control m-bot15" placeholder="请输入要查询的卡号" />
                            </div>
                            <div className="col-md-2">
                                <a id="card_id_btn" onClick={this.onClickFormCardId} href="javascript:" className="btn btn-info"><i className="icon-search"></i><span> 卡号查询</span></a>
                            </div>
                        </div>
                    </div>
                </section>
                {OrderNodes}
            </div>
            );
    }
});


//卡号查询结果
var OrderBox = React.createClass({
    setState: function (){
        
    },

    getResultDesc: function (result) {
        return {
            '1': {'face': 'label-success label', name: '手工成功(1)'},
            '9': {'face': 'label-info label', name: '手工失败(9)'},

            '101': {'face': 'label-success label', name: '成功充值(101)'},
            '102': {'face': 'label-success label', name: '成功充值(102)'},

            '900': {'face': 'label-info label', name: '其他未知状态(900)'},
            '901': {'face': 'label-info label', name: '充值卡密码有误(901)'},
            '902': {'face': 'label-info label', name: '充值卡已失效(902)'},
            '903': {'face': 'label-info label', name: '输入有误(903)'},
            '904': {'face': 'label-info label', name: '目前暂不能充值(904)'},
            '905': {'face': 'label-info label', name: '输入超时(905)'},
            '906': {'face': 'label-info label', name: '操作失败(906)'},
            '907': {'face': 'label-info label', name: '手机号码有误(907)'},
            '908': {'face': 'label-info label', name: '您不能为该用户充值(908)'},
            '909': {'face': 'label-info label', name: '其他服务请按1(909)'},
            '910': {'face': 'label-info label', name: '充值失败(910)'},

            '991': {'face': 'label-warning label', name: '通话一接通就挂断(991)'},
            '992': {'face': 'label-warning label', name: '通话时间过长(992)'},
            '993': {'face': 'label-warning label', name: '输完卡密之前挂断(993)'},
            '994': {'face': 'label-warning label', name: '输完卡密之后挂断(994)'},
            '995': {'face': 'label-warning label', name: '充值超时(995)'}

        }[result] || {'face': 'label-success label', name: '未知'}
    },

    render: function () {

        var callNodes = this.props.children.map(function (agents, i) {
            var t = new Date(agents.tsp);
            var m = '' + (t.getMonth() + 1);
            if (m.length == 1) m = "0" + m;
            var y = '' + t.getFullYear();
            var d = '' + t.getDate();
            if (d.length == 1) d = "0" + d;

            var path = y + m + '/' + d;

            var wav = 'http://112.25.220.13:9004/data/' + path + '/' + agents.agent + '/' + this.props.order._id + '_' + (i + 1) + '_ALL.wav';
            var mp3 = 'http://112.25.220.13:9004/data/' + path + '/' + agents.agent + '/' + this.props.order._id + '_' + (i + 1) + '_ALL.mp3';
            var msg = this.getResultDesc(agents.result);
            
            var audio_control = '';
            if (agents.result != 1 && agents.result != 9) {
                audio_control = (
                    <audio controls>
                        <source src={wav} type="audio/wav"/>
                        <source src={mp3} type="audio/mp3"/>
                    </audio>
                    );
            }
            
            return (
                <tr>
                    <td>{i + 1}</td>
                    <td>
                        <span className={msg.face}>{msg.name}</span>
                    </td>
                    <td>{agents.agent}</td>
                    <td>{audio_control}</td>
                </tr>
            );
        }.bind(this));

    
        return (
            <div className="panel" id="quxun_card">
                <header className="panel-heading row">
                    <span className="pull-left"><i
                        className="icon-list-alt"></i><span>订单号: {this.props.order._id}</span></span>
                </header>
                <div className="panel">
                    <table className="table table-bordered">
                        <thead>
                        <tr className="active">
                            <td>卡号</td>
                            <td>充值号码</td>
                            <td>充值时间</td>
                            <td>面值</td>
                            <td>话机时间</td>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>{this.props.order.card_id}</td>
                            <td>{this.props.order.mobile}</td>
                            <td>{this.props.time}</td>
                            <td>{this.props.order.price}</td>
                            <td>{this.props.agent_time}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div className="row col-sm-12">
                    <div className="col-sm-8">
                        <table className="table table-advance table-bordered">
                            <thead>
                            <tr className="active">
                                <td>序号</td>
                                <td>结果</td>
                                <td>分机</td>
                                <td>语音</td>
                            </tr>
                            </thead>
                            <tbody>
                                {callNodes}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
}
});

React.render(
    <MainContent />
    ,
    document.getElementById('main-content')
);