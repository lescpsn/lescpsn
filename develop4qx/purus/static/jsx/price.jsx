var React = require('react');
var ReactDOM = require('react-dom');

var MainPanel = React.createClass({
    getInitialState: function () {
        return {
            product_list: [],
            current_product: {},
            level_name: [],
            filter: {},
            page: 1,
            max: 1,
            size: 20,
            area:''
        };
    },

    componentDidMount: function () {
        this.loadProductList(1, null);
        this.loadLevelName();
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

    loadProductList: function (page, filter) {
        var _filter = filter || this.state.filter;
        _filter['page'] = page || this.state.page;
        _filter['size'] = this.state.size;

        $.ajax({
            url: '/api/product/list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(_filter),
            success: function (resp) {
                this.setState({
                    product_list: resp.list,
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

    onLoadPage: function (page) {
        this.loadProductList(page, null);
    },

    onSetStatus: function (index, status) {
        var p = this.state.product_list[index];
        var data = JSON.stringify({'id': p['id'], 'status': status});

        $.ajax({
            url: '/api/product/update',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (data) {
                this.state.product_list[index]['status'] = status;
                this.state.product_list[index]['status_n'] = data.status_n;
                this.setState({ 'product_list': this.state.product_list });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onEditFinish: function (index) {
        var product = this.state.product_list[index];
        var limit = product.value;
        var need_confirm = false;

        var d = {'id': product['id']};
        var p = [0, 0, 0, 0, 0];

        for (var i = 1; i <= 5; i++) {
            var k = '#edit-' + index + '-' + i;
            var v = $(k).val();
            if (!v || isNaN(v)) {
                alert("请输入有效数字");
                $(k).focus();
                return;
            }
            p[i - 1] = Math.round(parseFloat(v) * 10000);
            if (p[i - 1] < limit) {
                need_confirm = true;
            }
            d['p' + i] = p[i - 1];
        }

        if (need_confirm && confirm('您设置的价格低于采购价格，是否继续？') == false) {
            return;
        }

        var data = JSON.stringify(d);
        console.info(data);

        $.ajax({
            url: '/api/product/update',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (data) {
                for (var i = 1; i <= 5; i++) {
                    this.state.product_list[index]['p' + i] = p[i - 1];
                }
                this.state.product_list[index]['in_edit'] = false;
                this.setState({ 'product_list': this.state.product_list });
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onEditPrice: function (index) {
        this.state.product_list[index]['in_edit'] = true;
        this.setState({ 'product_list': this.state.product_list });
    },

    onEditLevel: function () {
        for (var i = 0; i < 5; i++) {
            $('#name-' + (i + 1)).val(this.state.level_name[i]);
        }
        $('#priceModal').modal('show');
    },

    onUpdateProduct: function (product) {
        var index = this.state.current;
        this.state.product_list[index] = product;
        this.setState({product_list: this.state.product_list});
    },

    onSetName: function (name_list) {
        this.setState({'level_name': name_list});
    },

    render: function () {
        return (
            <section className="wrapper">
                    <QueryPanel loadProductList={this.loadProductList}/>

                    <PriceListPanel loadProductList={this.loadProductList} product_list={this.state.product_list}
                                    page={this.state.page} max={this.state.max} onEditFinish={this.onEditFinish}
                                    onEditLevel={this.onEditLevel} onEditPrice={this.onEditPrice} level_name={this.state.level_name}/>

                    <PriceSettingBox level_name={this.state.level_name} setName={this.onSetName} />
            </section>
        );
    }
});

var QueryPanel = React.createClass({
    doFilter: function () {
        var filter = {
            'id': $('#form_id').val(),
            'name': $('#form_name').val(),
            'carrier': $('#form_carrier').val(),
            'area': $('#form_area').attr("data-value"),
            'price': $('#form_price').val()
        };

        this.props.loadProductList(1, filter);
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

    render: function(){
        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-table" />过滤</span>
                            </header>
                            <div className="panel-body">
                                <form className="form-horizontal" method="get">
                                    <div className="form-group form-border">
                                        <label className="col-sm-4 col-md-1 control-label">产品编号</label>

                                        <div className="col-sm-8 col-md-2">
                                            <input id="form_id" type="text" className="form-control input-sm"
                                                   maxLength="11"/>
                                        </div>

                                        <label className="col-sm-4 col-md-1 control-label">产品名称</label>

                                        <div className="col-sm-8 col-md-2">
                                            <input id="form_name" type="text" className="form-control input-sm"
                                                   maxLength="11" placeholder='(关键词)'/>
                                        </div>

                                        <label className="col-sm-4 col-md-1 control-label">充值地区</label>

                                        <div className="col-sm-8 col-md-2">
                                                <input id="form_area" type="text" className="form-control input-sm"
                                                       readonly="readonly" defaultValue={this.props.area} data-value=""
                                                       onClick={this.onShowProvinceList} />
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
                                                            <dt></dt>
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

                                        <label className="col-sm-4 col-md-1 control-label">运营商</label>

                                        <div className="col-sm-8 col-md-2">
                                            <select id="form_carrier" className="form-control m-bot15 input-sm">
                                                <option value="">全部</option>
                                                <option value="1">中国移动</option>
                                                <option value="2">中国联通</option>
                                                <option value="3">中国电信</option>
                                            </select>
                                        </div>

                                        <label className="col-sm-4 col-md-1 control-label">面值</label>

                                        <div className="col-sm-8 col-md-2">
                                            <input id="form_price" type="text" className="form-control input-sm"
                                                   maxLength="11" />
                                        </div>
                                    </div>
                                    <div className="col-md-offset-1 col-md-2">
                                        <a href="javascript:void(0);" className="btn btn-danger" onClick={this.doFilter}>
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

var PriceListPanel = React.createClass({
    onEditFinish: function (index){
        this.props.onEditFinish(index);
    },

    onEditPrice:function(index){
        this.props.onEditPrice(index);
    },

    onEditLevel:function(){
        this.props.onEditLevel();
    },

    render:function(){
        var priceNodes = this.props.product_list.map(function (product, index) {
            var levelNodeA = null;
            var levelNodeB = null;
            var levelNodeC = null;
            var levelNodeD = null;
            var levelNodeE = null;
            var editBtnNode = null;

            if (product.in_edit) {
                levelNodeA = (<td><input id={'edit-' + index+ '-1'} className='list_price'
                               type='text' size='5' defaultValue={(product.p1 / 10000).toFixed(3)}/></td>);
                levelNodeB = (<td><input id={'edit-' + index+ '-2'} className='list_price'
                               type='text' size='5' defaultValue={(product.p2 / 10000).toFixed(3)}/></td>);
                levelNodeC = (<td><input id={'edit-' + index+ '-3'} className='list_price'
                               type='text' size='5' defaultValue={(product.p3 / 10000).toFixed(3)}/></td>);
                levelNodeD = (<td><input id={'edit-' + index+ '-4'} className='list_price'
                               type='text' size='5' defaultValue={(product.p4 / 10000).toFixed(3)}/></td>);
                levelNodeE = (<td><input id={'edit-' + index+ '-5'} className='list_price'
                               type='text' size='5' defaultValue={(product.p5 / 10000).toFixed(3)}/></td>);
                editBtnNode = (<td>
                    <a href="#" onClick={this.onEditFinish.bind(this, index)} className="alter_list">确定</a>
                    </td>);
                $('tr[name='+index+']').focusin();
            } else {
                levelNodeA = (<td className="text-right"><span className="price_color">{(product.p1 / 10000).toFixed(3)}</span>
                    ({product.p1 / product.price / 100}%)</td>);
                levelNodeB = (<td className="text-right"><span className="price_color">{(product.p2 / 10000).toFixed(3)}</span>
                    ({product.p2 / product.price / 100}%)</td>);
                levelNodeC = (<td className="text-right"><span className="price_color">{(product.p3 / 10000).toFixed(3)}</span>
                    ({product.p3 / product.price / 100}%)</td>);
                levelNodeD = (<td className="text-right"><span className="price_color">{(product.p4 / 10000).toFixed(3)}</span>
                    ({product.p4 / product.price / 100}%)</td>);
                levelNodeE = (<td className="text-right"><span className="price_color">{(product.p5 / 10000).toFixed(3)}</span>
                    ({product.p5 / product.price / 100}%)</td>);
                editBtnNode = (<td className="text-center">
                    <a href="#" onClick={this.onEditPrice.bind(this, index)} className="alter_list">修改</a>
                    </td>);
            }
            return (
              <tr name={index}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.type_n}</td>
                <td>{product.carrier_n}</td>
                <td className="text-right">{product.price}</td>
                <td className="text-right">{(product.value / 10000).toFixed(3)}</td>
                <td>{product.area_n}</td>
                <td>{product.use_area_n}</td>
                {levelNodeA}
                {levelNodeB}
                {levelNodeC}
                {levelNodeD}
                {levelNodeE}
                {editBtnNode}
            </tr>
            );
        }.bind(this));

        return (
            <div className="row">
                <div className="col-lg-12">
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left"><i className="icon-table" />价格等级</span>
                        <span className="pull-right"><a href="javascript:;" className="btn btn-danger"
                                                        onClick={this.onEditLevel}><i className="icon-edit" />
                            <span> 价格模版管理</span>
                        </a></span>
                    </header>
                    <div className="panel-body table-responsive">
                        <table id="list_price" className="table table-striped table-hover">
                            <thead>
                            <tr>
                                <th>产品编号</th>
                                <th>产品名称</th>
                                <th>类型</th>
                                <th>运营商</th>
                                <th className="text-right">面值</th>
                                <th className="text-right">进货价格</th>
                                <th>充值地区</th>
                                <th>使用地区</th>
                                <th className="text-right">{this.props.level_name[0]}</th>
                                <th className="text-right">{this.props.level_name[1]}</th>
                                <th className="text-right">{this.props.level_name[2]}</th>
                                <th className="text-right">{this.props.level_name[3]}</th>
                                <th className="text-right">{this.props.level_name[4]}</th>
                                <th className="text-center">操作</th>
                            </tr>
                            </thead>
                            <tbody>
                                {priceNodes}
                            </tbody>
                        </table>
                    </div>
                    <PageIndexGroup onQuery={this.props.loadProductList}
                                    page={this.props.page}
                                    max={this.props.max} />
                </section>
            </div>
        </div>
        );
    }
});

var PriceSettingBox = React.createClass({
    onUpdate: function () {
        var level_name = this.props.level_name.slice();

        for (var i = 0; i < 5; i++) {
            var v = $('#name-' + (i + 1)).val();
            if (!v || v.length == 0) {
                alert('请输入名称');
                $('#name-' + (i + 1)).focus();
                return;
            }
            level_name[i] = v;
        }

        var request = {'level_name': level_name};

        console.info(JSON.stringify(request));

        $.ajax({
            url: '/api/product/set_level',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                $('#priceModal').modal('hide');
                this.props.setName(level_name);
            }.bind(this),
            error: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {

        return (
            <div className="modal" id="priceModal" tabIndex="-1" role="dialog"
                 aria-labelledby="priceModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="priceModalLabel" />
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <input type='hidden' id="to_product"/>

                                <label className="col-md-2">等级一</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="name-1"/>
                                </div>

                                <label className="col-md-2">等级二</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="name-2"/>
                                </div>

                                <label className="col-md-2">等级三</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="name-3"/>
                                </div>

                                <label className="col-md-2">等级四</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="name-4"/>
                                </div>

                                <label className="col-md-2">等级五</label>

                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="name-5"/>
                                </div>

                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-danger" onClick={this.onUpdate}>修改</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
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
    <MainPanel />
    ,
    document.getElementById('main-content')
);
