//显示全屏遮罩
"use strict";

var Showfullbg = function Showfullbg() {
    $("#reload_fullbg,#reload_icon").show();
};

//隐藏全屏遮罩
var Hidefullbg = function Hidefullbg() {
    $("#reload_fullbg,#reload_icon").hide();
};

var re_order = /^Q[0-9]{22}$/;
var re_card = /^\d{17}$/;

var MainContent = React.createClass({
    displayName: "MainContent",

    getInitialState: function getInitialState() {
        return {
            order_list: []
        };
    },

    componentDidMount: function componentDidMount() {},

    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {},

    //订单查询按钮
    onClickFormOrderId: function onClickFormOrderId() {
        var order_id = $("#form_order_id").val();
        if (!re_order.test(order_id)) {
            alert("请检查您输入的订单号\n订单号为大写字母Q开头加22位数字\n例如: Q2015031812355001871025");
            return;
        }

        $("#order_id_btn").addClass('disabled');
        Showfullbg();

        $.ajax({
            url: _.str.sprintf('/forrestal_query/cmcc_fee/query_order?&requ_type=%s&order_id=%s', encodeURIComponent('by_order_id'), encodeURIComponent(order_id)),

            type: 'GET',
            dataType: 'json',

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        order_list: resp_data.data.order_list
                    });
                } else {
                    alert("查询出错\n" + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }).bind(this),

            complete: (function (XMLHttpRequest, textStatus) {
                Hidefullbg();
                $("#order_id_btn").removeClass('disabled');
            }).bind(this)
        });
    },

    //卡号查询按钮
    onClickFormCardId: function onClickFormCardId() {
        var card_id = $("#form_card_id").val();
        if (!re_card.test(card_id)) {
            alert("请检查您输入的卡号\n卡号为17位数字\n例如: 14606104111331409");
            return;
        }

        $("#card_id_btn").addClass('disabled');
        Showfullbg();

        $.ajax({
            url: _.str.sprintf('/forrestal_query/cmcc_fee/query_order?&requ_type=%s&card_id=%s', encodeURIComponent('by_card_id'), encodeURIComponent(card_id)),

            type: 'GET',
            dataType: 'json',

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        order_list: resp_data.data.order_list
                    });
                } else {
                    alert("查询出错\n" + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }).bind(this),

            complete: (function (XMLHttpRequest, textStatus) {
                Hidefullbg();
                $("#card_id_btn").removeClass('disabled');
            }).bind(this)
        });
    },

    render: function render() {
        var OrderNodes = this.state.order_list.map(function (order) {
            var t = new Date(order.create_time);
            var time = t.toLocaleString();
            var agent_t = new Date(order.agents[0].tsp);
            var agent_time = agent_t.toLocaleString();
            console.log(agent_time);
            return React.createElement(
                OrderBox,
                { order: order, time: time, agent_time: agent_time },
                order.agents
            );
        });

        return React.createElement(
            "div",
            { className: "wrapper" },
            React.createElement(
                "section",
                { className: "panel" },
                React.createElement(
                    "header",
                    { className: "panel-heading row" },
                    React.createElement(
                        "span",
                        { className: "pull-left" },
                        React.createElement("i", { className: "icon-search" }),
                        "卡充查询"
                    )
                ),
                React.createElement(
                    "div",
                    { className: "panel-body" },
                    React.createElement(
                        "div",
                        { className: "form-group row" },
                        React.createElement(
                            "h4",
                            { className: "col-md-1 col-md-offset-1 control-label" },
                            "订单号"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-md-6" },
                            React.createElement("input", { id: "form_order_id", maxLength: "30", type: "text", className: "form-control m-bot15", placeholder: "请输入要查询的订单号" })
                        ),
                        React.createElement(
                            "div",
                            { className: "col-md-2" },
                            React.createElement(
                                "a",
                                { id: "order_id_btn", onClick: this.onClickFormOrderId, href: "javascript:", className: "btn btn-info" },
                                React.createElement("i", { className: "icon-search" }),
                                React.createElement(
                                    "span",
                                    null,
                                    " 订单查询"
                                )
                            )
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "form-group row" },
                        React.createElement(
                            "h4",
                            { className: "col-md-1 col-md-offset-1 control-label" },
                            "卡号"
                        ),
                        React.createElement(
                            "div",
                            { className: "col-md-6" },
                            React.createElement("input", { id: "form_card_id", maxLength: "20", type: "text", className: "form-control m-bot15", placeholder: "请输入要查询的卡号" })
                        ),
                        React.createElement(
                            "div",
                            { className: "col-md-2" },
                            React.createElement(
                                "a",
                                { id: "card_id_btn", onClick: this.onClickFormCardId, href: "javascript:", className: "btn btn-info" },
                                React.createElement("i", { className: "icon-search" }),
                                React.createElement(
                                    "span",
                                    null,
                                    " 卡号查询"
                                )
                            )
                        )
                    )
                )
            ),
            OrderNodes
        );
    }
});

