// weahwww optimize

'use strict';

var MainContent = React.createClass({
    displayName: 'MainContent',

    getCustomerList: function getCustomerList() {
        $.ajax({
            url: _.str.sprintf('/fuel_card/customer_list?&requ_type=%s', encodeURIComponent('get_customer_list')),
            type: 'get',
            dataType: 'json',

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        customer_list: resp_data.data.customer_list
                    });
                } else {
                    alert("读取客户列表出错 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("读取客户列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //显示新增帐号弹窗
    onClickAddCustomer: function onClickAddCustomer() {
        this.refs.AddCustomerDlg.showDlg(this.onAddCustomer, this.onClickAddCustomer);
    },
    //新增帐号
    onAddCustomer: function onAddCustomer(customer_info) {
        var requ_data = {
            requ_type: 'add_customer',
            argu_list: customer_info
        };

        $.ajax({
            url: '/fuel_card/customer_list',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getCustomerList();
                } else {
                    alert("增加客户出错 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("增加客户异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //删除一个账号
    onDelCustomer: function onDelCustomer(customer_info) {
        if (!window.confirm(_.str.sprintf('确认删除客户 %s(%s) 吗?', customer_info.card_id, customer_info.name))) {
            return;
        }

        var requ_data = {
            requ_type: 'del_customer',
            argu_list: customer_info
        };

        $.ajax({
            url: '/fuel_card/customer_list',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getCustomerList();
                } else {
                    alert("删除客户出错 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("删除客户异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //检查加油卡账户相关信息
    onClickCheckCardAccountInfo: function onClickCheckCardAccountInfo(customer_info) {
        this.refs.CheckCardAccountInfoDlg.showDlg(customer_info, this.getCustomerList);
    },

    //显示修改客户的相关信息弹窗
    onClickModifyCustomerInfo: function onClickModifyCustomerInfo(customer_info) {
        this.refs.ModifyDlg.showDlg(customer_info, this.onModifyName, this.onModifyNotes);
    },
    //修改名称
    onModifyName: function onModifyName(card_id, name) {
        var requ_data = {
            requ_type: 'modify_name',
            argu_list: {
                card_id: card_id,
                name: name
            }
        };

        $.ajax({
            url: '/fuel_card/customer_list',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getCustomerList();
                    alert("名称修改成功");
                } else {
                    alert("名称修改错误 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("名称修改异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },
    //修改备注
    onModifyNotes: function onModifyNotes(card_id, notes) {
        var requ_data = {
            requ_type: 'modify_notes',
            argu_list: {
                card_id: card_id,
                notes: notes
            }
        };

        $.ajax({
            url: '/fuel_card/customer_list',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getCustomerList();
                    alert("备注修改成功");
                } else {
                    alert("备注修改错误 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("备注修改异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    getInitialState: function getInitialState() {
        return {
            customer_list: []
        };
    },

    componentDidMount: function componentDidMount() {
        this.getCustomerList();
    },

    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {},

    render: function render() {
        var customerListNodes = this.state.customer_list.map((function (customer_info, index) {
            var verifyInfoNode = customer_info.verify_info;
            var verifyTimeNode = customer_info.verify_time;
            if (!verifyInfoNode) {
                verifyInfoNode = React.createElement(
                    'button',
                    { type: 'button',
                        href: 'javascript:void(0);',
                        className: 'btn btn-xs btn-warning',
                        onClick: this.onClickCheckCardAccountInfo.bind(this, customer_info) },
                    React.createElement('i', { className: 'icon-check' }),
                    ' 验证'
                );
            }

            return React.createElement(
                'tr',
                null,
                React.createElement(
                    'td',
                    null,
                    customer_info.card_id
                ),
                React.createElement(
                    'td',
                    null,
                    customer_info.name
                ),
                React.createElement(
                    'td',
                    null,
                    verifyInfoNode
                ),
                React.createElement(
                    'td',
                    null,
                    verifyTimeNode
                ),
                React.createElement(
                    'td',
                    null,
                    customer_info.update_time
                ),
                React.createElement(
                    'td',
                    null,
                    customer_info.notes
                ),
                React.createElement(
                    'td',
                    null,
                    React.createElement(
                        'button',
                        { type: 'button',
                            href: 'javascript:void(0);',
                            className: 'btn btn-xs btn-primary',
                            onClick: this.onClickModifyCustomerInfo.bind(this, customer_info) },
                        React.createElement('i', { className: 'icon-edit' }),
                        ' 修改'
                    )
                ),
                React.createElement(
                    'td',
                    null,
                    React.createElement(
                        'button',
                        { type: 'button',
                            href: 'javascript:void(0);',
                            className: 'btn btn-xs btn-danger',
                            onClick: this.onDelCustomer.bind(this, customer_info) },
                        React.createElement('i', { className: 'icon-remove' }),
                        ' 删除'
                    )
                )
            );
        }).bind(this));

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
                            ' 客户列表'
                        ),
                        React.createElement(
                            'span',
                            { className: 'pull-right' },
                            React.createElement(
                                'a',
                                { className: 'btn btn-warning m-right5', href: 'javascript:void(0);', onClick: this.onClickCheckCardAccountInfo },
                                React.createElement('i', { className: 'icon-check' }),
                                ' 加油卡信息检测'
                            ),
                            React.createElement(
                                'a',
                                { className: 'btn btn-info', href: 'javascript:void(0);', onClick: this.onClickAddCustomer },
                                React.createElement('i', { className: 'icon-plus' }),
                                ' 新增加油卡客户'
                            )
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
                                        '加油卡卡号'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '名称'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '验证信息'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '验证时间'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '修改时间'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '备注'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '修改'
                                    ),
                                    React.createElement(
                                        'th',
                                        null,
                                        '删除'
                                    )
                                )
                            ),
                            React.createElement(
                                'tbody',
                                null,
                                customerListNodes
                            )
                        )
                    )
                )
            ),
            React.createElement(AddCustomerDlg, { ref: 'AddCustomerDlg' }),
            React.createElement(CheckCardAccountInfoDlg, { ref: 'CheckCardAccountInfoDlg', secondsRemaining: '120' }),
            React.createElement(ModifyDlg, { ref: 'ModifyDlg' })
        );
    }
});

//新增加油卡客户弹窗
var AddCustomerDlg = React.createClass({
    displayName: 'AddCustomerDlg',

    onOk: function onOk() {
        if (this.state.onAddCustomer) {
            var customer_info = {
                card_id: $('#customer_card_id').val(),
                name: $('#customer_name').val(),
                notes: $('#customer_notes').val()
            };
            this.state.onAddCustomer(customer_info);
        }
        this.hideDlg();
    },

    showDlg: function showDlg(onAddCustomer, onClickAddCustomer) {
        this.setState({
            onAddCustomer: onAddCustomer,
            onClickAddCustomer: onClickAddCustomer
        });
        $('#AddCustomerDlg').modal('show');
        $('#customer_name,#add_customer_btn').attr({ 'disabled': 'disabled' });
        $('#customer_name_msg,#customer_card_id_msg').hide();
        $('#customer_card_id,#customer_name,#customer_notes').val('');
    },

    hideDlg: function hideDlg() {
        $('#AddCustomerDlg').modal('hide');
        this.clearInput();
    },

    clearInput: function clearInput() {
        this.setState({
            onAddCustomer: null,
            onClickAddCustomer: null
        });
    },

    getInitialState: function getInitialState() {
        return {
            onAddCustomer: null,
            onClickAddCustomer: null
        };
    },

    onInputKeyUp: function onInputKeyUp(input_id) {
        $('#' + input_id).keydown(function (e) {
            if (!e) var e = window.event;
            if (input_id == "customer_card_id") {
                if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 96 && e.keyCode <= 105 || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 37 || e.keyCode == 39) {} else {
                    e.preventDefault();
                    e.stopPropagation();
                };
            } else {
                if (e.keyCode == 32) {
                    e.preventDefault();
                    e.stopPropagation();
                };
            };
        });

        var card_id = $("#customer_card_id").val();
        var name = $("#customer_name").val();
        var notes = $('#customer_notes').val();
        var cardidVali = /^\d+$/;

        if (!cardidVali.test(card_id) || card_id.length != 19 || card_id == null || card_id == "" || card_id == "null") {
            $('#customer_name').attr({ 'disabled': 'disabled' });
            $('#customer_card_id_msg').show();
        } else {
            $('#customer_card_id_msg').hide();
            $('#customer_name').removeAttr('disabled');
            if (name == '' || name == null || name == 'null') {
                $('#customer_name_msg').show();
            } else if (cardidVali.test(card_id) && card_id.length == 19 && name != null && name != "" && name != "null") {
                $('#customer_card_id_msg,#customer_name_msg').hide();
                $('#add_customer_btn').removeAttr('disabled');
            };
        };
    },

    render: function render() {
        return React.createElement(
            'div',
            { className: 'modal', id: 'AddCustomerDlg', tabIndex: '-1', role: 'dialog' },
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
                            'h5',
                            { className: 'modal-title' },
                            '新增客户信息'
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
                                null,
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-4 col-md-2 control-label' },
                                    '加油卡卡号'
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-9' },
                                    React.createElement('input', { id: 'customer_card_id',
                                        maxLength: '19',
                                        placeholder: '请输入中石化加油卡卡号',
                                        className: 'm-bot15 form-control input-sm',
                                        onBlur: this.onInputKeyUp.bind(this, 'customer_card_id'),
                                        onKeyUp: this.onInputKeyUp.bind(this, 'customer_card_id') })
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-offset-2 col-md-9' },
                                    React.createElement(
                                        'span',
                                        { className: 'form-control alert alert-danger padding-5',
                                            id: 'customer_card_id_msg' },
                                        React.createElement('i', { className: 'icon-remove' }),
                                        '加油卡卡号为19位数字,不能为空'
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-4 col-md-2 control-label' },
                                    '名称'
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-9' },
                                    React.createElement('input', { id: 'customer_name',
                                        maxLength: '20',
                                        placeholder: '请输入需要设定的名称',
                                        className: 'm-bot15 form-control input-sm',
                                        onBlur: this.onInputKeyUp.bind(this, 'customer_name'),
                                        onKeyUp: this.onInputKeyUp.bind(this, 'customer_name') })
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-offset-2 col-md-9' },
                                    React.createElement(
                                        'span',
                                        { className: 'form-control alert alert-danger padding-5',
                                            id: 'customer_name_msg' },
                                        React.createElement('i', { className: 'icon-remove' }),
                                        '名称不能为空'
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-4 col-md-2 control-label' },
                                    '备注'
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-9' },
                                    React.createElement('input', { id: 'customer_notes',
                                        maxLength: '20',
                                        placeholder: '备注信息（可以为空）',
                                        className: 'm-bot15 form-control input-sm' })
                                )
                            )
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'modal-footer form-horifooter' },
                        React.createElement(
                            'button',
                            { type: 'button', className: 'btn btn-info', onClick: this.state.onClickAddCustomer },
                            '重置'
                        ),
                        React.createElement(
                            'button',
                            { id: 'add_customer_btn', type: 'button', className: 'btn btn-danger', onClick: this.onOk },
                            '新建'
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

//修改卡号名称和备注的弹窗
var ModifyDlg = React.createClass({
    displayName: 'ModifyDlg',

    showDlg: function showDlg(cunstomer_info, onName, onNotes) {
        if (!cunstomer_info) {
            alert("卡号信息加载错误");
            return null;
        }
        this.setState({
            card_id: cunstomer_info.card_id,
            onName: onName,
            onNotes: onNotes
        });

        $('#ModifyDlg').modal('show');
        $('#name_edit_btn').addClass('disabled');
        $('#new_name_msg').hide();
        $('#myTab a:first').tab('show');
        $('#new_name_value,#new_notes_value').val('');
    },

    hideDlg: function hideDlg() {
        $('#ModifyDlg').modal('hide');
        this.clearInput();
    },

    clearInput: function clearInput() {
        this.setState({
            onName: null,
            onNotes: null
        });
        $('#new_name_value,#new_notes_value').val('');
    },

    getInitialState: function getInitialState() {
        return {
            card_id: null,
            onName: null,
            onNotes: null
        };
    },

    onChangeName: function onChangeName() {
        var card_id = this.state.card_id;
        var name = $("#new_name_value").val();
        if (name != "" || name != null || name != "null") {
            this.state.onName(card_id, name);
        } else {
            alert("名称不能为空");
            return;
        }
        this.hideDlg();
    },

    onChangeNotes: function onChangeNotes() {
        var card_id = this.state.card_id;
        var notes = " ";
        if ($("#new_notes_value").val()) {
            notes = $("#new_notes_value").val();
        }

        this.state.onNotes(card_id, notes);
        this.hideDlg();
    },

    onInputKeyUp: function onInputKeyUp() {
        $('#new_name_value').keydown(function (e) {
            if (!e) var e = window.event;
            if (e.keyCode == 32) {
                e.preventDefault();
                e.stopPropagation();
            };
        });

        var i = $('#new_name_value').val();
        console.log(i, i.length);
        if (i == "" || i == null || i == "null") {
            $('#name_edit_btn').addClass('disabled');
            $('#new_name_msg').show();
        } else {
            $('#name_edit_btn').removeClass('disabled');
            $('#new_name_msg').hide();
        }
    },

    render: function render() {

        return React.createElement(
            'div',
            { className: 'modal', id: 'ModifyDlg', tabIndex: '-1', role: 'dialog' },
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
                            'h5',
                            { className: 'modal-title' },
                            '修改卡号 ',
                            React.createElement(
                                'b',
                                null,
                                this.state.card_id
                            ),
                            ' 的信息'
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'modal-body form-horizontal' },
                        React.createElement(
                            'div',
                            { className: 'form-group add-pro-body' },
                            React.createElement(
                                'ul',
                                { id: 'myTab', className: 'nav nav-tabs m-bot15' },
                                React.createElement(
                                    'li',
                                    { className: 'active' },
                                    React.createElement(
                                        'a',
                                        { href: '#password', 'data-toggle': 'tab' },
                                        '修改名称'
                                    )
                                ),
                                React.createElement(
                                    'li',
                                    null,
                                    React.createElement(
                                        'a',
                                        { href: '#notes', 'data-toggle': 'tab' },
                                        '修改备注'
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                { id: 'myTabContent', className: 'tab-content m-bot15' },
                                React.createElement(
                                    'div',
                                    { className: 'tab-pane active', id: 'password' },
                                    React.createElement(
                                        'div',
                                        { className: 'row' },
                                        React.createElement(
                                            'label',
                                            { className: 'col-sm-4 col-md-2 control-label' },
                                            '新名称'
                                        ),
                                        React.createElement(
                                            'div',
                                            { className: 'col-sm-8 col-md-9' },
                                            React.createElement('input', { type: 'text', id: 'new_name_value',
                                                placeholder: '请输入新名称',
                                                className: 'm-bot15 input-sm form-control',
                                                onBlur: this.onInputKeyUp,
                                                onKeyUp: this.onInputKeyUp })
                                        ),
                                        React.createElement(
                                            'div',
                                            { className: 'col-sm-8 col-md-offset-2 col-md-9' },
                                            React.createElement(
                                                'span',
                                                { className: 'form-control alert alert-danger padding-5',
                                                    id: 'new_name_msg' },
                                                React.createElement('i', { className: 'icon-remove' }),
                                                '名称不能为空'
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'modal-footer form-horifooter' },
                                        React.createElement(
                                            'button',
                                            { id: 'name_edit_btn', type: 'button',
                                                className: 'btn btn-danger disabled',
                                                onClick: this.onChangeName },
                                            '确定'
                                        ),
                                        React.createElement(
                                            'button',
                                            { type: 'button',
                                                className: 'btn btn-default',
                                                'data-dismiss': 'modal' },
                                            '取消'
                                        )
                                    )
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'tab-pane', id: 'notes' },
                                    React.createElement(
                                        'div',
                                        { className: 'row' },
                                        React.createElement(
                                            'label',
                                            { className: 'col-sm-4 col-md-2 control-label' },
                                            '新备注'
                                        ),
                                        React.createElement(
                                            'div',
                                            { className: 'col-sm-10 col-md-9' },
                                            React.createElement('input', { type: 'text', id: 'new_notes_value',
                                                placeholder: '请输入备注内容(不输入为清空原内容)',
                                                className: 'm-bot15 input-sm form-control' })
                                        )
                                    ),
                                    React.createElement(
                                        'div',
                                        { className: 'modal-footer form-horifooter' },
                                        React.createElement(
                                            'button',
                                            { id: 'notes_edit_btn', type: 'button',
                                                className: 'btn btn-danger',
                                                onClick: this.onChangeNotes },
                                            '确定'
                                        ),
                                        React.createElement(
                                            'button',
                                            { type: 'button', className: 'btn btn-default', 'data-dismiss': 'modal' },
                                            '取消'
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    }
});

//加油卡信息检测弹窗
/**
 * Generates a GUID string.
 * @returns {String} The generated GUID.
 * @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
 * @author Slavik Meltser (slavik@meltser.info).
 * @link http://slavik.meltser.info/?p=142
 */
function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

var CheckCardAccountInfoDlg = React.createClass({
    displayName: 'CheckCardAccountInfoDlg',

    checkStep1: function checkStep1() {
        var check_id = guid();
        this.setState({ check_id: check_id });
        var requ_data = {
            requ_type: 'check_card_account_step1',
            argu_list: {
                check_id: check_id,
                card_id: $('#check_card_id').val(),
                mobile: $('#check_mobile').val()
            }
        };

        $.ajax({
            url: '/fuel_card/customer_list',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    alert("短信发送成功");
                    this.setState({
                        secondsRemaining: this.props.secondsRemaining
                    });

                    $("#check_btn").text("重新发送(" + this.state.secondsRemaining + ")");

                    this.interval = setInterval(this.tick, 1000);

                    $('#check_moblie_yzm').show().val('');
                    $("#check_card_id,#check_mobile,#check_btn").attr({ 'disabled': 'disabled' });
                    $("#checkStep2").show();
                } else {
                    this.setState({ check_id: null });
                    alert("发送短信验证码出错\n" + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                this.setState({ check_id: null });

                alert("发送短信验证码异常\n" + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    checkStep2: function checkStep2() {
        var requ_data = {
            requ_type: 'check_card_account_step2',
            argu_list: {
                check_id: this.state.check_id,
                mobile_yzm: $('#check_mobile_yzm').val()
            }
        };
        $.ajax({
            url: '/fuel_card/customer_list',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    alert('验证成功\n验证信息为: ' + resp_data.data.name);
                    //alert(JSON.stringify(resp_data.data));
                    if (this.state.getCustomerList) {
                        this.state.getCustomerList();
                    }
                    this.hideDlg();
                } else {
                    alert("验证用户信息出错 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("验证用户信息异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    returnStep1: function returnStep1() {
        $('#check_mobile,#check_mobile_yzm,#check_card_id,#check_btn').removeAttr('disabled');
        $('#checkStep2').hide();
        $('#check_card_id_msg,#check_mobile_msg,#check_mobile_yzm_msg').hide();
    },

    onOk: function onOk() {
        this.hideDlg();
    },

    showDlg: function showDlg(customer_info, getCustomerList) {
        $('#check_card_id').val('');
        $('#check_mobile,#check_mobile_yzm,#check_card_id').removeAttr('disabled');
        if (customer_info && getCustomerList) {
            this.setState({
                customer_info: customer_info,
                getCustomerList: getCustomerList
            });
            if (customer_info.card_id) {
                $('#check_card_id').val(customer_info.card_id).attr({ 'disabled': 'disabled' });
            }
        }
        $('#check_btn').attr({ 'disabled': 'disabled' });
        $('#checkStep2').hide();
        $('#check_card_id_msg,#check_mobile_msg,#check_mobile_yzm_msg').hide();
        $('#check_mobile,#check_mobile_yzm').val('');
        $('#CheckCardAccountInfoDlg').modal('show');
    },

    hideDlg: function hideDlg() {
        $('#CheckCardAccountInfoDlg').modal('hide');
        this.clearInput();
    },

    clearInput: function clearInput() {
        this.setState({
            check_id: null,
            customer_info: null,
            getCustomerList: null
        });
        $('#check_card_id,#check_mobile,#check_mobile_yzm').removeAttr('disabled');
        $('#check_card_id,#check_mobile,#check_mobile_yzm').val('');
    },

    tick: function tick() {
        this.setState({
            secondsRemaining: this.state.secondsRemaining - 1
        });
        $("#check_btn").text("重新验证(" + this.state.secondsRemaining + ")");
        if (this.state.secondsRemaining <= 0) {
            $("#check_btn").text("获取验证码");
            $("#check_btn").removeAttr('disabled');
            clearInterval(this.interval);
        }
    },

    getInitialState: function getInitialState() {
        return {
            check_id: null,
            customer_info: null,
            getCustomerList: null,
            secondsRemaining: 120
        };
    },

    componentDidMount: function componentDidMount() {
        return {
            secondsRemaining: 120
        };
    },

    componentWillUnmount: function componentWillUnmount() {
        clearInterval(this.interval);
    },

    onInputKeyUp: function onInputKeyUp(input_id) {
        $('#' + input_id).keydown(function (e) {
            if (!e) var e = window.event;
            if (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 96 && e.keyCode <= 105 || e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 37 || e.keyCode == 39) {} else {
                e.preventDefault();
                e.stopPropagation();
            };
        });

        var card_id = $("#check_card_id").val();
        var mobile = $("#check_mobile").val();
        if (card_id.length < 18) {
            $('#check_mobile').attr({ 'disabled': 'disabled' });
            $('#check_card_id_msg').show();
        } else {
            $('#check_card_id_msg').hide();
            $('#check_mobile').removeAttr('disabled');
            if (mobile == '' || mobile == null || mobile == 'null') {
                $('#check_mobile_msg').show();
            } else {
                $('#check_card_id_msg,#check_mobile_msg').hide();
                $('#check_btn').removeAttr('disabled');
            };
        };
    },

    render: function render() {
        return React.createElement(
            'div',
            { className: 'modal', id: 'CheckCardAccountInfoDlg', tabIndex: '-1', role: 'dialog' },
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
                            'h5',
                            { className: 'modal-title' },
                            '加油卡信息检测'
                        )
                    ),
                    React.createElement(
                        'div',
                        { className: 'modal-body form-horizontal' },
                        React.createElement(
                            'div',
                            { className: 'add-pro-body' },
                            React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-4 col-md-3 control-label' },
                                    '加油卡卡号'
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-9' },
                                    React.createElement('input', { id: 'check_card_id', maxLength: '19',
                                        onKeyDown: this.onInputKeyUp.bind(this, 'check_card_id'),
                                        placeholder: '请输入需要监测的中石化加油卡卡号',
                                        className: 'm-bot15 form-control input-sm' })
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-offset-3 col-md-9' },
                                    React.createElement(
                                        'span',
                                        { className: 'alert alert-danger form-control padding-5',
                                            id: 'check_card_id_msg' },
                                        React.createElement('i', { className: 'icon-remove' }),
                                        ' 输入错误,卡号是19位,不能为空'
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                null,
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-4 col-md-3 control-label' },
                                    '手机号码'
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-9' },
                                    React.createElement('input', { id: 'check_mobile', maxLength: '11',
                                        onKeyDown: this.onInputKeyUp.bind(this, 'check_mobile'),
                                        placeholder: '请输入接收中石化验证码的手机',
                                        className: 'm-bot15 form-control input-sm' })
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: 'form-group' },
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-12' },
                                    React.createElement(
                                        'button',
                                        { id: 'check_btn', type: 'button',
                                            className: 'btn btn-info pull-right',
                                            onClick: this.checkStep1 },
                                        '获取验证码'
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                { id: 'checkStep2' },
                                React.createElement(
                                    'label',
                                    { className: 'col-sm-4 col-md-3 control-label' },
                                    '手机验证码'
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-9' },
                                    React.createElement('input', { id: 'check_mobile_yzm', maxLength: '10',
                                        placeholder: '请输入收到的手机验证码',
                                        className: 'm-bot15 form-control input-sm' })
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'col-sm-8 col-md-12 m-bot10' },
                                    React.createElement(
                                        'button',
                                        { id: 'check_yzm_btn', type: 'button',
                                            className: 'btn btn-info pull-right',
                                            onClick: this.checkStep2 },
                                        '检测有效性'
                                    ),
                                    React.createElement(
                                        'button',
                                        { id: 'return_step1_btn', type: 'button',
                                            className: 'btn btn-default pull-right m-right5',
                                            onClick: this.returnStep1 },
                                        '返回'
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
                            { type: 'button', className: 'btn btn-default', onClick: this.onOk },
                            '关闭'
                        )
                    )
                )
            )
        );
    }
});

React.render(React.createElement(MainContent, null), document.getElementById('main-content'));

