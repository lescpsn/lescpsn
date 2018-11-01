var React = require('react');
var ReactDOM = require('react-dom');

var MODE = {
    'QUERY': 1,
    'SINGLE_EDIT': 2,
    'BATCH_EDIT': 3
}

var SpecialPanel = React.createClass({

    re_user: new RegExp("user_id=(\\d+)"),

    getInitialState: function() {
        return {
            special_list: [],
            user_list: [],
            current_user: null,
            selected_user: null,
            plevel: 0,
            available_product: [],
            level_name: ['1', '2', '3', '4', '5'],
            current_mode: MODE.QUERY,
            current_select: null,
            filter: {},
            page: 1,
            max: 0,
            size: 22,
            area: ''
        };
    },

    componentDidMount: function() {
        //this.loadProductList();
        this.loadUserList();
        //this.loadSpecialList();
    },

    loadUserList: function() {
        $.ajax({
            url: '/api/user/list',
            dataType: 'json',
            type: 'get',
            success: function(data) {
                this.setState({
                    user_list: data
                });
                $('#form_user_id').selectpicker('refresh');

                var result = this.re_user.exec(location.search);
                if (result) {
                    var user_id = result[1];
                    $('#form_user_id').selectpicker('val', user_id);
                    var filter = {
                        'user_id': user_id
                    };
                    this.loadSpecialList(1, filter);
                }

                this.changeUser(0);

            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadSpecialList: function(page, filter) {
        var _filter = filter || this.state.filter;
        _filter['page'] = page || this.state.page;
        _filter['size'] = this.state.size;

        $.ajax({
            url: '/api/special/list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(_filter),
            success: function(resp) {
                console.log(resp);
                if (resp) {
                    //alert(JSON.stringify(resp));
                    this.setState({
                        special_list: resp.list,
                        page: resp.page,
                        max: resp.max,
                        filter: _filter,
                        current_mode: MODE.QUERY,
                        area: _filter.area
                    });
                }

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
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    changeUser: function(index) {
        var user = this.state.user_list[index];

        $.ajax({
            url: '/api/special/product',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify({
                'user_id': user.id
            }),

            success: function(data) {
                var plevel = user.plevel;
                this.setState({
                    selected_user: user,
                    available_product: data
                });
                var product = data[0];
                $('#form_price1').val((parseFloat(product.value) / 10000).toFixed(3));
                $('#form_price2').val((parseFloat(product['p' + plevel]) / 10000).toFixed(3));
            }.bind(this),

            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onEditPrice: function(index) {
        this.setState({
            current_mode: MODE.SINGLE_EDIT,
            current_select: index
        })
    },

    onEditPriceFinish: function(index, value) {
        var p = this.state.special_list[index];
        var limit = p['value'];
        value = parseFloat(value) * 10000;

        if (value < limit && confirm('您设置的价格低于采购价格，是否继续？') == false) {
            return;
        }

        var data = JSON.stringify({
            'user_id': p['user_id'],
            'product_id': p['product_id'],
            'value': value
        });

        $.ajax({
            url: '/api/special/update',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function(data) {
                if (data) {
                    console.info(JSON.stringify(data));
                    //this.state.special_list[index] = data;
                    //this.state.special_list[index]['in_edit'] = false;
                    //this.setState({'special_list': this.state.special_list})
                    this.loadSpecialList();
                }

            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    onBatchSelect: function(index, if_select) {
        this.setState({
            current_mode: MODE.BATCH_EDIT
        });
    },

    onBatchFinish: function() {

    },

    toggleBatch: function() {
        if (this.state.current_mode == MODE.QUERY) {
            this.setState({
                current_mode: MODE.BATCH_EDIT,
                current_select: {}
            });
        } else if (this.state.current_mode == MODE.BATCH_EDIT) {
            this.setState({
                current_mode: MODE.QUERY
            });
            //this.loadSpecialList();
        }
    },

    toggleSelect: function(index) {
        var current_select = this.state.current_select;
        var key = index.toString();

        if (key in current_select) {
            delete current_select[key]
        } else {
            current_select[key] = true;
        }

        this.setState({
            current_select: current_select
        });
    },

    batchEditFinish: function(value) {
        var update_list = [];
        var special_list = this.state.special_list;

        for (var i = 0; i < special_list.length; i++) {
            var key = i.toString();
            if (key in this.state.current_select) {
                update_list.push({
                    'user_id': special_list[i].user_id,
                    'product_id': special_list[i].id,
                    'index': key
                });
            }
        }

        var req = {
            'discount': value,
            'list': update_list
        }

        $.ajax({
            url: '/api/special/batch_update',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(req),
            success: function(resp) {
                if (resp) {
                    if (resp.result) {
                        var special_list = this.state.special_list;
                        for (var key in resp.result) {
                            var index = parseInt(key);
                            special_list[index].value = resp.result[key];
                        }
                        this.setState({
                            special_list: special_list
                        });
                    } else {
                        alert(resp.msg);
                    }
                }
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    removeSpecial: function(index) {
        var special = this.state.special_list[index];
        var product_value = special.product_value;

        var req = {
            'user_id': special['user_id'],
            'product_id': special['product_id']
        };

        $.ajax({
            url: '/api/special/delete',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(req),
            success: function(resp) {
                if (resp.status && resp.status == 'ok') {
                    var special_list = this.state.special_list;
                    special_list[index].product_value = product_value;
                    special_list[index].value = null;
                    special_list[index].tsp_status = null;
                    special_list[index].notes = null;
                    this.setState({
                        'special_list': special_list
                    });
                }
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    addSpecial: function(index) {
        var special = this.state.special_list[index];
        var req = {
            'user_id': special.user_id,
            'product_id': special.id,
            'value': special.product_value
        };

        $.ajax({
            url: '/api/special/add',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(req),
            success: function(resp) {
                if (resp) {
                    if (resp.data) {
                        var special_list = this.state.special_list;
                        special_list[index] = resp.data;
                        this.setState({
                            special_list: special_list
                        });
                    } else {
                        alert(resp.msg);
                    }
                    //this.state.special_list.push(data);
                    //this.setState({special_list: this.state.special_list});
                    //$('#priceModal').modal('hide');
                }
            }.bind(this),
            error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function() {
        return (
            <section className="wrapper">
                <QueryPanel
                    user_list={this.state.user_list}
                    onLoad={this.loadSpecialList}
                    area = {this.state.area}
                />

                <SpecialList
                    onLoad={this.loadSpecialList}
                    page={this.state.page}
                    max={this.state.max}
                    special_list = {this.state.special_list}
                    toggleBatch = {this.toggleBatch}
                    onEditPrice = {this.onEditPrice}
                    onEditPriceFinish = {this.onEditPriceFinish}
                    removeSpecial = {this.removeSpecial}
                    addSpecial = {this.addSpecial}
                    batchSelect = {this.batchSelect}
                    toggleSelect = {this.toggleSelect}
                    batchEditFinish = {this.batchEditFinish}
                    mode = {this.state.current_mode}
                    current_select = {this.state.current_select}
                />
            </section>
        );
    }
});

var QueryPanel = React.createClass({
    doFilter: function() {
        var user_id = $('#form_user_id').val();
        var filter = {
            'product_id': $('#form_id').val(),
            'user_id': user_id,
            'status': $('#form_status').val(),
            'price': $('#form_price').val(),
            'name': $('#form_name').val(),
            'type': $('#form_type').val(),
            'carrier': $('#form_carrier').val(),
            'area': $('#form_area').attr("data-value"),
        };
        this.props.onLoad(1, filter);
    },

    //省份选择 start
    onShowProvinceList: function() {
        $("#all_province").show();
        this.onSelectProvince();
        $(document).bind("click", function(e) {
            var target = $(e.target);
            if (target.closest("#all_province").length == 0) {
                $("#all_province").hide();
            }
        });
    },

    onSelectProvince: function() {
        $("#all_province dd a").on('click', function(e) {
            var area_code = $(e.target).attr("data-value");
            $("#form_area").val($(e.target).text()).attr({
                "data-value": area_code
            });
            $("#all_province").hide();
        });
    },

    // 输入框Enter绑定
    onInputKeyUp: function (e) {
        if (!e) var e = window.event;
        if (e.keyCode == 13) {
            this.doFilter();
        }
    },

    // end
    render: function() {

        var userNode = this.props.user_list.map(function(user, index) {
            return (<option value={user.id} data-subtext={user.tags}>{user.id} - {user.name}</option>);
        });

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-search" />密价查询</span>
                        </header>
                        <div className="panel-body">
                            <form className="form-horizontal" method="get">
                                <div className="form-group form-border">
                                    <label className="col-sm-4 col-md-1 control-label">用户名</label>

                                    <div className="col-sm-8 col-md-2">
                                        <select className="form-control input-sm m-bot15" id="form_user_id"
                                                data-live-search="true">
                                            <option value=''>全部</option>
                                            {userNode}
                                        </select>
                                    </div>

                                    <label className="col-sm-4 col-md-1 control-label">产品编号</label>

                                    <div className="col-sm-8 col-md-2">
                                        <input id="form_id" type="text" className="form-control input-sm"
                                               maxLength="11" onKeyDown={this.onInputKeyUp}/>
                                    </div>
                                    <label className="col-sm-4 col-md-1 control-label">产品名称</label>

                                    <div className="col-sm-8 col-md-2">
                                        <input id="form_name" type="text" className="form-control input-sm"
                                               placeholder='(关键词)' onKeyDown={this.onInputKeyUp}/>
                                    </div>
                                    <label className="col-sm-4 col-md-1 control-label">类型</label>

                                    <div className="col-sm-8 col-md-2">
                                        <select id="form_type" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            <option value="data">流量</option>
                                            <option value="fee">话费</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
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
                                               maxLength="11" onKeyDown={this.onInputKeyUp}/>
                                    </div>
                                    <label className="col-sm-4 col-md-1 control-label">充值地区</label>

                                    <div className="col-sm-8 col-md-2">
                                        <input id="form_area" type="text" className="form-control input-sm"
                                               readonly="readonly" data-value="" defaultValue={this.props.area}
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
                                <div className="col-md-offset-1 col-md-5">
                                    <a href="javascript:void(0);" className="btn btn-danger" onClick={this.doFilter}>
                                        <i className="icon-search" /> 搜索</a>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

var SpecialList = React.createClass({
    toggleBatch: function() {
        this.props.toggleBatch();
    },

    editPrice: function(index) {
        this.props.onEditPrice(index);
    },

    editPriceFinish: function(e) {
        if (e.keyCode == 13) {
            this.props.onEditPriceFinish(this.props.current_select, e.target.value);
        }
    },

    removeSpecial: function(index) {
        this.props.removeSpecial(index);
    },

    addSpecial: function(index) {
        this.props.addSpecial(index);
    },

    batchSelect: function(index) {
        this.props.onBatchSelect(index);
    },

    toggleSelect: function(index) {
        this.props.toggleSelect(index);
    },

    batchEditFinish: function(e) {
        if (e.keyCode == 13) {
            this.props.batchEditFinish(e.target.value);
        }
    },

    percent: function(f) {
        var pc = f.toString();
        if (pc.indexOf(".") > 0 && pc.length > 6) {
            pc = f.toFixed(2);
        }
        return pc;
    },

    render: function() {
        //'ALL_USER': 1, /*can*/
        //'ONE_USER': 2,
        //'SINGLE_EDIT': 3,
        //'BATCH_EDIT': 4
        var priceTag = null;
        var batchClass = "btn btn-default";

        if (this.props.mode == MODE.BATCH_EDIT) {
            priceTag = (<th className="price-edit">
                <input type="input" onKeyDown={this.batchEditFinish} maxLength="6" placeholder="%"/></th>);
            batchClass = "btn btn-danger";
        } else {
            priceTag = (<th>密价</th>);
        }

        var specialNode = this.props.special_list.map(function(special, index) {
            var priceNode = null;
            var editNode = null;
            var trClass = "";

            // price edit mode
            if (this.props.mode == MODE.QUERY) {

                if (special.value) {
                    priceNode = (
                        <td onDoubleClick={this.editPrice.bind(this, index)} className="text-right">
                                {(special.value / 10000).toFixed(3)} ({this.percent(special.value / special.price / 100)}%)
                            </td>);

                    editNode = (
                        <div>
                                <a href="#" className="alter_list" onClick={this.removeSpecial.bind(this, index)}>删除</a>
                            </div>);

                } else {
                    priceNode = (<td className="text-right">
                            {(special.product_value / 10000).toFixed(3)}
                            ({this.percent(special.product_value / special.price / 100)}%)
                        </td>);
                    trClass = "user-no-special";

                    editNode = (
                        <div>
                                <a href="#" className="alter_list" onClick={this.addSpecial.bind(this, index)}>添加</a>
                            </div>);
                }
            } else if (this.props.mode == MODE.BATCH_EDIT) {
                editNode = (<div></div>);

                var cn = "text-right price-edit price_color";

                if (index.toString() in this.props.current_select) {
                    cn = cn + " batch-select";
                }

                if (special.value) {
                    priceNode = (<td className={cn} onClick={this.toggleSelect.bind(this, index)}>
                            {(special.value / 10000).toFixed(3)}
                            ({this.percent(special.value / special.price / 100)}%)
                        </td>);
                } else {
                    trClass = "user-no-special";

                    priceNode = (<td className={cn}>
                            {(special.product_value / 10000).toFixed(3)}
                            ({this.percent(special.product_value / special.price / 100)}%)
                        </td>);
                }

            } else if (this.props.mode == MODE.SINGLE_EDIT) {
                editNode = null;

                if (this.props.current_select == index) {
                    priceNode = (
                        <td className="text-right">
                                <input type='text'
                                       defaultValue={(special.value / 10000).toFixed(3)}
                                       onKeyDown={this.editPriceFinish}/>
                            </td>
                    );
                } else {
                    priceNode = (<td>{(special.value / 10000).toFixed(3)}</td>);
                }
            }

            return (
                <tr key={index} className={trClass}>
                        <td>{special.product_id}</td>
                        <td>{special.user_name}</td>
                        <td>{special.name}</td>
                        <td>{special.type_n}</td>
                        <td>{special.carrier_n}</td>
                        <td>{special.price}</td>
                        <td>{(special.product_value / 10000).toFixed(3)}</td>
                        <td>{special.area_n}</td>
                        <td>{special.use_area_n}</td>
                        <td>{special.status_n}</td>
                        {priceNode}
                        <td>{special.tsp_status}</td>
                        <td>{special.notes}</td>
                        <td>{editNode}</td>
                    </tr>
            )
        }.bind(this));

        return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="form-group text-right"></div>
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table" />密价列表 {this.props.mode}</span>
                            <span className="pull-right">
                                <a href="javascript:void(0);" className={batchClass}
                                   onClick={this.toggleBatch}><i className="icon-edit" /><span> 批量模式</span></a>
                            </span>
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
                                        <th>进货价格</th>
                                        <th>充值地区</th>
                                        <th>使用地区</th>
                                        <th>当前状态</th>
                                        {priceTag}
                                        <th>时间</th>
                                        <th>备注</th>
                                        <th>编辑</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {specialNode}
                                    </tbody>
                                </table>
                            </div>
                            <PageIndexGroup onQuery={this.props.onLoad}
                                            page={this.props.page}
                                            max={this.props.max} />
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

// 分页
var PageIndexGroup = React.createClass({
    onClickPage: function (page_index) {
        this.props.onQuery(page_index, undefined);
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
    <SpecialPanel />,
    document.getElementById('main-content')
);