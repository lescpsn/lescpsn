(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var React = require('react');
var ReactDOM = require('react-dom');

var AdminPanel = React.createClass({
    displayName: 'AdminPanel',

    getInitialState: function () {
        return {
            'province': [],
            'states': [],
            'user_map': {},
            'user_list': []
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
            return React.createElement(
                'option',
                { value: u.master },
                u.master,
                ' - ',
                u.name
            );
        });

        return React.createElement(
            'div',
            null,
            React.createElement(
                'section',
                { className: 'panel' },
                React.createElement(
                    'header',
                    { className: 'panel-heading row' },
                    React.createElement(
                        'span',
                        { className: 'pull-left' },
                        React.createElement('i', { className: 'icon-table' }),
                        '路由'
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'panel-body' },
                    React.createElement(
                        'form',
                        { className: 'form-horizontal', method: 'get' },
                        React.createElement(
                            'div',
                            { className: 'col-sm-12' },
                            React.createElement(
                                'lable',
                                { className: 'control-label col-sm-1 col-md-1' },
                                '运营商'
                            ),
                            React.createElement(
                                'div',
                                { className: 'col-sm-2 col-md-2' },
                                React.createElement(
                                    'select',
                                    { id: 'carrier',
                                        className: 'form-control m-bot15 input-sm' },
                                    React.createElement(
                                        'option',
                                        { value: '*' },
                                        '全部'
                                    ),
                                    React.createElement(
                                        'option',
                                        { value: '1' },
                                        '移动'
                                    ),
                                    React.createElement(
                                        'option',
                                        { value: '2' },
                                        '联通'
                                    ),
                                    React.createElement(
                                        'option',
                                        { value: '3' },
                                        '电信'
                                    )
                                )
                            ),
                            React.createElement(
                                'lable',
                                { className: 'control-label col-sm-1 col-md-1' },
                                '用户'
                            ),
                            React.createElement(
                                'div',
                                { className: 'col-sm-2 col-md-2' },
                                React.createElement(
                                    'select',
                                    { className: 'form-control m-bot15 input-sm',
                                        id: 'form_user', 'data-live-search': 'true' },
                                    React.createElement(
                                        'option',
                                        { value: '*' },
                                        '全部'
                                    ),
                                    userNode
                                )
                            ),
                            React.createElement(
                                'lable',
                                { className: 'control-label col-sm-1 col-md-1' },
                                '区域'
                            ),
                            React.createElement(
                                'div',
                                { className: 'col-sm-2 col-md-2' },
                                React.createElement(
                                    'select',
                                    { className: 'form-control m-bot15 input-sm' },
                                    React.createElement(
                                        'option',
                                        null,
                                        '全国'
                                    ),
                                    React.createElement(
                                        'option',
                                        null,
                                        '广东'
                                    ),
                                    React.createElement(
                                        'option',
                                        null,
                                        '江苏'
                                    )
                                )
                            ),
                            React.createElement(
                                'a',
                                { className: 'btn btn-small btn-danger', href: 'javascript:void(0);',
                                    onClick: this.loadRouting },
                                '过滤'
                            )
                        )
                    )
                )
            ),
            React.createElement(RoutingPanel, { data: this.state.province, user_map: this.state.user_map }),
            React.createElement(RoutingPanel, { data: this.state.states, user_map: this.state.user_map })
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
    displayName: 'RoutingPanel',

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
                    return React.createElement(
                        'li',
                        null,
                        u,
                        ' ',
                        user_name
                    );
                }.bind(this));

                var discountNode = upstream_node.discount.map(function (d, i) {
                    return React.createElement(
                        'span',
                        { className: 'label label-success' },
                        d + '%'
                    );
                });

                var valueNode = upstream_node.value.map(function (v, i) {
                    return React.createElement(
                        'span',
                        { className: 'badge badge-danger' },
                        v
                    );
                });

                areaNodes.push(React.createElement(
                    'section',
                    { className: 'panel' },
                    React.createElement(
                        'header',
                        { className: 'panel-heading row' },
                        React.createElement(
                            'span',
                            { className: 'pull-left' },
                            React.createElement('i', { className: 'icon-fullscreen' }),
                            area_name,
                            ' - ',
                            upstream_name
                        ),
                        React.createElement(
                            'span',
                            { className: 'pull-right' },
                            valueNode,
                            ' ',
                            discountNode
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'panel-body' },
                        React.createElement(
                            'div',
                            null,
                            React.createElement(
                                'ul',
                                null,
                                userNode
                            )
                        )
                    )
                ));
            }

            return areaNodes;
        }.bind(this));

        return React.createElement(
            'div',
            { className: 'col-sm-6 col-md-6' },
            nodes
        );
    }
});

