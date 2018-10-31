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

    loadDownstreamList: function (page) {
        var request = {
            page: page,
            size: 20
        };

        $.ajax({
            url: '/api/downstream/downstream',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                this.setState({downstream_list: data.list, page: data.page, max: data.max});
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

    loadLoginList: function () {
        $.ajax({
            url: '/api/downstream/user',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({user_list: data});
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onReload: function () {
        $.ajax({
            url: '/api/downstream/reload',
            dataType: 'json',
            type: 'post',
            success: function (data) {
                alert(data.msg);
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onSync: function () {
        var request = {'message': ''};

        $.ajax({
            url: '/api/downstream/sync',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                alert(data.msg);
                //$('#publishModal').modal('hide');
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

    onPublish: function () {
        $.ajax({
            url: '/api/downstream/publish',
            dataType: 'json',
            type: 'post',
            success: function (data) {
                alert(data.msg);
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
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

    updateMessage: function (msg) {
        this.setState({'commit_message': msg})
    },

    componentDidMount: function () {
        this.loadRequestList();
        this.loadLevelName();
        //this.loadDownstreamList();
        //this.loadLoginList();

        if (location.search == '?page=2') {
            this.moveToTab(2);
        }
    },

    moveToTab: function (i) {
        this.setState({tab: i});
        if (i == 1) {
            this.loadRequestList();
        } else if (i == 2) {
            this.loadDownstreamList(1);
        } else if (i == 3) {
            this.loadLoginList();
        }
    },

    onSelectDownstream: function (index) {
        //alert(index);
        var current = this.state.downstream_list[index];

        $("#detail-name").val(current['name']);
        $("#detail-login").val(current['login']);
        $("#detail-qq").val(current['qq']);
        $("#detail-mobile").val(current['mobile']);
        $("#detail-cooperation").val(current['cooperation']);
        $("#detail-notes").val(current['notes']);

        $('#downstreamModal').modal('show');
    },

    onEditLevelFinish: function (index, level) {
        console.info('INDEX=' + index + ',LEVEL=' + level);

        var p = this.state.downstream_list[index];

        var data = {
            'id': p['id'],
            'plevel': parseInt(level)
        };

        this.doEditDownstream(index, data);
    },

    onEditStatus: function (index, status) {
        var p = this.state.downstream_list[index];

        var data = {
            'id': p['id'],
            'status': status
        };

        this.doEditDownstream(index, data);
    },

    doEditDownstream: function (index, data) {

        $.ajax({
            url: '/api/downstream/update',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(data),
            success: function (resp) {
                if (resp) {
                    var d = this.state.downstream_list[index];
                    if (data.status) {
                        d['status'] = data.status;
                        d['status_n'] = data.status == 'enabled' ? '正常' : '关闭';
                    }
                    if (data.plevel) {
                        d['plevel'] = data.plevel;
                        d['plevel_n'] = this.state.level_name[data.plevel - 1];
                        d['in_edit'] = false;
                    }

                    this.setState({'downstream_list': this.state.downstream_list})
                }

            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onUpdate: function () {
        var request = {
            'id': $('#ds-id').val(),
            'name': $('#ds-name').val(),
            'back_url': $('#ds-url').val(),
            //'master_id': $('#ds-master').val(),
            'plevel': $('#ds-plevel').val()
        };

        $.ajax({
            url: '/api/downstream/update',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                alert(data.msg);
                if (data.status == 'ok') {
                    $('#downstreamModal').modal('hide');
                    this.props.refresh();
                }
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onEditLevel: function (index) {
        this.state.downstream_list[index]['in_edit'] = true;
        this.setState({'downstream_list': this.state.downstream_list})
    },

    render: function () {

        var tabNodes = ['客户审核', '客户列表'].map(function (name, i) {
            var col_class = (i + 1 == this.state.tab) ? 'col_on' : '';
            return (
                React.createElement("li", {key: i, className: col_class}, 
                    React.createElement("a", {href: "javascript:void(0);", onClick: this.moveToTab.bind(this, i + 1)}, name)
                )
            );
        }.bind(this));

        var tableNode = undefined;

        if (this.state.tab == 1) {
            tableNode = (
                React.createElement(RequestList, {request_list: this.state.request_list})
            );
        } else if (this.state.tab == 2) {
            tableNode = (
                React.createElement(DownstreamList, {downstream_list: this.state.downstream_list, 
                                page: this.state.page, 
                                max: this.state.max, 
                                onSelectDownstream: this.onSelectDownstream, 
                                onLoadPage: this.loadDownstreamList, 
                                onEditLevelFinish: this.onEditLevelFinish, 
                                onEditLevel: this.onEditLevel, 
                                onEditStatus: this.onEditStatus, 
                                level_name: this.state.level_name}
                    )
            );
        } else if (this.state.tab == 3) {
            tableNode = (
                React.createElement(UserList, {user_list: this.state.user_list})
            );
        }


        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "col_line"}, 
                    React.createElement("ul", null, 
                        tabNodes
                    )
                ), 


                React.createElement("div", {className: "table-responsive"}, 

                    tableNode, 

                    React.createElement("div", {className: "col-sm-12 col-md-12"}, 
                        React.createElement("button", {className: "btn btn-danger", onClick: this.onNewRequest}, "添加代理")
                    ), 

                    React.createElement(RequestBox, {
                        request: this.state.current_request, 
                        refresh: this.loadRequestList, 
                        level_name: this.state.level_name}), 
                    React.createElement(PublishBox, {message: this.state.commit_message, updateMessage: this.updateMessage}), 
                    React.createElement(DetailBox, {current: this.state.current_downstream})
                )
            )
        );
    }
});

var RequestList = React.createClass({displayName: "RequestList",
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
            React.createElement("table", {id: "order_result", className: "table table-hover"}, 
                React.createElement("thead", null, 
                React.createElement("tr", null, 
                    React.createElement("th", {className: "text-center"}, "请求编号"), 
                    React.createElement("th", {className: "text-center"}, "名称"), 
                    React.createElement("th", {className: "text-center"}, "手机"), 
                    React.createElement("th", {className: "text-center"}, "QQ"), 
                    React.createElement("th", {className: "text-center"}, "需求"), 
                    React.createElement("th", {className: "text-center"}, "备注"), 
                    React.createElement("th", {className: "text-center"}, "登录名")
                )
                ), 
                React.createElement("tbody", null, 
                requestNodes
                )
            )
        );
    }
});

var DownstreamList = React.createClass({displayName: "DownstreamList",

    onSelectDownstream: function (id) {
        this.props.onSelectDownstream(id);
    },

    onLoadPage: function (page) {
        this.props.onLoadPage(page);
    },

    onEditLevel: function (index) {
        this.props.onEditLevel(index);
    },

    onEditLevelFinish: function (index) {
        var level = $("#set-level-" + index).val();
        if (level) {
            level = parseInt(level);
            this.props.onEditLevelFinish(index, level);
        }
    },

    onEditStatus: function (index, status) {
        this.props.onEditStatus(index, status);
    },

    getPagination: function (p, max) {
        var start = p > 5 ? p - 5 : 1;
        var end = p + 5 > max ? max : p + 5;

        page_list = [];

        if (p > 1) {
            page_list.push({disable: false, index: 1, icon: "icon-fast-backward"});
            page_list.push({disable: false, index: p - 1, icon: "icon-backward"});
        } else {
            page_list.push({disable: true, icon: "icon-fast-backward"});
            page_list.push({disable: true, icon: "icon-backward"});
        }

        for (var i = start; i <= end; i++) {
            page_list.push({disable: false, index: i, title: i});
        }

        if (p < max) {
            page_list.push({disable: false, index: p + 1, icon: "icon-forward"});
            page_list.push({disable: false, index: max, icon: "icon-fast-forward"});
        } else {
            page_list.push({disable: true, icon: "icon-forward"});
            page_list.push({disable: true, icon: "icon-fast-forward"});
        }

        var page_group = page_list.map(function (btn, i) {
            if (btn.disable) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default disabled", type: "button"}, 
                    React.createElement("i", {className: btn.icon})
                ));
            } else if (btn['icon']) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default", type: "button", 
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    React.createElement("i", {className: btn.icon})
                ));
            } else if (btn.index == p) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-primary", type: "button", 
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    btn.title
                ));
            } else {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default", type: "button", 
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    btn.title
                ));
            }
        }.bind(this));

        return page_group;
    },

    render: function () {
        console.info(this.props.level_name);

        var requestNodes = this.props.downstream_list.map(function (downstream, i) {
                var setNode = null;
                var levelNode = null;
                var statusNode = null;

                if (!downstream.in_edit) {
                    levelNode = (React.createElement("td", null, downstream.plevel_n));
                    setNode = (React.createElement("a", {href: "#", onClick: this.onEditLevel.bind(this, i)}, "设价"));
                } else {
                    var optionNode = this.props.level_name.map(function (level, index) {
                        return (React.createElement("option", {value: index+1}, level));
                    }.bind(this));

                    levelNode = (
                        React.createElement("td", null, 
                            React.createElement("select", {id: "set-level-" + i}, 
                                optionNode
                            )
                        )
                    );

                    setNode = (React.createElement("a", {href: "#", onClick: this.onEditLevelFinish.bind(this, i)}, "确认"));
                }

                if (downstream.status == 'disabled') {
                    statusNode = (React.createElement("a", {href: "#", onClick: this.onEditStatus.bind(this, i, 'enabled')}, "开启"));
                } else {
                    statusNode = (React.createElement("a", {href: "#", onClick: this.onEditStatus.bind(this, i, 'disabled')}, "关闭"));
                }

                return (
                    React.createElement("tr", {key: downstream.id}, 
                        React.createElement("td", null, downstream.id), 
                        React.createElement("td", null, downstream.login), 
                        React.createElement("td", null, downstream.name), 
                        React.createElement("td", null, downstream.tsp_n), 
                        React.createElement("td", null), 
                        React.createElement("td", null, downstream.status_n), 
                        levelNode, 
                        React.createElement("td", null, 
                            React.createElement("a", {href: "javascript:void(0);", onClick: this.onSelectDownstream.bind(this, i)}, "详情"), " ", 
                            React.createElement("a", {href: "/query/data?user_id=" + downstream.id}, "订单"), " ", 
                            React.createElement("a", {href: "/admin/product_user?user_id=" + downstream.id}, "产品"), " ", 
                            React.createElement("a", {href: "/finance?user_id=" + downstream.id}, "财务")
                        ), 
                        React.createElement("td", null, 
                            setNode, " ", 
                            React.createElement("a", {href: "/admin/special?user_id=" + downstream.id}, "密价"), " ", 
                            statusNode
                        ), 
                        React.createElement("td", null, downstream.notes)
                    )
                );
            }.bind(this)
        );


        var page_group = this.getPagination(this.props.page, this.props.max);
        return (
            React.createElement("div", null, 
                React.createElement("table", {id: "downstream_result", className: "table table-hover"}, 
                    React.createElement("thead", null, 
                    React.createElement("tr", null, 
                        React.createElement("th", null, "编号"), 
                        React.createElement("th", null, "用户名"), 
                        React.createElement("th", null, "名称"), 
                        React.createElement("th", null, "开通时间"), 
                        React.createElement("th", null, "合作类型"), 
                        React.createElement("th", null, "状态"), 
                        React.createElement("th", null, "价格等级"), 
                        React.createElement("th", null, "查看"), 
                        React.createElement("th", null, "操作"), 
                        React.createElement("th", null, "其他备注")
                    )
                    ), 
                    React.createElement("tbody", null, 
                    requestNodes
                    )
                ), 

                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-sm-12"}, 
                        React.createElement("div", {className: "btn-row dataTables_filter"}, 
                            React.createElement("div", {className: "btn-group"}, 
                                page_group
                            )
                        )
                    )
                )
            )
        );
    }
});

var UserList = React.createClass({displayName: "UserList",
    render: function () {
        var requestNodes = this.props.user_list.map(function (user, i) {

            return (
                React.createElement("tr", {key: user.id}, 
                    React.createElement("td", null, user.id), 
                    React.createElement("td", null, user.login), 
                    React.createElement("td", null, user.name), 
                    React.createElement("td", null, user.user_id), 
                    React.createElement("td", null, user.downstream_name)
                )
            );
        }.bind(this));


        return (
            React.createElement("table", {id: "user_result", className: "table table-hover"}, 
                React.createElement("thead", null, 
                React.createElement("tr", null, 
                    React.createElement("th", {className: ""}, "登录ID"), 
                    React.createElement("th", {className: ""}, "登录名"), 
                    React.createElement("th", {className: ""}, "登录显示名称"), 
                    React.createElement("th", {className: ""}, "代理商编码"), 
                    React.createElement("th", {className: ""}, "代理商名称")
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

    onApproval: function () {
        var re_login = /^[0-9a-zA-Z]{4,12}/;

        name = $('#user-name').val();
        login = $('#user-login').val();
        template_id = $('#template_id').val();
        request_id = $('#request-id').val();
        plevel = $('#user-plevel').val();
        notes = $('#user-notes').val();
        qq = $('#user-qq').val();
        mobile = $('#user-mobile').val();

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
                    $('#addModal').modal('hide');
                }
                this.props.refresh();
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

        return (
            React.createElement("div", {className: "modal fade", id: "addModal", tabIndex: "-1", role: "dialog", "aria-labelledby": "addModalLabel", 
                 "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title", id: "addModalLabel"}, "请求：", this.props.request.id)
                        ), 
                        React.createElement("div", {className: "modal-body"}, 
                            React.createElement("div", {className: "form-group"}, 

                                React.createElement("label", {className: "col-md-2"}, "姓名"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-name", 
                                           value: this.props.request.name, 
                                           placeholder: "2-50位任意字符"}), 
                                    React.createElement("input", {id: "request-id", type: "hidden", value: this.props.request.id})
                                ), 
                                React.createElement("label", {className: "col-md-2"}, "登录名"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-login", 
                                           value: this.props.request.login, 
                                           placeholder: "4-12位数字或英文字母"})
                                ), 

                                React.createElement("label", {className: "col-md-2"}, "电话"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-mobile", 
                                           value: this.props.request.mobile})
                                ), 
                                React.createElement("label", {className: "col-md-2"}, "QQ"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-qq", 
                                           value: this.props.request.qq})
                                ), 
                                React.createElement("label", {className: "col-md-2"}, "需求"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-needs", 
                                           value: this.props.request.needs})
                                ), 
                                React.createElement("label", {className: "col-md-2"}, "备注"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "user-notes", 
                                           value: this.props.request.notes})
                                ), 

                                React.createElement("label", {className: "col-md-2"}, "价格等级"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {className: "m-bot15 form-control input-sm", id: "user-plevel"}, 
                                        levelNode
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2"}, "用户类型"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {id: "template_id", className: "m-bot15 form-control"}, 
                                        template_list
                                    )
                                )

                            )
                        ), 
                        React.createElement("div", {className: "modal-footer"}, 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消"), 
                            React.createElement("button", {type: "button", className: "btn btn-primary", onClick: this.onDismiss}, "不通过"), 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onApproval}, "通过")
                        )
                    )
                )
            )
        )
    }
});

