// weahwww optimize

//显示全屏遮罩
"use strict";

var Showfullbg = function Showfullbg() {
    $("#reload_fullbg,#reload_icon").show();
};

//隐藏全屏遮罩
var Hidefullbg = function Hidefullbg() {
    $("#reload_fullbg,#reload_icon").hide();
};

var MainContent = React.createClass({
    displayName: "MainContent",

    getAccountList: function getAccountList() {
        $.ajax({
            url: _.str.sprintf('/fuel_card/bot_account?&requ_type=%s', encodeURIComponent('get_account_list')),
            type: 'get',
            dataType: 'json',

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        account_list: resp_data.data.account_list
                    });
                    //$('#check_account_btn').attr({ "disabled": "disabled" });
                    //$('#check_account_btn').text("已验证")
                } else {
                        alert("读取账号列表出错 " + resp_data.msg);
                    }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("读取账号列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //显示新增账号弹窗
    onClickAddAccount: function onClickAddAccount() {
        this.refs.AddAccountDlg.showDlg(this.onAddAccount, this.onClickAddAccount);
    },

    //新增帐号
    onAddAccount: function onAddAccount(account_info) {
        var requ_data = {
            requ_type: 'add_account',
            argu_list: account_info
        };

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                } else {
                    alert("读取账号列表出错 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("读取账号列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //删除帐号
    onDelAccount: function onDelAccount(account_info) {
        if (!window.confirm(_.str.sprintf('确认删除帐号 %s 吗?', account_info.account))) {
            return;
        }

        var requ_data = {
            requ_type: 'del_account',
            argu_list: account_info
        };

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                } else {
                    alert("删除账号出错 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("删除账号异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //设置默认帐号
    onSetDefaultAccount: function onSetDefaultAccount(account_info) {
        var requ_data = {
            requ_type: 'set_default_account',
            argu_list: account_info
        };

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                } else {
                    alert("设置默认账号出错 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("设置默认账号异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //显示修改帐号弹窗
    onClickModify: function onClickModify(account) {
        this.refs.ModifyDlg.showDlg(account, this.onModifyPassword, this.onModifyNotes);
    },

    //修改密码
    onModifyPassword: function onModifyPassword(account, password) {
        var requ_data = {
            requ_type: 'modify_password',
            argu_list: {
                account: account,
                password: password
            }
        };

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                    alert("密码修改成功");
                } else {
                    alert("密码修改错误 " + resp_data.msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("密码修改异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this)
        });
    },

    //修改备注
    onModifyNotes: function onModifyNotes(account, notes) {
        var requ_data = {
            requ_type: 'modify_notes',
            argu_list: {
                account: account,
                notes: notes
            }
        };

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
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

    //验证卡号信息
    onCheckAccount: function onCheckAccount(account) {
        var requ_data = {
            requ_type: 'check_account',
            argu_list: {
                account: account
            }
        };
        Showfullbg();
        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: (function (resp_data) {
                if (resp_data.status == 'ok') {
                    alert("验证成功\n" + "卡号: " + resp_data.data.cardInfo.cardNo + "\n用户名: " + resp_data.data.cardInfo.cardHolder);
                } else {
                    console.log(JSON.stringify(resp_data));
                    alert("验证错误 " + resp_data.data.sinopec_msg);
                }
            }).bind(this),

            error: (function (xhr, status, err) {
                alert("验证异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }).bind(this),

            complete: (function (XMLHttpRequest, textStatus) {
                Hidefullbg();
            }).bind(this)
        });
    },

    getInitialState: function getInitialState() {
        return {
            account_list: []
        };
    },

    componentDidMount: function componentDidMount() {
        this.getAccountList();
    },

    componentDidUpdate: function componentDidUpdate(prevProps, prevState) {},

    render: function render() {
        var defaultAccount = "(无)";
        var accountListNodes = this.state.account_list.map((function (account_info, index) {
            var setDefaultBtnNode = null;
            if (account_info["default"]) {
                defaultAccount = account_info.account;
            } else {
                setDefaultBtnNode = React.createElement(
                    "div",
                    { className: "btn-group btn-group-xs", role: "group", "aria-label": "" },
                    React.createElement(
                        "a",
                        { type: "button", href: "javascript:void(0);",
                            className: "btn btn-success",
                            onClick: this.onSetDefaultAccount.bind(this, account_info) },
                        React.createElement("i", { className: "icon-bookmark" }),
                        " 设为默认"
                    )
                );
            }

            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    null,
                    account_info.account
                ),
                React.createElement(
                    "td",
                    null,
                    account_info.status_n
                ),
                React.createElement(
                    "td",
                    null,
                    account_info.update_time
                ),
                React.createElement(
                    "td",
                    null,
                    account_info.notes
                ),
                React.createElement(
                    "td",
                    null,
                    setDefaultBtnNode
                ),
                React.createElement(
                    "td",
                    null,
                    React.createElement(
                        "a",
                        { id: "check_account_btn", type: "button", href: "javascript:void(0);",
                            className: "btn btn-xs btn-warning",
                            onClick: this.onCheckAccount.bind(this, account_info.account) },
                        React.createElement("i", { className: "icon-check" }),
                        " 验证"
                    )
                ),
                React.createElement(
                    "td",
                    null,
                    React.createElement(
                        "div",
                        { className: "btn-group btn-group-xs", role: "group", "aria-label": "" },
                        React.createElement(
                            "a",
                            { type: "button", href: "javascript:void(0);",
                                className: "btn btn-primary",
                                onClick: this.onClickModify.bind(this, account_info.account) },
                            React.createElement("i", { className: "icon-edit" }),
                            " 修改"
                        )
                    )
                ),
                React.createElement(
                    "td",
                    null,
                    React.createElement(
                        "div",
                        { className: "btn-group btn-group-xs", role: "group", "aria-label": "" },
                        React.createElement(
                            "a",
                            { type: "button", href: "javascript:void(0);",
                                className: "btn btn-danger",
                                onClick: this.onDelAccount.bind(this, account_info) },
                            React.createElement("i", { className: "icon-trash" }),
                            " 删除"
                        )
                    )
                )
            );
        }).bind(this));

        return React.createElement(
            "div",
            { className: "wrapper" },
            React.createElement("div", { id: "reload_fullbg" }),
            React.createElement(
                "div",
                { id: "reload_icon" },
                React.createElement("i", { className: "icon-spinner icon-spin icon-4x" })
            ),
            React.createElement(
                "div",
                { className: "col-md-12" },
                React.createElement(
                    "section",
                    { className: "panel" },
                    React.createElement(
                        "header",
                        { className: "panel-heading row" },
                        React.createElement(
                            "span",
                            { className: "pull-left" },
                            React.createElement("i", { className: "icon-table" }),
                            "账号列表"
                        ),
                        React.createElement(
                            "a",
                            { className: "btn btn-info pull-right",
                                href: "javascript:void(0);",
                                onClick: this.onClickAddAccount },
                            React.createElement("i", { className: "icon-plus" }),
                            " 新增账号"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "panel-body" },
                        React.createElement(
                            "div",
                            { className: "col-xs-12" },
                            React.createElement(
                                "h5",
                                { className: "text-danger" },
                                React.createElement(
                                    "strong",
                                    null,
                                    React.createElement("i", { className: "icon-bookmark" }),
                                    " 当前默认账号： ",
                                    defaultAccount
                                )
                            )
                        ),
                        React.createElement(
                            "table",
                            { className: "table table-striped table-hover" },
                            React.createElement(
                                "thead",
                                null,
                                React.createElement(
                                    "tr",
                                    null,
                                    React.createElement(
                                        "th",
                                        null,
                                        "用户名"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "状态"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "修改时间"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "备注"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "操作"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "验证"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "修改"
                                    ),
                                    React.createElement(
                                        "th",
                                        null,
                                        "删除"
                                    )
                                )
                            ),
                            React.createElement(
                                "tbody",
                                null,
                                accountListNodes
                            )
                        )
                    )
                )
            ),
            React.createElement(AddAccountDlg, { ref: "AddAccountDlg" }),
            React.createElement(ModifyDlg, { ref: "ModifyDlg" })
        );
    }
});

//新增账号弹窗
var AddAccountDlg = React.createClass({
    displayName: "AddAccountDlg",

    onOk: function onOk() {
        if (this.state.onAddAccount) {
            var account_info = {
                account: $('#account_account').val(),
                password: $('#account_password').val(),
                notes: $('#account_notes').val()
            };
            this.state.onAddAccount(account_info);
        }

        this.hideDlg();
    },

    showDlg: function showDlg(onAddAccount, onClickAddAccount) {
        this.setState({
            onAddAccount: onAddAccount,
            onClickAddAccount: onClickAddAccount
        });
        $('#AddAccountDlg').modal('show');
        $('#account_password,#add_account_btn').attr({ 'disabled': 'disabled' });
        $('#account_account_msg,#account_password_msg').hide();
        $('#account_account,#account_password,#account_notes').val('');
    },

    hideDlg: function hideDlg() {
        $('#AddAccountDlg').modal('hide');
        this.clearInput();
    },

    clearInput: function clearInput() {
        this.setState({
            onAddAccount: null
        });
    },

    getInitialState: function getInitialState() {
        return {
            onAddAccount: null
        };
    },

    onInputKeyUp: function onInputKeyUp(input_id) {
        $('#' + input_id).keydown(function (e) {
            if (!e) var e = window.event;
            if (e.keyCode == 32) {
                e.preventDefault();
                e.stopPropagation();
            };
        });

        var account = $("#account_account").val();
        var password = $("#account_password").val();

        if (account == null || account == "" || account == "null") {
            $('#account_account_msg').show();
            $('#account_password_msg').hide();
            $('#add_account_btn').attr({ 'disabled': 'disabled' });;
        } else {
            $('#account_account_msg').hide();
            $('#account_password').removeAttr('disabled');
            if (password == '' || password == null || password == 'null') {
                $('#account_password_msg').show();
                $('#add_account_btn').attr({ 'disabled': 'disabled' });;
            } else {
                $('#account_account_msg,#account_password_msg').hide();
                $('#add_account_btn').removeAttr('disabled');
            };
        };
    },

    render: function render() {
        return React.createElement(
            "div",
            { className: "modal", id: "AddAccountDlg", tabIndex: "-1", role: "dialog" },
            React.createElement(
                "div",
                { className: "modal-dialog" },
                React.createElement(
                    "div",
                    { className: "modal-content" },
                    React.createElement(
                        "div",
                        { className: "modal-header" },
                        React.createElement(
                            "h5",
                            { className: "modal-title" },
                            "新增账号"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "modal-body form-horizontal" },
                        React.createElement(
                            "div",
                            { className: "form-group add-pro-body" },
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "label",
                                    { className: "col-sm-4 col-md-2 control-label" },
                                    "用户名"
                                ),
                                React.createElement(
                                    "div",
                                    { className: "col-sm-8 col-md-9" },
                                    React.createElement("input", { id: "account_account",
                                        className: "m-bot15 form-control input-sm",
                                        placeholder: "请输入中石化网站登录帐号",
                                        onBlur: this.onInputKeyUp.bind(this, 'account_account'),
                                        onKeyUp: this.onInputKeyUp.bind(this, 'account_account') })
                                ),
                                React.createElement(
                                    "div",
                                    { className: "col-sm-8 col-md-offset-2 col-md-9" },
                                    React.createElement(
                                        "span",
                                        { className: "form-control alert alert-danger padding-5",
                                            id: "account_account_msg" },
                                        React.createElement("i", { className: "icon-remove" }),
                                        " 帐号不能为空"
                                    )
                                )
                            ),
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "label",
                                    { className: "col-sm-4 col-md-2 control-label" },
                                    "用户密码"
                                ),
                                React.createElement(
                                    "div",
                                    { className: "col-sm-8 col-md-9" },
                                    React.createElement("input", { id: "account_password",
                                        className: "m-bot15 form-control input-sm",
                                        placeholder: "请输入中石化网站帐号密码",
                                        onBlur: this.onInputKeyUp.bind(this, 'account_password'),
                                        onKeyUp: this.onInputKeyUp.bind(this, 'account_password') })
                                ),
                                React.createElement(
                                    "div",
                                    { className: "col-sm-8 col-md-offset-2 col-md-9" },
                                    React.createElement(
                                        "span",
                                        { className: "form-control alert alert-danger padding-5",
                                            id: "account_password_msg" },
                                        React.createElement("i", { className: "icon-remove" }),
                                        " 密码不能为空"
                                    )
                                )
                            ),
                            React.createElement(
                                "div",
                                null,
                                React.createElement(
                                    "label",
                                    { className: "col-sm-4 col-md-2 control-label" },
                                    "备注"
                                ),
                                React.createElement(
                                    "div",
                                    { className: "col-sm-8 col-md-9" },
                                    React.createElement("input", { id: "account_notes", placeholder: "备注信息（可以为空）",
                                        className: "m-bot15 form-control input-sm" })
                                ),
                                React.createElement(
                                    "div",
                                    { className: "modal-footer form-horifooter" },
                                    React.createElement(
                                        "button",
                                        { type: "button", className: "btn btn-info", onClick: this.state.onClickAddAccount },
                                        "重置"
                                    ),
                                    React.createElement(
                                        "button",
                                        { type: "button", id: "add_account_btn", className: "btn btn-danger", onClick: this.onOk },
                                        "新建"
                                    ),
                                    React.createElement(
                                        "button",
                                        { type: "button", className: "btn btn-default", "data-dismiss": "modal" },
                                        "取消"
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

//修改账号弹窗
var ModifyDlg = React.createClass({
    displayName: "ModifyDlg",

    showDlg: function showDlg(account, onPwd, onNotes) {
        this.setState({
            account: account,
            onPwd: onPwd,
            onNotes: onNotes
        });
        $('#ModifyDlg').modal('show');
        $('#pwd_edit_btn').addClass('disabled');
        $('#new_pwd_msg').hide();
        $('#new_pwd_value,#new_notes_value').val('');
        $('#myTab a:first').tab('show');
    },

    hideDlg: function hideDlg() {
        $('#ModifyDlg').modal('hide');
        this.clearInput();
    },

    clearInput: function clearInput() {
        this.setState({
            onOper: null
        });
        $('#new_pwd_value,#new_notes_value').val('');
    },

    getInitialState: function getInitialState() {
        return {
            account: null,
            key_name: null,
            onOper: null
        };
    },

    onChangePassword: function onChangePassword() {
        var account = this.state.account;
        var password = $("#new_pwd_value").val();
        if (password == "" || password == null || password == "null") {
            alert("密码不能为空");
        }
        this.state.onPwd(account, password);
        this.hideDlg();
    },

    onChangeNotes: function onChangeNotes() {
        var account = this.state.account;
        var notes = " ";
        if ($("#new_notes_value").val()) {
            notes = $("#new_notes_value").val();
        }
        this.state.onNotes(account, notes);
        this.hideDlg();
    },

    onInputKeyUp: function onInputKeyUp() {
        $('#new_pwd_value').keydown(function (e) {
            if (!e) var e = window.event;
            if (e.keyCode == 32) {
                e.preventDefault();
                e.stopPropagation();
            };
        });

        var i = $('#new_pwd_value').val();
        if (i == null || i == "" || i == "null") {
            $('#new_pwd_msg').show();
            $('#pwd_edit_btn').addClass('disabled');
        } else {
            $('#pwd_edit_btn').removeClass('disabled');
            $('#new_pwd_msg').hide();
        }
    },

    render: function render() {
        return React.createElement(
            "div",
            { className: "modal", id: "ModifyDlg", tabIndex: "-1", role: "dialog" },
            React.createElement(
                "div",
                { className: "modal-dialog" },
                React.createElement(
                    "div",
                    { className: "modal-content" },
                    React.createElement(
                        "div",
                        { className: "modal-header" },
                        React.createElement(
                            "h5",
                            { className: "modal-title" },
                            "修改 ",
                            React.createElement(
                                "b",
                                null,
                                this.state.account
                            ),
                            " 信息"
                        )
                    ),
                    React.createElement(
                        "div",
                        { className: "modal-body form-horizontal" },
                        React.createElement(
                            "div",
                            { className: "form-group add-pro-body" },
                            React.createElement(
                                "ul",
                                { id: "myTab", className: "nav nav-tabs m-bot15" },
                                React.createElement(
                                    "li",
                                    { className: "active" },
                                    React.createElement(
                                        "a",
                                        { href: "#password", "data-toggle": "tab" },
                                        "修改密码"
                                    )
                                ),
                                React.createElement(
                                    "li",
                                    null,
                                    React.createElement(
                                        "a",
                                        { href: "#notes", "data-toggle": "tab" },
                                        "修改备注"
                                    )
                                )
                            ),
                            React.createElement(
                                "div",
                                { id: "myTabContent", className: "tab-content m-bot15" },
                                React.createElement(
                                    "div",
                                    { className: "tab-pane active", id: "password" },
                                    React.createElement(
                                        "div",
                                        { className: "row" },
                                        React.createElement(
                                            "label",
                                            { className: "col-sm-4 col-md-2 control-label" },
                                            "新密码"
                                        ),
                                        React.createElement(
                                            "div",
                                            { className: "col-sm-8 col-md-9" },
                                            React.createElement("input", { type: "text", id: "new_pwd_value",
                                                placeholder: "请输入新密码",
                                                className: "m-bot15 form-control input-sm",
                                                onBlur: this.onInputKeyUp,
                                                onKeyUp: this.onInputKeyUp })
                                        ),
                                        React.createElement(
                                            "div",
                                            { className: "col-sm-8 col-md-offset-2 col-md-9" },
                                            React.createElement(
                                                "span",
                                                { className: "form-control alert alert-danger padding-5",
                                                    id: "new_pwd_msg" },
                                                React.createElement("i", { className: "icon-remove" }),
                                                "密码不能为空"
                                            )
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "modal-footer form-horifooter" },
                                        React.createElement(
                                            "button",
                                            { id: "pwd_edit_btn", type: "button",
                                                className: "btn btn-danger",
                                                onClick: this.onChangePassword },
                                            "确定"
                                        ),
                                        React.createElement(
                                            "button",
                                            { type: "button",
                                                className: "btn btn-default",
                                                "data-dismiss": "modal" },
                                            "取消"
                                        )
                                    )
                                ),
                                React.createElement(
                                    "div",
                                    { className: "tab-pane", id: "notes" },
                                    React.createElement(
                                        "div",
                                        { className: "row" },
                                        React.createElement(
                                            "label",
                                            { className: "col-sm-4 col-md-2 control-label" },
                                            "新备注"
                                        ),
                                        React.createElement(
                                            "div",
                                            { className: "col-sm-8 col-md-9" },
                                            React.createElement("input", { type: "text",
                                                id: "new_notes_value",
                                                placeholder: "请输入备注内容(不输入为清空原内容)",
                                                className: "m-bot15 form-control input-sm" })
                                        )
                                    ),
                                    React.createElement(
                                        "div",
                                        { className: "modal-footer form-horifooter" },
                                        React.createElement(
                                            "button",
                                            { id: "notes_edit_btn", type: "button",
                                                className: "btn btn-danger",
                                                onClick: this.onChangeNotes },
                                            "确定"
                                        ),
                                        React.createElement(
                                            "button",
                                            { type: "button", className: "btn btn-default", "data-dismiss": "modal" },
                                            "取消"
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

React.render(React.createElement(MainContent, null), document.getElementById('main-content'));

