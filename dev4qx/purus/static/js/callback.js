(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var React = require('react');
var ReactDOM = require('react-dom');

var CallbackPanel = React.createClass({
    displayName: 'CallbackPanel',

    getInitialState: function () {
        return {
            filter: {},
            user_list: [],
            order_list: [],
            current_callback: null
        };
    },

    componentDidMount: function () {
        if (window.location.pathname == '/query/data') {
            this.setState({ product: 'data' });
        } else if (window.location.pathname == '/query/fee') {
            this.setState({ product: 'fee' });
        } else if (window.location.pathname == '/query/sinopec') {
            this.setState({ product: 'sinopec' });
        }

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
        }, function (start, end) {
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

        this.loadUserList();
    },

    loadUserList: function () {
        $.ajax({
            url: '/api/user/list_local',
            dataType: 'json',
            type: 'get',

            success: function (data) {
                this.setState({ 'user_list': data });
                $('#form_user_id').selectpicker({});
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onQuery: function () {
        var filter = this.state.filter;
        filter['start'] = $('#form_range_start').val();
        filter['end'] = $('#form_range_end').val();
        filter['user_id'] = $('#form_user_id').val();
        filter['id_list'] = $('#form_id_list').val();
        filter['carrier'] = $('#form_carrier').val();
        filter['area'] = $('#form_area').val();

        this.loadOrderList(filter);
    },

    loadOrderList: function (filter) {
        var _filter = filter || this.state.filter;

        $.ajax({
            url: '/api/services/callback/filter',
            dataType: 'json',
            data: JSON.stringify(_filter),
            type: 'post',

            success: function (resp) {
                this.setState({
                    order_list: resp.data,
                    'filter': _filter
                });
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    toggleCallback: function () {
        if (this.state.current_callback) {
            clearTimeout(this.state.current_callback);
            this.setState({ 'current_callback': null });
        } else {
            /* found last */
            var order_list = this.state.order_list;
            var n = -1;
            for (var i = 0; i < order_list.length; i++) {
                if (!order_list[i].status) {
                    n = i;
                    break;
                }
            }

            if (n >= 0) {
                var t = setTimeout(this.sendCallback.bind(this, n), 1000);
                this.setState({ 'current_callback': t });
                console.info('TIMEOUT' + t);
            }
        }
    },

    sendCallback: function (index) {
        var order_id = this.state.order_list[index]['id'];
        var req = JSON.stringify({ order_id: order_id });

        console.debug(req);

        $.ajax({
            url: '/api/services/callback/send',
            dataType: 'json',
            data: req,
            type: 'post',

            success: function (data) {
                var order_list = this.state.order_list;
                order_list[index]['status'] = 'finish';

                this.setState({ 'user_list': order_list });

                if (index < order_list.length) {
                    var t = setTimeout(this.sendCallback.bind(this, index + 1), 1000);
                    this.setState({ 'current_callback': t });
                    console.info('TIMEOUT' + t);
                } else {
                    this.setState({ 'current_callback': null });
                    console.info('TIMEOUT OVER');
                }
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var orderNode = this.state.order_list.map(function (order, index) {
            return React.createElement(
                'tr',
                { key: order.id },
                React.createElement(
                    'td',
                    null,
                    index
                ),
                React.createElement(
                    'td',
                    null,
                    order.user_id
                ),
                React.createElement(
                    'td',
                    null,
                    order.id
                ),
                React.createElement(
                    'td',
                    null,
                    order.sp_order_id
                ),
                React.createElement(
                    'td',
                    null,
                    order.mobile
                ),
                React.createElement(
                    'td',
                    null,
                    order.area
                ),
                React.createElement(
                    'td',
                    { className: 'text-right' },
                    order.price
                ),
                React.createElement(
                    'td',
                    null,
                    order.result
                ),
                React.createElement(
                    'td',
                    null,
                    order.status
                )
            );
        });

        var userNode = this.state.user_list.map(function (u, i) {
            return React.createElement(
                'option',
                { value: u.id, 'data-subtext': u.tags },
                u.id,
                ' - ',
                u.name
            );
        });

        return React.createElement(
            'section',
            { className: 'wrapper' },
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'col-lg-4' },
                    React.createElement(
                        'section',
                        { className: 'panel' },
                        React.createElement(
                            'header',
                            { className: 'panel-heading row' },
                            React.createElement(
                                'span',
                                { className: 'pull-left' },
                                React.createElement('i', {
                                    className: 'icon-search' }),
                                '过滤订单'
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
                                    { className: 'form-group' },
                                    React.createElement(
                                        'label',
                                        { className: 'col-md-2 control-label' },
                                        '订单号/手机号/上游订单号'
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'col-md-10' },
                                        React.createElement('textarea', { id: 'form_id_list', className: 'form-control m-bot15',
                                            style: { 'height': '150px' } })
                                    ),
                                    React.createElement(
                                        'label',
                                        { className: 'col-md-2 control-label' },
                                        '时间范围'
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'col-md-10' },
                                        React.createElement('input', { id: 'form_range', type: 'text',
                                            className: 'form-control input-sm m-bot15' }),
                                        React.createElement('input', { id: 'form_range_start', type: 'hidden' }),
                                        React.createElement('input', { id: 'form_range_end', type: 'hidden' })
                                    ),
                                    React.createElement(
                                        'label',
                                        { className: 'control-label col-md-2' },
                                        '用户'
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'col-md-10 m-bot15' },
                                        React.createElement(
                                            'select',
                                            { className: 'form-control m-bot15', id: 'form_user_id',
                                                'data-live-search': 'true' },
                                            userNode,
                                            React.createElement(
                                                'option',
                                                { value: '', 'data-subtext': '' },
                                                '000000 - 全部'
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        'label',
                                        { className: 'col-md-2 control-label' },
                                        '运营商'
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'col-md-4' },
                                        React.createElement(
                                            'select',
                                            { id: 'form_carrier',
                                                className: 'form-control m-bot15 input-sm' },
                                            React.createElement(
                                                'option',
                                                { value: '' },
                                                '全部'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: '3' },
                                                '电信'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: '2' },
                                                '联通'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: '1' },
                                                '移动'
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        'label',
                                        { className: 'col-md-2 control-label' },
                                        '省份'
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'col-md-4' },
                                        React.createElement(
                                            'select',
                                            { id: 'form_area',
                                                className: 'form-control m-bot15 input-sm' },
                                            React.createElement(
                                                'option',
                                                { value: '' },
                                                '全国'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'BJ' },
                                                '北京'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'TJ' },
                                                '天津'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'HE' },
                                                '河北'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'SX' },
                                                '山西'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'NM' },
                                                '内蒙古'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'LN' },
                                                '辽宁'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'JL' },
                                                '吉林'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'HL' },
                                                '黑龙江'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'SH' },
                                                '上海'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'JS' },
                                                '江苏'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'ZJ' },
                                                '浙江'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'AH' },
                                                '安徽'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'FJ' },
                                                '福建'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'JX' },
                                                '江西'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'SD' },
                                                '山东'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'HA' },
                                                '河南'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'HB' },
                                                '湖北'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'HN' },
                                                '湖南'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'GD' },
                                                '广东'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'GX' },
                                                '广西'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'HI' },
                                                '海南'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'CQ' },
                                                '重庆'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'SC' },
                                                '四川'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'GZ' },
                                                '贵州'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'YN' },
                                                '云南'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'XZ' },
                                                '西藏'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'SN' },
                                                '陕西'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'GS' },
                                                '甘肃'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'QH' },
                                                '青海'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'NX' },
                                                '宁夏'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'XJ' },
                                                '新疆'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'TW' },
                                                '台湾'
                                            ),
                                            React.createElement(
                                                'option',
                                                { value: 'HK' },
                                                '香港'
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'col-md-offset-2 col-md-4' },
                                        React.createElement(
                                            'a',
                                            { href: 'javascript:void(0);', className: 'btn btn-danger',
                                                onClick: this.onQuery },
                                            React.createElement('i', { className: 'icon-search' }),
                                            ' 过滤'
                                        )
                                    )
                                )
                            )
                        )
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'col-lg-8' },
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
                                '订单列表'
                            ),
                            React.createElement(
                                'span',
                                { className: 'pull-right' },
                                React.createElement(
                                    'a',
                                    { className: 'btn btn-info', onClick: this.toggleCallback,
                                        href: 'javascript:void(0);' },
                                    '回调'
                                )
                            )
                        ),
                        React.createElement(
                            'div',
                            { className: 'panel-body table-responsive' },
                            React.createElement(
                                'table',
                                { id: 'order_result',
                                    className: 'table table-striped table-hover' },
                                React.createElement(
                                    'thead',
                                    null,
                                    React.createElement(
                                        'tr',
                                        null,
                                        React.createElement(
                                            'th',
                                            null,
                                            '序号'
                                        ),
                                        React.createElement(
                                            'th',
                                            null,
                                            '用户'
                                        ),
                                        React.createElement(
                                            'th',
                                            null,
                                            '订单编号'
                                        ),
                                        React.createElement(
                                            'th',
                                            null,
                                            '代理商订单编号'
                                        ),
                                        React.createElement(
                                            'th',
                                            null,
                                            '手机号'
                                        ),
                                        React.createElement(
                                            'th',
                                            null,
                                            '运营商'
                                        ),
                                        React.createElement(
                                            'th',
                                            { className: 'text-right' },
                                            '面值'
                                        ),
                                        React.createElement(
                                            'th',
                                            null,
                                            '订单结果'
                                        ),
                                        React.createElement(
                                            'th',
                                            null,
                                            '处理状态'
                                        )
                                    )
                                ),
                                React.createElement(
                                    'tbody',
                                    null,
                                    orderNode
                                )
                            )
                        )
                    )
                )
            )
        );
    }
});