//卡号查询结果
var OrderBox = React.createClass({
    displayName: "OrderBox",

    setState: function setState() {},

    getResultDesc: function getResultDesc(result) {
        return ({
            '1': { 'face': 'label-success label', name: '手工成功(1)' },
            '9': { 'face': 'label-info label', name: '手工失败(9)' },

            '101': { 'face': 'label-success label', name: '成功充值(101)' },
            '102': { 'face': 'label-success label', name: '成功充值(102)' },

            '900': { 'face': 'label-info label', name: '其他未知状态(900)' },
            '901': { 'face': 'label-info label', name: '充值卡密码有误(901)' },
            '902': { 'face': 'label-info label', name: '充值卡已失效(902)' },
            '903': { 'face': 'label-info label', name: '输入有误(903)' },
            '904': { 'face': 'label-info label', name: '目前暂不能充值(904)' },
            '905': { 'face': 'label-info label', name: '输入超时(905)' },
            '906': { 'face': 'label-info label', name: '操作失败(906)' },
            '907': { 'face': 'label-info label', name: '手机号码有误(907)' },
            '908': { 'face': 'label-info label', name: '您不能为该用户充值(908)' },
            '909': { 'face': 'label-info label', name: '其他服务请按1(909)' },
            '910': { 'face': 'label-info label', name: '充值失败(910)' },

            '991': { 'face': 'label-warning label', name: '通话一接通就挂断(991)' },
            '992': { 'face': 'label-warning label', name: '通话时间过长(992)' },
            '993': { 'face': 'label-warning label', name: '输完卡密之前挂断(993)' },
            '994': { 'face': 'label-warning label', name: '输完卡密之后挂断(994)' },
            '995': { 'face': 'label-warning label', name: '充值超时(995)' }

        })[result] || { 'face': 'label-success label', name: '未知' };
    },

    render: function render() {

        var callNodes = this.props.children.map((function (agents, i) {
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
                audio_control = React.createElement(
                    "audio",
                    { controls: true },
                    React.createElement("source", { src: wav, type: "audio/wav" }),
                    React.createElement("source", { src: mp3, type: "audio/mp3" })
                );
            }

            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    null,
                    i + 1
                ),
                React.createElement(
                    "td",
                    null,
                    React.createElement(
                        "span",
                        { className: msg.face },
                        msg.name
                    )
                ),
                React.createElement(
                    "td",
                    null,
                    agents.agent
                ),
                React.createElement(
                    "td",
                    null,
                    audio_control
                )
            );
        }).bind(this));

        return React.createElement(
            "div",
            { className: "panel", id: "quxun_card" },
            React.createElement(
                "header",
                { className: "panel-heading row" },
                React.createElement(
                    "span",
                    { className: "pull-left" },
                    React.createElement("i", {
                        className: "icon-list-alt" }),
                    React.createElement(
                        "span",
                        null,
                        "订单号: ",
                        this.props.order._id
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "panel" },
                React.createElement(
                    "table",
                    { className: "table table-bordered" },
                    React.createElement(
                        "thead",
                        null,
                        React.createElement(
                            "tr",
                            { className: "active" },
                            React.createElement(
                                "td",
                                null,
                                "卡号"
                            ),
                            React.createElement(
                                "td",
                                null,
                                "充值号码"
                            ),
                            React.createElement(
                                "td",
                                null,
                                "充值时间"
                            ),
                            React.createElement(
                                "td",
                                null,
                                "面值"
                            ),
                            React.createElement(
                                "td",
                                null,
                                "话机时间"
                            )
                        )
                    ),
                    React.createElement(
                        "tbody",
                        null,
                        React.createElement(
                            "tr",
                            null,
                            React.createElement(
                                "td",
                                null,
                                this.props.order.card_id
                            ),
                            React.createElement(
                                "td",
                                null,
                                this.props.order.mobile
                            ),
                            React.createElement(
                                "td",
                                null,
                                this.props.time
                            ),
                            React.createElement(
                                "td",
                                null,
                                this.props.order.price
                            ),
                            React.createElement(
                                "td",
                                null,
                                this.props.agent_time
                            )
                        )
                    )
                )
            ),
            React.createElement(
                "div",
                { className: "row col-sm-12" },
                React.createElement(
                    "div",
                    { className: "col-sm-8" },
                    React.createElement(
                        "table",
                        { className: "table table-advance table-bordered" },
                        React.createElement(
                            "thead",
                            null,
                            React.createElement(
                                "tr",
                                { className: "active" },
                                React.createElement(
                                    "td",
                                    null,
                                    "序号"
                                ),
                                React.createElement(
                                    "td",
                                    null,
                                    "结果"
                                ),
                                React.createElement(
                                    "td",
                                    null,
                                    "分机"
                                ),
                                React.createElement(
                                    "td",
                                    null,
                                    "语音"
                                )
                            )
                        ),
                        React.createElement(
                            "tbody",
                            null,
                            callNodes
                        )
                    )
                )
            )
        );
    }
});

React.render(React.createElement(MainContent, null), document.getElementById('main-content'));

