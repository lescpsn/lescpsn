'use strict';

var MainContent = React.createClass({
    displayName: 'MainContent',

    //获取列表
    getUpStreamList: function getUpStreamList() {
        $.ajax({
            url: '/api/upstream/list_all',
            dataType: 'json',
            type: 'post',

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        upstream_list: resp_data.data
                    });
                } else {
                    alert("上游接口列表加载错误 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("上游接口列表加载异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //充值和校对
    changeUpStreamValue: function changeUpStreamValue(upstream_id, value, type, notes) {
        var requ_data = {
            upstream_id: upstream_id,
            value: value,
            type: type,
            notes: notes
        };

        var key = "充值";
        if (type == "adjust") {
            key = "校对";
        }

        $.ajax({
            url: '/api/upstream/adjust',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getUpStreamList();
                    alert(key + "成功");
                } else {
                    alert(key + "错误 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert(key + "异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    onFilter: function onFilter() {
        this.setState({
            filter: "filter"
        });
    },

    onAllList: function onAllList() {
        this.setState({
            filter: "alllist"
        });
    },

    getInitialState: function getInitialState() {
        return {
            upstream_list: [],
            log_list: [],
            filter: "alllist"
        };
    },

    componentDidMount: function componentDidMount() {
        this.getUpStreamList();
    },

    render: function render() {
        var upstreamlist = this.state.upstream_list.map((function (upstream_info, index) {
            var upstream_id = upstream_info.upstream_id;
            var upstream_name = upstream_info.upstream_name;
            var value = upstream_info.value;
            var last = upstream_info.last;

            var deposit_btn = React.createElement(
                'button',
                { type: 'button', className: 'btn btn-xs btn-primary m-right5', onClick: this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "deposit") },
                React.createElement('i', { className: 'icon-usd' }),
                ' 充值'
            );

            var adjust_btn = React.createElement(
                'button',
                { type: 'button', className: 'btn btn-xs btn-danger m-right5', onClick: this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "adjust") },
                React.createElement('i', { className: 'icon-edit' }),
                ' 校对'
            );

            var warning_btn = React.createElement(
                'button',
                { type: 'button', className: 'btn btn-xs btn-warning disabled', onClick: this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "warning") },
                React.createElement('i', { className: 'icon-warning-sign' }),
                ' 预警'
            );

            return React.createElement(
                'tr',
                null,
                React.createElement(
                    'td',
                    null,
                    upstream_id
                ),
                React.createElement(
                    'td',
                    null,
                    upstream_name
                ),
                React.createElement(
                    'td',
                    { className: 'text-right' },
                    value
                ),
                React.createElement(
                    'td',
                    { className: 'text-right' },
                    last
                ),
                React.createElement(
                    'td',
                    { className: 'text-center' },
                    deposit_btn,
                    adjust_btn,
                    warning_btn
                )
            );
        }).bind(this));

        if (this.state.filter == "filter") {
            upstreamlist = this.state.upstream_list.map((function (upstream_info, index) {
                var upstream_id = upstream_info.upstream_id;
                var upstream_name = upstream_info.upstream_name;
                var value = upstream_info.value;
                var last = upstream_info.last;

                var deposit_btn = React.createElement(
                    'button',
                    { type: 'button', className: 'btn btn-xs btn-primary m-right5', onClick: this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "deposit") },
                    React.createElement('i', { className: 'icon-usd' }),
                    ' 充值'
                );

                var adjust_btn = React.createElement(
                    'button',
                    { type: 'button', className: 'btn btn-xs btn-danger m-right5', onClick: this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "adjust") },
                    React.createElement('i', { className: 'icon-edit' }),
                    ' 校对'
                );

                var warning_btn = React.createElement(
                    'button',
                    { type: 'button', className: 'btn btn-xs btn-warning disabled', onClick: this.refs.UpStreamDlg.showDlg.bind(this, upstream_info, "warning") },
                    React.createElement('i', { className: 'icon-warning-sign' }),
                    ' 预警'
                );

                if (value != "0.000") {
                    return React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            upstream_id
                        ),
                        React.createElement(
                            'td',
                            null,
                            upstream_name
                        ),
                        React.createElement(
                            'td',
                            { className: 'text-right' },
                            value
                        ),
                        React.createElement(
                            'td',
                            { className: 'text-right' },
                            last
                        ),
                        React.createElement(
                            'td',
                            { className: 'text-center' },
                            deposit_btn,
                            adjust_btn,
                            warning_btn
                        )
                    );
                } else {
                    return "";
                }
            }).bind(this));
        }

        return React.createElement(
            'div',
            { className: 'wrapper' },
            React.createElement(
                'div',
                { className: 'col-md-12' },
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
                            '上游余额管理'
                        ),
                        React.createElement(
                            'a',
                            { id: 'filter_btn', className: 'btn btn-info pull-right', href: 'javascript:void(0);', onClick: this.onFilter },
                            React.createElement('i', { className: 'icon-filter' }),
                            ' 去零'
                        ),
                        React.createElement(
                            'a',
                            { id: 'reply_btn', className: 'btn btn-info pull-right m-right5', href: 'javascript:void(0);', onClick: this.onAllList },
                            React.createElement('i', { className: 'icon-list-alt' }),
                            ' 全部'
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'panel-body' },
                        React.createElement(
                            'table',
                            { className: 'table table-striped table-hover' },
                            React.createElement(
                                'thead',
                                null,
                                React.createElement(
                                    'tr',
                                    null,
                                    React.createElement(
                                        'th',
                                        null,
                                        '接口名称'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '名称'
                                    ),
                                    React.createElement(
                                        'th',
                                        { className: 'text-right' },
                                        '余额'
                                    ),
                                    React.createElement(
                                        'th',
                                        { className: 'text-right' },
                                        '上次加款'
                                    ),
                                    React.createElement(
                                        'th',
                                        { className: 'text-center' },
                                        '操作'
                                    )
                                )
                            ),
                            React.createElement(
                                'tbody',
                                null,
                                upstreamlist
                            )
                        )
                    )
                )
            ),
            React.createElement(UpStreamDlg, { ref: 'UpStreamDlg',
                changeUpStreamValue: this.changeUpStreamValue
            })
        );
    }
});

