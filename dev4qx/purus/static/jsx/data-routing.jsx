var React = require('react');
var ReactDOM = require('react-dom');

var AdminPanel = React.createClass({
    getInitialState: function () {
        return {
            'province': [],
            'states': [],
            'user_map': {},
            'user_list': [],
        };
    },

    loadUserList: function () {
        $.ajax({
            url: '/api/user/list',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                var user_map = {};
                console.info('USER:' + JSON.stringify(data));
                for (var i in data) {
                    user_map[data[i]['id']] = data[i]['name'];
                }

                this.setState({
                    'user_map': user_map,
                    'user_list': data
                });

                $('#form_user').selectpicker({});

            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadRouting: function () {
        var user_id = $("#form_user").val();
        var carrier = $("#carrier").val();

        console.info('LOAD ROUTING');

        var request = {
            'user_id': user_id,
            'carrier': carrier,
            'area': '*'
        };

        console.info(JSON.stringify(request));

        $.ajax({
            url: '/services/data_routing/all',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),

            success: function (data) {
                var routing_pr = [];
                var routing_st = [];

                for (var k in data) {
                    if (k == 'CN') {
                        routing_st.push(data[k]);
                    } else {
                        routing_pr.push(data[k]);
                    }
                }

                console.info(JSON.stringify(routing_pr));
                console.info(JSON.stringify(routing_st));

                this.setState({
                    'province': routing_pr,
                    'states': routing_st
                });

            }.bind(this),

            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function () {
        this.loadUserList();
        this.loadRouting();
    },

    render: function () {
        var userNode = this.state.user_list.map(function (u, i) {
            return (<option value={u.master}>{u.master} - {u.name}</option>);
        });

        return (
            <div>
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left"><i className="icon-table"></i>路由</span>
                    </header>

                    <div className="panel-body">
                        <form className="form-horizontal" method='get'>
                            <div className="col-sm-12">
                                <lable className='control-label col-sm-1 col-md-1'>运营商</lable>
                                <div className='col-sm-2 col-md-2'>
                                    <select id='carrier'
                                            className='form-control m-bot15 input-sm'>
                                        <option value='*'>全部</option>
                                        <option value='1'>移动</option>
                                        <option value='2'>联通</option>
                                        <option value='3'>电信</option>
                                    </select>
                                </div>

                                <lable className='control-label col-sm-1 col-md-1'>用户</lable>
                                <div className='col-sm-2 col-md-2'>
                                    <select className='form-control m-bot15 input-sm'
                                            id='form_user' data-live-search="true">
                                        <option value='*'>全部</option>
                                        {userNode}
                                    </select>
                                </div>

                                <lable className='control-label col-sm-1 col-md-1'>区域</lable>
                                <div className='col-sm-2 col-md-2'>
                                    <select className='form-control m-bot15 input-sm'>
                                        <option>全国</option>
                                        <option>广东</option>
                                        <option>江苏</option>
                                    </select>
                                </div>

                                <a className='btn btn-small btn-danger' href='javascript:void(0);'
                                   onClick={this.loadRouting}>过滤</a>
                            </div>
                        </form>
                    </div>
                </section>

                <RoutingPanel data={this.state.province} user_map={this.state.user_map}/>
                <RoutingPanel data={this.state.states} user_map={this.state.user_map}/>

            </div>
        );
    }
});

var areaMap = {
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

var upstreamMap = {
    'mopote': '成都微品',
    'cmcc': '广东移动-趣讯',
    'cmcc-leliu': '广东移动-乐流',
    'cmcc-ha': '河南移动',
    'xicheng': '上海西城',
    'aspire': '卓望',
    '21cn-leliu': '21cn-乐流',
    'legend': '越亮传奇',
    'CLOSE': '维护'
};

var RoutingPanel = React.createClass({

    render: function () {
        var data = this.props.data || [];
        //alert(data);

        var nodes = data.map(function (area_set, i) {
            //area
            var areaNodes = [];
            for (var upstream_key in area_set) {
                var upstream_node = area_set[upstream_key];

                var area_name = areaMap[upstream_node.area] || upstream_node.area;
                var upstream_name = upstreamMap[upstream_key] || upstream_key;

                var userNode = upstream_node.user.map(function (u, i) {
                    var user_name = this.props.user_map[u] || u;
                    return (<li>{u} {user_name}</li>);
                }.bind(this));

                var discountNode = upstream_node.discount.map(function (d, i) {
                    return (<span className='label label-success'>{d + '%'}</span>);
                });

                var valueNode = upstream_node.value.map(function (v, i) {
                    return (<span className='badge badge-danger'>{v}</span>);
                });

                areaNodes.push(
                    <section className='panel'>
                        <header className="panel-heading row">
                            <span className="pull-left">
                                <i className="icon-fullscreen"></i>{area_name} - {upstream_name}</span>
                            <span className="pull-right">{valueNode} {discountNode}</span>
                        </header>

                        <div className='panel-body'>

                            <div>
                                <ul>
                                    {userNode}
                                </ul>
                            </div>
                        </div>
                    </section>
                );
            }

            return areaNodes;
        }.bind(this));

        return (
            <div className="col-sm-6 col-md-6">
                {nodes}
            </div>
        );
    }
});

React.render(
    <AdminPanel />
    ,
    document.getElementById('content')
);
