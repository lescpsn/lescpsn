var DownstreamPanel = React.createClass({
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
            <section className="panel">
                <header className="panel-heading row">
                    <span className="pull-left"><i className="icon-table"></i>客户审核</span>
                    <span className="pull-right">
                        <a href="javascript:void(0);" className="btn btn-danger" onClick={this.onNewRequest}>
                            <i className="icon-edit"></i><span> 添加客户</span></a>
                    </span>
                </header>

                <div className="panel-body">
                    <div className="table-responsive">

                        <RequestList
                            request_list={this.state.request_list}
                            onSelect={this.onSelect}/>

                        <RequestBox
                            request={this.state.current_request}
                            refresh={this.loadRequestList}
                            level_name={this.state.level_name}/>
                    </div>
                </div>
            </section>
        );
    }
});

var RequestList = React.createClass({
    onSelect: function (id) {
        this.props.onSelect(id);
    },

    render: function () {
        var requestNodes = this.props.request_list.map(function (request, i) {

            return (
                <tr key={request.id} onClick={this.onSelect.bind(this, request.id)}>
                    <td>{request.id}</td>
                    <td>{request.name}</td>
                    <td>{request.mobile}</td>
                    <td>{request.qq}</td>
                    <td>{request.needs}</td>
                    <td>{request.notes}</td>
                    <td>{request.login}</td>
                </tr>
            );
        }.bind(this));


        return (
            <table id="order_result" className="table table-striped table-hover">
                <thead>
                <tr>
                    <th>编号</th>
                    <th>名称</th>
                    <th>手机</th>
                    <th>QQ</th>
                    <th>需求</th>
                    <th>备注</th>
                    <th>登录名</th>
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
                <option key={t.id} value={t.id}>{t.name}</option>
            );
        });

        var levelNode = this.props.level_name.map(function (level, index) {
            return (<option value={index+1}>{level}</option>);
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
                <div className="modal-footer">
                    <button type="button" className="btn btn-info" onClick={this.onReject}>不通过</button>
                    <button type="button" className="btn btn-danger" onClick={this.onApproval}>通过</button>
                    <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                </div>
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
                <div className="modal-footer">
                    <button type="button" className="btn btn-danger" onClick={this.onApproval}>确定</button>
                    <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                </div>
            );
        }

        return (
            <div className="modal fade" id="addModal" tabIndex="-1" role="dialog" aria-labelledby="addModalLabel"
                 aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="addModalLabel">{title}</h4>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <label className="col-md-2 control-label">姓名</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="user-name"
                                           placeholder='2-50位任意字符'/>
                                    <input id="request-id" type="hidden"/>
                                </div>
                                <label className="col-md-2 control-label">登录名</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="user-login"
                                           placeholder='4-12位数字或英文字母'/>
                                </div>

                                <label className="col-md-2 control-label">电话</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="user-mobile"/>
                                </div>
                                <label className="col-md-2 control-label">QQ</label>

                                <div className="col-md-4">
                                    <input className="m-bot15 form-control input-sm" id="user-qq"/>
                                </div>
                                <label className="col-md-2 control-label">需求</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="user-needs"/>
                                </div>
                                <label className="col-md-2 control-label">备注</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="user-notes"/>
                                </div>

                                <label className="col-md-2 control-label">价格等级</label>

                                <div className="col-md-10">
                                    <select className="m-bot15 form-control input-sm" id="user-plevel">
                                        {levelNode}
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">用户类型</label>

                                <div className="col-md-10">
                                    <select id="template_id" className="m-bot15 form-control input-sm">
                                        {template_list}
                                    </select>
                                </div>
                            </div>
                        </div>
                        {actionBar}
                    </div>
                </div>
            </div>
        )
    }
});


React.render(
    <DownstreamPanel />
    ,
    document.getElementById('content')
);
