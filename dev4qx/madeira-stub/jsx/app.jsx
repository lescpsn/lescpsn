// main.js
var React = require('react');
var ReactDOM = require('react-dom');

var ControlPanel = React.createClass({

    getInitialState: function () {
        return {
            target_list: [
                {value: "http://localhost:8899", name: 'Localhost(8899)'},
                {value: "http://fee.e7chong.com:8899", name: 'fee.e7chong.com(8899)'},
                {value: "http://localhost:8902", name: 'Localhost(8902)Ranger'}
            ],
            mobile_list: [
                {value: "13951771065", name: "(江苏移动)13951771065"},
                {value: "18132085842", name: "(江苏电信)18132085842"},
                {value: "15950536228", name: "(江苏移动)15950536228"},
                {value: "18605170123", name: "(江苏联通)18605170123"},
                {value: "15089340050", name: "(广东移动)15089340050"},
                {value: "18822972877", name: "(广东移动)18822972877"}
            ],
            user_list: [{id: "100001", name: "100001"}],
            product_list: [
                {id: "TBM00000100A", name: "移动(全国)10M通用流量", price: "3", value: '29000', cost: '28000', scope: '0'},
                {id: "TBM00000300A", name: "移动(全国)30M通用流量", price: "5", value: '49000', cost: '48000', scope: '0'},
                {id: "TBM00001500A", name: "移动(全国)150M通用流量", price: "20", value: '190000', cost: '180000', scope: '0'},
                {id: "TBM00003000B", name: "移动(全国)300M通用流量", price: "20", value: '190000', cost: '180000', scope: '1'},
                {id: "TBU00000200A", name: "联通20M流量包", price: "3", value: '29000', cost: '28000', scope: '0'},
                {id: "TBC00000300B", name: "电信(全国)30M流量包", price: "5", value: '40000', cost: '35000', scope: '0'}
            ],
            route_list: [
                {value: "", name: "无"},
                {value: "suopai-direct", name: "索派直连"},
                {value: "ranger", name: "广东移动话费直充"},
                {value: "telecom_gz", name: "河源电信"},
                {value: "people", name: "人民网"},
                {value: "shangtong", name: "尚通"},
                {value: "xicheng", name: "西城"},
                {value: "trafficweb", name: "乐流"},
                {value: "telecom_js", name: "江苏电信"},
                {value: "ibumobile", name: "中深源"},
                {value: "mopote", name: "魔品"},
                {value: "cmcc", name: "广东移动"},
                {value: "xiamen_zyt", name: "厦门掌易通"},
                {value: "aspire_ec", name: "江苏移动"},
                {value: "faliuliang2", name: "5A流量"},
                {value: "xicheng;xicheng@1", name: "西城"}
            ],
            current_route: "default",
            result_list: {

                "default": [
                    {name: "无", value: ""}
                ],
                "suopai-direct": [
                    {name: "索派-直接失败", value: "false"},
                    {name: "索派-回调失败", value: "true,0"},
                    {name: "索派-回调成功", value: "true,1"}
                ],
                "ranger": [
                    {name: "广东移动话费直充-失败", value: "8888;充值失败"},
                    {name: "广东移动话费直充-成功", value: "0000;充值成功"}
                ],
                "telecom_gz": [
                    {name: "河源电信-直接失败", value: "8000,0000;其他错误。请联系工程师跟进"},
                    {name: "河源电信-回调失败", value: "0000,0003;充值失败"},
                    {name: "河源电信-回调成功", value: "0000,0002;充值成功"}
                ],
                "people": [
                    {name: "人民网-直接失败", value: "8000,0000;其他错误。请联系工程师跟进"},
                    {name: "人民网-回调失败", value: "0000,0003;充值失败"},
                    {name: "人民网-回调成功", value: "0000,0002;充值成功"}
                ],
                "shangtong": [
                    {name: "尚通-直接失败", value: "8000,0000;其他错误。请联系工程师跟进"},
                    {name: "尚通-回调失败", value: "0000,0003;充值失败"},
                    {name: "尚通-回调成功", value: "0000,0002;充值成功"}
                ],
                "xicheng": [
                    {name: "西城-直接失败", value: "1003,0000"},
                    {name: "西城-回调失败", value: "0000,1003;电信通道故障！"},
                    {name: "西城-回调成功", value: "0000,0000;成功"}
                ],
                "trafficweb": [
                    {name: "乐流-直接失败", value: "99999"},
                    {name: "乐流-回调失败", value: "00000,fail"},
                    {name: "乐流-回调成功", value: "00000,finish"}
                ],
                "telecom_js": [
                    {name: "江苏电信-失败", value: "10900"},
                    {name: "江苏电信-成功", value: "0;成功"}
                ],
                "ibumobile": [
                    {name: "中深源-直接失败", value: "102,0000"},
                    {name: "中深源-回调失败", value: "100,-99999;订单充值失败"},
                    {name: "中深源-回调成功", value: "100,00;成功"}
                ],
                "mopote": [
                    {name: "魔品-直接失败", value: "1000,0;订单提交失败"},
                    {name: "魔品-回调失败", value: "0000,0;充值失败"},
                    {name: "魔品-回调成功", value: "0000,1;充值成功"}
                ],
                "cmcc": [
                    {name: "广东移动-直接失败", value: "1"},
                    {name: "广东移动-回调成功", value: "0"}
                ],
                "xiamen_zyt": [
                    {name: "厦门掌易通-直接失败", value: "7"},
                    {name: "厦门掌易通-回调失败", value: "0,10010;欠费/停机"},
                    {name: "厦门掌易通-回调成功", value: "0,00000"}
                ],
                "aspire_ec": [
                    {name: "江苏移动-直接失败(没有实例)", value: "02"},
                    {name: "江苏移动-回调失败", value: "00,0000"},
                    {name: "江苏移动-回调成功", value: "00,0305;禁止重复办理业务"}
                ],
                "faliuliang2": [
                    {name: "5A流量-直接失败(没有实例)", value: "23"},
                    {name: "5A流量-回调失败", value: "0,r"},
                    {name: "5A流量-回调成功", value: "0,s;失败"}
                ]
            },

            current_product: 'TBC00002000A'
        };
    },

    componentDidMount: function () {
        this.changeProduct(this.state.product_list[0].id);
    },

    changeProduct: function (id) {
        var product_list = this.state.product_list;
        for (var index in product_list) {
            if (product_list[index].id == id) {
                $('#price').val(product_list[index].price);
                $('#value').val(product_list[index].value);
                $('#cost').val(product_list[index].cost);
                $('#scope').val(product_list[index].scope);
                break;
            }
        }
    },

    onChangeProduct: function (event) {
        var id = event.target.value;
        this.setState({current_product: id});
        this.changeProduct(id);
    },

    onCreateOrder: function () {
        var q = {
            type: 'data',
            user_id: $('#user_id').val(),
            price: $('#price').val(),
            mobile: $('#mobile').val(),
            cost: $('#cost').val(),
            value: $('#value').val(),
            result: $('#result').val(),
            url: $('#url').val(),
            routing: $('#routing').val(),
            offer: $('#offer').val(),
            scope: $('#scope').val()
        };

        console.info('query string=' + q);

        $("#message").text('');

        var url = '/unit/start';

        $.post(url, JSON.stringify(q)).done(function (data) {
            console.info('return=' + data);
            $("#message").text(data);
        }).fail(function (e) {
            alert('fail');
            $("#message").text('Fail');
        });
    },

    onCreateFeeOrder: function () {
        var q = {
            type: 'fee',
            user_id: $('#user_id').val(),
            price: $('#price').val(),
            mobile: $('#mobile').val(),
            cost: $('#cost').val(),
            value: $('#value').val(),
            result: $('#result').val(),
            url: $('#url').val(),
            routing: $('#routing').val(),
            offer: $('#offer').val()
        };

        console.info('query string=' + q);

        $("#message").text('');

        var url = '/unit/start';

        $.post(url, JSON.stringify(q)).done(function (data) {
            console.info('return=' + data);
            $("#message").text(data);
        }).fail(function (e) {
            alert('fail');
            $("#message").text('Fail');
        });
    },

    onCleanOrder: function () {
        $.get('/unit/tools/clean_order').done(function (data) {
            alert('OK')
        }).fail(function (e) {
            alert('Fail');
        });
    },

    onChangeRouting: function (e) {
        this.setState({current_route: e.target.value});
    },

    render: function () {
        var routeNode = this.state.route_list.map(function (r, i) {
            return (<option value={r.value}>{r.name} - {r.value}</option>);
        });

        var targetNode = this.state.target_list.map(function (t, i) {
            return (<option value={t.value}>{t.name}</option>);
        });

        var mobileNode = this.state.mobile_list.map(function (m, i) {
            return (<option value={m.value}>{m.name}</option>);
        });

        var productNode = this.state.product_list.map(function (p, i) {
            return (<option value={p.id}>{p.id} - {p.name}</option>);
        });

        var userNode = this.state.user_list.map(function (u, i) {
            return (<option value={u.id}>{u.name}</option>);
        });

        var result_list = null;
        if (this.state.current_route in this.state.result_list) {
            result_list = this.state.result_list[this.state.current_route];
        } else {
            result_list = this.state.result_list["default"];
        }

        var resultNode = result_list.map(function (u, i) {
            return (<option value={u.value}>{u.name} - {u.value}</option>);
        });

        return (
            <div className="row">
                <div className="col-md-12 form-horizontal">

                    <div className="row">

                        <label className="col-md-2 control-label">路由</label>

                        <div className="col-md-4 form-group">
                            <select className="form-control" id='routing' onChange={this.onChangeRouting}>
                                {routeNode}
                            </select>
                        </div>

                        <label className="col-md-2 control-label">目标</label>

                        <div className="col-md-4 form-group">
                            <select className="form-control" id='url'>
                                {targetNode}
                            </select>
                        </div>

                        <label className="col-md-2 control-label">结果</label>

                        <div className="col-md-4 form-group">
                            <select className="form-control" id='result'>
                                {resultNode}
                            </select>
                        </div>

                        <label className="col-md-2 control-label">号码</label>

                        <div className="col-md-4 form-group">
                            <select className="form-control" id='mobile'>
                                {mobileNode}
                            </select>
                        </div>

                        <label className="col-md-2 control-label">产品</label>

                        <div className="col-md-4 form-group">
                            <select className='form-control' id="offer" name='offer'
                                    value={this.state.current_product}
                                    onChange={this.onChangeProduct}>
                                {productNode}
                            </select>
                        </div>

                        <label className="col-md-2 control-label">用户</label>

                        <div className="col-md-4 form-group">
                            <select className="form-control" id='user_id'>
                                {userNode}
                            </select>
                        </div>

                        <label className="col-md-2 control-label">面值</label>

                        <div className="col-md-1 form-group">
                            <input className='form-control' type='text' id="price" name='price'/>
                            <input className='form-control' type='hidden' id="scope" name='scope'/>
                        </div>

                        <label className="col-md-1 control-label">售价</label>

                        <div className="col-md-1 form-group">
                            <input className='form-control' type='text' id="value" name='value'/>
                        </div>

                        <label className="col-md-1 control-label">成本</label>

                        <div className="col-md-1 form-group">
                            <input className='form-control' type='text' id="cost" name='cost'/>
                        </div>

                        <div className="col-md-offset-1 col-md-4" style={{'margin-bottom': '15px'}}>
                            <a className="btn btn-danger" onClick={this.onCreateOrder}>START!</a>
                            <a className="btn btn-danger" onClick={this.onCreateFeeOrder}>FEE!</a>
                            <a className="btn btn-danger" onClick={this.onCleanOrder}>Clean Order</a>
                        </div>

                        <label className="col-md-2 control-label">Result</label>

                        <div className="col-md-10">
                            <pre style={{height: '200px'}} id="message" className="highlight"></pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

ReactDOM.render(
    <ControlPanel/>,
    document.getElementById('main-content')
);