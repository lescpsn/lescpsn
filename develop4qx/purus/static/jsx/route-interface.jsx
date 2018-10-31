var React = require('react');
var ReactDOM = require('react-dom');


var InterfacePanel = React.createClass({
    getInitialState: function () {
        return {
            interface_list: [],
            current_interface: '',
            maintain_list: [],
            datapool_interface_list: [],
            datapool_list: [],
            product_list: [],
            user_list: [],
            price_list: [],
            price_page: 0,
            price_max: 1,
            sort_by: '',
            desc: false,
            limit_zero: true,
            carrier: null
        };
    },

    componentDidMount: function () {
        this.loadInterfaceList('score', true, true);
        this.loadMaintainList();
        this.loadUserList();
        this.loadDataPoolList();
        this.loadDatapoolInterfaceList();
        this.loadProductList()
    },

    onSort: function (column) {
        var desc = false;
        if (this.state.sort_by == column) {
            desc = !this.state.desc;
        }

        this.loadInterfaceList(column, desc, this.state.limit_zero);
    },

    onToggleZero: function () {
        var limit_zero = !this.state.limit_zero;
        this.loadInterfaceList(this.state.sort_by, this.state.desc, limit_zero)
    },
    
    loadInterfaceList: function (sort_by, desc, limit_zero) {

        var request = JSON.stringify({
            sort_by: sort_by,
            desc: desc,
            limit: limit_zero ? 1 : 0
        });

        console.debug(request);

        $.ajax({
            url: '/api/route/interface/list',
            dataType: 'json',
            type: 'post',
            data: request,
            success: function (data) {
                this.setState({
                    interface_list: data.list,
                    sort_by: sort_by,
                    desc: desc,
                    limit_zero: limit_zero
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },


    loadProductList: function () {
        $.ajax({
            url: '/api/product/list',
            dataType: 'json',
            type: 'get',
            success: function (product_list) {
                this.setState({
                    product_list: product_list,

                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },
    
    loadMaintainList: function () {

        $.ajax({
            url: '/api/route/maintain/list',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                console.log("*********************t201:",data)
                this.setState({maintain_list: data});
            }.bind(this),
            error: function (xhr, status, err) {
                console.log("*********************t202:")
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    loadDataPoolList: function () {
        $.ajax({
            url: '/api/route/pool/list',
            dataType: 'json',
            type: 'get',            
            success: function (resp_data) {
                console.log("*********************t101:",resp_data.data)
                this.setState({datapool_list: resp_data.data});
            }.bind(this),
            error: function (xhr, status, err) {
                console.log("*********************t100:")
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    loadDatapoolInterfaceList: function () {
        $.ajax({
            url: '/api/route/pool/interface',
            dataType: 'json',
            type: 'get',
            success: function (resp_data) {
                this.setState({datapool_interface_list: resp_data.data});
                //$('#form_user_id').selectpicker('refresh');
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
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
                //$('#form_user_id').selectpicker('refresh');
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    removeProduct: function (key) {
        var request = JSON.stringify({'id': key});
        $.ajax({
            
            url:'/api/route/interface/price/remove',
            dataType: 'json',
            type: 'post',
            data: request,
            success: function (data) {
                alert(data.msg);
                this.loadPriceList(this.state.current_interface, '');
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

    removeDataPool: function (key) {
        var request = JSON.stringify({'key': key});
        $.ajax({
            url: '/api/route/pool/remove',
            dataType: 'json',
            type: 'post',
            data: request,
            success: function (data) {
//                alert(data.msg);
                this.loadDataPoolList();
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    addMaintain: function (request) {
        $.ajax({
            url: '/api/route/maintain/add',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                alert(data.msg);
                this.loadMaintainList();
                $("#addModal").modal("hide");
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    addDatapool: function (request) {
        $.ajax({
            url: '/api/route/pool/add',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
//                alert(data.msg);
                this.loadDataPoolList();
                $("#addDataPool").modal("hide");
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    addProduct: function (request) {
        //current_interface
        $.ajax({
            
            url:'/api/route/interface/price/add',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(request),
            success: function (data) {
                //console.log("******************************add product successful",this.state.current_interface)
                //alert(data.msg);
                this.loadPriceList(this.state.current_interface, '');
                $("#addProduct").modal("hide");
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    onChangeCarrier: function (carrier) {
        console.debug('CHANGE CARRIER ' + carrier);
        this.loadPriceList(this.state.current_interface, carrier);
    },

    loadPriceList: function (interface_id, carrier) {
        var req = JSON.stringify({
            'interface_id': interface_id,
            'carrier': carrier
        });

        $.ajax({
            url: '/api/route/interface/price',
            dataType: 'json',
            type: 'post',
            data: req,
            success: function (data) {
                this.setState({
                    price_list: data.list,
                    current_interface: interface_id,
                    carrier: carrier
                });
                
                $("#add_product").removeClass('disabled');
                
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },

    onEditScore: function(index){
        this.state.interface_list[index]['in_edit'] = true;
        this.setState({
            interface_list:this.state.interface_list
        });
    },

    onEditScoreFinish: function(index, score){
        var re_value = /^([0-9]*[.0-9])$/;
        if (!re_value.test(score)){     
            alert('价格必须是实数');
            return;
        }
        var id  = this.state.interface_list[index]['id'];
        var req = JSON.stringify({
            'interface_id': id,
            'score': score
        });

        $.ajax({
            url:'/api/route/interface/score',
            dataType:'json',
            type: 'post',
            data: req,
            success: function(data){
                if(data.status == "ok"){
                    alert('手工评分成功!');
                    this.state.interface_list[index]['score'] = score;
                    this.state.interface_list[index]['in_edit'] = false;
                    this.setState({
                        interface_list: this.state.interface_list
                    });
                }else{
                    alert('手工评分失败');
                }
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },
    
    onEditPriceScore: function(index){
        this.state.price_list[index]['score_in_edit'] = true;
        this.setState({
            price_list:this.state.price_list
        });
    },

    onEditPriceScoreFinish: function(index, score){
        var re_value = /^([0-9]*\.*)$/;
        if (!re_value.test(score)){
            alert('价格必须是实数');
            return;
        }
        var id  = this.state.price_list[index]['id'];
        var req = JSON.stringify({
            'id': id,            
            'score': score
        });

        $.ajax({
            url:'/api/route/interface/price/modify',
            dataType:'json',
            type: 'post',
            data: req,
            success: function(data){
                
                if(data.status == "ok"){
                    alert('手工评分成功!');
                    this.state.price_list[index]['score'] = score;
                    this.state.price_list[index]['score_in_edit'] = false;
                    this.setState({
                        price_list: this.state.price_list
                    });

                }else{
                    alert('手工评分失败');
                }
                this.loadPriceList(this.state.current_interface, '');
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(status, err.toString());
            }.bind(this)
        });
    },    

    onEditPricePrice: function(index){
        this.state.price_list[index]['price_in_edit'] = true;
        this.setState({
            price_list:this.state.price_list
        });
    },

    onEditPricePriceFinish: function(index, value){
        var re_value =  /^([0-9]*.*)$/;
        if (!re_value.test(value)){
            alert('修改价格必须是数字!!');
            return;
        }
        var id  = this.state.price_list[index]['id'];
        var req = JSON.stringify({
            'id': id,
            'value': value
        });
        alert(req)
        
        $.ajax({
            url:'/api/route/interface/price/modify',
            dataType:'json',
            type: 'post',
            data: req,
            success: function(data){
                if(data.status == "ok"){
                    alert('手工评分成功!');
                    this.state.price_list[index]['value'] = value;
                    this.state.price_list[index]['price_in_edit'] = false;
                    this.setState({
                        price_list: this.state.price_list
                    });
                }else{
                    alert('手工评分失败');
                }
                this.loadPriceList(this.state.current_interface, '');
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
                    <InterfaceList
                        interface_list={this.state.interface_list}
                        limit_zero={this.state.limit_zero}
                        loadPriceList={this.loadPriceList}
                        onSort={this.onSort}
                        onEditScore={this.onEditScore}
                        onEditScoreFinish={this.onEditScoreFinish}
                        onToggleZero={this.onToggleZero}
                    />

                    <PriceList
                        interface_list={this.state.interface_list}
                        price_list={this.state.price_list}
                        carrier={this.state.carrier}
                        onChangeCarrier={this.onChangeCarrier}
                        onEditPricePrice={this.onEditPricePrice}
                        onEditPricePriceFinish={this.onEditPricePriceFinish}
                        onEditPriceScore={this.onEditPriceScore}
                        onEditPriceScoreFinish={this.onEditPriceScoreFinish}
                        removeProduct={this.removeProduct}/>

                    <MaintainList
                        maintain_list={this.state.maintain_list}
                        removeMaintain={this.removeMaintain}/>

                    <DataPoolSplitManage
                        datapool_list={this.state.datapool_list}
                        removeDataPool={this.removeDataPool}/>
                </div>

                <AddMaintainBox
                    user_list={this.state.user_list}
                    interface_list={this.state.interface_list}
                    addMaintain={this.addMaintain}/>
                <AddDataPoolBox
                    datapool_interface_list={this.state.datapool_interface_list}
                    addDatapool={this.addDatapool}/>
                    
                <AddProductBox
                    interface_list={this.state.interface_list}
                    current_interface={this.state.current_interface}
                    product_list={this.state.product_list}
                    price_list={this.state.price_list}
                    addProduct={this.addProduct}/>
                    
                                        
            </section>
        );
    }
});


var InterfaceList = React.createClass({

    onToggleZero: function () {
        this.props.onToggleZero();
    },

    onSort: function (column) {
        this.props.onSort(column);
    },

    loadPriceList: function (interface_id) {
        this.props.loadPriceList(interface_id, '');
    },

    editScore:function(index){
        this.props.onEditScore(index);
    },

    editScoreFinish:function(index){
        var score = $('#edit' + index).val();
        this.props.onEditScoreFinish(index, score);
    },

    render: function () {
        var interfaceNodes = this.props.interface_list.map(function (inf, index) {
            var editScoreNode = null;
            var scoreInputNode = null;
            // price edit mode
            if (inf.in_edit) {
                editScoreNode = (
                    <a href="javascript:void(0);" className="alter_list"
                       onClick={this.editScoreFinish.bind(this, index)}>确定</a>);
                scoreInputNode = (<td className="text-right">
                        <input id={'edit'+ index} type='text' size='3'
                               defaultValue={inf.score}/>
                    </td>);
            } else {
                editScoreNode = (
                    <a href="javascript:void(0);" className="alter_list"
                       onClick={this.editScore.bind(this, index)}>手工评分</a>);
                scoreInputNode = (
                        <td>{inf.score}</td>);
            }
            return (
                <tr key={inf.id}>
                    <td>{inf.id}</td>
                    <td>{inf.name}</td>
                    <td>{inf.carrier}</td>
                    <td>{inf.area}</td>
                    <td>{inf.create_time}</td>
                    {scoreInputNode}
                    <td className="text-left">
                        {editScoreNode} | <a href='#' onClick={this.loadPriceList.bind(this, inf.id)}>查看价格
                        </a>
                    </td>
                </tr>
            );
        }.bind(this)
    );

        var toggle_class = "btn btn-xs " + (this.props.limit_zero ? "btn-info" : "btn-default");
        console.info(toggle_class);

        return (
            <div className="col-md-12 col-lg-8">
                <div className="form-group text-right"></div>
                <section className="panel">
                    <header className="panel-heading row">
                        <span className="pull-left"><i className="icon-table" />接口列表</span>
                                                
                        <span className="pull-right">
                            <a href="javascript:void(0);" className="btn btn-danger"
                               onClick={this.onToggleZero}>
                                <span>在用接口</span></a>
                        </span>                                                
                    </header>

                    <div className="panels">
                        <div className="panel-body table-responsive">

                            <table id="downstream_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th><a href="javascript:void(0);" onClick={this.onSort.bind(this, 'id')}>标识</a></th>
                                    <th>名称</th>
                                    <th>运营商</th>
                                    <th>使用区域</th>
                                    <th><a href="javascript:void(0);" onClick={this.onSort.bind(this, 'create_time')}>开通时间</a>
                                    </th>
                                    <th><a href="javascript:void(0);" onClick={this.onSort.bind(this, 'score')}>评分</a>
                                    </th>
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
        );
    }
});


var PriceList = React.createClass({
    
    onAddProduct: function () {
        window.location.replace("#sec-product");
        $('#addProduct').modal('show');
    },
    

    onRemoveProduct: function (price) {
        var msg = '确认删除 "' + price.product_id + '" 么?';
        if (!confirm(msg)) return;
        
        this.props.removeProduct(price.id);
    },
    
        
    editPricePrice:function(index){
        this.props.onEditPricePrice(index);
    },

    editPricePriceFinish:function(index){
        var value = $('#edit' + index).val();
        this.props.onEditPricePriceFinish(index, value);
    },
        
                
    editPriceScore:function(index){
        this.props.onEditPriceScore(index);
    },

    editPriceScoreFinish:function(index){
        var score = $('#edit' + index).val();
        this.props.onEditPriceScoreFinish(index, score);
    },

    onChangeCarrier: function (e) {
        this.props.onChangeCarrier(e.target.value);
    },

    render: function () {
        
            var priceNodes = this.props.price_list.map(function (price, index) {                        
                    var editScoreNode = null;
                    var scoreInputNode = null;
                    // price edit mode
                    
                    if (price.price_in_edit) {
                        editPriceNode = (
                            <a href="javascript:void(0);" className="alter_list" onClick={this.editPricePriceFinish.bind(this, index)}>确定</a>
                            );
                        priceInputNode = (
                            <td className="text-left">
                               <input id={'edit'+ index} type='text' size='6' defaultValue={price.value}/>
                            </td>
                            );
                    } 
                    else {
                        editPriceNode = (
                            <a href="javascript:void(0);" className="alter_list" onClick={this.editPricePrice.bind(this, index)}>修改</a>
                            );
                        priceInputNode = (<td className="price_color">{price.value}</td>);
                    }
                    console.log(price.score_in_edit)
                    if (price.score_in_edit) {
                        editScoreNode = (
                            <a href="javascript:void(0);" className="alter_list" onClick={this.editPriceScoreFinish.bind(this, index)}>确定</a>
                            );
                        scoreInputNode = (
                            <td className="text-left">
                               <input id={'edit'+ index} type='text' size='6' defaultValue={price.score}/>
                            </td>
                            );
                    } 
                    else {
                        editScoreNode = (
                            <a href="javascript:void(0);" className="alter_list" onClick={this.editPriceScore.bind(this, index)}>修改</a>
                            );
                        scoreInputNode = (<td>{price.score}</td>);
                    }
                    return (
                        <tr key={price.id}>
                            <td>{price.product_name}</td>
                            {priceInputNode}
                            <td>{editPriceNode}</td>
                            <td>{price.discount}% </td>
                            {scoreInputNode}
                            <td>{editScoreNode}</td>
                            <td><a href='#' onClick={this.onRemoveProduct.bind(this, price)}>删除</a></td>                       
                        </tr>
                    );
                }.bind(this)
            );
            return (
                <div className="col-md-12 col-lg-4">
                    <div className="form-group text-right"></div>
                    <section className="panel">
                        <header className="panel-heading row">
                            <a name='sec-product'><span className="pull-left"><i className="icon-table" />采购价格</span></a>
                            
                            <span className="pull-right">
                                <a href="javascript:void(0);" id="add_product" className="btn btn-danger disabled" onClick={this.onAddProduct}> 
                                    <i className="icon-edit " /><span>添加产品</span></a>
                            </span>
                            <span className="pull-right">
                                <select onChange={this.onChangeCarrier} value={this.props.carrier}>
                                    <option value="">全部</option>
                                    <option value="1">移动</option>
                                    <option value="2">联通</option>
                                    <option value="3">电信</option>
                                </select></span>
                        </header>
            
                        <div className="panels">
                            <div className="panel-body table-responsive">
            
                                <table id="downstream_result" className="table table-striped table-hover">
                                    <thead>
                                    <tr>
                                        <th>产品</th>
                                        <th>价格</th>
                                        <th></th>
                                        <th>折扣</th>
                                        <th>评分</th>
                                        <th></th>
                                        <th>操作</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {priceNodes}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
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


var DataPoolSplitManage = React.createClass({
    onAddDataPool: function () {
        window.location.replace("#sec-datapool");
        $('#addDataPool').modal('show');
    },

    onRemoveDataPool: function (datapoolnode) {
        var msg = '确认删除 "' + datapoolnode.route + datapoolnode.name +'" 么?';
        if (!confirm(msg)) return;
        this.props.removeDataPool(datapoolnode.key);
    },
    //
    render: function () {
        var dataPoolNodes = this.props.datapool_list.map(function (datapoolnode) {
                return (
                    <tr key={datapoolnode.key}>
                        <td>{datapoolnode.route}</td>
                        <td>{datapoolnode.carrier}</td>
                        <td>{datapoolnode.name}</td>
                        <td>{datapoolnode.number}</td>
                        <td>{datapoolnode.notes}</td>
                        <td><a href='#' onClick={this.onRemoveDataPool.bind(this, datapoolnode)}>删除</a></td>
                    </tr>
                );
            }.bind(this)
        );

        return (
            <div className="col-md-12 col-lg-8">
                <div className="form-group text-right"></div>
                <section className="panel">
                    <header className="panel-heading row">
                        <a name='sec-datapool'>
                            <span className="pull-left"><i className="icon-table" />流量池切割管理</span></a>
                        <span className="pull-right">
                            <a href="javascript:void(0);" className="btn btn-danger" onClick={this.onAddDataPool}>
                                <i className="icon-edit" /><span>添加/修改</span></a>
                        </span>
                    </header>

                    <div className="panels">
                        <div className="panel-body table-responsive">

                            <table id="downstream_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>接口</th>
                                    <th>运营商</th>
                                    <th>产品名称</th>
                                    <th>数量</th>
                                    <th>备注</th>
                                    <th>操作</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dataPoolNodes}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        );
    }
});


var AddMaintainBox = React.createClass({

    onAdd: function () {
        var request = {
            'route': $('#form-route').val(),
            'carrier': $('#form-carrier').val(),
            'area': $('#form-area').val(),
            'user_id': $('#form-user-id').val(),
            'notes': $('#form-notes').val(),
            'ttl': $('#form-ttl').val(),
            'ttl_value': $('#form-ttl-value').val()
        };
        //alert(request);

        this.props.addMaintain(request);
    },

    onSelectTime: function (event) {
        if (event.target.value == "") {
            $("#form-ttl-value").prop('readonly', true).val('');
        } else {
            $("#form-ttl-value").prop('readonly', false);
        }
    },

    onDismiss: function () {
        $('#addModal').modal('hide');
    },

    render: function () {
        var routeNodes = this.props.interface_list.map(function (inf, index) {
            return (<option value={inf.id}>{inf.name} - {inf.id}</option>);
        });

        var userNodes = this.props.user_list.map(function (user, index) {
            return (<option value={user.id}>{user.id} - {user.name}</option>);
        });

        return (
            <div className="modal fade" id="addModal" tabIndex="-1" role="dialog" aria-labelledby="addModalLabel"
                 aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="addModalLabel">添加接口级维护</h4>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <label className="col-md-2 control-label">接口</label>

                                <div className="col-md-10">
                                    <select className="m-bot15 form-control input-sm" id="form-route">
                                        {routeNodes}
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">区域</label>

                                <div className="col-md-4">
                                    <select className="m-bot15 form-control input-sm" id="form-carrier">
                                        <option value="1">移动</option>
                                        <option value="3">电信</option>
                                        <option value="2">联通</option>
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">区域</label>

                                <div className="col-md-4">
                                    <select className="m-bot15 form-control input-sm" id="form-area">
                                        <option value="CN">(全国)</option>
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

                                <label className="col-md-2 control-label">用户</label>

                                <div className="col-md-10">
                                    <select className="m-bot15 form-control input-sm" id="form-user-id">
                                        <option value="">(全部)</option>
                                        {userNodes}
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">时效</label>

                                <div className="col-md-4">
                                    <select className="m-bot15 form-control input-sm" id="form-ttl"
                                            onChange={this.onSelectTime}>
                                        <option value="">长期有效</option>
                                        <option value="hour">按小时</option>
                                        <option value="min">按分钟</option>
                                        <option value="day">按天</option>
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <input id="form-ttl-value" className="form-control m-bot15" type='text'
                                           readOnly/>
                                </div>

                                <label className="col-md-2 control-label">备注</label>

                                <div className="col-md-10">
                                    <input id="form-notes" className="form-control" type='text' placeholder='简短说明'/>
                                </div>

                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-info" onClick={this.onAdd}>维护</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});


var AddDataPoolBox = React.createClass({
    onAdd: function () {
        var request = {
            'key': $('#form-route-pool').val(),
            'number': $('#form-number-pool').val(),
            'notes': $('#form-notes-pool').val(),
        };
        //alert(request);

        this.props.addDatapool(request);
    },

    render: function () {
        var routeNodes = this.props.datapool_interface_list.map(function (inf, index) {
            return (<option value={inf.key}>{inf.carrier}-{inf.route}-{inf.name}</option>);
        });
        return (
            <div className="modal fade" id="addDataPool" tabIndex="-1" role="dialog" aria-labelledby="addDataPoolLabel"
                 aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="addDataPoolLabel">流量池切割管理</h4>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <label className="col-md-2 control-label">上游接口</label>

                                <div className="col-md-10">
                                    <select className="m-bot15 form-control input-sm" id="form-route-pool">
                                        {routeNodes}
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">数量</label>
                                <div className="col-md-10">
                                    <input id="form-number-pool" className="form-control" type='text' placeholder='请输入数量'/>
                                </div>

                                <label className="col-md-2 control-label">备注</label>
                                <div className="col-md-10">
                                    <input id="form-notes-pool" className="form-control" type='text' placeholder='简短说明'/>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-info" onClick={this.onAdd}>添加</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});


var AddProductBox = React.createClass({
    onAdd: function () {
        var request = {
            'interface_id': $('#form-interface_id-interface_price').val(),         //interface_id
            
            //'interface_id': this.props.current_interface,

            'product_id': $('#form-product_id-interface_price').val(),             //product_id
            'value': $('#form-value-interface_price').val(),                       //product_id
        };
        this.props.addProduct(request);
    },

    onDismiss: function () {
        $('#addProduct').modal('hide');
    },

    render: function () {
        
        //var routeNodes = this.props.interface_list.map(function (inf, index) {
        //    return (<option value={inf.id}>{inf.name} - {inf.id}</option>);
        //});        
        //
        var routeNodes = <option value={this.props.current_interface}>{this.props.current_interface}</option>
        var productNodes = this.props.product_list.map(function (inf, index) {
            return (<option value={inf.id}>{inf.name} - {inf.id}-{inf.value}</option>);
        });
        
        
        
        return (
            <div className="modal fade" id="addProduct" tabIndex="-1" role="dialog" aria-labelledby="addProductLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title" id="addModalLabel">添加产品</h4>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <label className="col-md-2 control-label">接口</label>
                                <div className="col-md-10">
                                    
                                    <select className="m-bot15 form-control input-sm" id="form-interface_id-interface_price">
                                {routeNodes}
                                    </select>                                    
                                
                                    
                                </div>

                                <label className="col-md-2 control-label">产品</label>
                                <div className="col-md-10">
                                    <select className="m-bot15 form-control input-sm" id="form-product_id-interface_price">
                                        {productNodes}
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">价格</label>
                                <div className="col-md-10">
                                    <input id="form-value-interface_price" className="form-control" type='text' placeholder='请输入价格(元)'/>
                                </div>                                
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-info" onClick={this.onAdd}>添加</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

    
ReactDOM.render(
    <InterfacePanel />,
    document.getElementById('main-content')
);