//弹窗
var UpStreamDlg = React.createClass({
    displayName: 'UpStreamDlg',

    onOk: function onOk() {
        var upstream_id = this.state.upstream_info.upstream_id;
        var value = $('#value').val();
        var type = this.state.key;
        var notes = $('#notes').val();

        this.props.changeUpStreamValue(upstream_id, value, type, notes);
        this.hideDlg();
    },

    onInputKeyUp: function onInputKeyUp() {
        $('#value').keydown(function (e) {
            if (!e) var e = window.event;
            if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 96 && e.keyCode <= 105 || e.keyCode == 9 || e.keyCode == 8 || e.keyCode == 37 || e.keyCode == 39 || e.keyCode == 110 || e.keyCode == 190) {} else {
                e.preventDefault();
                e.stopPropagation();
            };
        });
        var value = $('#value').val();
        if (value != null || value != "" || value != "null") {
            $('#upstream_btn').removeClass('disabled');
        } else {
            $('#upstream_btn').addClass('disabled');
        }
    },

    showDlg: function showDlg(upstream_info, key) {
        this.setState({
            upstream_info: upstream_info,
            key: key
        });

        this.getHistoryLog(upstream_info.upstream_id, key);
        this.hideHistoryLog();

        $('#upstream_dlg').modal('show');
        $('#upstream_dlg input').val('');
        $('#upstream_btn').addClass('disabled');
    },

    hideDlg: function hideDlg() {
        $('#upstream_dlg').modal('hide');
    },

    getInitialState: function getInitialState() {
        return {
            upstream_info: [],
            key: "",
            log_info: []
        };
    },

    // 获取查询结果
    getHistoryLog: function getHistoryLog(upstream_id, key) {
        var requ_data = {
            upstream_id: upstream_id
        };

        var title = "充值";
        if (key == "adjust") {
            title = "校对";
        }

        $.ajax({
            url: '/api/upstream/detail',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        log_list: resp_data.data
                    });
                    console.log(this.state.log_list);
                } else {
                    alert(title + "记录查询错误 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert(title + "记录查询异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //显示查询列表
    showHistoryLog: function showHistoryLog() {
        $('#history_table,#hide_history_link').removeClass('hide');
        $('#show_history_link').addClass('hide');
    },

    //隐藏查询列表
    hideHistoryLog: function hideHistoryLog() {
        $('#history_table,#hide_history_link').addClass('hide');
        $('#show_history_link').removeClass('hide');
    },

    render: function render() {
        var key = this.state.key;
        console.log(this.state.key);
        var title = '';
        if (this.state.key == "adjust") {
            title = "校对";
        } else if (this.state.key == "deposit") {
            title = "充值";
        }

        if (this.state.log_list === null || this.state.log_list === undefined || this.state.log_list == []) {
            var history_log = "";
        } else {
            history_log = this.state.log_list.map(function (log_info, index) {
                var create_date = log_info.create_date;
                var type = log_info.type;
                var operator_name = log_info.operator_name;
                var value = log_info.value;
                var notes = log_info.notes;

                if (type == key) {
                    return React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'td',
                            null,
                            create_date
                        ),
                        React.createElement(
                            'td',
                            null,
                            operator_name
                        ),
                        React.createElement(
                            'td',
                            null,
                            value
                        ),
                        React.createElement(
                            'td',
                            null,
                            notes
                        )
                    );
                }
            });
        }

        var value = 0;
        if (this.state.upstream_info.value > 0) {
            value = this.state.upstream_info.value;
        }

        return React.createElement(
            'div',
            { className: 'modal fade', id: 'upstream_dlg', tabIndex: '-1', role: 'dialog', 'aria-labelledby': 'addModalLabel',
                'aria-hidden': 'true' },
            React.createElement(
                'div',
                { className: 'modal-dialog' },
                React.createElement(
                    'div',
                    { className: 'modal-content' },
                    React.createElement(
                        'div',
                        { className: 'modal-header' },
                        React.createElement(
                            'h4',
                            { className: 'modal-title' },
                            this.state.upstream_info.upstream_name,
                            ' - ',
                            title
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'modal-body form-horizontal' },
                        React.createElement(
                            'div',
                            { className: 'form-group add-pro-body' },
                            React.createElement(
                                'div',
                                { className: 'row' },
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-3 col-md-3 control-label' },
                                    this.state.upstream_info.upstream_name,
                                    ': '
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-9 col-md-7' },
                                    React.createElement(
                                        'span',
                                        { className: 'form-control border-1 m-bot10 alert-danger text-center' },
                                        '当前余额 ',
                                        React.createElement(
                                            'b',
                                            null,
                                            value
                                        ),
                                        ' 元'
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: 'row' },
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-3 col-md-3 control-label' },
                                    title,
                                    '金额(元): '
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-9 col-md-7' },
                                    React.createElement('input', { className: 'm-bot10 form-control input-sm', id: 'value',
                                        onKeyUp: this.onInputKeyUp })
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: 'row' },
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-3 col-md-3 control-label' },
                                    '备注'
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-9 col-md-7' },
                                    React.createElement('input', { className: 'form-control input-sm', id: 'notes',
                                        placeholder: '可为空' })
                                )
                            )
                        ),
                        React.createElement(
                            'div',
                            { className: 'form-group add-pro-body' },
                            React.createElement(
                                'div',
                                { className: 'text-primary col-sm-12 col-md-12 text-center m-bot10' },
                                React.createElement(
                                    'a',
                                    { id: 'show_history_link', className: '', href: 'javascript:void(0);', onClick: this.showHistoryLog },
                                    React.createElement(
                                        'h4',
                                        null,
                                        '上次记录'
                                    )
                                ),
                                React.createElement(
                                    'a',
                                    { id: 'hide_history_link', className: 'hide', href: 'javascript:void(0);', onClick: this.hideHistoryLog },
                                    React.createElement(
                                        'h4',
                                        null,
                                        '隐藏记录'
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: 'col-sm-12 col-md-12' },
                                React.createElement(
                                    'table',
                                    { id: 'history_table', className: 'table table-bordered table-striped hide' },
                                    React.createElement(
                                        'thead',
                                        null,
                                        React.createElement(
                                            'tr',
                                            null,
                                            React.createElement(
                                                'th',
                                                null,
                                                '日期'
                                            ),
                                            React.createElement(
                                                'th',
                                                null,
                                                '操作人'
                                            ),
                                            React.createElement(
                                                'th',
                                                null,
                                                '金额'
                                            ),
                                            React.createElement(
                                                'th',
                                                null,
                                                '备注'
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        'tbody',
                                        null,
                                        history_log
                                    )
                                )
                            )
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'modal-footer form-horifooter' },
                        React.createElement(
                            'button',
                            { id: 'upstream_btn', type: 'button', className: 'btn btn-danger', onClick: this.onOk },
                            title
                        ),
                        React.createElement(
                            'button',
                            { type: 'button', className: 'btn btn-default', 'data-dismiss': 'modal' },
                            '取消'
                        )
                    )
                )
            )
        );
    }
});

React.render(React.createElement(MainContent, null), document.getElementById('main-content'));