ReactDOM.render(React.createElement(CallbackPanel, null), document.getElementById('main-content'));

},{"react":"react","react-dom":"react-dom"}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWNcXGpzeFxcc2VydmljZXNcXGNhbGxiYWNrLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUksUUFBUSxRQUFRLE9BQVIsQ0FBUjtBQUNKLElBQUksV0FBVyxRQUFRLFdBQVIsQ0FBWDs7QUFFSixJQUFJLGdCQUFnQixNQUFNLFdBQU4sQ0FBa0I7OztBQUVsQyxxQkFBaUIsWUFBWTtBQUN6QixlQUFPO0FBQ0gsb0JBQVEsRUFBUjtBQUNBLHVCQUFXLEVBQVg7QUFDQSx3QkFBWSxFQUFaO0FBQ0EsOEJBQWtCLElBQWxCO1NBSkosQ0FEeUI7S0FBWjs7QUFTakIsdUJBQW1CLFlBQVk7QUFDM0IsWUFBSSxPQUFPLFFBQVAsQ0FBZ0IsUUFBaEIsSUFBNEIsYUFBNUIsRUFBMkM7QUFDM0MsaUJBQUssUUFBTCxDQUFjLEVBQUMsU0FBUyxNQUFULEVBQWYsRUFEMkM7U0FBL0MsTUFFTyxJQUFJLE9BQU8sUUFBUCxDQUFnQixRQUFoQixJQUE0QixZQUE1QixFQUEwQztBQUNqRCxpQkFBSyxRQUFMLENBQWMsRUFBQyxTQUFTLEtBQVQsRUFBZixFQURpRDtTQUE5QyxNQUVBLElBQUksT0FBTyxRQUFQLENBQWdCLFFBQWhCLElBQTRCLGdCQUE1QixFQUE4QztBQUNyRCxpQkFBSyxRQUFMLENBQWMsRUFBQyxTQUFTLFNBQVQsRUFBZixFQURxRDtTQUFsRDs7QUFJUCxZQUFJLFlBQVksRUFBRSxhQUFGLENBQVosQ0FUdUI7QUFVM0Isa0JBQVUsZUFBVixDQUEwQjtBQUNsQixvQkFBUTtBQUNKLHNCQUFNLENBQUMsU0FBUyxPQUFULENBQWlCLE1BQWpCLENBQUQsRUFBMkIsU0FBUyxPQUFULENBQWlCLE1BQWpCLEVBQXlCLEdBQXpCLENBQTZCLE1BQTdCLEVBQXFDLENBQXJDLENBQTNCLENBQU47QUFDQSxzQkFBTSxDQUFDLFNBQVMsT0FBVCxDQUFpQixNQUFqQixF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REFBUyxLQUFLLE9BQUwsRUFEWjs0Q0FFSSwyQkFBRyxXQUFVLGFBQVYsRUFBSCxDQUZKOzt5Q0FESjtxQ0FwRko7aUNBREo7NkJBREo7eUJBTko7cUJBREo7aUJBREo7Z0JBMEdJOztzQkFBSyxXQUFVLFVBQVYsRUFBTDtvQkFDSTs7MEJBQVMsV0FBVSxPQUFWLEVBQVQ7d0JBQ0k7OzhCQUFRLFdBQVUsbUJBQVYsRUFBUjs0QkFDSTs7a0NBQU0sV0FBVSxXQUFWLEVBQU47Z0NBQTRCLDJCQUFHLFdBQVUsWUFBVixFQUFILENBQTVCOzs2QkFESjs0QkFFSTs7a0NBQU0sV0FBVSxZQUFWLEVBQU47Z0NBQ0k7O3NDQUFHLFdBQVUsY0FBVixFQUF5QixTQUFTLEtBQUssY0FBTDtBQUNsQyw4Q0FBSyxxQkFBTCxFQURIOztpQ0FESjs2QkFGSjt5QkFESjt3QkFPSTs7OEJBQUssV0FBVSw2QkFBVixFQUFMOzRCQUNJOztrQ0FBTyxJQUFHLGNBQUg7QUFDQSwrQ0FBVSxpQ0FBVixFQURQO2dDQUVJOzs7b0NBQ0E7Ozt3Q0FDSTs7Ozt5Q0FESjt3Q0FFSTs7Ozt5Q0FGSjt3Q0FHSTs7Ozt5Q0FISjt3Q0FJSTs7Ozt5Q0FKSjt3Q0FLSTs7Ozt5Q0FMSjt3Q0FNSTs7Ozt5Q0FOSjt3Q0FPSTs7OENBQUksV0FBVSxZQUFWLEVBQUo7O3lDQVBKO3dDQVFJOzs7O3lDQVJKO3dDQVNJOzs7O3lDQVRKO3FDQURBO2lDQUZKO2dDQWVJOzs7b0NBQ0MsU0FERDtpQ0FmSjs2QkFESjt5QkFQSjtxQkFESjtpQkExR0o7YUFESjtTQURKLENBdEJnQjtLQUFaO0NBcExRLENBQWhCOztBQTZWSixTQUFTLE1BQVQsQ0FBZ0Isb0JBQUMsYUFBRCxPQUFoQixFQUFtQyxTQUFTLGNBQVQsQ0FBd0IsY0FBeEIsQ0FBbkMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcclxudmFyIFJlYWN0RE9NID0gcmVxdWlyZSgncmVhY3QtZG9tJyk7XHJcblxyXG52YXIgQ2FsbGJhY2tQYW5lbCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcclxuXHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBmaWx0ZXI6IHt9LFxyXG4gICAgICAgICAgICB1c2VyX2xpc3Q6IFtdLFxyXG4gICAgICAgICAgICBvcmRlcl9saXN0OiBbXSxcclxuICAgICAgICAgICAgY3VycmVudF9jYWxsYmFjazogbnVsbFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PSAnL3F1ZXJ5L2RhdGEnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3Byb2R1Y3Q6ICdkYXRhJ30pXHJcbiAgICAgICAgfSBlbHNlIGlmICh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgPT0gJy9xdWVyeS9mZWUnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3Byb2R1Y3Q6ICdmZWUnfSlcclxuICAgICAgICB9IGVsc2UgaWYgKHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSA9PSAnL3F1ZXJ5L3Npbm9wZWMnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe3Byb2R1Y3Q6ICdzaW5vcGVjJ30pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2VsX3JhbmdlID0gJCgnI2Zvcm1fcmFuZ2UnKTtcclxuICAgICAgICBzZWxfcmFuZ2UuZGF0ZXJhbmdlcGlja2VyKHtcclxuICAgICAgICAgICAgICAgIHJhbmdlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICfku4rlpKknOiBbbW9tZW50KCkuc3RhcnRPZignZGF5cycpLCBtb21lbnQoKS5zdGFydE9mKCdkYXlzJykuYWRkKCdkYXlzJywgMSldLFxyXG4gICAgICAgICAgICAgICAgICAgICfmmKjlpKknOiBbbW9tZW50KCkuc3RhcnRPZignZGF5cycpLnN1YnRyYWN0KCdkYXlzJywgMSksIG1vbWVudCgpLnN0YXJ0T2YoJ2RheXMnKV0sXHJcbiAgICAgICAgICAgICAgICAgICAgJ+acgOi/kTflpKknOiBbbW9tZW50KCkuc3RhcnRPZignZGF5cycpLnN1YnRyYWN0KCdkYXlzJywgNiksIG1vbWVudCgpLnN0YXJ0T2YoJ2RheXMnKS5hZGQoJ2RheXMnLCAxKV0sXHJcbiAgICAgICAgICAgICAgICAgICAgJ+acgOi/kTMw5aSpJzogW21vbWVudCgpLnN0YXJ0T2YoJ2RheXMnKS5zdWJ0cmFjdCgnZGF5cycsIDI5KSwgbW9tZW50KCkuc3RhcnRPZignZGF5cycpLmFkZCgnZGF5cycsIDEpXSxcclxuICAgICAgICAgICAgICAgICAgICAn5pys5pyIJzogW21vbWVudCgpLnN0YXJ0T2YoJ21vbnRoJyksIG1vbWVudCgpLnN0YXJ0T2YoJ21vbnRoJykuYWRkKCdtb250aCcsIDEpXSxcclxuICAgICAgICAgICAgICAgICAgICAn5LiK5pyIJzogW21vbWVudCgpLnN1YnRyYWN0KCdtb250aCcsIDEpLnN0YXJ0T2YoJ21vbnRoJyksIG1vbWVudCgpLnN0YXJ0T2YoJ21vbnRoJyldXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgb3BlbnM6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ1lZWVkvTU0vREQgSEg6bW06c3MnLFxyXG4gICAgICAgICAgICAgICAgc2VwYXJhdG9yOiAnIC0gJyxcclxuICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZTogbW9tZW50KCkuYWRkKCdkYXlzJywgLTI5KSxcclxuICAgICAgICAgICAgICAgIGVuZERhdGU6IG1vbWVudCgpLFxyXG4gICAgICAgICAgICAgICAgbWluRGF0ZTogJzIwMTQvMDEvMDEnLFxyXG4gICAgICAgICAgICAgICAgbWF4RGF0ZTogJzIwMjUvMTIvMzEnLFxyXG4gICAgICAgICAgICAgICAgdGltZVBpY2tlcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHRpbWVQaWNrZXJJbmNyZW1lbnQ6IDEwLFxyXG4gICAgICAgICAgICAgICAgdGltZVBpY2tlcjEySG91cjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBsb2NhbGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBhcHBseUxhYmVsOiAn56Gu6K6kJyxcclxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxMYWJlbDogJ+WPlua2iCcsXHJcbiAgICAgICAgICAgICAgICAgICAgZnJvbUxhYmVsOiAn5LuOJyxcclxuICAgICAgICAgICAgICAgICAgICB0b0xhYmVsOiAn6IezJyxcclxuICAgICAgICAgICAgICAgICAgICBjdXN0b21SYW5nZUxhYmVsOiAn6Ieq5a6a5LmJJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXlzT2ZXZWVrOiBbJ+aXpScsICfkuIAnLCAn5LqMJywgJ+S4iScsICflm5snLCAn5LqUJywgJ+WFrSddLFxyXG4gICAgICAgICAgICAgICAgICAgIG1vbnRoTmFtZXM6IFsn5LiA5pyIJywgJ+S6jOaciCcsICfkuInmnIgnLCAn5Zub5pyIJywgJ+S6lOaciCcsICflha3mnIgnLCAn5LiD5pyIJywgJ+WFq+aciCcsICfkuZ3mnIgnLCAn5Y2B5pyIJywgJ+WNgeS4gOaciCcsICfljYHkuozmnIgnXSxcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdERheTogMVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHNob3dXZWVrTnVtYmVyczogZmFsc2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcclxuICAgICAgICAgICAgICAgIC8vYWxlcnQodHlwZW9mKHN0YXJ0KSlcclxuICAgICAgICAgICAgICAgICQoJyNmb3JtX3JhbmdlX3N0YXJ0JykudmFsKG1vbWVudChzdGFydCkuZm9ybWF0KCdZWVlZL01NL0REIEhIOm1tOnNzJykpO1xyXG4gICAgICAgICAgICAgICAgJCgnI2Zvcm1fcmFuZ2VfZW5kJykudmFsKG1vbWVudChlbmQpLmZvcm1hdCgnWVlZWS9NTS9ERCBISDptbTpzcycpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGluaXRcclxuICAgICAgICB2YXIgc3RhcnREYXRlID0gbW9tZW50KCkuc3RhcnRPZignZGF5cycpO1xyXG4gICAgICAgIHZhciBlbmREYXRlID0gbW9tZW50KCkuc3RhcnRPZignZGF5cycpLmFkZCgnZGF5cycsIDEpO1xyXG4gICAgICAgIHNlbF9yYW5nZS5kYXRhKCdkYXRlcmFuZ2VwaWNrZXInKS5zZXRTdGFydERhdGUoc3RhcnREYXRlKTtcclxuICAgICAgICBzZWxfcmFuZ2UuZGF0YSgnZGF0ZXJhbmdlcGlja2VyJykuc2V0RW5kRGF0ZShlbmREYXRlKTtcclxuXHJcbiAgICAgICAgJCgnI2Zvcm1fcmFuZ2Vfc3RhcnQnKS52YWwoc3RhcnREYXRlLmZvcm1hdCgnWVlZWS9NTS9ERCBISDptbTpzcycpKTtcclxuICAgICAgICAkKCcjZm9ybV9yYW5nZV9lbmQnKS52YWwoZW5kRGF0ZS5mb3JtYXQoJ1lZWVkvTU0vREQgSEg6bW06c3MnKSk7XHJcblxyXG4gICAgICAgIHRoaXMubG9hZFVzZXJMaXN0KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRVc2VyTGlzdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogJy9hcGkvdXNlci9saXN0X2xvY2FsJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgdHlwZTogJ2dldCcsXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7J3VzZXJfbGlzdCc6IGRhdGF9KTtcclxuICAgICAgICAgICAgICAgICQoJyNmb3JtX3VzZXJfaWQnKS5zZWxlY3RwaWNrZXIoe30pO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcyksXHJcblxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgc3RhdHVzLCBlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IodGhpcy5wcm9wcy51cmwsIHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgb25RdWVyeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBmaWx0ZXIgPSB0aGlzLnN0YXRlLmZpbHRlcjtcclxuICAgICAgICBmaWx0ZXJbJ3N0YXJ0J10gPSAkKCcjZm9ybV9yYW5nZV9zdGFydCcpLnZhbCgpO1xyXG4gICAgICAgIGZpbHRlclsnZW5kJ10gPSAkKCcjZm9ybV9yYW5nZV9lbmQnKS52YWwoKTtcclxuICAgICAgICBmaWx0ZXJbJ3VzZXJfaWQnXSA9ICQoJyNmb3JtX3VzZXJfaWQnKS52YWwoKTtcclxuICAgICAgICBmaWx0ZXJbJ2lkX2xpc3QnXSA9ICQoJyNmb3JtX2lkX2xpc3QnKS52YWwoKTtcclxuICAgICAgICBmaWx0ZXJbJ2NhcnJpZXInXSA9ICQoJyNmb3JtX2NhcnJpZXInKS52YWwoKTtcclxuICAgICAgICBmaWx0ZXJbJ2FyZWEnXSA9ICQoJyNmb3JtX2FyZWEnKS52YWwoKTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2FkT3JkZXJMaXN0KGZpbHRlcik7XHJcbiAgICB9LFxyXG5cclxuICAgIGxvYWRPcmRlckxpc3Q6IGZ1bmN0aW9uIChmaWx0ZXIpIHtcclxuICAgICAgICB2YXIgX2ZpbHRlciA9IGZpbHRlciB8fCB0aGlzLnN0YXRlLmZpbHRlcjtcclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAnL2FwaS9zZXJ2aWNlcy9jYWxsYmFjay9maWx0ZXInLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShfZmlsdGVyKSxcclxuICAgICAgICAgICAgdHlwZTogJ3Bvc3QnLFxyXG5cclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3ApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIG9yZGVyX2xpc3Q6IHJlc3AuZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAnZmlsdGVyJzogX2ZpbHRlclxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBzdGF0dXMsIGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcih0aGlzLnByb3BzLnVybCwgc3RhdHVzLCBlcnIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuXHJcbiAgICB0b2dnbGVDYWxsYmFjazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmN1cnJlbnRfY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuc3RhdGUuY3VycmVudF9jYWxsYmFjayk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeydjdXJyZW50X2NhbGxiYWNrJzogbnVsbH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8qIGZvdW5kIGxhc3QgKi9cclxuICAgICAgICAgICAgdmFyIG9yZGVyX2xpc3QgPSB0aGlzLnN0YXRlLm9yZGVyX2xpc3Q7XHJcbiAgICAgICAgICAgIHZhciBuID0gLTE7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3JkZXJfbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFvcmRlcl9saXN0W2ldLnN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgICAgIG4gPSBpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobiA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHNldFRpbWVvdXQodGhpcy5zZW5kQ2FsbGJhY2suYmluZCh0aGlzLCBuKSwgMTAwMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsnY3VycmVudF9jYWxsYmFjayc6IHR9KTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnVElNRU9VVCcgKyB0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgc2VuZENhbGxiYWNrOiBmdW5jdGlvbiAoaW5kZXgpIHtcclxuICAgICAgICB2YXIgb3JkZXJfaWQgPSB0aGlzLnN0YXRlLm9yZGVyX2xpc3RbaW5kZXhdWydpZCddO1xyXG4gICAgICAgIHZhciByZXEgPSBKU09OLnN0cmluZ2lmeSh7b3JkZXJfaWQ6IG9yZGVyX2lkfSk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuZGVidWcocmVxKTtcclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAnL2FwaS9zZXJ2aWNlcy9jYWxsYmFjay9zZW5kJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgZGF0YTogcmVxLFxyXG4gICAgICAgICAgICB0eXBlOiAncG9zdCcsXHJcblxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9yZGVyX2xpc3QgPSB0aGlzLnN0YXRlLm9yZGVyX2xpc3Q7XHJcbiAgICAgICAgICAgICAgICBvcmRlcl9saXN0W2luZGV4XVsnc3RhdHVzJ10gPSAnZmluaXNoJztcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsndXNlcl9saXN0Jzogb3JkZXJfbGlzdH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA8IG9yZGVyX2xpc3QubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHQgPSBzZXRUaW1lb3V0KHRoaXMuc2VuZENhbGxiYWNrLmJpbmQodGhpcywgaW5kZXggKyAxKSwgMTAwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7J2N1cnJlbnRfY2FsbGJhY2snOiB0fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdUSU1FT1VUJyArIHQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsnY3VycmVudF9jYWxsYmFjayc6IG51bGx9KTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ1RJTUVPVVQgT1ZFUicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLFxyXG5cclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHRoaXMucHJvcHMudXJsLCBzdGF0dXMsIGVyci50b1N0cmluZygpKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSxcclxuXHJcbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgb3JkZXJOb2RlID0gdGhpcy5zdGF0ZS5vcmRlcl9saXN0Lm1hcChmdW5jdGlvbiAob3JkZXIsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICA8dHIga2V5PXtvcmRlci5pZH0+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntpbmRleH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57b3JkZXIudXNlcl9pZH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57b3JkZXIuaWR9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyLnNwX29yZGVyX2lkfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntvcmRlci5tb2JpbGV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQ+e29yZGVyLmFyZWF9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwidGV4dC1yaWdodFwiPntvcmRlci5wcmljZX08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD57b3JkZXIucmVzdWx0fTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkPntvcmRlci5zdGF0dXN9PC90ZD5cclxuICAgICAgICAgICAgICAgIDwvdHI+KTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIHZhciB1c2VyTm9kZSA9IHRoaXMuc3RhdGUudXNlcl9saXN0Lm1hcChmdW5jdGlvbiAodSwgaSkge1xyXG4gICAgICAgICAgICByZXR1cm4gKDxvcHRpb24gdmFsdWU9e3UuaWR9IGRhdGEtc3VidGV4dD17dS50YWdzfT57dS5pZH0gLSB7dS5uYW1lfTwvb3B0aW9uPik7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJ3cmFwcGVyXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLTRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicGFuZWxcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGluZyByb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwdWxsLWxlZnRcIj48aVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJpY29uLXNlYXJjaFwiPjwvaT7ov4fmu6TorqLljZU8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2hlYWRlcj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhbmVsLWJvZHlcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWhvcml6b250YWxcIiBtZXRob2Q9XCJnZXRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWdyb3VwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiY29sLW1kLTIgY29udHJvbC1sYWJlbFwiPuiuouWNleWPty/miYvmnLrlj7cv5LiK5ri46K6i5Y2V5Y+3PC9sYWJlbD5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0xMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYSBpZD1cImZvcm1faWRfbGlzdFwiIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbCBtLWJvdDE1XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3snaGVpZ2h0JzogJzE1MHB4J319Lz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtbWQtMiBjb250cm9sLWxhYmVsXCI+5pe26Ze06IyD5Zu0PC9sYWJlbD5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0xMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cImZvcm1fcmFuZ2VcIiB0eXBlPVwidGV4dFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbCBpbnB1dC1zbSBtLWJvdDE1XCIvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cImZvcm1fcmFuZ2Vfc3RhcnRcIiB0eXBlPVwiaGlkZGVuXCIvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBpZD1cImZvcm1fcmFuZ2VfZW5kXCIgdHlwZT1cImhpZGRlblwiLz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb250cm9sLWxhYmVsIGNvbC1tZC0yXCI+55So5oi3PC9sYWJlbD5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC0xMCBtLWJvdDE1XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgbS1ib3QxNVwiIGlkPVwiZm9ybV91c2VyX2lkXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtbGl2ZS1zZWFyY2g9XCJ0cnVlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt1c2VyTm9kZX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlwiIGRhdGEtc3VidGV4dD1cIlwiPjAwMDAwMCAtIOWFqOmDqFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NlbGVjdD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJjb2wtbWQtMiBjb250cm9sLWxhYmVsXCI+6L+Q6JCl5ZWGPC9sYWJlbD5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC00XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNlbGVjdCBpZD1cImZvcm1fY2FycmllclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmb3JtLWNvbnRyb2wgbS1ib3QxNSBpbnB1dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+5YWo6YOoPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIzXCI+55S15L+hPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIyXCI+6IGU6YCaPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIxXCI+56e75YqoPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiY29sLW1kLTIgY29udHJvbC1sYWJlbFwiPuecgeS7vTwvbGFiZWw+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtNFwiPlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c2VsZWN0IGlkPVwiZm9ybV9hcmVhXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImZvcm0tY29udHJvbCBtLWJvdDE1IGlucHV0LXNtXCI+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+5YWo5Zu9PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJCSlwiPuWMl+S6rDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiVEpcIj7lpKnmtKU8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkhFXCI+5rKz5YyXPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJTWFwiPuWxseilvzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiTk1cIj7lhoXokpnlj6Q8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkxOXCI+6L695a6BPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJKTFwiPuWQieaelzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiSExcIj7pu5HpvpnmsZ88L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlNIXCI+5LiK5rW3PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJKU1wiPuaxn+iLjzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiWkpcIj7mtZnmsZ88L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkFIXCI+5a6J5b69PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJGSlwiPuemj+W7ujwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiSlhcIj7msZ/opb88L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlNEXCI+5bGx5LicPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJIQVwiPuays+WNlzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiSEJcIj7muZbljJc8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkhOXCI+5rmW5Y2XPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJHRFwiPuW5v+S4nDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiR1hcIj7lub/opb88L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkhJXCI+5rW35Y2XPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJDUVwiPumHjeW6hjwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiU0NcIj7lm5vlt508L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkdaXCI+6LS15beePC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJZTlwiPuS6keWNlzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiWFpcIj7opb/ol488L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIlNOXCI+6ZmV6KW/PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJHU1wiPueUmOiCgzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiUUhcIj7pnZLmtbc8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIk5YXCI+5a6B5aSPPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJYSlwiPuaWsOeWhjwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiVFdcIj7lj7Dmub48L29wdGlvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIkhLXCI+6aaZ5rivPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC1vZmZzZXQtMiBjb2wtbWQtNFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kYW5nZXJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25RdWVyeX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tc2VhcmNoXCI+PC9pPiDov4fmu6Q8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZm9ybT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLWxnLThcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicGFuZWxcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGluZyByb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwdWxsLWxlZnRcIj48aSBjbGFzc05hbWU9XCJpY29uLXRhYmxlXCI+PC9pPuiuouWNleWIl+ihqDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJwdWxsLXJpZ2h0XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT1cImJ0biBidG4taW5mb1wiIG9uQ2xpY2s9e3RoaXMudG9nZ2xlQ2FsbGJhY2t9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCI+5Zue6LCDPC9hPjwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYW5lbC1ib2R5IHRhYmxlLXJlc3BvbnNpdmVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgaWQ9XCJvcmRlcl9yZXN1bHRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLWhvdmVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aGVhZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPuW6j+WPtzwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+55So5oi3PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7orqLljZXnvJblj7c8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPuS7o+eQhuWVhuiuouWNlee8luWPtzwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5omL5py65Y+3PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7ov5DokKXllYY8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInRleHQtcmlnaHRcIj7pnaLlgLw8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPuiuouWNlee7k+aenDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5aSE55CG54q25oCBPC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7b3JkZXJOb2RlfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5cclxuUmVhY3RET00ucmVuZGVyKDxDYWxsYmFja1BhbmVsIC8+LCBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi1jb250ZW50JykpOyJdfQ==
