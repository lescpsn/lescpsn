var React = require('react');
var ReactDOM = require('react-dom');

var ProductPanel = React.createClass({

    getInitialState: function () {
        return {
            product_list: [],
            supply_list: [],
            filter: {},
            page: 1,
            max: 0,
            size: 25,
            area:''
        };
    },

    componentDidMount: function () {
        this.loadProductSupplyList(1, {});
    },

    loadProductSupplyList: function (page, filter) {
        var _filter = filter || this.state.filter;
        _filter['page'] = page || this.state.page;
        _filter['size'] = this.state.size;

        $.ajax({
            url: '/api/route/product/list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(_filter),
            success: function (resp) {
                this.setState({
                    product_list: resp.product,
                    supply_list: resp.supply,
                    page: resp.page,
                    max: resp.max,
                    filter: _filter,
                    area: _filter.area
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onEditPrice: function (index) {
        this.state.product_list[index]['in_edit'] = true;
        this.setState({
            'product_list': this.state.product_list
        });
    },

    onEditPriceFinish: function (index, product_id, value) {

        var req = {'product_id': product_id, 'supply_id': value};

        $.ajax({
            url: '/api/route/product/update',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(req),
            success: function (resp) {

                if (resp.status == 'ok') {
                    this.state.product_list[index].routing = resp.routing;
                    this.state.product_list[index].routing_n = resp.routing_n;
                    this.state.product_list[index]['in_edit'] = false;

                    this.setState({ 'product_list': this.state.product_list });
                } else {
                    alert(resp.msg);
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
                <QueryPanel onLoad={this.loadProductSupplyList}
                            area={this.state.area}
                />
                <ProductList
                    product_list={this.state.product_list}
                    supply_list={this.state.supply_list}
                    page={this.state.page}
                    max={this.state.max}
                    onEditPrice={this.onEditPrice}
                    onEditPriceFinish={this.onEditPriceFinish}
                    onLoadPage={this.loadProductSupplyList}/>
            </section>
        );
    }
});

var QueryPanel = React.createClass({
    doFilter: function () {
        var filter = {
            'id': $('#form_id').val(),
            'price': $('#form_price').val(),
            'name': $('#form_name').val(),
            'type': $('#form_type').val(),
            'carrier': $('#form_carrier').val(),
            'area': $('#form_area').attr("data-value"),
            'status': $('#form_status').val()
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
            $("#form_area").val($(e.target).text()).attr({ "data-value": area_code });
            $("#all_province").hide();
        });
    },

    // 输入框Enter绑定
    onInputKeyUp: function (e) {
        if (!e) var e = window.event;
        if (e.keyCode == 13) {
            this.onQuery();
            return false;
        }else{
            return true;
        }
    },

    render: function () {
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
                                        <input id="form_id" type="text" className="form-control input-sm"
                                               maxLength="11" onKeyDown={this.onInputKeyUp}/>
                                    </div>
                                    <label className="col-sm-4 col-md-1 control-label">产品名称</label>

                                    <div className="col-sm-8 col-md-2">
                                        <input id="form_name" type="text" className="form-control input-sm"
                                               maxLength="11" placeholder='(关键词)' onKeyDown={this.onInputKeyUp}/>
                                    </div>
                                    <label className="col-sm-4 col-md-1 control-label">类型</label>

                                    <div className="col-sm-8 col-md-2">
                                        <select id="form_type" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="data">流量</option>
                                            <option value="fee">话费</option>
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
                                               maxLength="11" onKeyDown={this.onInputKeyUp}/>
                                    </div>
                                    <label className="col-sm-4 col-md-1 control-label">充值地区</label>

                                    <div className="col-sm-8 col-md-2">
                                        <input id="form_area" type="text" className="form-control input-sm"
                                               readonly="readonly" defaultValue={this.props.area} data-value=""
                                               onClick={this.onShowProvinceList} onKeyDown={this.onInputKeyUp}/>
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
                                    <label className="col-sm-4 col-md-1 control-label">当前状态</label>

                                    <div className="col-sm-8 col-md-2">
                                        <select id="form_status" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="enabled">正常</option>
                                            <option value="disabled">维护</option>
                                        </select>
                                    </div>
                                </div>                                
                                <div className="col-md-offset-1 col-md-2">
                                    <a href="javascript:void(0);" className="btn btn-danger"
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

var ProductList = React.createClass({

    editPrice: function (index) {
        //alert(index);
        //this.props.product_list[index]['in_edit'] = true;
        this.props.onEditPrice(index);
    },

    editPriceFinish: function (index, product_id) {
        var value = $('#edit-' + product_id).val();
        this.props.onEditPriceFinish(index, product_id, value);
    },

       render: function () {
        var supplyNode = this.props.supply_list.map(function (supply, index) {
            return (<option value={supply.id}>{supply.name}</option>);
        });

        var productNode = this.props.product_list.map(function (product, index) {
                var priceNode = null;
                var editNode = null;

                // price edit mode
                if (product.in_edit) {
                    editNode = (
                        <a href="javascript:void(0);" className="alter_list"
                           onClick={this.editPriceFinish.bind(this, index, product.id)}>确定</a>);

                    priceNode = (
                        <td>
                            <select id={'edit-' + product.id} defaultValue={product.routing}>
                                {supplyNode}
                            </select>
                        </td>);
                } else {
                    editNode = (
                        <a href="javascript:void(0);" className="alter_list" onClick={this.editPrice.bind(this, index)}>切换</a>);

                    priceNode = (<td className="text-center price_color">{product.routing_n}</td>);
                }

                // status button

                return (
                    <tr>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{product.type_n}</td>
                        <td>{product.carrier_n}</td>
                        <td className="text-right">{product.price}</td>
                        <td>{product.area_n}</td>
                        <td>{product.use_area_n}</td>
                        <td>{product.status_n}</td>
                        {priceNode}
                        <td className="text-center">{editNode}</td>
                        <td>{product.tsp}</td>
                    </tr>
                )
            }.bind(this)
        );

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table" />产品列表</span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>产品编号</th>
                                    <th>产品名称</th>
                                    <th>类型</th>
                                    <th className="text-center">运营商</th>
                                    <th className="text-right">面值</th>
                                    <th className="text-center">充值地区</th>
                                    <th className="text-center">使用地区</th>
                                    <th className="text-center">当前状态</th>
                                    <th className="text-center">货源</th>
                                    <th className="text-center">操作</th>
                                    <th>上线日期</th>
                                </tr>
                                </thead>
                                <tbody>
                                {productNode}
                                </tbody>
                            </table>
                        </div>
                        <PageIndexGroup onQuery={this.props.onLoadPage}
                                        page={this.props.page}
                                        max={this.props.max} />
                    </section>
                </div>
            </div>
        );
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
    <ProductPanel />
    ,
    document.getElementById('main-content')
);
