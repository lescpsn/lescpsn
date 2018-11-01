(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var React = require('react');
var ReactDOM = require('react-dom');
var InterfacePanel = React.createClass({
    displayName: 'InterfacePanel',

    getInitialState: function () {
        return {
            maintain_list: []
        };
    },

    componentDidMount: function () {
        this.loadMaintainList();
    },

    loadMaintainList: function () {
        $.ajax({
            url: '/api/route/maintain/list',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({ maintain_list: data });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    removeMaintain: function (key) {
        var request = JSON.stringify({ 'key': key });

        $.ajax({
            url: '/api/route/maintain/remove',
            dataType: 'json',
            type: 'post',
            data: request,
            success: function (data) {
                alert(data.msg);
                this.loadMaintainList();
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return React.createElement(
            'section',
            { className: 'wrapper' },
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(MaintainList, {
                    maintain_list: this.state.maintain_list,
                    removeMaintain: this.removeMaintain })
            )
        );
    }
});

var MaintainList = React.createClass({
    displayName: 'MaintainList',

    onAddMaintain: function () {
        window.location.replace("#sec-maintain");
        $('#addModal').modal('show');
    },

    onRemoveMaintain: function (maintain) {
        var msg = '确认删除 "' + maintain.route_n + maintain.carrier_n + maintain.area_n + maintain.user_name + '" 么?';
        if (!confirm(msg)) return;

        alert(maintain.key);
        this.props.removeMaintain(maintain.key);
    },

    render: function () {

        var maintainNodes = this.props.maintain_list.map(function (maintain, i) {
            return React.createElement(
                'tr',
                { key: maintain.key },
                React.createElement(
                    'td',
                    null,
                    maintain.route_n
                ),
                React.createElement(
                    'td',
                    null,
                    maintain.carrier_n
                ),
                React.createElement(
                    'td',
                    null,
                    maintain.area_n
                ),
                React.createElement(
                    'td',
                    null,
                    maintain.user_name
                ),
                React.createElement(
                    'td',
                    null,
                    maintain.ttl_name
                ),
                React.createElement(
                    'td',
                    null,
                    maintain.notes
                ),
                React.createElement(
                    'td',
                    null,
                    React.createElement(
                        'a',
                        { href: '#', onClick: this.onRemoveMaintain.bind(this, maintain) },
                        '删除'
                    )
                )
            );
        }.bind(this));

        return React.createElement(
            'div',
            { className: 'col-md-12 col-lg-8' },
            React.createElement('div', { className: 'form-group text-right' }),
            React.createElement(
                'section',
                { className: 'panel' },
                React.createElement(
                    'header',
                    { className: 'panel-heading row' },
                    React.createElement(
                        'a',
                        { name: 'sec-maintain' },
                        React.createElement(
                            'span',
                            { className: 'pull-left' },
                            React.createElement('i', { className: 'icon-table' }),
                            '接口维护信息'
                        )
                    ),
                    React.createElement(
                        'span',
                        { className: 'pull-right' },
                        React.createElement(
                            'a',
                            { href: 'javascript:void(0);', className: 'btn btn-danger', onClick: this.onAddMaintain },
                            React.createElement('i', { className: 'icon-edit' }),
                            React.createElement(
                                'span',
                                null,
                                ' 添加维护'
                            )
                        )
                    )
                ),
                React.createElement(
                    'div',
                    { className: 'panels' },
                    React.createElement(
                        'div',
                        { className: 'panel-body table-responsive' },
                        React.createElement(
                            'table',
                            { id: 'downstream_result', className: 'table table-striped table-hover' },
                            React.createElement(
                                'thead',
                                null,
                                React.createElement(
                                    'tr',
                                    null,
                                    React.createElement(
                                        'th',
                                        null,
                                        '接口'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '运营商'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '区域'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '用户'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '时效'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '备注'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '操作'
                                    )
                                )
                            ),
                            React.createElement(
                                'tbody',
                                null,
                                maintainNodes
                            )
                        )
                    )
                )
            )
        );
    }
});

ReactDOM.render(React.createElement(InterfacePanel, null), document.getElementById('main-content'));

},{"react":"react","react-dom":"react-dom"}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzdGF0aWNcXGpzeFxcc2VydmljZS1pbnRlcmZhY2UuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBSSxRQUFRLFFBQVEsT0FBUixDQUFSO0FBQ0osSUFBSSxXQUFXLFFBQVEsV0FBUixDQUFYO0FBQ0osSUFBSSxpQkFBaUIsTUFBTSxXQUFOLENBQWtCOzs7QUFDbkMscUJBQWlCLFlBQVk7QUFDekIsZUFBTztBQUNILDJCQUFlLEVBQWY7U0FESixDQUR5QjtLQUFaOztBQU1qQix1QkFBbUIsWUFBWTtBQUMzQixhQUFLLGdCQUFMLEdBRDJCO0tBQVo7O0FBSW5CLHNCQUFrQixZQUFZO0FBQzFCLFVBQUUsSUFBRixDQUFPO0FBQ0gsaUJBQUssMEJBQUw7QUFDQSxzQkFBVSxNQUFWO0FBQ0Esa0JBQU0sS0FBTjtBQUNBLHFCQUFTLFVBQVUsSUFBVixFQUFnQjtBQUNyQixxQkFBSyxRQUFMLENBQWMsRUFBQyxlQUFlLElBQWYsRUFBZixFQURxQjthQUFoQixDQUVQLElBRk8sQ0FFRixJQUZFLENBQVQ7QUFHQSxtQkFBTyxVQUFVLEdBQVYsRUFBZSxNQUFmLEVBQXVCLEdBQXZCLEVBQTRCO0FBQy9CLHdCQUFRLEtBQVIsQ0FBYyxNQUFkLEVBQXNCLElBQUksUUFBSixFQUF0QixFQUQrQjthQUE1QixDQUVMLElBRkssQ0FFQSxJQUZBLENBQVA7U0FQSixFQUQwQjtLQUFaOztBQWNsQixvQkFBZ0IsVUFBVSxHQUFWLEVBQWU7QUFDM0IsWUFBSSxVQUFVLEtBQUssU0FBTCxDQUFlLEVBQUMsT0FBTyxHQUFQLEVBQWhCLENBQVYsQ0FEdUI7O0FBRzNCLFVBQUUsSUFBRixDQUFPO0FBQ0gsaUJBQUssNEJBQUw7QUFDQSxzQkFBVSxNQUFWO0FBQ0Esa0JBQU0sTUFBTjtBQUNBLGtCQUFNLE9BQU47QUFDQSxxQkFBUyxVQUFVLElBQVYsRUFBZ0I7QUFDckIsc0JBQU0sS0FB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QUE5Qjs0QkFDSTs7O2dDQUNBOzs7b0NBQ0k7Ozs7cUNBREo7b0NBRUk7Ozs7cUNBRko7b0NBR0k7Ozs7cUNBSEo7b0NBSUk7Ozs7cUNBSko7b0NBS0k7Ozs7cUNBTEo7b0NBTUk7Ozs7cUNBTko7b0NBT0k7Ozs7cUNBUEo7aUNBREE7NkJBREo7NEJBWUk7OztnQ0FDQyxhQUREOzZCQVpKO3lCQUZKO3FCQURKO2lCQVZKO2FBRko7U0FESixDQWpCZ0I7S0FBWjtDQWZPLENBQWY7O0FBd0VKLFNBQVMsTUFBVCxDQUNJLG9CQUFDLGNBQUQsT0FESixFQUdJLFNBQVMsY0FBVCxDQUF3QixjQUF4QixDQUhKIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XHJcbnZhciBSZWFjdERPTSA9IHJlcXVpcmUoJ3JlYWN0LWRvbScpO1xyXG52YXIgSW50ZXJmYWNlUGFuZWwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XHJcbiAgICBnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBtYWludGFpbl9saXN0OiBbXSxcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxuXHJcbiAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMubG9hZE1haW50YWluTGlzdCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBsb2FkTWFpbnRhaW5MaXN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAnL2FwaS9yb3V0ZS9tYWludGFpbi9saXN0JyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgdHlwZTogJ2dldCcsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKHttYWludGFpbl9saXN0OiBkYXRhfSk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVtb3ZlTWFpbnRhaW46IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICB2YXIgcmVxdWVzdCA9IEpTT04uc3RyaW5naWZ5KHsna2V5Jzoga2V5fSk7XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogJy9hcGkvcm91dGUvbWFpbnRhaW4vcmVtb3ZlJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgdHlwZTogJ3Bvc3QnLFxyXG4gICAgICAgICAgICBkYXRhOiByZXF1ZXN0LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoZGF0YS5tc2cpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkTWFpbnRhaW5MaXN0KCk7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHN0YXR1cywgZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHN0YXR1cywgZXJyLnRvU3RyaW5nKCkpO1xyXG4gICAgICAgICAgICB9LmJpbmQodGhpcylcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwid3JhcHBlclwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICA8TWFpbnRhaW5MaXN0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1haW50YWluX2xpc3Q9e3RoaXMuc3RhdGUubWFpbnRhaW5fbGlzdH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZlTWFpbnRhaW49e3RoaXMucmVtb3ZlTWFpbnRhaW59Lz5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufSk7XHJcblxyXG52YXIgTWFpbnRhaW5MaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xyXG5cclxuICAgIG9uQWRkTWFpbnRhaW46IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShcIiNzZWMtbWFpbnRhaW5cIik7XHJcbiAgICAgICAgJCgnI2FkZE1vZGFsJykubW9kYWwoJ3Nob3cnKTtcclxuICAgIH0sXHJcblxyXG4gICAgb25SZW1vdmVNYWludGFpbjogZnVuY3Rpb24gKG1haW50YWluKSB7XHJcbiAgICAgICAgdmFyIG1zZyA9ICfnoa7orqTliKDpmaQgXCInICsgbWFpbnRhaW4ucm91dGVfbiArIG1haW50YWluLmNhcnJpZXJfbiArIG1haW50YWluLmFyZWFfbiArIG1haW50YWluLnVzZXJfbmFtZSArICdcIiDkuYg/JztcclxuICAgICAgICBpZiAoIWNvbmZpcm0obXNnKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBhbGVydChtYWludGFpbi5rZXkpO1xyXG4gICAgICAgIHRoaXMucHJvcHMucmVtb3ZlTWFpbnRhaW4obWFpbnRhaW4ua2V5KTtcclxuICAgIH0sXHJcblxyXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBtYWludGFpbk5vZGVzID0gdGhpcy5wcm9wcy5tYWludGFpbl9saXN0Lm1hcChmdW5jdGlvbiAobWFpbnRhaW4sIGkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17bWFpbnRhaW4ua2V5fT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnttYWludGFpbi5yb3V0ZV9ufTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57bWFpbnRhaW4uY2Fycmllcl9ufTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57bWFpbnRhaW4uYXJlYV9ufTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57bWFpbnRhaW4udXNlcl9uYW1lfTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZD57bWFpbnRhaW4udHRsX25hbWV9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkPnttYWludGFpbi5ub3Rlc308L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQ+PGEgaHJlZj0nIycgb25DbGljaz17dGhpcy5vblJlbW92ZU1haW50YWluLmJpbmQodGhpcywgbWFpbnRhaW4pfT7liKDpmaQ8L2E+PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtMTIgY29sLWxnLThcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9ybS1ncm91cCB0ZXh0LXJpZ2h0XCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJwYW5lbFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwicGFuZWwtaGVhZGluZyByb3dcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgbmFtZT0nc2VjLW1haW50YWluJz5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB1bGwtbGVmdFwiPjxpIGNsYXNzTmFtZT1cImljb24tdGFibGVcIiAvPuaOpeWPo+e7tOaKpOS/oeaBrzwvc3Bhbj48L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB1bGwtcmlnaHRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9XCJqYXZhc2NyaXB0OnZvaWQoMCk7XCIgY2xhc3NOYW1lPVwiYnRuIGJ0bi1kYW5nZXJcIiBvbkNsaWNrPXt0aGlzLm9uQWRkTWFpbnRhaW59PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpIGNsYXNzTmFtZT1cImljb24tZWRpdFwiIC8+PHNwYW4+IOa3u+WKoOe7tOaKpDwvc3Bhbj48L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2hlYWRlcj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYW5lbHNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYW5lbC1ib2R5IHRhYmxlLXJlc3BvbnNpdmVcIj5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGFibGUgaWQ9XCJkb3duc3RyZWFtX3Jlc3VsdFwiIGNsYXNzTmFtZT1cInRhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtaG92ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5o6l5Y+jPC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPui/kOiQpeWVhjwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7ljLrln588L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+55So5oi3PC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoPuaXtuaViDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0aD7lpIfms6g8L3RoPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGg+5pON5L2cPC90aD5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGhlYWQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRib2R5PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHttYWludGFpbk5vZGVzfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5SZWFjdERPTS5yZW5kZXIoXHJcbiAgICA8SW50ZXJmYWNlUGFuZWwgLz5cclxuICAgICxcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLWNvbnRlbnQnKVxyXG4pO1xyXG4iXX0=
