//汇总模块
var DataPanel = React.createClass({
    getInitialState: function () {
        return {
            data_list: [],
            packets_name_list: [],
            product_cmcc:[],
            product_cucc:[],
            product_ct:[],
            filter: {},
            page: 1,
            max: 0,
            size: 20
        };
    },

    componentDidMount: function () {
        this.loadDataList({}, 1);
        this.get_packets_name_list();
        this.product_list();
        $('#form_qr_mobile').attr("checked", true);
        $('#form_qr_unicom').attr("checked", true);
        $('#form_qr_telecom').attr("checked", true);
        $('#end_time').datepicker({
            format: 'yyyy-mm-dd',
            startDate: '+1d',
            autoclose: true,
         })
        $("#product_check_cmcc").bind("click", function () {
            if($(this).is(":checked"))
            {
                $(".product_cont_cmcc").show();
            }else{
                $(".product_cont_cmcc").hide();
                $(".product_cont_cmcc option:first").prop("selected", 'selected');
            }
        });
        $("#product_check_cucc").bind("click", function () {
            if($(this).is(":checked"))
            {
                $(".product_cont_cucc").show();
            }else{
                $(".product_cont_cucc").hide();
                $(".product_cont_cucc option:first").prop("selected", 'selected');
            }
        });
        $("#product_check_ct").bind("click", function () {
            if($(this).is(":checked"))
            {
                $(".product_cont_ct").show();
            }else{
                $(".product_cont_ct").hide();
                $(".product_cont_ct option:first").prop("selected", 'selected');
            }
        });
    },

    loadDataList: function (filter, page) {
        if (!filter) {
            filter = this.state.filter;
        }
        filter['page'] = page || this.state.page;
        filter['size'] = this.state.size;

        request_data = {
            'request_type':'query',
            'argument_list':filter
        }
        $.ajax({
            url: '/api/data_card/manage/shipment_list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request_data),

            success: function (resp) {
                if (resp.status == 'success')
                {
                    this.setState({
                        data_list: resp.data.data_list,
                        product_cmcc:this.state.product_cmcc,
                        product_cucc:this.state.product_cucc,
                        product_ct:this.state.product_ct,
                        page: resp.data.page,
                        max: resp.data.max,
                        filter: filter
                    });
                }else{
                    alert("查询失败,"+resp.msg);
                }
                $("#loadingWindow").modal("hide");
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    get_packets_name_list: function () {
        var data = JSON.stringify({
            'request_type': 'argument_info',
            'argument_list':'packet_info_list'
        });

        $.ajax({
            url: '/api/data_card/manage/shipment_list',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    this.setState({packets_name_list: resp.data})
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    product_list:function(){
        $.ajax({
            url: '/api/get_product',
            dataType: 'json',
            type: 'get',
            success: function (resp) {
                if(resp.msg == "ok")
                {
                  this.setState({
                        data_list: this.state.data_list,
                        product_cmcc:resp.product["1"],
                        product_cucc:resp.product["2"],
                        product_ct:resp.product["3"],
                        page: this.state.page,
                        max: this.state.max,
                        filter: this.state.filter
                    });  
                }

            }.bind(this),
            fail: function (xhr, status, err) {
                alert('['+ status + ']' + err.toString())
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
        return false;
    },

    render: function () {
        return (
            <section className="wrapper">
                <QueryPanel loadDataList={this.loadDataList} packets_name_list={this.state.packets_name_list}/>
                <DataList data_list={this.state.data_list}
                          packets_name_list={this.state.packets_name_list}
                          product_cmcc={this.state.product_cmcc}
                          product_cucc={this.state.product_cucc}
                          product_ct={this.state.product_ct}
                          loadDataList={this.loadDataList}
                           page={this.state.page}
                           max={this.state.max}
                    />
            </section>
        );
    }
});

//查询模块
var QueryPanel = React.createClass({

    doFilter: function () {
        var filter = {
            'serial_num': $('#serial_num').val(),
            'is_select_cmcc': $('#form_qr_mobile').is(":checked"),
            'is_select_cucc': $('#form_qr_unicom').is(":checked"),
            'is_select_ct': $('#form_qr_telecom').is(":checked"),
            'packet_name': $('#query_packet_name').val(),
        };
        $("#loadingWindow").modal("show");
        this.props.loadDataList(filter);
    },

    render: function () {
        var packetnameNodes = this.props.packets_name_list.map(function (packet_name, index) {
            return (<option value={packet_name.name}>{packet_name.name}</option>);
        });
        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-search"></i>开卡查询</span>
                        </header>
                        <div className="panel-body">
                            <form className="form-horizontal" method="get">
                                <div className="form-group form-border">
                                    <label className="col-sm-2 col-md-1 control-label">批次号</label>
                                    <div className="col-sm-8 col-md-2">
                                        <input id="serial_num" type="text" className="form-control input-sm"/>
                                    </div>

                                    <div id="form_flow" className="col-sm-2 col-md-2 control-label">
                                        <label className="checkbox-inline"><input id="form_qr_mobile" type="checkbox"/> 移动</label>
                                        <label className="checkbox-inline"><input id="form_qr_unicom" type="checkbox"/> 联通</label>
                                        <label className="checkbox-inline"><input id="form_qr_telecom" type="checkbox"/> 电信</label>
                                    </div>

                                    <div className="col-sm-8 col-md-1">
                                        <select id="query_packet_name" className="form-control m-bot15 input-sm">
                                            <option value="">全部</option>
                                            {packetnameNodes}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-offset-1 col-md-5">
                                    <a href="javascript:void(0);" className="btn btn-danger" onClick={this.doFilter}>
                                        <i className="icon-search"></i>搜索</a>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        );
    }
});

//数据列表模块
var check_serial_num_list = [];
var checked_serial_num_list = [];
var DataList = React.createClass({

    onOpenCard: function(){
        $('#openCardWindow').modal('show');
    },

    onBindPage: function(){
        checked_serial_num_list = [];
        var serial_num_list = '';

            for(i in check_serial_num_list)
            {
                check_id = check_serial_num_list[i];

                if( $('#'+check_id).prop("checked"))
                {
                    serial_num_list += $('#'+check_id).val();
                    serial_num_list += ',';
                    checked_serial_num_list.push( $('#'+check_id).val() );
                }
            }
            $('#shipment_id_list').val(serial_num_list);
            if(serial_num_list.length<1)
            {
                alert("请勾选需要绑定的批次号");
            }
            else
            {
                $('#bindPageWindow').modal('show');
            }
            

    },

    onDataNodeOperation: function (serial_num, request_type) {
        this.setState({
             request_type: request_type,
             serial_num: serial_num
        });
        $('#confirmWindow').modal('show');
    },

    onLoadPage: function (page) {
        this.props.loadDataList(undefined, page);
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
                return (<button key={'p' + i} className="btn btn-default disabled" type="button">
                    <i className={btn.icon}></i>
                </button>);
            } else if (btn['icon']) {
                return (<button key={'p' + i} className="btn btn-default" type="button"
                                onClick={this.onLoadPage.bind(this, btn.index)}>
                    <i className={btn.icon}></i>
                </button>);
            } else if (btn.index == p) {
                return (<button key={'p' + i} className="btn btn-primary" type="button"
                                onClick={this.onLoadPage.bind(this, btn.index)}>
                    {btn.title}
                </button>);
            } else {
                return (<button key={'p' + i} className="btn btn-default" type="button"
                                onClick={this.onLoadPage.bind(this, btn.index)}>
                    {btn.title}
                </button>);
            }
        }.bind(this));

        return page_group;
    },

    getInitialState: function () {
        return {
             request_type: '',
             serial_num: ''
        };
    },

    render: function () {
        check_serial_num_list = [];
        var dataNode = this.props.data_list.map(function (data, index) {
                var actvNode = null;
                var voidNode = null;
                var tokenNode = null;
                var checkNode = null;
                var tokentimeNode = null;

                var check_id ="check_"+data.serial_num;
                if(data.status != '已作废')
                {
                    check_serial_num_list.push(check_id);
                }

                //  edit mode
                if (data.status == '已开卡' && !data.is_overdue)
                {
                    actvNode = (<a href="javascript:void(0);" className="btn btn-primary btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this, data.serial_num,'activate')}>激活</a>);
                    voidNode = (<a href="javascript:void(0);" className="btn btn-danger btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this, data.serial_num,'destroy')}>作废</a>);
                    tokenNode = (<a href="javascript:void(0);" className="btn btn-primary btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this, data.serial_num,'take')}>提卡</a>);
                    checkNode = (<input name="check_num" id={check_id} value={data.serial_num} type="checkbox"/>);
                }
                else if
                (data.status == '已激活' && !data.is_overdue) {
                    actvNode=(<span className="btn btn-sm color_99">激活</span>);
                    voidNode = (<a href="javascript:void(0);" className="btn btn-danger btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this, data.serial_num,'destroy')}>作废</a>);
                    tokenNode =  (<a href="javascript:void(0);" className="btn btn-primary btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this, data.serial_num,'take')}>提卡</a>);
                    checkNode = (<input name="check_num" id={check_id} value={data.serial_num} type="checkbox"/>);
                }
                else if
                (data.status == '已作废' && !data.is_overdue){
                    actvNode=(<span className="btn btn-sm color_99">激活</span>);
                    voidNode = (<a href="javascript:void(0);" className="btn btn-success btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this, data.serial_num,'recover')}>恢复</a>);
                    tokenNode=(<span className="btn btn-sm color_99">提卡</span>);
                    checkNode = (<input type="checkbox" disabled="true"/>);
                }
                else
                {
                    actvNode=(<span className="btn btn-sm color_99">激活</span>);
                    voidNode=(<span className="btn btn-sm color_99">作废</span>);
                    tokenNode=(<span className="btn btn-sm color_99">提卡</span>);
                    checkNode = (<input type="checkbox" disabled="true"/>);
                }

                var node_serial_num = null;
                if( data.take_count > 0 )
                {
                    link = "/data_card/card_search?serial_num=" + data.serial_num
                    node_serial_num = <a href={link}>{data.serial_num}</a>
                    tokentimeNode = (<span>{data.last_take_time}</span>);
                }
                else
                {
                    node_serial_num = <span>{data.serial_num}</span>
                    tokentimeNode = (<span>未提卡</span>);
                }

                return (
                    <tr>
                        <td>{checkNode}</td>
                        <td>{data.serial_name}</td>
                        <td>{node_serial_num}</td>
                        <td>{data.open_count}</td>
                        <td>{data.carrier_list}</td>
                        <td>{data.open_time}</td>
                        <td>{data.end_time}</td>
                        <td>{data.recharge_max_time}</td>
                        <td>{data.recharge_page_name}</td>
                        <td>{data.status}</td>
                        <td>
                            {actvNode}  {voidNode}
                        </td>
                        <td>{tokenNode} - {tokentimeNode}</td>
                    </tr>
                )
            }.bind(this)
        );

        var page_group = this.getPagination(this.props.page, this.props.max);

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>开卡列表</span>
                            <span className="pull-right">
                                <a href="javascript:;" className="btn btn-primary mr15" onClick={this.onOpenCard}><i className="icon-credit-card"></i><span> 开卡</span></a>
                                <a href="javascript:;" className="btn btn-danger" onClick={this.onBindPage}><i className="icon-legal"></i><span> 绑定页面</span></a>
                            </span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th></th>
                                    <th>开卡名称</th>
                                    <th>批次号</th>
                                    <th>开卡数量</th>
                                    <th>运营商</th>
                                    <th>开卡日期</th>
                                    <th>截至日期</th>
                                    <th>充值方案</th>
                                    <th>绑定页面</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                    <th>卡密提取 - 最近提取时间</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dataNode}
                                </tbody>
                            </table>
                        </div>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="btn-row dataTables_filter">
                                    <div id="page_group" className="btn-group">
                                        {page_group}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <OpenCardWindow
                        packets_name_list={this.props.packets_name_list}
                        loadDataList={this.props.loadDataList}
                        product_cmcc={this.props.product_cmcc}
                        product_cucc={this.props.product_cucc}
                        product_ct={this.props.product_ct}
                        loadDataList={this.props.loadDataList}/>
                    <BindPageWindow
                        loadDataList={this.props.loadDataList} />
                    <ConfirmWindow
                        request_type = {this.state.request_type}
                        serial_num = {this.state.serial_num}
                        loadDataList = {this.props.loadDataList}/>
                    <LoadingWindow />

                </div>
            </div>
        );
    }
});

//弹出的新建一批卡的窗口
var OpenCardWindow = React.createClass({

    onUpdate: function () {
        var serial_name = $('#serial_name').val();
            open_count = $('#open_count').val();
            packet_name = $('#packet_name').val();
            end_time = $('#end_time').val();
            recharge_max_time = $('#recharge_max_time').val();

        if (serial_name.length < 1) {
            alert('请输入开卡名称');
            return;
        }

        if (open_count.length < 1) {
            alert('请输入开卡数量');
            return;
        }

        var cont_lable = /^[1-9]$|^[1-9]\d$|^[1-9]\d\d$|^[1-9]\d\d\d$|^10000$/g;
        if (!cont_lable.test(open_count)) {
            alert('输入有误,1-10000的正整数');
            return;
        }

        if ($('#product_cmcc').val() < 0 && $('#product_cucc').val() < 0 && $('#product_ct').val() < 0  ) {
            alert('至少选择一种产品');
            return;
        }

        if (end_time.length < 1) {
            alert('请选择截止日期');
            return;
        }

        index = $('#product_cmcc').val()
        product_cmcc = null;
        if(index != -1)
        {
            product_cmcc = this.props.product_cmcc[index]
        }

        index = $('#product_cucc').val()
        product_cucc = null;
        if(index != -1)
        {
            product_cucc = this.props.product_cucc[index]
        }

        index = $('#product_ct').val()
        product_ct = null;
        if(index != -1)
        {
            product_ct = this.props.product_ct[index]
        }

        product_info = {
            'CMCC':product_cmcc,
            'CUCC':product_cucc,
            'CT':product_ct,
        }

        var data = JSON.stringify({
            'request_type': 'open',
            'argument_list': {
                'serial_name':serial_name,                //开卡名称
                'open_count': open_count,                 //开卡数量, 只能大于0
                'product_info': product_info,             //产品
                'end_time': end_time,                     //截止日期，至少一天
                'recharge_max_time': recharge_max_time,   //充值方案
            }
        });
        $.ajax({
            url: '/api/data_card/manage/shipment_list',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if (resp.status == 'success')
                {
                    alert("开卡成功");
                    this.props.loadDataList();
                    $('#openCardWindow').modal('hide');
                }
                else
                {
                    alert("开卡失败 - " + resp.msg);
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                alert('['+ status + ']' + err.toString())
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },


    render: function () {
        var product_cmccNode=this.props.product_cmcc.map( function (product, index){
            return(<option value={index}>{product.name} (采购价格：{product.value} 元 ，区域：{product.area_name})</option>);
        });

        var product_cuccNode=this.props.product_cucc.map( function (product, index){
            return(<option value={index}>{product.name} (采购价格：{product.value} 元 ，区域：{product.area_name})</option>);
        });

        var product_ctNode=this.props.product_ct.map( function (product, index){
            return(<option value={index}>{product.name} (采购价格：{product.value} 元 ，区域：{product.area_name})</option>);
        });


        return (
            <div className="modal" id="openCardWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="priceModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="priceModalLabel">开卡</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <label className="col-md-2 control-label">开卡名称</label>
                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="serial_name" placeholder="请输入开卡名称"/>
                                </div>

                                <label className="col-md-2 control-label">开卡数量</label>
                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="open_count" placeholder="1-10000的正整数"/>
                                </div>

                                <label className="col-md-2 control-label">选择产品</label>
                                <div className="col-md-10 m-bot15">
                                    <label className="checkbox-inline"><input id="product_check_cmcc" type="checkbox"/> 移动</label>
                                    <label className="checkbox-inline"><input id="product_check_cucc" type="checkbox"/> 联通</label>
                                    <label className="checkbox-inline"><input id="product_check_ct" type="checkbox"/> 电信</label>
                                </div>

                                <div className="product_cont">
                                    <div className="product_cont_cmcc product_hide">
                                        <label className="col-md-2 control-label">移动产品</label>
                                        <div className="col-md-10">
                                            <select className="m-bot15 form-control input-s"  name="demo1" id="product_cmcc">
                                                <option value="-1">请选择移动产品</option>
                                                {product_cmccNode}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="product_cont_cucc product_hide">
                                        <label className="col-md-2 control-label">联通产品</label>
                                        <div className="col-md-10">
                                            <select className="m-bot15 form-control input-s"  name="demo1" id="product_cucc">
                                                <option value="-1">请选择联通产品</option>
                                                {product_cuccNode}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="product_cont_ct product_hide">
                                        <label className="col-md-2 control-label">电信产品</label>
                                        <div className="col-md-10">
                                            <select className="m-bot15 form-control input-s"  name="demo1" id="product_ct">
                                                <option value="-1">请选择电信产品</option>
                                                {product_ctNode}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <label className="col-md-2 control-label">截止日期</label>
                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="end_time" readonly="readonly" placeholder="请选择截止日期"/>
                                </div>

                                <label className="col-md-2 control-label">充值方案</label>
                                <div className="col-md-10">
                                    <select className="form-control m-bot15 input-sm" id="recharge_max_time">
                                        <option value="单次卡">单次卡(只充1次)</option>
                                        <option value="两次卡">两次卡(可充2次，每月限只充1次)</option>
                                        <option value="半年卡">半年卡(可充6次，每月限充1次)</option>
                                        <option value="一年卡">一年卡(可充12次，每月限充1次)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onUpdate}>开卡</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

//弹出的绑定页面的窗口
var BindPageWindow = React.createClass({
    pageUpdate: function () {
        var  page_id = $('#recharge_page_list').val();

        var data = JSON.stringify({
            'request_type': 'set_page_bind_shipment_list',
            'argument_list':{
                'page_id':page_id,
                'shipment_list':checked_serial_num_list
            }
        });

        //alert(JSON.stringify(data));
        $.ajax({
            url: '/api/data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            data: data,
            //async: false,
            success: function (resp) {
                if(resp.status == 'success')
                {
                    alert('绑定成功');
                    this.props.loadDataList();
                    $('#bindPageWindow').modal('hide');
                }
                else
                {
                    alert('绑定失败 ' + resp.msg);
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadPageList: function () {
        var data = JSON.stringify({
            'request_type': 'get_all_page',
            'argument_list': null
        });
        $.ajax({
            url: '/api/data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success')
                {
                    this.setState({
                        recharge_page_list: resp.data,
                    })
                }
                else
                {
                    alert('查询失败 ' + resp.msg);
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {
            recharge_page_list: []
        };
    },

    componentDidMount: function () {
        this.loadPageList();
    },

    render: function () {
        var rechargePageNodes = this.state.recharge_page_list.map(function (page, index) {
             return (<option value={page.page_id}>{page.name}</option>);
        });

        return (
            <div className="modal" id="bindPageWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="priceModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="priceModalLabel">充值页面绑定</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <label className="col-md-2 control-label">批次号</label>
                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="shipment_id_list" disabled />
                                </div>

                                <label className="col-md-2 control-label">已有页面</label>
                                <div className="col-md-10">
                                    <select className="form-control m-bot15 input-sm" id="recharge_page_list">
                                    {rechargePageNodes}
                                    </select>
                                </div>

                                <label className="col-md-2">&nbsp;</label>
                                <div className="col-md-10">没有想要页面？<a href="/data_card/page_recharge">新建页面</a></div>
                            </div>

                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.pageUpdate}>确定</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

});

//弹出的操作确认窗口
var ConfirmWindow = React.createClass({

    onConfirm: function ()
    {
        serial_num = this.props.serial_num;
        request_type = this.props.request_type;
        var data = JSON.stringify({'serial_num':serial_num,'request_type':request_type});

        $.ajax({
            url: '/api/data_card/manage/shipment',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    if(request_type == 'take')
                    {
                        window.location.assign('/data_card_file/'+ resp.data);
                        alert("提卡成功");
                    } 
                    else if(request_type == "activate")
                    {
                        alert("激活成功");
                    }
                    else if(request_type == "destroy")
                    {
                        alert("作废成功");
                    }

                    this.props.loadDataList();
                    $("#confirmWindow").modal("hide");
                }
                else
                {
                    alert('操作失败 - ' + resp.msg);
                }
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function ()
    {
        var msg = null;
        var msg1 = '确定激活此批次卡?';
        var msg2 = '确定作废此批次卡？？？？？';
        var msg3 = '确定提取此批次卡?';
        var msg4 = '确定恢复此批次卡？？？？？';

        if( this.props.request_type == "activate")
        {
            msg= msg1;
        }
        else if (this.props.request_type == "destroy")
        {
            msg = msg2;
        }
        else if (this.props.request_type == "take")
        {
            msg = msg3;
        }
        else if (this.props.request_type == "recover")
        {
            msg = msg4;
        }

        return (
            <div className="modal" id="confirmWindow" tabIndex="-1" role="dialog"
                 aria-labelledby="myModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-min">
                    <div className="modal-content">
                        <div className="modal-header">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
                            <h5 className="modal-title" id="priceModalLabel"></h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body dialog_cont">
                                <div className="col-md-4 text-right"><h1 className="icon-ok-sign"></h1></div>
                                <div className="col-md-8"><h4>{msg}</h4><h5>批次号：{this.props.serial_num}</h5></div>
                            </div>

                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onConfirm}>确定</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

//等待窗口
var LoadingWindow = React.createClass({
    render: function (){
        return(
            <div className="modal" id="loadingWindow" backdrop="false">
                 <h1 className="icon-spinner icon-spin loading-icon"></h1>
            </div>
        )
    }
});

React.render(
    <DataPanel />
    ,
    document.getElementById('main-content')
);