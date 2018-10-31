// weahwww optimize

//显示全屏遮罩
var Showfullbg = function () {
    $("#reload_fullbg,#reload_icon").show();
}

//隐藏全屏遮罩
var Hidefullbg = function () {
    $("#reload_fullbg,#reload_icon").hide();
}

var MainContent = React.createClass({
    getAccountList: function () {
        $.ajax({
            url: _.str.sprintf('/fuel_card/bot_account?&requ_type=%s',
                               encodeURIComponent('get_account_list')
                              ),
            type: 'get',
            dataType: 'json',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.setState({
                        account_list: resp_data.data.account_list,
                    });
                    //$('#check_account_btn').attr({ "disabled": "disabled" });
                    //$('#check_account_btn').text("已验证")
                } else {
                    alert("读取账号列表出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("读取账号列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),
        });

    },

    //显示新增账号弹窗
    onClickAddAccount: function () {
        this.refs.AddAccountDlg.showDlg(this.onAddAccount, this.onClickAddAccount);
    },

    //新增帐号
    onAddAccount: function (account_info) {
        var requ_data = {
            requ_type: 'add_account',
            argu_list: account_info
        }

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                } else {
                    alert("读取账号列表出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("读取账号列表异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

    },

    //删除帐号
    onDelAccount: function (account_info) {
        if (!window.confirm(_.str.sprintf('确认删除帐号 %s 吗?', account_info.account))) {
            return;
        }

        var requ_data = {
            requ_type: 'del_account',
            argu_list: account_info
        }

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                } else {
                    alert("删除账号出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("删除账号异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //设置默认帐号
    onSetDefaultAccount: function (account_info) {
        var requ_data = {
            requ_type: 'set_default_account',
            argu_list: account_info
        }

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                } else {
                    alert("设置默认账号出错 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("设置默认账号异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //显示修改帐号弹窗
    onClickModify: function (account) {
        this.refs.ModifyDlg.showDlg(account, this.onModifyPassword, this.onModifyNotes);
    },

    //修改密码
    onModifyPassword: function (account, password) {
        var requ_data = {
            requ_type: 'modify_password',
            argu_list: {
                account: account,
                password: password,
            }
        }

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                    alert("密码修改成功");
                } else {
                    alert("密码修改错误 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("密码修改异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //修改备注
    onModifyNotes: function (account, notes) {
        var requ_data = {
            requ_type: 'modify_notes',
            argu_list: {
                account: account,
                notes: notes,
            }
        }

        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                    alert("备注修改成功");
                } else {
                    alert("备注修改错误 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("备注修改异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    
    //验证卡号信息
    onCheckAccount: function (account) {
        var requ_data = {
            requ_type: 'check_account',
            argu_list: {
                account: account,
            }
        }
        Showfullbg();
        $.ajax({
            url: '/fuel_card/bot_account',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    alert("验证成功\n"
                        + "卡号: " + resp_data.data.cardInfo.cardNo
                        + "\n用户名: " + resp_data.data.cardInfo.cardHolder);
                } else {
                    console.log(JSON.stringify(resp_data));
                    alert("验证错误 " + resp_data.data.sinopec_msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("验证异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this),

            complete: function (XMLHttpRequest, textStatus) {
                Hidefullbg();
            }.bind(this),
        });
    },

    getInitialState: function () {
        return {
            account_list: [],
        };
    },

    componentDidMount: function () {
        this.getAccountList();
    },

    componentDidUpdate: function (prevProps, prevState) {
    },

    render: function () {
        var defaultAccount = "(无)";
        var accountListNodes = this.state.account_list.map(function (account_info, index) {
            var setDefaultBtnNode = null;
            if (account_info.default) {
                defaultAccount = account_info.account;
            }
            else {
                setDefaultBtnNode = (
                    <div className="btn-group btn-group-xs" role="group" aria-label="">
                        <a type="button" href="javascript:void(0);"
                           className="btn btn-success"
                           onClick={this.onSetDefaultAccount.bind(this, account_info)}>
                            <i className="icon-bookmark" /> 设为默认
                        </a>
                    </div>
                    );
            }

            return (
                    <tr>
                        <td>{account_info.account}</td>
                        <td>{account_info.status_n}</td>
                        <td>{account_info.update_time}</td>
                        <td>{account_info.notes}</td>
                        <td>{setDefaultBtnNode}</td>
                        <td>
                            <a id="check_account_btn" type="button" href="javascript:void(0);"
                               className="btn btn-xs btn-warning"
                               onClick={this.onCheckAccount.bind(this, account_info.account)}>
                                <i className="icon-check" /> 验证
                            </a>
                        </td>
                        <td>
                            <div className="btn-group btn-group-xs" role="group" aria-label="">
                                <a type="button" href="javascript:void(0);"
                                   className="btn btn-primary"
                                   onClick={this.onClickModify.bind(this, account_info.account)}>
                                    <i className="icon-edit" /> 修改
                                </a>
                            </div>
                        </td>
                        <td>
                            <div className="btn-group btn-group-xs" role="group" aria-label="">
                                <a type="button" href="javascript:void(0);"
                                   className="btn btn-danger"
                                   onClick={this.onDelAccount.bind(this, account_info)}>
                                    <i className="icon-trash" /> 删除
                                </a>
                            </div>
                        </td>
                    </tr>
                )
        }.bind(this));


        return (
                <div className="wrapper">
                    <div id="reload_fullbg"></div>
                    <div id="reload_icon"><i className="icon-spinner icon-spin icon-4x"></i></div>
                    <div className="col-md-12">
                       <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>账号列表</span>
                            <a className="btn btn-info pull-right"
                               href="javascript:void(0);"
                               onClick={this.onClickAddAccount}>
                            <i className="icon-plus" /> 新增账号
                            </a>
                        </header>
                        <div className="panel-body">
                            <div className="col-xs-12">
                                <h5 className="text-danger">
                                    <strong><i className="icon-bookmark" /> 当前默认账号： {defaultAccount}</strong>
                                </h5>
                            </div>
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>用户名</th>
                                        <th>状态</th>
                                        <th>修改时间</th>
                                        <th>备注</th>
                                        <th>操作</th>
                                        <th>验证</th>
                                        <th>修改</th>
                                        <th>删除</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accountListNodes}
                                </tbody>
                            </table>
                        </div>
                       </section>
                    </div>
                    <AddAccountDlg ref="AddAccountDlg" />
                    <ModifyDlg ref="ModifyDlg" />
                </div>
         );
    }
});

//新增账号弹窗
var AddAccountDlg = React.createClass({
    onOk: function () {
        if (this.state.onAddAccount) {
            var account_info = {
                account: $('#account_account').val(),
                password: $('#account_password').val(),
                notes: $('#account_notes').val(),
            };
            this.state.onAddAccount(account_info);
        }

        this.hideDlg();
    },

    showDlg: function (onAddAccount, onClickAddAccount) {
        this.setState({
            onAddAccount: onAddAccount,
            onClickAddAccount: onClickAddAccount
        });
        $('#AddAccountDlg').modal('show');
        $('#account_password,#add_account_btn').attr({ 'disabled': 'disabled' });
        $('#account_account_msg,#account_password_msg').hide();
        $('#account_account,#account_password,#account_notes').val('');
    },


    hideDlg: function () {
        $('#AddAccountDlg').modal('hide');
        this.clearInput();
    },

    clearInput: function () {
        this.setState({
            onAddAccount: null,
        });
    },

    getInitialState: function () {
        return ({
            onAddAccount: null,
        });
    },

    onInputKeyUp: function (input_id) {
        $('#' + input_id).keydown(
            function (e) {
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
            } else{
                $('#account_account_msg,#account_password_msg').hide();
                $('#add_account_btn').removeAttr('disabled');
            };
        };
    },

    render: function () {
        return (
            <div className="modal" id="AddAccountDlg" tabIndex="-1" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">新增账号</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <div>
                                    <label className="col-sm-4 col-md-2 control-label">用户名</label>
                                    <div className="col-sm-8 col-md-9">
                                        <input id="account_account"
                                               className="m-bot15 form-control input-sm"
                                               placeholder="请输入中石化网站登录帐号"
                                               onBlur={this.onInputKeyUp.bind(this,'account_account')}
                                               onKeyUp={this.onInputKeyUp.bind(this,'account_account')} />
                                    </div>
                                    <div className="col-sm-8 col-md-offset-2 col-md-9">
                                        <span className="form-control alert alert-danger padding-5"
                                              id="account_account_msg">
                                              <i className="icon-remove" /> 帐号不能为空
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="col-sm-4 col-md-2 control-label">用户密码</label>
                                    <div className="col-sm-8 col-md-9">
                                        <input id="account_password"
                                               className="m-bot15 form-control input-sm"
                                               placeholder="请输入中石化网站帐号密码"
                                               onBlur={this.onInputKeyUp.bind(this,'account_password')}
                                               onKeyUp={this.onInputKeyUp.bind(this,'account_password')} />
                                    </div>
                                    <div className="col-sm-8 col-md-offset-2 col-md-9">
                                        <span className="form-control alert alert-danger padding-5"
                                              id="account_password_msg">
                                              <i className="icon-remove" /> 密码不能为空
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="col-sm-4 col-md-2 control-label">备注</label>
                                    <div className="col-sm-8 col-md-9">
                                        <input id="account_notes" placeholder="备注信息（可以为空）"
                                               className="m-bot15 form-control input-sm" />
                                    </div>
                                    <div className="modal-footer form-horifooter">
                                        <button type="button" className="btn btn-info" onClick={this.state.onClickAddAccount}>重置</button>
                                        <button type="button" id="add_account_btn" className="btn btn-danger" onClick={this.onOk}>新建</button>
                                        <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

//修改账号弹窗
var ModifyDlg = React.createClass({
    showDlg: function (account, onPwd, onNotes) {
        this.setState({
            account: account,
            onPwd: onPwd,
            onNotes: onNotes,
        });
        $('#ModifyDlg').modal('show');
        $('#pwd_edit_btn').addClass('disabled');
        $('#new_pwd_msg').hide();
        $('#new_pwd_value,#new_notes_value').val('');
        $('#myTab a:first').tab('show');
    },

    hideDlg: function () {
        $('#ModifyDlg').modal('hide');
        this.clearInput();
    },

    clearInput: function () {
        this.setState({
            onOper: null,
        });
        $('#new_pwd_value,#new_notes_value').val('');
    },

    getInitialState: function () {
        return ({
            account: null,
            key_name: null,
            onOper: null,
        });
    },

    onChangePassword: function () {
        var account = this.state.account;
        var password = $("#new_pwd_value").val();
        if (password == "" || password == null || password == "null") {
            alert("密码不能为空");
        }
        this.state.onPwd(account, password);
        this.hideDlg();
    },

    onChangeNotes: function () {
        var account = this.state.account;
        var notes = " ";
        if ($("#new_notes_value").val()) {
            notes = $("#new_notes_value").val();
        }
        this.state.onNotes(account, notes);
        this.hideDlg();
    },

    onInputKeyUp: function () {
        $('#new_pwd_value').keydown(
            function (e) {
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

    render: function () {
        return (
            <div className="modal" id="ModifyDlg" tabIndex="-1" role="dialog">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">修改 <b>{this.state.account}</b> 信息</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <ul id="myTab" className="nav nav-tabs m-bot15">
                                    <li className="active"><a href="#password" data-toggle="tab">修改密码</a></li>
                                    <li><a href="#notes" data-toggle="tab">修改备注</a></li>
                                </ul>
                                <div id="myTabContent" className="tab-content m-bot15">
                                    <div className="tab-pane active" id="password">
                                        <div className="row">
                                            <label className="col-sm-4 col-md-2 control-label">新密码</label>
                                            <div className="col-sm-8 col-md-9">
                                                <input type="text" id="new_pwd_value"
                                                       placeholder="请输入新密码"
                                                       className="m-bot15 form-control input-sm"
                                                       onBlur={this.onInputKeyUp}
                                                       onKeyUp={this.onInputKeyUp} />
                                            </div>
                                            <div className="col-sm-8 col-md-offset-2 col-md-9">
                                                <span className="form-control alert alert-danger padding-5"
                                                      id="new_pwd_msg"><i className="icon-remove" />密码不能为空</span>
                                            </div>
                                        </div>
                                        <div className="modal-footer form-horifooter">
                                            <button id="pwd_edit_btn" type="button"
                                                    className="btn btn-danger"
                                                    onClick={this.onChangePassword}>
                                                确定
                                            </button>
                                            <button type="button"
                                                    className="btn btn-default"
                                                    data-dismiss="modal">
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                    <div className="tab-pane" id="notes">
                                        <div className="row">
                                            <label className="col-sm-4 col-md-2 control-label">新备注</label>
                                            <div className="col-sm-8 col-md-9">
                                                <input type="text"
                                                       id="new_notes_value"
                                                       placeholder="请输入备注内容(不输入为清空原内容)"
                                                       className="m-bot15 form-control input-sm" />
                                            </div>
                                        </div>
                                        <div className="modal-footer form-horifooter">
                                            <button id="notes_edit_btn" type="button"
                                                    className="btn btn-danger"
                                                    onClick={this.onChangeNotes}>
                                                确定
                                            </button>
                                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

React.render(
    <MainContent />
    ,
    document.getElementById('main-content')
);