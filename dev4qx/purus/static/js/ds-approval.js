var DownstreamPanel = React.createClass({displayName: "DownstreamPanel",
    getInitialState: function () {
        return {
            tab: 1,
            request_list: [],
            downstream_list: [],
            page: 0,
            max: 1,
            user_list: [],
            current_request: {},
            commit_message: '',
            level_name: []
        };
    },

    loadRequestList: function () {
        $.ajax({
            url: '/api/downstream/request',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({request_list: data});
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadLevelName: function () {
        $.ajax({
            url: '/api/product/level',
            dataType: 'json',
            type: 'get',
            success: function (list) {
                if (list) {
                    this.setState({level_name: list});
                }
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onNewRequest: function (id) {
        this.setState({current_request: {}});
        $('#addModal').modal('show');
    },

    onSelect: function (id) {
        for (var i = 0; i < this.state.request_list.length; i++) {
            if (this.state.request_list[i].id == id) {
                this.setState({current_request: this.state.request_list[i]});
                $('#addModal').modal('show');
                break;
            }
        }
    },

    componentDidMount: function () {
        this.loadRequestList();
        this.loadLevelName();
    },

    render: function () {

        return (
            React.createElement("section", {className: "panel"}, 
                React.createElement("header", {className: "panel-heading row"}, 
                    React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "客户审核"), 
                    React.createElement("span", {className: "pull-right"}, 
                        React.createElement("a", {href: "javascript:void(0);", className: "btn btn-danger", onClick: this.onNewRequest}, 
                            React.createElement("i", {className: "icon-edit"}), React.createElement("span", null, " 添加客户"))
                    )
                ), 

                React.createElement("div", {className: "panel-body"}, 
                    React.createElement("div", {className: "table-responsive"}, 

                        React.createElement(RequestList, {
                            request_list: this.state.request_list, 
                            onSelect: this.onSelect}), 

                        React.createElement(RequestBox, {
                            request: this.state.current_request, 
                            refresh: this.loadRequestList, 
                            level_name: this.state.level_name})
                    )
                )
            )
        );
    }
});

var RequestList = React.createClass({displayName: "RequestList",
    onSelect: function (id) {
        this.props.onSelect(id);
    },

    render: function () {
        var requestNodes = this.props.request_list.map(function (request, i) {

            return (
                React.createElement("tr", {key: request.id, onClick: this.onSelect.bind(this, request.id)}, 
                    React.createElement("td", null, request.id), 
                    React.createElement("td", null, request.name), 
                    React.createElement("td", null, request.mobile), 
                    React.createElement("td", null, request.qq), 
                    React.createElement("td", null, request.needs), 
                    React.createElement("td", null, request.notes), 
                    React.createElement("td", null, request.login)
                )
            );
        }.bind(this));


        return (
            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                React.createElement("thead", null, 
                React.createElement("tr", null, 
                    React.createElement("th", null, "编号"), 
                    React.createElement("th", null, "名称"), 
                    React.createElement("th", null, "手机"), 
                    React.createElement("th", null, "QQ"), 
                    React.createElement("th", null, "需求"), 
                    React.createElement("th", null, "备注"), 
                    React.createElement("th", null, "登录名")
                )
                ), 
                React.createElement("tbody", null, 
                requestNodes
                )
            )
        );
    }
});

var RequestBox = React.createClass({displayName: "RequestBox",
    getInitialState: function () {
        return {
            template: []
        };
    },

    componentDidMount: function () {
        $.ajax({
            url: '/api/downstream/template',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({template: data});
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onReject: function () {
        var request_id = $('#request-id').val();
        var request = {'request_id': request_id};

        $.ajax({
            url: '/api/downstream/reject',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                alert(data.msg);
                if (data.status == 'ok') {
                    $('#addModal').modal('hide');
                }
                this.props.refresh();
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onApproval: function () {
        var re_login = /^[0-9a-zA-Z]{4,12}/;

        var name = $('#user-name').val();
        var login = $('#user-login').val();
        var template_id = $('#template_id').val();
        var request_id = $('#request-id').val();
        var plevel = $('#user-plevel').val();
        var notes = $('#user-notes').val();
        var qq = $('#user-qq').val();
        var mobile = $('#user-mobile').val();

        if (name.length < 2 || name.length > 40) {
            alert('请输入有效的姓名');
            return;
        }

        if (!re_login.exec(login)) {
            alert('请输入有效的登录名');
            return;

        }

        var request = {
            'name': name,
            'login': login,
            'template_id': template_id,
            'request_id': request_id,
            'plevel': plevel,
            'notes': notes,
            'qq': qq,
            'mobile': mobile
        };

        $.ajax({
            url: '/api/downstream/approval',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                alert(data.msg);
                if (data.status == 'ok') {

                    alert("请牢记密码：" + data.password);
                    $('#addModal').modal('hide');
                    this.props.refresh();
                }
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onDismiss: function () {
        $('#addModal').modal('hide');
    },

    render: function () {
        var template_list = this.state.template.map(function (t, i) {
            return (
                React.createElement("option", {key: t.id, value: t.id}, t.name)
            );
        });

        var levelNode = this.props.level_name.map(function (level, index) {
            return (React.createElement("option", {value: index+1}, level));
        });

        var title = null;
        var actionBar = null;

        if (this.props.request.id) {
            $("#request-id").val(this.props.request.id);
            $("#user-name").val(this.props.request.name);
            $("#user-login").val(this.props.request.login);
            $("#user-mobile").val(this.props.request.mobile);
            $("#user-qq").val(this.props.request.qq);
            $("#user-needs").val(this.props.request.needs);
            $("#user-notes").val(this.props.request.notes);

            title = '审核客户';
            actionBar = (
                React.createElement("div", {className: "modal-footer"}, 
                    React.createElement("button", {type: "button", className: "btn btn-info", onClick: this.onReject}, "不通过"), 
                    React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onApproval}, "通过"), 
                    React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                )
            );
        } else {

            $("#request-id").val('');
            $("#user-name").val('');
            $("#user-login").val('');
            $("#user-mobile").val('');
            $("#user-qq").val('');
            $("#user-needs").val('');
            $("#user-notes").val('');

            title = '添加客户';
            actionBar = (
                React.createElement("div", {className: "modal-footer"}, 
                    React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onApproval}, "确定"), 
                    React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                )
            );
        }

        return (
            React.createElement("div", {className: "modal fade", id: "addModal", tabIndex: "-1", role: "dialog", "aria-labelledby": "addModalLabel", 
                 "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title", id: "addModalLabel"}, title)
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 
                                React.createElement("label", {className: "col-md-2 control-label"}, "姓名"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-name", 
                                           placeholder: "2-50位任意字符"}), 
                                    React.createElement("input", {id: "request-id", type: "hidden"})
                                ), 
                                React.createElement("label", {className: "col-md-2 control-label"}, "登录名"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-login", 
                                           placeholder: "4-12位数字或英文字母"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "电话"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-mobile"})
                                ), 
                                React.createElement("label", {className: "col-md-2 control-label"}, "QQ"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-qq"})
                                ), 
                                React.createElement("label", {className: "col-md-2 control-label"}, "需求"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-needs"})
                                ), 
                                React.createElement("label", {className: "col-md-2 control-label"}, "备注"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-notes"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "价格等级"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {className: "m-bot15 form-control input-sm", id: "user-plevel"}, 
                                        levelNode
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "用户类型"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {id: "template_id", className: "m-bot15 form-control input-sm"}, 
                                        template_list
                                    )
                                )
                            )
                        ), 
                        actionBar
                    )
                )
            )
        )
    }
});


React.render(
    React.createElement(DownstreamPanel, null)
    ,
    document.getElementById('content')
);
