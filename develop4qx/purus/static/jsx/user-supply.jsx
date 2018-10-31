var React = require('react');
var ReactDOM = require('react-dom');

var UserSupplyPanel = React.createClass({

    re_user: new RegExp("user_id=(\\d+)"),

    getInitialState: function () {
        return {
            user_list: [],
            available_product: [],
            supply_list: [],
            user_supply_list: [],
            selected_user: null,
            filter: {},
            page: 1,
            max: 0,
            size: 20,
            area:''
        };
    },

    componentDidMount: function () {
        this.loadUserList();
        this.loadSupplyList();
    },

    loadSupplyList: function () {

        $.ajax({
            url: '/api/route/supply/list',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({
                    supply_list: data.supply_list,
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    loadUserList: function () {
        $.ajax({
            url: '/api/user/list',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({user_list: data});
                $('#form_user_id').selectpicker('refresh');
                $('#form_user_index').selectpicker('refresh').on('change', function () {
                    var index = $('#form_user_index').val();
                    this.changeUser(index);
                }.bind(this));

                var result = this.re_user.exec(location.search);
                if (result) {
                    var user_id = result[1];
                    $('#form_user_id').selectpicker('val', user_id);
                    var filter = {'user_id': user_id};
                    this.loadUserSupplyList(filter, 1);
                }

                this.changeUser(0);

            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadUserSupplyList: function (page, filter) {
        var _filter = filter || this.state.filter;
        _filter['page'] = page || this.state.page;
        _filter['size'] = this.state.size;


        $.ajax({
            url: '/api/special/supply',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(_filter),
            success: function (resp) {
                if (resp) {
                    //alert(JSON.stringify(resp));
                    this.setState({
                        user_supply_list: resp.list,
                        page: resp.page,
                        max: resp.max,
                        filter: _filter,
                        area: _filter.area
                    });
                }
                console.log(this.state.user_supply_list);

                if (_filter.user_id) {
                    var index = 0;
                    for (var i = 0; i < this.state.user_list.length; i++) {
                        if (_filter.user_id == this.state.user_list[i]['id']) {
                            index = i;
                            break;
                        }
                    }
                    $('#form_add_user_id').val(index);
                    this.changeUser(index);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    changeUser: function (index) {
        //alert(index);
        var user = this.state.user_list[index];

        $.ajax({
            url: '/api/special/product',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify({'user_id': user.id}),

            success: function (data) {
                this.setState({
                    selected_user: user,
                    available_product: data
                });
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onEditUserSupply: function (index) {
        this.state.user_supply_list[index]['in_edit'] = true;
        this.setState({'user_supply_list': this.state.user_supply_list});
    },

    onEditUserSupplyFinish: function (index, value) {
        var p = this.state.user_supply_list[index];

        var data = JSON.stringify({
            'user_id': p['user_id'],
            'product_id': p['product_id'],
            'supply': value
        });

        $.ajax({
            url: '/api/special/update',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (data) {
                if (data) {
                    this.loadUserSupplyList();
                }

            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    removeUserSupply: function (index) {
        var p = this.state.user_supply_list[index];

        var data = JSON.stringify({
            'user_id': p['user_id'],
            'product_id': p['product_id'],
            mode: 'supply'
        });

        $.ajax({
            url: '/api/special/delete',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (data) {
                this.state.user_supply_list.splice(index, 1);
                //this.state.special_list[index]['in_edit'] = false;
                this.setState({'user_supply_list': this.state.user_supply_list});
                this.loadUserSupplyList();
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onAddUserSupply: function (user_index, product_id, supply_id) {

        var user = this.state.user_list[user_index];

        var data = JSON.stringify({
            'user_id': user.id,
            'product_id': product_id,
            'supply': supply_id
        });

        $.ajax({
            url: '/api/special/add',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (data) {
                if (data) {
                    this.loadUserSupplyList({user_id: user.id, page: 1});
                    //$('#priceModal').modal('hide');
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            <section className="wrapper">
                <QueryPanel
                    user_list={this.state.user_list}
                    onLoad={this.loadUserSupplyList}
                    area={this.state.area}
                />

                <UserSupplyList
                    user_supply_list={this.state.user_supply_list}
                    supply_list={this.state.supply_list}
                    onEditUserSupply={this.onEditUserSupply}
                    onEditUserSupplyFinish={this.onEditUserSupplyFinish}
                    removeUserSupply={this.removeUserSupply}
                    onLoadPage={this.loadUserSupplyList}
                    page={this.state.page}
                    max={this.state.max}
                    filter={this.state.filter}
                />

                <AddingBox user_list={this.state.user_list}
                           available_product={this.state.available_product}
                           supply_list={this.state.supply_list}
                           selected_user={this.state.selected_user}
                           changeUser={this.changeUser}
                           onAddUserSupply={this.onAddUserSupply}/>
            </section>
        );
    }
});

var QueryPanel = React.createClass({
    doFilter: function () {
        var filter = {
            'product_id': $('#form_product').val(),
            'user_id': $('#form_user_id').val(),
            'status': $('#form_status').val(),
            'carrier': $('#form_carrier').val(),
            'price': $('#form_price').val(),
            'area': $('#form_area').attr("data-value")
        };

        this.props.onLoad(1, filter);
    },

    onShowProvinceList: function () {
        $("#all_province").show();
        this.onSelectProvince();
        $(document).bind("click", function (e) {
            var target = $(e.target);
            if (target.closest("#all_province").length == 0) {
                $("#all_province").hide();
            }
        });
    },

    onSelectProvince: function () {
        $("#all_province dd a").on('click', function (e) {
            var area_code = $(e.target).attr("data-value");
            $("#form_area").val($(e.target).text()).attr({"data-value": area_code});
            $("#all_province").hide();
        });
    },

    render: function () {

        var userNode = this.props.user_list.map(function (user, index) {
            return (<option value={user.id} data-subtext={user.tags}>{user.id}-{user.name}</option>);
        });

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-search" />产品查询</span>
                        </header>
                        <div className="panel-body">
                            <form className="form-horizontal" method="get">
                                <div className="form-group form-border">
                                    <label className="col-sm-4 col-md-1 control-label">产品编号</label>

                                    <div className="col-sm-8 col-md-2">
                                        <input id="form_product" type="text" className="form-control input-sm m-bot15"
                                               maxlength="20"/>
                                    </div>
                                    <label className="col-sm-4 col-md-1 control-label">用户名</label>

                                    <div className="col-sm-8 col-md-2">
                                        <select className="form-control input-sm m-bot15" id="form_user_id"
                                                data-live-search="true">
                                            <option value=''>全部</option>
                                            {userNode}
                                        </select>
                                    </div>

                                    <label className="col-sm-4 col-md-1 control-label">当前状态</label>
                                    <div className="col-sm-8 col-md-2">
                                        <select id="form_status" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="enabled">正常</option>
                                            <option value="disabled">维护</option>
                                        </select>
                                    </div>

                                    <label className="col-sm-4 col-md-1 control-label">运营商</label>
                                    <div className="col-sm-8 col-md-2">
                                        <select id="form_carrier" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="1">中国移动</option>
                                            <option value="2">中国联通</option>
                                            <option value="3">中国电信</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="col-sm-4 col-md-1 control-label">面值</label>
                                    <div className="col-sm-8 col-md-2">
                                        <input id="form_price" type="text" className="form-control input-sm"
                                               maxLength="11"/>
                                    </div>

                                    <label className="col-sm-4 col-md-1 control-label">充值地区</label>
                                    <div className="col-sm-8 col-md-2">
                                        <input id="form_area" type="text" className="form-control input-sm"
                                               readonly="readonly" defaultValue={this.props.area} data-value=""
                                               onClick={this.onShowProvinceList}
                                        />
                                        <div id="all_province" className="province_list">
                                            <dl data-tpc="1" className="hot_province">
                                                <dt>常用:</dt>
                                                <dd><a href="javascript:void(0);" data-value="HA">河南</a></dd>
                                                <dd><a href="javascript:void(0);" data-value="GD">广东</a></dd>
                                                <dd><a href="javascript:void(0);" data-value="HE">河北</a></dd>
                                                <dd><a href="javascript:void(0);" data-value="JS">江苏</a></dd>
                                                <dd><a href="javascript:void(0);" data-value="SC">四川</a></dd>
                                                <dd><a href="javascript:void(0);" data-value="HN">湖南</a></dd>
                                            </dl>
                                            <div data-tpc="2" className="province_detail clearfix">
                                                <dl className="clearfix">
                                                    <dd><a href="javascript:void(0);" data-value="">全部</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="CN">全国</a></dd>
                                                </dl>
                                                <dl className="clearfix">
                                                    <dt>华北：</dt>
                                                    <dd><a href="javascript:void(0);" data-value="BJ">北京</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="TJ">天津</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="HE">河北</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="SX">山西</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="NM">内蒙古</a></dd>
                                                </dl>
                                                <dl className="clearfix">
                                                    <dt>华东：</dt>
                                                    <dd><a href="javascript:void(0);" data-value="SH">上海</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="JS">江苏</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="ZJ">浙江</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="AH">安徽</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="FJ">福建</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="SD">山东</a></dd>
                                                </dl>
                                                <dl className="clearfix">
                                                    <dt>华南：</dt>
                                                    <dd><a href="javascript:void(0);" data-value="GD">广东</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="GX">广西</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="HI">海南</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="HK">香港</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="TW">台湾</a></dd>
                                                </dl>
                                                <dl className="clearfix">
                                                    <dt>华中：</dt>
                                                    <dd><a href="javascript:void(0);" data-value="JX">江西</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="HA">河南</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="HB">湖北</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="HN">湖南</a></dd>
                                                </dl>
                                                <dl className="clearfix">
                                                    <dt>西南：</dt>
                                                    <dd><a href="javascript:void(0);" data-value="CQ">重庆</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="SC">四川</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="GZ">贵州</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="YN">云南</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="XZ">西藏</a></dd>
                                                </dl>
                                                <dl className="clearfix">
                                                    <dt>西北：</dt>
                                                    <dd><a href="javascript:void(0);" data-value="SN">陕西</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="GS">甘肃</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="QH">青海</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="NX">宁夏</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="XJ">新疆</a></dd>
                                                </dl>
                                                <dl className="clearfix">
                                                    <dt>东北：</dt>
                                                    <dd><a href="javascript:void(0);" data-value="LN">辽宁</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="JL">吉林</a></dd>
                                                    <dd><a href="javascript:void(0);" data-value="HL">黑龙江</a></dd>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-offset-1 col-md-2">
                                    <a id="act_query" href="javascript:void(0);" className="btn btn-danger"
                                       onClick={this.doFilter}>
                                        <i className="icon-search" /> 搜索
                                    </a>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

var UserSupplyList = React.createClass({
    onEditUserSupply: function (index) {
        this.props.onEditUserSupply(index);
    },

    onEditUserSupplyFinish: function (index) {
        var value = $('#edit-' + index).val();
        this.props.onEditUserSupplyFinish(index, value);
    },

    addUserSupply: function () {
        $('#priceModal').modal('show');
    },

    removeUserSupply: function (index) {
        this.props.removeUserSupply(index);
    },

    render: function () {
        var selectNode = this.props.supply_list.map(function (supply, index) {
            return (<option value={supply.id}>{supply.name}</option>);
        });

        var specialNode = this.props.user_supply_list.map(function (user_supply, index) {
                var supplyNode = null;
                var editNode = null;

                // price edit mode
                if (user_supply.in_edit) {
                    editNode = (
                        <a href="#" className="alter_list"
                           onClick={this.onEditUserSupplyFinish.bind(this, index)}>确定</a>);

                    supplyNode = (
                        <td>
                            <select id={'edit-'+index}>{selectNode}</select>
                        </td>);
                } else {
                    editNode = (
                        <div>
                            <a href="#" className="alter_list" onClick={this.onEditUserSupply.bind(this, index)}>切换</a>
                            |
                            <a href="#" className="alter_list" onClick={this.removeUserSupply.bind(this, index)}>删除</a>
                        </div>
                    );

                    supplyNode = (
                        <td className="text-center price_color">{user_supply.routing_n}</td>);
                }

                return (
                    <tr>
                        <td>{user_supply.product_id}</td>
                        <td>{user_supply.user_name}</td>
                        <td>{user_supply.name}</td>
                        <td>{user_supply.type_n}</td>
                        <td>{user_supply.carrier_n}</td>
                        <td>{user_supply.price}</td>
                        <td>{user_supply.area_n}</td>
                        <td>{user_supply.use_area_n}</td>
                        <td>{user_supply.status_n}</td>
                        {supplyNode}
                        <td>{editNode}</td>
                        <td>{user_supply.tsp}</td>
                    </tr>
                )
            }.bind(this)
        );

        return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="form-group text-right"></div>
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table" />用户-货源列表</span>
                            <span className="pull-right">
                                <a href="javascript:;"
                                   className="btn btn-danger"
                                   onClick={this.addUserSupply}>
                                    <i className="icon-edit" /><span> 新增</span></a></span>
                        </header>
                        <div className="panels">
                            <div className="panel-body table-responsive">
                                <table id="order_result" className="table table-striped table-hover">
                                    <thead>
                                    <tr>
                                        <th>产品编号</th>
                                        <th>用户名</th>
                                        <th>名称</th>
                                        <th>类型</th>
                                        <th>运营商</th>
                                        <th>面值</th>
                                        <th>充值地区</th>
                                        <th>使用地区</th>
                                        <th>当前状态</th>
                                        <th className="text-center">货源</th>
                                        <th>编辑</th>
                                        <th>时间</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {specialNode}
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

var AddingBox = React.createClass({

    changeUser: function (event) {
        var index = event.target.value;
        this.props.changeUser(index);
    },

    onAddUserSupply: function () {
        var user_index = $('#form_user_index').val();
        var product_id = $('#form_product_id').val();
        var supply_id = $('#form_supply_id').val();

        this.props.onAddUserSupply(user_index, product_id, supply_id);
    },

    render: function () {
        var userNode = this.props.user_list.map(function (user, index) {
            return (<option value={index} data-subtext={user.tags}>{user.id} - {user.name}</option>);
        });

        var productNode = this.props.available_product.map(function (product, index) {
            return (<option value={product.id}>{product.id} - {product.name}</option>);
        });

        var supplyNode = this.props.supply_list.map(function (supply, index) {
            return (<option value={supply.id}>{supply.name}</option>);
        });

        return (
            <div className="modal" id="priceModal" tabIndex="-1" role="dialog"
                 aria-labelledby="priceModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="priceModalLabel">添加</h4>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <input type='hidden' id="to_product"/>

                                <label className="col-md-2 control-label m-bot15">用户名称</label>

                                <div className="col-md-10 m-bot15">
                                    <select className="form-control input-sm" id="form_user_index"
                                            data-live-search="true">
                                        {userNode}
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">产品名称</label>

                                <div className="col-md-10">
                                    <select className="form-control input-sm m-bot15" id="form_product_id"
                                            onChange={this.onSelectProduct}>
                                        {productNode}
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">货源</label>

                                <div className="col-md-10">
                                    <select className="form-control input-sm m-bot15" id="form_supply_id">
                                        {supplyNode}
                                    </select>
                                </div>

                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger" onClick={this.onAddUserSupply}>添加</button>
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
    <UserSupplyPanel />
    ,
    document.getElementById('main-content')
);
