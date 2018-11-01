var AdminPanel = React.createClass({
    getInitialState: function () {
        return {
            user_list: [],
            role_list: []
        };
    },

    loadUserList: function () {
        $.ajax({
            url: '/api/user/list',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({user_list: data});
                $('#form_user_id').selectpicker('refresh');
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadRoleList: function () {
        $.ajax({
            url: '/api/user/role',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({role_list: data});
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onSyncUser: function () {
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

    onSyncPrice: function () {

        $.ajax({
            url: '/api/product/sync',
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

    onSyncUserPrice: function () {
        var user_id = $("#form_user_id").val();
        var request = {'user_id': user_id};
        alert(JSON.stringify(request));

        $.ajax({
            url: '/api/product/sync',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                alert(data.msg);
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function () {
        this.loadUserList();
        this.loadRoleList();
    },

    onAddOperator: function () {
        var req = {
            'user_id': $("#form_user_id").val(),
            'role': $("#form_role").val(),
            'login': $("#form_login").val(),
            'name': $("#form_name").val()
        };

        $.ajax({
            url: '/api/downstream/add_operator',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(req),
            success: function (resp) {
                if (resp.status == 'ok') {
                    alert(resp.msg + "；密码为：" + resp.password);
                } else if (resp.status == 'fail') {
                    alert(resp.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var userNode = this.state.user_list.map(function (user) {
            return (<option value={user.id} data-subtext={user.tags}>{user.id} - {user.name}</option>);
        });

        var roleNode = this.state.role_list.map(function (role) {
            return (<option value={role}>{role}</option>);
        });

        return (
            <section className="wrapper">
                <div className="row">
                    <div id="content" className="col-md-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-table"></i>用户选择</span>
                            </header>

                            <div className="panel-body">

                                <div className="col-sm-12 col-md-12">
                                    <select className="form-control  m-bot15" id="form_user_id"
                                            data-live-search="true">
                                        {userNode}
                                    </select>
                                </div>

                            </div>
                        </section>
                    </div>

                    <div id="content" className="col-md-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-table"></i>产品同步</span>
                            </header>

                            <div className="panel-body">
                                <div className="col-sm-4 col-md-2">
                                    <a className='btn btn-info' href='javascript:void(0);'
                                       onClick={this.onSyncUser}>同步用户信息</a>
                                </div>
                                <div className="col-sm-4 col-md-2">
                                    <a className='btn btn-info' href='javascript:void(0);'
                                       onClick={this.onSyncPrice}>同步价格 (全部)</a>
                                </div>
                                <div className="col-sm-4 col-md-2">
                                    <a className='btn btn-info' href='javascript:void(0);'
                                       onClick={this.onSyncUserPrice}>同步价格 (当前用户)</a>
                                </div>

                            </div>
                        </section>
                    </div>

                    <div id="content" className="col-md-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-table"></i>操作员添加</span>
                            </header>

                            <div className="panel-body">
                                <form className="form-horizontal">

                                    <label className="col-sm-4 col-md-1 control-label">权限</label>

                                    <div className="col-sm-4 col-md-3">
                                        <select className="form-control m-bot15" id="form_role">
                                            {roleNode}
                                        </select>
                                    </div>

                                    <label className="col-sm-4 col-md-1 control-label">登录名</label>

                                    <div className="col-sm-8 col-md-3">
                                        <input id="form_login" type="text" className="form-control input-sm m-bot15"
                                               maxLength="11"/>
                                    </div>

                                    <label className="col-sm-4 col-md-1 control-label m-bot15">姓名</label>

                                    <div className="col-sm-8 col-md-3">
                                        <input id="form_name" type="text" className="form-control input-sm m-bot15"
                                               maxLength="11"/>
                                    </div>

                                    <div className="col-sm-4 col-md-2 col-md-offset-1">
                                        <a className='btn btn-info' href='javascript:void(0);'
                                           onClick={this.onAddOperator}>添加</a>
                                    </div>
                                </form>
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        );
    }
});

React.render(
    <AdminPanel />
    ,
    document.getElementById('main-content')
);