var PublishBox = React.createClass({displayName: "PublishBox",
    componentDidMount: function () {
    },

    onPublish: function () {
        var request = {
            'message': $('#commit-message').val()
        };

        $.ajax({
            url: '/api/downstream/sync',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                alert(data.msg);
                $('#publishModal').modal('hide');
                //this.props.refresh();
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onDismiss: function () {
        $('#publishModal').modal('hide');
    },

    updateMessage: function (event) {
        this.props.updateMessage(event.target.value);
    },

    render: function () {

        return (
            React.createElement("div", {className: "modal", id: "publishModal", tabIndex: "-1", role: "dialog", "aria-labelledby": "publishModalLabel", 
                 "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title", id: "publishModalLabel"}, "提交")
                        ), 
                        React.createElement("div", {className: "modal-body"}, 
                            React.createElement("div", {className: "form-group"}, 

                                React.createElement("label", {className: "col-md-2"}, "备注"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("textarea", {className: "form-control input-sm", id: "commit-message", 
                                              value: this.props.message, onChange: this.updateMessage})
                                )
                            )
                        ), 
                        React.createElement("div", {className: "modal-footer"}, 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消"), 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.onPublish}, "应用")
                        )
                    )
                )
            )
        )
    }
});

var DetailBox = React.createClass({displayName: "DetailBox",

    render: function () {

        return (
            React.createElement("div", {className: "modal", id: "downstreamModal", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "downstreamModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title", id: "downstreamModalLabel"})
                        ), 
                        React.createElement("div", {className: "modal-body"}, 
                            React.createElement("div", {className: "form-group"}, 

                                React.createElement("label", {className: "col-md-2"}, "企业名称/姓名"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "detail-name", disabled: true})
                                ), 

                                React.createElement("label", {className: "col-md-2"}, "用户名"), 

                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "detail-login", disabled: true})
                                ), 

                                React.createElement("label", {className: "col-md-2"}, "手机号码"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "detail-mobile", disabled: true})
                                ), 

                                React.createElement("label", {className: "col-md-2"}, "QQ"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "detail-qq", disabled: true})
                                ), 

                                React.createElement("label", {className: "col-md-2"}, "合作类型"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "detail-op", disabled: true})
                                ), 

                                React.createElement("label", {className: "col-md-2"}, "备注"), 

                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "detail-notes", disabled: true})
                                )

                            )
                        ), 
                        React.createElement("div", {className: "modal-footer"}, 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "关闭")
                        )
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
