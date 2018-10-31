var React = require('react');
var ReactDOM = require('react-dom');
var InterfacePanel = React.createClass({
    getInitialState: function () {
        return {
            maintain_list: [],
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
                this.setState({maintain_list: data});
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    removeMaintain: function (key) {
        var request = JSON.stringify({'key': key});

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
        return (
            <section className="wrapper">
                <div className="row">
                    <MaintainList
                        maintain_list={this.state.maintain_list}
                        removeMaintain={this.removeMaintain}/>
                </div>
            </section>
        );
    }
});

var MaintainList = React.createClass({

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
                return (
                    <tr key={maintain.key}>
                        <td>{maintain.route_n}</td>
                        <td>{maintain.carrier_n}</td>
                        <td>{maintain.area_n}</td>
                        <td>{maintain.user_name}</td>
                        <td>{maintain.ttl_name}</td>
                        <td>{maintain.notes}</td>
                        <td><a href='#' onClick={this.onRemoveMaintain.bind(this, maintain)}>删除</a></td>
                    </tr>
                );
            }.bind(this)
        );

        return (
            <div className="col-md-12 col-lg-8">
                <div className="form-group text-right"></div>
                <section className="panel">
                    <header className="panel-heading row">
                        <a name='sec-maintain'>
                            <span className="pull-left"><i className="icon-table" />接口维护信息</span></a>
                        <span className="pull-right">
                            <a href="javascript:void(0);" className="btn btn-danger" onClick={this.onAddMaintain}>
                                <i className="icon-edit" /><span> 添加维护</span></a>
                        </span>
                    </header>

                    <div className="panels">
                        <div className="panel-body table-responsive">

                            <table id="downstream_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>接口</th>
                                    <th>运营商</th>
                                    <th>区域</th>
                                    <th>用户</th>
                                    <th>时效</th>
                                    <th>备注</th>
                                    <th>操作</th>
                                </tr>
                                </thead>
                                <tbody>
                                {maintainNodes}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        );
    }
});

ReactDOM.render(
    <InterfacePanel />
    ,
    document.getElementById('main-content')
);