React.render(React.createElement(AdminPanel, null), document.getElementById('content'));

},{"react":"react","react-dom":"react-dom"}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWNcXGpzeFxcZGF0YS1yb3V0aW5nLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUksUUFBUSxRQUFRLE9BQVIsQ0FBUjtBQUNKLElBQUksV0FBVyxRQUFRLFdBQVIsQ0FBWDs7QUFFSixJQUFJLGFBQWEsTUFBTSxXQUFOLENBQWtCOzs7QUFDL0IscUJBQWlCLFlBQVk7QUFDekIsZUFBTztBQUNILHdCQUFZLEVBQVo7QUFDQSxzQkFBVSxFQUFWO0FBQ0Esd0JBQVksRUFBWjtBQUNBLHlCQUFhLEVBQWI7U0FKSixDQUR5QjtLQUFaOztBQVNqQixrQkFBYyxZQUFZO0FBQ3RCLFVBQUUsSUFBRixDQUFPO0FBQ0gsaUJBQUssZ0JBQUw7QUFDQSxzQkFBVSxNQUFWO0FBQ0Esa0JBQU0sS0FBTjtBQUNBLHFCQUFTLFVBQVUsSUFBVixFQUFnQjtBQUNyQixvQkFBSSxXQUFXLEVBQVgsQ0FEaUI7QUFFckIsd0JBQVEsSUFBUixDQUFhLFVBQVUsS0FBSyxTQUFMLENBQWUsSUFBZixDQUFWLENBQWIsQ0FGcUI7QUFHckIscUJBQUssSUFBSSxDQUFKLElBQVMsSUFBZCxFQUFvQjtBQUNoQiw2QkFBUyxLQUFLLENBQUwsRUFBUSxJQUFSLENBQVQsSUFBMEIsS0FBSyxDQUFMLEVBQVEsTUFBUixDQUExQixDQURnQjtpQkFBcEI7O0FBSUEscUJBQUssUUFBTCxDQUFjO0FBQ1YsZ0NBQVksUUFBWjtBQUNBLGlDQUFhLElBQWI7aUJBRkosRUFQcUI7O0FBWXJCLGtCQUFFLFlBQUYsRUFBZ0IsWUFBaEIsQ0FBNkIsRUFBN0IsRUFacUI7YUFBaEIsQ0FjUCxJQWRPLENBY0YsSUFkRSxDQUFUO0FBZUEsbUJBQU8sVUFBVSxHQUFWLEVBQWUsTUFBZixFQUF1QixHQUF2QixFQUE0QjtBQUMvQix3QkFBUSxLQUFSLENBQWMsS0FBSyxLQUFMLENBQVcsR0FBWCxFQUFnQixNQUE5QixFQUFzQyxJQUFJLFFBQUosRUFBdEMsRUFEK0I7YUFBNUIsQ0FFTCxJQUZLLENBRUEsSUFGQSxDQUFQO1NBbkJKLEVBRHNCO0tBQVo7O0FBMEJkLGlCQUFhLFlBQVk7QUFDckIsWUFBSSxVQUFVLEVBQUUsWUFBRixFQUFnQixHQUFoQixFQUFWLENBRGlCO0FBRXJCLFlBQUksVUFBVSxFQUFFLFVBQUYsRUFBYyxHQUFkLEVBQVYsQ0FGaUI7O0FBSXJCLGdCQUFRLElBQVIsQ0FBYSxjQUFiLEVBSnFCOztBQU1yQixZQUFJLFVBQVU7QUFDVix1QkFBVyxPQUFYO0FBQ0EsdUJBQVcsT0FBWDtBQUNBLG9CQUFRLEdBQVI7U0FIQSxDQU5pQjs7QUFZckIsZ0JBQVEsSUFBUixDQUFhLEtBQUssU0FBTCxDQUFlLE9BQWYsQ0FBYixFQVpxQjs7QUFjckIsVUFBRSxJQUFGLENBQU87QUFDSCxpQkFBSyw0QkFBTDtBQUNBLHNCQUFVLE1BQVY7QUFDQSxrQkFBTSxNQUFOO0FBQ0Esa0JBQU0sS0FBSyxTQUFMLENBQWUsT0FBZixDQUFOOztBQUVBLHFCQUFTLFVBQVUsSUFBVixFQUFnQjtBQUNyQixvQkFBSSxhQUFhLEVBQWIsQ0FEaUI7QUFFckIsb0JBQUksYUFBYSxFQUFiLENBRmlCOztBQUlyQixxQkFBSyxJQUFJLENBQUosSUFBUyxJQUFkLEVBQW9CO0FBQ2hCLHdCQUFJLEtBQUssSUFBTCxFQUFXO0FBQ1gsbUNBQVcsSUFBWCxDQUFnQixLQUFLLENBQUwsQ0FBaEIsRUFEVztxQkFBZixNQUVPO0FBQ0gsbUNBQVcsSUFBWCxDQUFnQixLQUFLLENBQUwsQ0FBaEIsRUFERztxQkFGUDtpQkFESjs7QUFRQSx3QkFBUSxJQUFSLENBQWEsS0FBSyxTQUFMLENBQWUsVUFBZixDQUFiLEVBWnFCO0FBYXJCLHdCQUFRLElBQVIsQ0FBYSxLQUFLLFNBQUwsQ0FBZSxVQUFmLENBQWIsRUFicUI7O0FBZXJCLHFCQUFLLFFBQUwsQ0FBYztBQUNWLGdDQUFZLFVBQVo7QUFDQSw4QkFBVSxVQUFWO2lCQUZKLEVBZnFCO2FBQWhCLENBb0JQLElBcEJPLENBb0JGLElBcEJFLENBQVQ7O0FBc0JBLG1CQUFPLFVBQVUsR0FBVixFQUFlLE1BQWYsRUFBdUIsR0FBdkIsRUFBNEI7O2FBQTVCLENBRUwsSUFGSyxDQUVBLElBRkEsQ0FBUDtTQTVCSixFQWRxQjtLQUFaOztBQWdEYix1QkFBbUIsWUFBWTtBQUMzQixhQUFLLFlBQUwsR0FEMkI7QUFFM0IsYUFBSyxXQUFMLEdBRjJCO0tBQVo7O0FBS25CLFlBQVEsWUFBWTtBQUNoQixZQUFJLFdBQVcsS0FBSyxLQUFMLENBQVcsU0FBWCxDQUFxQixHQUFyQixDQUF5QixVQUFVLENBQVYsRUFBYSxDQUFiLEVBQWdCO0FBQ3BELG1CQUFROztrQkFBUSxPQUFPLEVBQUUsTUFBRixFQUFmO2dCQUEwQixFQUFFLE1BQUY7cUJBQTFCO2dCQUF1QyxFQUFFLElBQUY7YUFBL0MsQ0FEb0Q7U0FBaEIsQ0FBcEMsQ0FEWTs7QUFLaEIsZUFDSTs7O1lBQ0k7O2tCQUFTLFdBQVUsT0FBVixFQUFUO2dCQUNJOztzQkFBUSxXQUFVLG1CQUFWLEVBQVI7b0JBQ0k7OzBCQUFNLFdBQVUsV0FBVixFQUFOO3dCQUE0QiwyQkFBRyxXQUFVLFlBQVYsRUFBSCxDQUE1Qjs7cUJBREo7aUJBREo7Z0JBS0k7O3NCQUFLLFdBQVUsWUFBVixFQUFMO29CQUNJOzswQkFBTSxXQUFVLGlCQUFWLEVBQTRCLFFBQU8sS0FBUCxFQUFsQzt3QkFDSTs7OEJBQUssV0FBVSxXQUFWLEVBQUw7NEJBQ0k7O2tDQUFPLFdBQVUsaUNBQVYsRUFBUDs7NkJBREo7NEJBRUk7O2tDQUFLLFdBQVUsbUJBQVYsRUFBTDtnQ0FDSTs7c0NBQVEsSUFBRyxTQUFIO0FBQ0EsbURBQVUsK0JBQVYsRUFEUjtvQ0FFSTs7MENBQVEsT0FBTSxHQUFOLEVBQVI7O3FDQUZKO29DQUdJOzswQ0FBUSxPQUFNLEdBQU4sRUFBUjs7cUNBSEo7b0NBSUk7OzBDQUFRLE9BQU0sR0FBTixFQUFSOztxQ0FKSjtvQ0FLSTs7MENBQVEsT0FBTSxHQUFOLEVBQVI7O3FDQUxKO2lDQURKOzZCQUZKOzRCQVlJOztrQ0FBTyxXQUFVLGlDQUFWLEVBQVA7OzZCQVpKOzRCQWFJOztrQ0FBSyxXQUFVLG1CQUFWLEVBQUw7Z0NBQ0k7O3NDQUFRLFdBQVUsK0JBQVY7QUFDQSw0Q0FBRyxXQUFILEVBQWUsb0JBQWlCLE1BQWpCLEVBRHZCO29DQUVJOzswQ0FBUSxPQUFNLEdBQU4sRUFBUjs7cUNBRko7b0NBR0ssUUFITDtpQ0FESjs2QkFiSjs0QkFxQkk7O2tDQUFPLFdBQVUsaUNBQVYsRUFBUDs7NkJBckJKOzRCQXNCSTs7a0NBQUssV0FBVSxtQkFBVixFQUFMO2dDQUNJOztzQ0FBUSxXQUFVLCtCQUFWLEVBQVI7b0NBQ0k7Ozs7cUNBREo7b0NBRUk7Ozs7cUNBRko7b0NBR0k7Ozs7cUNBSEo7aUNBREo7NkJBdEJKOzRCQThCSTs7a0NBQUcsV0FBVSwwQkFBVixFQUFxQyxNQUFLLHFCQUFMO0FBQ3JDLDZDQUFTLEtBQUssV0FBTCxFQURaOzs2QkE5Qko7eUJBREo7cUJBREo7aUJBTEo7YUFESjtZQTZDSSxvQkFBQyxZQUFELElBQWMsTUFBTSxLQUFLLEtBQUwsQ0FBVyxRQUFYLEVBQXFCLFVBQVUsS0FBSyxLQUFMLENBQVcsUUFBWCxFQUFuRCxDQTdDSjtZQThDSSxvQkFBQyxZQUFELElBQWMsTUFBTSxLQUFLLEtBQUwsQ0FBVyxNQUFYLEVBQW1CLFVBQVUsS0FBSyxLQUFMLENBQVcsUUFBWCxFQUFqRCxDQTlDSjtTQURKLENBTGdCO0tBQVo7Q0F6RkssQ0FBYjs7QUFvSkosSUFBSSxVQUFVO0FBQ1YsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxLQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxLQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0FBQ0EsVUFBTSxJQUFOO0NBbENBOztBQXFDSixJQUFJLGNBQWM7QUFDZCxjQUFVLE1BQVY7QUFDQSxZQUFRLFNBQVI7QUFDQSxrQkFBYyxTQUFkO0FBQ0EsZUFBVyxNQUFYO0FBQ0EsZUFBVyxNQUFYO0FBQ0EsY0FBVSxJQUFWO0FBQ0Esa0JBQWMsU0FBZDtBQUNBLGNBQVUsTUFBVjtBQUNBLGFBQVMsSUFBVDtDQVRBOztBQVlKLElBQUksZUFBZSxNQUFNLFdBQU4sQ0FBa0I7OztBQUVqQyxZQUFRLFlBQVk7QUFDaEIsWUFBSSxPQUFPLEtBQUssS0FBTCxDQUFXLElBQVgsSUFBbUIsRUFBbkI7OztBQURLLFlBSVosUUFBUSxLQUFLLEdBQUwsQ0FBUyxVQUFVLFFBQVYsRUFBb0IsQ0FBcEIsRUFBdUI7O0FBRXhDLGdCQUFJLFlBQVksRUFBWixDQUZvQztBQUd4QyxpQkFBSyxJQUFJLFlBQUosSUFBb0IsUUFBekIsRUFBbUM7QUFDL0Isb0JBQUksZ0JBQWdCLFNBQVMsWUFBVCxDQUFoQixDQUQyQjs7QUFHL0Isb0JBQUksWUFBWSxRQUFRLGNBQWMsSUFBZCxDQUFSLElBQStCLGNBQWMsSUFBZCxDQUhoQjtBQUkvQixvQkFBSSxnQkFBZ0IsWUFBWSxZQUFaLEtBQTZCLFlBQTdCLENBSlc7O0FBTS9CLG9CQUFJLFdBQVcsY0FBYyxJQUFkLENBQW1CLEdBQW5CLENBQXVCLFVBQVUsQ0FBVixFQUFhLENBQWIsRUFBZ0I7QUFDbEQsd0JBQUksWUFBWSxLQUFLLEtBQUwsQ0FBVyxRQUFYLENBQW9CLENBQXBCLEtBQTBCLENBQTFCLENBRGtDO0FBRWxELDJCQUFROzs7d0JBQUssQ0FBTDs7d0JBQVMsU0FBVDtxQkFBUixDQUZrRDtpQkFBaEIsQ0FHcEMsSUFIb0MsQ0FHL0IsSUFIK0IsQ0FBdkIsQ0FBWCxDQU4yQjs7QUFXL0Isb0JBQUksZUFBZSxjQUFjLFFBQWQsQ0FBdUIsR0FBdkIsQ0FBMkIsVUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQjtBQUMxRCwyQkFBUTs7MEJBQU0sV0FBVSxxQkFBVixFQUFOO3dCQUF1QyxJQUFJLEdBQUo7cUJBQS9DLENBRDBEO2lCQUFoQixDQUExQyxDQVgyQjs7QUFlL0Isb0JBQUksWUFBWSxjQUFjLEtBQWQsQ0FBb0IsR0FBcEIsQ0FBd0IsVUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQjtBQUNwRCwyQkFBUTs7MEJBQU0sV0FBVSxvQkFBVixFQUFOO3dCQUFzQyxDQUF0QztxQkFBUixDQURvRDtpQkFBaEIsQ0FBcEMsQ0FmMkI7O0FBbUIvQiwwQkFBVSxJQUFWLENBQ0k7O3NCQUFTLFdBQVUsT0FBVixFQUFUO29CQUNJOzswQkFBUSxXQUFVLG1CQUFWLEVBQVI7d0JBQ0k7OzhCQUFNLFdBQVUsV0FBVixFQUFOOzRCQUNJLDJCQUFHLFdBQVUsaUJBQVYsRUFBSCxDQURKOzRCQUN3QyxTQUR4Qzs7NEJBQ3NELGFBRHREO3lCQURKO3dCQUdJOzs4QkFBTSxXQUFVLFlBQVYsRUFBTjs0QkFBOEIsU0FBOUI7OzRCQUEwQyxZQUExQzt5QkFISjtxQkFESjtvQkFPSTs7MEJBQUssV0FBVSxZQUFWLEVBQUw7d0JBRUk7Ozs0QkFDSTs7O2dDQUNLLFFBREw7NkJBREo7eUJBRko7cUJBUEo7aUJBREosRUFuQitCO2FBQW5DOztBQXVDQSxtQkFBTyxTQUFQLENBMUN3QztTQUF2QixDQTJDbkIsSUEzQ21CLENBMkNkLElBM0NjLENBQVQsQ0FBUixDQUpZOztBQWlEaEIsZUFDSTs7Y0FBSyxXQUFVLG1CQUFWLEVBQUw7WUFDSyxLQURMO1NBREosQ0FqRGdCO0tBQVo7Q0FGTyxDQUFmOztBQTJESixNQUFNLE1BQU4sQ0FDSSxvQkFBQyxVQUFELE9BREosRUFHSSxTQUFTLGNBQVQsQ0FBd0IsU0FBeEIsQ0FISiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xyXG52YXIgUmVhY3RET00gPSByZXF1aXJlKCdyZWFjdC1kb20nKTtcclxuXHJcbnZhciBBZG1pblBhbmVsID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG4gICAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgJ3Byb3ZpbmNlJzogW10sXHJcbiAgICAgICAgICAgICdzdGF0ZXMnOiBbXSxcclxuICAgICAgICAgICAgJ3VzZXJfbWFwJzoge30sXHJcbiAgICAgICAgICAgICd1c2VyX2xpc3QnOiBbXSxcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkVXNlckxpc3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6ICcvYXBpL3VzZXIvbGlzdCcsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdnZXQnLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHVzZXJfbWFwID0ge307XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1VTRVI6JyArIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHVzZXJfbWFwW2RhdGFbaV1bJ2lkJ11dID0gZGF0YVtpXVsnbmFtZSddO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICd1c2VyX21hcCc6IHVzZXJfbWFwLFxyXG4gICAgICAgICAgICAgICAgICAgICd1c2VyX2xpc3QnOiBkYXRhXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkKCcjZm9ybV91c2VyJykuc2VsZWN0cGlja2VyKHt9KTtcclxuXHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRSb3V0aW5nOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVzZXJfaWQgPSAkKFwiI2Zvcm1fdXNlclwiKS52YWwoKTtcclxuICAgICAgICB2YXIgY2FycmllciA9ICQoXCIjY2FycmllclwiKS52YWwoKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5pbmZvKCdMT0FEIFJPVVRJTkcnKTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICd1c2VyX2lkJzogdXNlcl9pZCxcclxuICAgICAgICAgICAgJ2NhcnJpZXInOiBjYXJyaWVyLFxyXG4gICAgICAgICAgICAnYXJlYSc6ICcqJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnNvbGUuaW5mbyhKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSk7XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogJy9zZXJ2aWNlcy9kYXRhX3JvdXRpbmcvYWxsJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgdHlwZTogJ3Bvc3QnLFxyXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSxcclxuXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcm91dGluZ19wciA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJvdXRpbmdfc3QgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoayA9PSAnQ04nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRpbmdfc3QucHVzaChkYXRhW2tdKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0aW5nX3ByLnB1c2goZGF0YVtrXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhKU09OLnN0cmluZ2lmeShyb3V0aW5nX3ByKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oSlNPTi5zdHJpbmdpZnkocm91dGluZ19zdCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICdwcm92aW5jZSc6IHJvdXRpbmdfcHIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3N0YXRlcyc6IHJvdXRpbmdfc3RcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgY29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmxvYWRVc2VyTGlzdCgpO1xyXG4gICAgICAgIHRoaXMubG9hZFJvdXRpbmcoKTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVzZXJOb2RlID0gdGhpcy5zdGF0ZS51c2VyX2xpc3QubWFwKGZ1bmN0aW9uICh1LCBpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoPG9wdGlvbiB2YWx1ZT17dS5tYXN0ZXJ9Pnt1Lm1hc3Rlcn0gLSB7dS5uYW1lfTwvb3B0aW9uPik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJwYW5lbFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGluZyByb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHVsbC1sZWZ0XCI+PGkgY2xhc3NOYW1lPVwiaWNvbi10YWJsZVwiPjwvaT7ot6/nlLE8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9oZWFkZXI+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFuZWwtYm9keVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWhvcml6b250YWxcIiBtZXRob2Q9J2dldCc+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS0xMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJsZSBjbGFzc05hbWU9J2NvbnRyb2wtbGFiZWwgY29sLXNtLTEgY29sLW1kLTEnPui/kOiQpeWVhjwvbGFibGU+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2NvbC1zbS0yIGNvbC1tZC0yJz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD0nY2FycmllcidcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9J2Zvcm0tY29udHJvbCBtLWJvdDE1IGlucHV0LXNtJz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9JyonPuWFqOmDqDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0nMSc+56e75YqoPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPScyJz7ogZTpgJo8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9JzMnPueUteS/oTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmxlIGNsYXNzTmFtZT0nY29udHJvbC1sYWJlbCBjb2wtc20tMSBjb2wtbWQtMSc+55So5oi3PC9sYWJsZT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nY29sLXNtLTIgY29sLW1kLTInPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZm9ybS1jb250cm9sIG0tYm90MTUgaW5wdXQtc20nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ9J2Zvcm1fdXNlcicgZGF0YS1saXZlLXNlYXJjaD1cInRydWVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9JyonPuWFqOmDqDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3VzZXJOb2RlfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmxlIGNsYXNzTmFtZT0nY29udHJvbC1sYWJlbCBjb2wtc20tMSBjb2wtbWQtMSc+5Yy65Z+fPC9sYWJsZT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nY29sLXNtLTIgY29sLW1kLTInPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZm9ybS1jb250cm9sIG0tYm90MTUgaW5wdXQtc20nPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbj7lhajlm708L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24+5bm/5LicPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uPuaxn+iLjzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdidG4gYnRuLXNtYWxsIGJ0bi1kYW5nZXInIGhyZWY9J2phdmFzY3JpcHQ6dm9pZCgwKTsnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5sb2FkUm91dGluZ30+6L+H5rukPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZm9ybT5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuXHJcbiAgICAgICAgICAgICAgICA8Um91dGluZ1BhbmVsIGRhdGE9e3RoaXMuc3RhdGUucHJvdmluY2V9IHVzZXJfbWFwPXt0aGlzLnN0YXRlLnVzZXJfbWFwfS8+XHJcbiAgICAgICAgICAgICAgICA8Um91dGluZ1BhbmVsIGRhdGE9e3RoaXMuc3RhdGUuc3RhdGVzfSB1c2VyX21hcD17dGhpcy5zdGF0ZS51c2VyX21hcH0vPlxyXG5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufSk7XHJcblxyXG52YXIgYXJlYU1hcCA9IHtcclxuICAgICdCSic6ICfljJfkuqwnLFxyXG4gICAgJ1RKJzogJ+Wkqea0pScsXHJcbiAgICAnSEUnOiAn5rKz5YyXJyxcclxuICAgICdTWCc6ICflsbHopb8nLFxyXG4gICAgJ05NJzogJ+WGheiSmeWPpCcsXHJcbiAgICAnTE4nOiAn6L695a6BJyxcclxuICAgICdKTCc6ICflkInmnpcnLFxyXG4gICAgJ0hMJzogJ+m7kem+meaxnycsXHJcbiAgICAnU0gnOiAn5LiK5rW3JyxcclxuICAgICdKUyc6ICfmsZ/oi48nLFxyXG4gICAgJ1pKJzogJ+a1meaxnycsXHJcbiAgICAnQUgnOiAn5a6J5b69JyxcclxuICAgICdGSic6ICfnpo/lu7onLFxyXG4gICAgJ0pYJzogJ+axn+ilvycsXHJcbiAgICAnU0QnOiAn5bGx5LicJyxcclxuICAgICdIQSc6ICfmsrPljZcnLFxyXG4gICAgJ0hCJzogJ+a5luWMlycsXHJcbiAgICAnSE4nOiAn5rmW5Y2XJyxcclxuICAgICdHRCc6ICflub/kuJwnLFxyXG4gICAgJ0dYJzogJ+W5v+ilvycsXHJcbiAgICAnSEknOiAn5rW35Y2XJyxcclxuICAgICdDUSc6ICfph43luoYnLFxyXG4gICAgJ1NDJzogJ+Wbm+W3nScsXHJcbiAgICAnR1onOiAn6LS15beeJyxcclxuICAgICdZTic6ICfkupHljZcnLFxyXG4gICAgJ1haJzogJ+ilv+iXjycsXHJcbiAgICAnU04nOiAn6ZmV6KW/JyxcclxuICAgICdHUyc6ICfnlJjogoMnLFxyXG4gICAgJ1FIJzogJ+mdkua1tycsXHJcbiAgICAnTlgnOiAn5a6B5aSPJyxcclxuICAgICdYSic6ICfmlrDnloYnLFxyXG4gICAgJ1RXJzogJ+WPsOa5vicsXHJcbiAgICAnSEsnOiAn6aaZ5rivJyxcclxuICAgICdDTic6ICflhajlm70nXHJcbn07XHJcblxyXG52YXIgdXBzdHJlYW1NYXAgPSB7XHJcbiAgICAnbW9wb3RlJzogJ+aIkOmDveW+ruWTgScsXHJcbiAgICAnY21jYyc6ICflub/kuJznp7vliqgt6Laj6K6vJyxcclxuICAgICdjbWNjLWxlbGl1JzogJ+W5v+S4nOenu+WKqC3kuZDmtYEnLFxyXG4gICAgJ2NtY2MtaGEnOiAn5rKz5Y2X56e75YqoJyxcclxuICAgICd4aWNoZW5nJzogJ+S4iua1t+ilv+WfjicsXHJcbiAgICAnYXNwaXJlJzogJ+WNk+acmycsXHJcbiAgICAnMjFjbi1sZWxpdSc6ICcyMWNuLeS5kOa1gScsXHJcbiAgICAnbGVnZW5kJzogJ+i2iuS6ruS8oOWlhycsXHJcbiAgICAnQ0xPU0UnOiAn57u05oqkJ1xyXG59O1xyXG5cclxudmFyIFJvdXRpbmdQYW5lbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZGF0YSA9IHRoaXMucHJvcHMuZGF0YSB8fCBbXTtcclxuICAgICAgICAvL2FsZXJ0KGRhdGEpO1xyXG5cclxuICAgICAgICB2YXIgbm9kZXMgPSBkYXRhLm1hcChmdW5jdGlvbiAoYXJlYV9zZXQsIGkpIHtcclxuICAgICAgICAgICAgLy9hcmVhXHJcbiAgICAgICAgICAgIHZhciBhcmVhTm9kZXMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgdXBzdHJlYW1fa2V5IGluIGFyZWFfc2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXBzdHJlYW1fbm9kZSA9IGFyZWFfc2V0W3Vwc3RyZWFtX2tleV07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGFyZWFfbmFtZSA9IGFyZWFNYXBbdXBzdHJlYW1fbm9kZS5hcmVhXSB8fCB1cHN0cmVhbV9ub2RlLmFyZWE7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXBzdHJlYW1fbmFtZSA9IHVwc3RyZWFtTWFwW3Vwc3RyZWFtX2tleV0gfHwgdXBzdHJlYW1fa2V5O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB1c2VyTm9kZSA9IHVwc3RyZWFtX25vZGUudXNlci5tYXAoZnVuY3Rpb24gKHUsIGkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXNlcl9uYW1lID0gdGhpcy5wcm9wcy51c2VyX21hcFt1XSB8fCB1O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoPGxpPnt1fSB7dXNlcl9uYW1lfTwvbGk+KTtcclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRpc2NvdW50Tm9kZSA9IHVwc3RyZWFtX25vZGUuZGlzY291bnQubWFwKGZ1bmN0aW9uIChkLCBpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICg8c3BhbiBjbGFzc05hbWU9J2xhYmVsIGxhYmVsLXN1Y2Nlc3MnPntkICsgJyUnfTwvc3Bhbj4pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlTm9kZSA9IHVwc3RyZWFtX25vZGUudmFsdWUubWFwKGZ1bmN0aW9uICh2LCBpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICg8c3BhbiBjbGFzc05hbWU9J2JhZGdlIGJhZGdlLWRhbmdlcic+e3Z9PC9zcGFuPik7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBhcmVhTm9kZXMucHVzaChcclxuICAgICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9J3BhbmVsJz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJwYW5lbC1oZWFkaW5nIHJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHVsbC1sZWZ0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGkgY2xhc3NOYW1lPVwiaWNvbi1mdWxsc2NyZWVuXCI+PC9pPnthcmVhX25hbWV9IC0ge3Vwc3RyZWFtX25hbWV9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHVsbC1yaWdodFwiPnt2YWx1ZU5vZGV9IHtkaXNjb3VudE5vZGV9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2hlYWRlcj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1bD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge3VzZXJOb2RlfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFyZWFOb2RlcztcclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1zbS02IGNvbC1tZC02XCI+XHJcbiAgICAgICAgICAgICAgICB7bm9kZXN9XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuUmVhY3QucmVuZGVyKFxyXG4gICAgPEFkbWluUGFuZWwgLz5cclxuICAgICxcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50JylcclxuKTtcclxuIl19
