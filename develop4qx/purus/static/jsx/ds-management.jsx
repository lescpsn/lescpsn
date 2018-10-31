var React = require('react');
var ReactDOM = require('react-dom');

var DownstreamPanel = React.createClass({
    getInitialState: function () {
        return {
            downstream_list: [],
            page: 0,
            max: 1,
            user_list: [],
            current_request: {},
            commit_message: '',
            level_name: [],
            search: ''
        };
    },

    loadDownstreamList: function (page, search) {
        var request = {
            search: search,
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
        this.loadLevelName();
        this.loadDownstreamList(1, "");
    },

    onSelectDownstream: function (index) {
        //alert(index);
        var current = this.state.downstream_list[index];

        $("#detail-id").val(current['id']);
        $("#detail-name").val(current['name']);
        $("#detail-login").val(current['login']);
        $("#detail-qq").val(current['qq']);
        $("#detail-mobile").val(current['mobile']);
        $("#detail-cooperation").val(current['cooperation']);
        $("#detail-notes").val(current['notes']);
        $("#detail-backurl").val(current['back_url']);
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
        if (data.status == 'enabled') {
            p['setNode'] = false;
        }
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

        return (
            <section className="wrapper">
                <QueryPanel onLoad={this.loadDownstreamList}/>

                <DownstreamList downstream_list={this.state.downstream_list}
                                page={this.state.page}
                                max={this.state.max}
                                onSelectDownstream={this.onSelectDownstream}
                                onLoadPage={this.loadDownstreamList}
                                onEditLevelFinish={this.onEditLevelFinish}
                                onEditLevel={this.onEditLevel}
                                onEditStatus={this.onEditStatus}
                                level_name={this.state.level_name}
                />

                <RequestBox
                    request={this.state.current_request}
                    refresh={this.loadRequestList}
                    level_name={this.state.level_name}
                />

                <PublishBox message={this.state.commit_message} updateMessage={this.updateMessage}/>

                <DetailBox
                    current={this.state.current_downstream}
                    onUpdate={this.onUpdate}
                />
            </section>
        );
    }
});

var QueryPanel = React.createClass({
    doFilter: function () {
        var search = $('#form_search').val();
        console.info(search);
        this.props.onLoad(1, search);
    },

    // 输入框Enter绑定
    onInputKeyUp: function (e) {
        if (!e) var e = window.event;
        if (e.keyCode == 13) {
            this.doFilter();
        }
    },

    render: function () {

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-search" />过滤</span>
                        </header>
                        <div className="panel-body">
                            <form className="form-horizontal" method="get">
                                <div className="form-group form-border">
                                    <label className="col-md-2 control-label">搜索条件</label>

                                    <div className="col-md-8">
                                        <input id="form_search" type="text" className="form-control input-sm m-bot15"
                                               maxlength="50" onKeyDown={this.onInputKeyUp}/>
                                    </div>

                                    <div className="col-md-2">
                                        <a id="act_query" href="javascript:void(0);" className="btn btn-danger"
                                           onClick={this.doFilter}>
                                            <i className="icon-search" /> 搜索</a>
                                    </div>

                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

var DownstreamList = React.createClass({
    onSelectDownstream: function (id) {
        this.props.onSelectDownstream(id);
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

    render: function () {
        console.info(this.props.level_name);

        var requestNodes = this.props.downstream_list.map(function (downstream, i) {
                var setNode = null;
                var levelNode = null;
                var statusNode = null;

                if (!downstream.in_edit) {
                    levelNode = (<td>{downstream.plevel_n}</td>);
                    setNode = (<a href="#" onClick={this.onEditLevel.bind(this, i)}>设价</a>);
                } else {
                    var optionNode = this.props.level_name.map(function (level, index) {
                        return (<option value={index+1}>{level}</option>);
                    }.bind(this));

                    levelNode = (
                        <td>
                            <select id={"set-level-" + i}>
                                {optionNode}
                            </select>
                        </td>
                    );

                    setNode = (<a href="#" onClick={this.onEditLevelFinish.bind(this, i)}>确认</a>);
                }

                if (downstream.status == 'disabled') {
                    statusNode = (<a href="#" onClick={this.onEditStatus.bind(this, i, 'enabled')}>开启</a>);

                } else {
                    statusNode = (<a href="#" onClick={this.onEditStatus.bind(this, i, 'disabled')}>关闭</a>);
                }

                return (
                    <tr key={downstream.id}>
                        <td>{downstream.id}</td>
                        <td>{downstream.login}</td>
                        <td>{downstream.name}</td>
                        <td>{downstream.tsp_n}</td>
                        <td></td>
                        <td>{downstream.status_n}</td>
                        {levelNode}
                        <td>
                            <a href="javascript:void(0);" onClick={this.onSelectDownstream.bind(this, i)}>详情</a>&nbsp;
                            <a href={"/query/data?user_id=" + downstream.id}>订单</a>&nbsp;
                            <a href={"/admin/product_user?user_id=" + downstream.id}>产品</a>&nbsp;
                            <a href={"/finance?user_id=" + downstream.id}>财务</a>
                        </td>
                        <td>
                            {setNode}&nbsp;
                            <a href={"/admin/special?user_id=" + downstream.id}>密价</a>&nbsp;
                            {statusNode}
                        </td>
                        <td>{downstream.notes}</td>
                    </tr>
                );
            }.bind(this)
        );

        return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="form-group text-right"></div>
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table" />客户列表</span>
                        </header>

                        <div className="panels">
                            <div className="panel-body table-responsive">

                                <table id="downstream_result" className="table table-striped table-hover">
                                    <thead>
                                    <tr>
                                        <th>编号</th>
                                        <th>用户名</th>
                                        <th>名称</th>
                                        <th>开通时间</th>
                                        <th>合作类型</th>
                                        <th>状态</th>
                                        <th>价格等级</th>
                                        <th>查看</th>
                                        <th>操作</th>
                                        <th>其他备注</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {requestNodes}
                                    </tbody>
                                </table>
                            </div>
                            <PageIndexGroup onQuery={this.props.onLoadPage}
                                            page={this.props.page}
                                            max={this.props.max} />
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

var UserList = React.createClass({
    render: function () {
        var requestNodes = this.props.user_list.map(function (user, i) {

            return (
                <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.login}</td>
                    <td>{user.name}</td>
                    <td>{user.user_id}</td>
                    <td>{user.downstream_name}</td>
                </tr>
            );
        }.bind(this));


        return (
            <table id="user_result" className="table table-striped table-hover">
                <thead>
                <tr>
                    <th className="">登录ID</th>
                    <th className="">登录名</th>
                    <th className="">登录显示名称</th>
                    <th className="">代理商编码</th>
                    <th className="">代理商名称</th>
                </tr>
                </thead>
                <tbody>
                {requestNodes}
                </tbody>
            </table>
        );
    }
});

var RequestBox = React.createClass({
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
                <option key={t.id} value={t.id}>{t.name}</option>
            );
        });

        var levelNode = this.props.level_name.map(function (level, index) {
            return (<option value={index+1}>{level}</option>);
        });

        return (
            <div className="modal fade" id="addModal" tabIndex="-1" role="dialog" aria-labelledby="addModalLabel"
                 aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="addModalLabel">请求：{this.props.request.id}</h4>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">

                                <label className="col-md-2">姓名</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="user-name"
                                           value={this.props.request.name}
                                           placeholder='2-50位任意字符'/>
                                    <input id="request-id" type="hidden" value={this.props.request.id}/>
                                </div>
                                <label className="col-md-2">登录名</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="user-login"
                                           value={this.props.request.login}
                                           placeholder='4-12位数字或英文字母'/>
                                </div>

                                <label className="col-md-2">电话</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="user-mobile"
                                           value={this.props.request.mobile}/>
                                </div>
                                <label className="col-md-2">QQ</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="user-qq"
                                           value={this.props.request.qq}/>
                                </div>
                                <label className="col-md-2">需求</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="user-needs"
                                           value={this.props.request.needs}/>
                                </div>
                                <label className="col-md-2">备注</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="user-notes"
                                           value={this.props.request.notes}/>
                                </div>

                                <label className="col-md-2">价格等级</label>

                                <div className="col-md-10">
                                    <select className="m-bot15 form-control input-sm" id="user-plevel">
                                        {levelNode}
                                    </select>
                                </div>

                                <label className="col-md-2">用户类型</label>

                                <div className="col-md-10">
                                    <select id="template_id" className="m-bot15 form-control">
                                        {template_list}
                                    </select>
                                </div>

                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                            <button type="button" className="btn btn-primary" onClick={this.onDismiss}>不通过</button>
                            <button type="button" className="btn btn-danger" onClick={this.onApproval}>通过</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

var PublishBox = React.createClass({
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
            <div className="modal" id="publishModal" tabIndex="-1" role="dialog" aria-labelledby="publishModalLabel"
                 aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="publishModalLabel">提交</h4>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">

                                <label className="col-md-2">备注</label>

                                <div className="col-md-10">
                                    <textarea className="form-control input-sm" id="commit-message"
                                              value={this.props.message} onChange={this.updateMessage}/>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                            <button type="button" className="btn btn-danger" onClick={this.onPublish}>应用</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

var DetailBox = React.createClass({

    resetPassword: function () {
        if (!confirm('您确定需要重置该用户的密码么？')) {
            return;
        }
        var user_id = $('#detail-id').val();
        var request = JSON.stringify({'user_id': user_id});

        $.ajax({
            url: '/api/downstream/reset_pwd',
            dataType: 'json',
            type: 'post',
            data: request,
            success: function (data) {
                alert(data.msg);
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    editBackURL: function () {
        var user_id = $('#detail-id').val();
        var back_url = $("#detail-backurl").val();

        if (!confirm('您确定要修改回调地址吗？')) {
            return;
        }

        var request = JSON.stringify({
            'id': user_id,
            'back_url': back_url
        });

        console.log(JSON.stringify(request));
        $.ajax({
            url: '/api/downstream/update',
            dataType: 'json',
            type: 'post',
            data: request,
            success: function (data) {
                alert(data.msg);
                if (data.status == 'ok') {
                    alter("回调地址修改成功");
                    //$('#downstreamModal').modal('hide');
                    this.props.refresh();
                }
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {

        return (
            <div className="modal" id="downstreamModal" tabIndex="-1" role="dialog"
                 aria-labelledby="downstreamModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="downstreamModalLabel"></h4>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">

                                <label className="col-md-2">企业名称/姓名</label>

                                <div className="col-md-10">
                                    <input type="hidden" id="detail-id"/>
                                    <input className="m-bot15 form-control input-sm" id="detail-name" disabled/>
                                </div>

                                <label className="col-md-2">用户名</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="detail-login" disabled/>
                                </div>

                                <label className="col-md-2">手机号码</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="detail-mobile" disabled/>
                                </div>

                                <label className="col-md-2">QQ</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="detail-qq" disabled/>
                                </div>

                                <label className="col-md-2">合作类型</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="detail-op" disabled/>
                                </div>

                                <label className="col-md-2">备注</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="detail-notes" disabled/>
                                </div>

                                <label className="col-md-2">回调地址</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="detail-backurl"/>
                                </div>

                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger" onClick={this.editBackURL}>修改回调地址</button>
                            <button type="button" className="btn btn-danger" onClick={this.resetPassword}>密码重置</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">关闭</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

// 分页
var PageIndexGroup = React.createClass({
    onClickPage: function (page_index) {
        this.props.onQuery(page_index,undefined);
    },

    render: function () {
        if (this.props.page == null || this.props.max == null) {
            return null;
        }
        var page_index = this.props.page;
        var max_page = this.props.max;

        var page_start = page_index - 4 > 0 ? page_index - 4 : 1;
        var page_end = page_index + 4 > max_page ? max_page : page_index + 4;

        var page_index_list = [];
        for (var i = page_start; i <= page_end; ++i) {
            page_index_list.push(i);
        }

        var pageIndexBtnBodes = page_index_list.map(function (i, index) {
            var disabled = null;
            if (i == this.props.page) {
                disabled = "disabled";
            }
            return (
                    <button className="btn btn-default" disabled={disabled} type="button" onClick={this.onClickPage.bind(this,i)}>
                        {i}
                    </button>
            );
        }.bind(this));

        var fastBackwardDisabled = null;
        var backwardDisabled = null;
        if (page_index <= 1) {
            fastBackwardDisabled = "disabled";
            backwardDisabled = "disabled";
        }

        var forwardDisabled = null;
        var fastForwardDisabled = null;
        if (page_index >= max_page) {
            forwardDisabled = "disabled";
            fastForwardDisabled = "disabled";
        }

        return (
            <div className="row">
                <div className="col-sm-12">
                    <div className="btn-row dataTables_filter">
                        <div id="page_group" className="btn-group">
                            <button className="btn btn-default" type="button" disabled={fastBackwardDisabled} onClick={this.onClickPage.bind(this,1)}>
                                <i className="icon-fast-backward" />
                            </button>
                            <button className="btn btn-default" type="button" disabled={backwardDisabled} onClick={this.onClickPage.bind(this,page_index-1)}>
                                <i className="icon-backward" />
                            </button>
                            {pageIndexBtnBodes}
                            <button className="btn btn-default" type="button" disabled={forwardDisabled} onClick={this.onClickPage.bind(this,page_index+1)}>
                                <i className="icon-forward" />
                            </button>
                            <button className="btn btn-default" type="button" disabled={fastForwardDisabled} onClick={this.onClickPage.bind(this,max_page)}>
                                <i className="icon-fast-forward" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

ReactDOM.render(
    <DownstreamPanel />
    ,
    document.getElementById('main-content')
);
