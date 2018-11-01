var React = require('react');
var ReactDOM = require('react-dom');

var SupplyPanel = React.createClass({
    getInitialState: function () {
        return {
            supply_list: [],
            interface_list: [],
            current_supply: {
                name: '',
                area: 'CN',
                adapt_flag: 'yes',
                restriction: '',
                interfaces: [],
                backup_map: {},
                status: 'enabled'
            },
            current_select: {index: -1, obj: -1}
        };
    },

    loadSupplyList: function () {

        $.ajax({
            url: '/api/route/supply/list',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({
                    supply_list: data.supply_list,
                    interface_list: data.interface_list
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    addInterface: function () {
        var current_supply = this.state.current_supply;
        current_supply.interfaces.push('');
        this.setState({current_supply: current_supply})
    },

    changeInterface: function (index, obj) {
        this.setState({current_select: {index: index, obj: obj}})
    },

    updateCurrentInterface: function (value) {
        var current_select = this.state.current_select;
        var current_supply = this.state.current_supply;
        var index = current_select.index;

        if (current_select.obj == 0) {
            current_supply.interfaces[index] = value;
            console.debug('UPDATE INTERFACE[' + index + ']=' + value);
        } else if (current_select.obj == 1) {
            var main_if = current_supply.interfaces[index];
            current_supply.backup_map[main_if] = value;
            console.debug('UPDATE BACKUP [' + main_if + ']=>' + value);
        }

        this.setState({
            current_supply: current_supply,
            current_select: {index: -1, obj: -1}
        });

    },

    removeInterface: function (index) {
        var current_supply = this.state.current_supply;
        current_supply.interfaces.splice(index, 1);
        this.setState({current_supply: current_supply});
    },

    updateName: function (name) {
        var current_supply = this.state.current_supply;
        current_supply.name = name;
        this.setState({current_supply: current_supply})
    },

    restrictionReg: /^\d+$/,

    updateRestriction: function (restriction) {
        if (!this.restrictionReg.test(restriction)) {
            alert('请输入有效的时间（分钟）');
            return;
        }

        var current_supply = this.state.current_supply;
        current_supply.restriction = restriction;
        this.setState({current_supply: current_supply})
    },

    updateArea: function (area) {
        var current_supply = this.state.current_supply;
        current_supply.area = area;
        this.setState({current_supply: current_supply})
    },

    updateFlag: function (flag) {
        var current_supply = this.state.current_supply;
        current_supply.adapt_flag = flag;
        this.setState({current_supply: current_supply})
    },

    selectCurrent: function (supply_id) {
        var current = null;

        for (var i = 0; i < this.state.supply_list.length; i++) {
            if (this.state.supply_list[i].id == supply_id) {
                current = this.state.supply_list[i];
                break;
            }
        }

        if (current) {
            console.debug(JSON.stringify(current));

            this.setState({
                current_supply: {
                    id: current.id,
                    name: current.name,
                    area: current.area,
                    restriction: current.restriction,
                    adapt_flag: current.adapt_flag,
                    interfaces: current.interfaces,
                    backup_map: current.backup_map
                }
            });
        }
    },

    createNewSupply: function () {
        this.setState({
            current_supply: {
                name: '',
                area: 'CN',
                restriction: '',
                interfaces: [],
                backup_map: {},
                status: 'enabled'
            }
        });
    },

    updateOrSaveSupply: function () {
        console.debug(JSON.stringify(this.state.current_supply));

        var supply = this.state.current_supply;
        if (supply.name == '') {
            alert('请输入名称');
            return;
        }
        if (supply.interfaces.length == 0) {
            alert('还没有选择接口');
            return;
        }

        for (var i = 0; i < supply.interfaces.length; i++) {
            if (supply.interfaces[i] == '') {
                alert('请选择第' + (i + 1) + '行的接口')
                return;
            }
        }

        $.ajax({
            url: '/api/route/supply/save_update',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(supply),

            success: function (data) {
                //alert(JSON.stringify(data));
                this.loadSupplyList();

                $('#detailBox').modal('hide');
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    deleteSupply: function (id) {
        if (!window.confirm("确定要删除这个接口吗?")) {
            return;
        }

        $.ajax({
            url: '/api/route/supply/delete',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify( {id: id}),

            success: function (data) {
                //alert(JSON.stringify(data));
                this.loadSupplyList();
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function () {
        this.loadSupplyList();
    },

    render: function () {

        return (
            <section className="wrapper">

                <SupplyList
                    supply_list={this.state.supply_list}
                    selectCurrent={this.selectCurrent}
                    createNewSupply={this.createNewSupply}
                    deleteSupply={this.deleteSupply}
                />

                <DetailBox
                    current_supply={this.state.current_supply}
                    current_select={this.state.current_select}
                    interface_list={this.state.interface_list}
                    addInterface={this.addInterface}
                    changeInterface={this.changeInterface}
                    updateCurrentInterface={this.updateCurrentInterface}
                    removeInterface={this.removeInterface}
                    updateName={this.updateName}
                    updateArea={this.updateArea}
                    updateFlag={this.updateFlag}
                    updateRestriction={this.updateRestriction}
                    updateOrSaveSupply={this.updateOrSaveSupply}
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
                                               maxlength="50"/>
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

var SupplyList = React.createClass({

    showUpdate: function (supply_id) {
        this.props.selectCurrent(supply_id);
        $('#detailBox').modal('show');
    },

    createNewSupply: function () {
        this.props.createNewSupply();
        $('#detailBox').modal('show');
    },

    deleteUpdate: function (id) {
        this.props.deleteSupply(id);
    },

    render: function () {

        var interfaceNodes = this.props.supply_list.map(function (supply, i) {
                return (
                    <tr key={supply.id}>
                        <td>{supply.id}</td>
                        <td>{supply.name}</td>
                        <td>{supply.area_n}</td>
                        <td>{supply.adapt_flag_n}</td>
                        <td></td>
                        <td>{supply.interfaces_n}</td>
                        <td>{supply.status_n}</td>
                        <td>
                            <a href='#'
                               onClick={this.showUpdate.bind(this, supply.id)}>修改</a> | <a href='#'
                                onClick={this.deleteUpdate.bind(this, supply.id)}>删除</a>
                        </td>
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
                            <span className="pull-left"><i className="icon-table" />接口列表</span>

                            <span className="pull-right">
                                <a href="javascript:void(0);" className="btn btn-primary mr15"
                                   onClick={this.createNewSupply}>
                                    <i className="icon-credit-card" /><span> 添加</span></a>
                            </span>
                        </header>

                        <div className="panels">
                            <div className="panel-body table-responsive">

                                <table id="downstream_result" className="table table-striped table-hover">
                                    <thead>
                                    <tr>
                                        <th>标识</th>
                                        <th>货源名称</th>
                                        <th>地区</th>
                                        <th>是否适配全国</th>
                                        <th>货源价格</th>
                                        <th>货源接口</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {interfaceNodes}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

var DetailBox = React.createClass({

    addInterface: function () {
        this.props.addInterface();
    },

    changeInterface: function (index, obj) {
        console.debug('CHANGE ' + index + '/' + obj);
        this.props.changeInterface(index, obj);
    },

    updateCurrentInterface: function (e) {
        console.debug('UPDATE ' + e.target.value);
        this.props.updateCurrentInterface(e.target.value);
    },

    removeInterface: function (index) {
        this.props.removeInterface(index);
    },

    updateName: function (event) {
        var name = event.target.value;
        this.props.updateName(name);
    },

    updateRestriction: function (event) {
        var restriction = event.target.value;
        this.props.updateRestriction(restriction);
    },

    updateFlag: function (event) {
        var flag = event.target.value;
        this.props.updateFlag(flag);
    },

    updateArea: function (event) {
        var area = event.target.value;
        this.props.updateArea(area);
    },

    updateOrSave: function () {
        this.props.updateOrSaveSupply();
    },

    render: function () {
        var interfaceMap = {};

        var interfaceOptionNode = this.props.interface_list.map(function (def, i) {
            interfaceMap[def.id] = def.name;
            return (<option value={def.id}>{def.name}</option>)
        });

        var interfaceNodes = this.props.current_supply.interfaces.map(function (inf, i) {
                var interfaceCell = null;
                if (this.props.current_select.index == i && this.props.current_select.obj == 0) {
                    interfaceCell = (
                        <td><select value={inf} style={{width: '100%'}}
                                    onChange={this.updateCurrentInterface}>
                            <option value=''>请选择...</option>
                            {interfaceOptionNode}
                        </select></td>);
                } else {
                    interfaceCell = (<td onClick={this.changeInterface.bind(this, i, 0)}>
                        <a href="javascript:void(0);">{interfaceMap[inf] || '请选择...'}</a></td>)
                }


                var backupCell = null;
                if (inf == '') {
                    backupCell = (<td></td>);
                } else {
                    var backup_if = "";
                    if (this.props.current_supply.backup_map && inf in this.props.current_supply.backup_map) {
                        var backup_if = this.props.current_supply.backup_map[inf]
                    }
                    if (this.props.current_select.index == i && this.props.current_select.obj == 1) {
                        backupCell = (
                            <td><select value={backup_if} style={{width: '100%'}}
                                        onChange={this.updateCurrentInterface}>
                                <option value="">--无后备接口--</option>
                                {interfaceOptionNode}
                            </select></td>);
                    } else {
                        backupCell = (<td onClick={this.changeInterface.bind(this, i, 1)}>
                            <a href="javascript:void(0);">{interfaceMap[backup_if] || '--无后备接口--'}</a></td>)
                    }
                }

                return (
                    <tr>
                        <td>{i + 1}</td>
                        {interfaceCell}
                        {backupCell}
                        <td><a className="btn btn-xs btn-danger" onClick={this.removeInterface.bind(this, i)}>删除</a></td>
                    </tr>
                );

            }.bind(this)
        );

        return (
            <div className="modal" id="detailBox" role="dialog"
                 aria-labelledby="detailBoxLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="downstreamModalLabel">添加货源</h4>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group">

                                <label className="col-md-2 control-label">货源名称</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="detail-name"
                                           value={this.props.current_supply.name}
                                           onChange={this.updateName}/>
                                </div>

                                <label className="col-md-2 control-label">区域</label>

                                <div className="col-md-4">
                                    <select className="form-control m-bot15 input-sm"
                                            value={this.props.current_supply.area}
                                            onChange={this.updateArea}>
                                        <option value='CN'>全国</option>
                                        <option value="BJ">北京</option>
                                        <option value="TJ">天津</option>
                                        <option value="HE">河北</option>
                                        <option value="SX">山西</option>
                                        <option value="NM">内蒙古</option>
                                        <option value="LN">辽宁</option>
                                        <option value="JL">吉林</option>
                                        <option value="HL">黑龙江</option>
                                        <option value="SH">上海</option>
                                        <option value="JS">江苏</option>
                                        <option value="ZJ">浙江</option>
                                        <option value="AH">安徽</option>
                                        <option value="FJ">福建</option>
                                        <option value="JX">江西</option>
                                        <option value="SD">山东</option>
                                        <option value="HA">河南</option>
                                        <option value="HB">湖北</option>
                                        <option value="HN">湖南</option>
                                        <option value="GD">广东</option>
                                        <option value="GX">广西</option>
                                        <option value="HI">海南</option>
                                        <option value="CQ">重庆</option>
                                        <option value="SC">四川</option>
                                        <option value="GZ">贵州</option>
                                        <option value="YN">云南</option>
                                        <option value="XZ">西藏</option>
                                        <option value="SN">陕西</option>
                                        <option value="GS">甘肃</option>
                                        <option value="QH">青海</option>
                                        <option value="NX">宁夏</option>
                                        <option value="XJ">新疆</option>
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">适配全国</label>

                                <div className="col-md-4">
                                    <select className="form-control m-bot15 input-sm"
                                            value={this.props.current_supply.adapt_flag}
                                            onChange={this.updateFlag}>
                                        <option value='yes'>是</option>
                                        <option value='no'>否</option>
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">限制</label>
                                <div className="col-md-4">
                                    <input className="form-control input-sm m-bot15" id="detail-rest"
                                           value={this.props.current_supply.restriction}
                                           onChange={this.updateRestriction}
                                           placeholder="小于此时间(分)，启用备用路由"/>
                                </div>

                                <div className="clearfix"></div>

                                <label className="col-md-2 control-label">接口</label>


                                <div className="col-md-2">
                                    <a href="javascript:void(0);" className="btn btn-primary btn-xs btn-block"
                                       onClick={this.addInterface}><i className="icon-plus" /> 添加</a>
                                </div>
                                <div className="col-md-10">
                                    <table className="table table-striped">
                                        <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>主接口</th>
                                            <th>后备接口</th>
                                            <th>操作</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {interfaceNodes}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                                <button type="button" className="btn btn-danger" onClick={this.updateOrSave}>
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

ReactDOM.render(
    <SupplyPanel />
    ,
    document.getElementById('main-content')
);
