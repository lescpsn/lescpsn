var PagePanel = React.createClass({
    getInitialState: function () {
        return {
            page_list: [],
        };
    },

    componentDidMount: function () {
        this.loadPageList();
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
                if(resp.status == 'success'){
                    this.setState({
                        page_list: resp.data,
                    })
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            <section className="wrapper">
                <PageList page_list={this.state.page_list}
                          loadPageList={this.loadPageList}
                    />
            </section>
        );
    }
});


var PageList = React.createClass({
    showAddpageBox: function () {
        this.loadAddPageBoxShipmentList();
        $('#openPage').modal('show');
    },

    showBindPageBox: function (page_info) {

        this.loadBindPageBoxShipmentList(page_info);

        this.setState({
            page_info: page_info,
        });

        $('#bindPage').modal('show');
    },

    loadBindPageBoxShipmentList: function(page_info)
    {
        page_bind_shipment_list = []
        other_page_bind_shipment_list = []

        var data = JSON.stringify({
            'request_type': 'get_page_bind_shipment_list',
            'argument_list': {
                'page_id': page_info.page_id,
            }
        });

        $.ajax({
            url: '/api/data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            async: false,
            data: data,
            success: function (resp) {
                if (resp.status == 'success')
                {
                    page_bind_shipment_list = resp.data;

                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        var data = JSON.stringify({
            'request_type': 'get_other_page_bind_shipment_list',
            'argument_list': {
                'page_id': page_info.page_id,
            }
        });

        $.ajax({
            url: '/api/data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            data: data,
            async: false,
            success: function (resp) {
                if (resp.status == 'success')
                {
                    other_page_bind_shipment_list = resp.data;
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });


        var data = [];
        for(i in page_bind_shipment_list)
        {
            shipment = page_bind_shipment_list[i];
            data.push({label: shipment.serial_num+"/"+shipment.serial_name+"/" + shipment.recharge_page_name, value: shipment.serial_num});

        }

        for(i in other_page_bind_shipment_list)
        {
            shipment = other_page_bind_shipment_list[i];
            data.push({label: shipment.serial_num+"/"+shipment.serial_name+"/" + shipment.recharge_page_name, value: shipment.serial_num});

        }
        $('#shipment_list').multiselect('dataprovider', data);


        for(i in page_bind_shipment_list)
        {
            shipment = page_bind_shipment_list[i];
            $('#shipment_list').multiselect('select', shipment.serial_num);
        }


    },

    onDataNodeOperation: function (page_id,name, page_status) {
        this.setState({
             page_id: page_id,
             name:name,
             page_status: page_status
        });
        $('#confirmWindow').modal('show');

    },


    loadAddPageBoxShipmentList: function()
    {
        var have_bind_page_shipment_list = [];
        var not_bind_page_shipment_list = [];
        var data = JSON.stringify({
            'request_type': 'get_have_bind_page_shipment_list',
        });
        $.ajax({
            url: '/api/data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            data: data,
            async: false,
            success: function (resp) {
                if (resp.status == 'success')
                {
                    have_bind_page_shipment_list = resp.data;
                }
                else
                {
                    alert("查询失败"+resp.msg);
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        var data = JSON.stringify({
            'request_type': 'get_not_bind_page_shipment_list',
        });
        $.ajax({
            url: '/api/data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            data: data,
            async: false,
            success: function (resp) {
                if (resp.status == 'success')
                {
                    not_bind_page_shipment_list = resp.data;
                }
                else
                {
                    alert("查询失败"+resp.msg);
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });

        var all_shipment_list = not_bind_page_shipment_list.concat(have_bind_page_shipment_list);
        
        var data = [];
        for(i in all_shipment_list)
        {
            shipment = all_shipment_list[i];
            data.push({label: shipment.serial_num +"("+shipment.serial_name+") - " + shipment.recharge_page_name, value: shipment.serial_num});

        }
        $('#all_shipment_list').multiselect('dataprovider', data);
    },

    getInitialState: function () {
        return {
        page_info: {
                'page_id': '',
                'user_id': '',
                'name': '',
                'create_time': '',
                'url':  '',
                'title': '',
                'status': ''}
                ,
        };
    },

    componentDidMount: function () {
    },

    render: function () {
        var rechargeNode = this.props.page_list.map(function (page, index) {
            var statusNode = null;
            var urlNode = null;

            if(page.status == '打开')
            {
                statusNode = (<a href="javascript:void(0);" className="btn btn-primary btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this, page.page_id, page.name,'关闭')}>关闭</a>);
                urlNode =(<a href={page.url} target="_blank">{page.url}</a>)
            }
            else
            {
                statusNode = (<a href="javascript:void(0);" className="btn btn-primary btn-sm btn-activate" onClick={this.onDataNodeOperation.bind(this, page.page_id, page.name,'打开')}>打开</a>);
                urlNode =(<span>{page.url}</span>)
            }

            return (
                <tr>
                    <td>{page.page_id}</td>
                    <td>{page.name}</td>
                    <td>{urlNode}</td>
                    <td>{page.create_time}</td>
                    <td>{page.status}</td>
                    <td className="text-center">{statusNode}</td>
                    <td className="text-center"><a href="javascript:;" className="btn btn-primary btn-sm btn-activate" onClick={this.showBindPageBox.bind(this, page)}>修改</a></td>
                </tr>
            )
            }.bind(this)
        );

        return (
            <div className="row">
                <div className="col-lg-12">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>充值页面管理</span>
                            <span className="pull-right">
                                <a href="javascript:;" className="btn btn-primary" onClick={this.showAddpageBox}><i className="icon-credit-card"></i><span> 新建页面</span></a>
                            </span>
                        </header>
                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>序号</th>
                                    <th>页面名称</th>
                                    <th>URL</th>
                                    <th>生成时间</th>
                                    <th>状态</th>
                                    <th className="text-center">操作</th>
                                    <th className="text-center">绑定</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {rechargeNode}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <AddPageBox
                        loadPageList = {this.props.loadPageList}/>
                    <BindPageBox
                        page_info = {this.state.page_info}/>
                    <ConfirmWindow
                        page_id = {this.state.page_id}
                        page_name = {this.state.name}
                        page_status = {this.state.page_status}
                        loadPageList = {this.props.loadPageList}/>
                </div>
            </div>
        );
    }
});


//新增
var AddPageBox = React.createClass({
    onOk: function () {
        var page_name = $('#page_name').val();
        var page_title = $('#page_title').val();
        var shipment_list = $('#all_shipment_list').val();
        var page_status = $('#page_status').val();


        var cont_lable = /^[0-9a-zA-Z]*$/g;
        if (page_name< 1 ) 
        {
            alert('页面名称不为空');
            return;
        } 
        else if(page_title < 1)
        {
            alert('标题不为空');
            return;
        } 

        var data = JSON.stringify({
            'request_type': 'add',
            'argument_list': {
                'name': page_name,                 //页面名称
                'page_title':page_title,
                'shipment_list': shipment_list,     //需要绑定的批次表
                'page_status':page_status
            }
        });

        $.ajax({
            url: '/api/data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if (resp.status == 'success')
                {
                    alert("新增成功")
                    this.props.loadPageList();
                    $('#openPage').modal('hide');
                }
                else
                {
                    alert("新增失败 - " + resp.msg);
                }
                $('#page_serial').multiselect({
                    includeSelectAllOption: true,
                    maxHeight: 180
                });
            }.bind(this),
            fail: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },


    render: function () {
        return (
            <div className="modal" id="openPage" tabIndex="-1" role="dialog"
                 aria-labelledby="priceModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="priceModalLabel">新建充值页面</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <input type='hidden' id="to_product"/>

                                <label className="col-md-2 control-label">页面名称</label>
                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="page_name" placeholder="请输入页面名称"/>
                                </div>

                                <label className="col-md-2 control-label">标题</label>
                                <div className="col-md-10">
                                    <input className="m-bot15 form-control input-sm" id="page_title" placeholder="请输入标题"/>
                                </div>

                                <label className="col-md-2 control-label">批次</label>
                                <div className="col-md-10 example">
                                    <select id="all_shipment_list" multiple="multiple">
                                    </select>
                                </div>

                                <label className="col-md-2 control-label">状态</label>
                                <div className="col-md-10">
                                    <select id="page_status" className="form-control m-bot15">
                                        <option value="打开">打开</option>
                                        <option value="关闭">关闭</option>
                                    </select>
                                </div>
                            </div>

                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onOk}>新建</button>
                            <button type="button" className="btn btn-default" data-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
});

//绑定
var BindPageBox = React.createClass({
    onBindPage: function ()
    {
        shipment_list = $("#shipment_list").val();
        //alert(JSON.stringify(shipment_list));
        var data = JSON.stringify({
            'request_type': 'set_page_bind_shipment_list',
            'argument_list':{
                'page_id':this.props.page_info.page_id,
                'shipment_list':shipment_list
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
                }
                else
                {
                    alert('绑定失败 ' + resp.msg);
                }
                $('#bindPage').modal('hide');
            }.bind(this),
            fail: function (xhr, status, err) {
                //console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        // var bind_shipment_list = this.props.page_info.map(function (card, index) {

        // });
        return (
            <div className="modal" id="bindPage" tabIndex="-1" role="dialog"
                 aria-labelledby="priceModalLabel" aria-hidden="true" backdrop="false">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="priceModalLabel">充值页面绑定</h5>
                        </div>
                        <div className="modal-body form-horizontal">
                            <div className="form-group add-pro-body">
                                <input type='hidden' id="to_product"/>

                                <label className="col-md-2 control-label">页面名称</label>
                                <div className="col-md-10">
                                    <input disabled="true" className="m-bot15 form-control input-sm" id="page_bind_name"  value={this.props.page_info.name}/>
                                </div>

                                <label className="col-md-2 control-label">批次号</label>
                                <div className="col-md-10 example">
                                    <select id="shipment_list" multiple="multiple" className="mb15">

                                    </select>   
                                </div>

                                <label className="col-md-2 control-label">生效时间</label>
                                <div className="col-md-10">
                                    <input disabled="true" className="m-bot15 form-control input-sm" id="page_bind_time" value={this.props.page_info.create_time}/>
                                </div>

                            </div>

                        </div>
                        <div className="modal-footer form-horifooter">
                            <button type="button" className="btn btn-danger" onClick={this.onBindPage}>确定</button>
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

    onConfirm: function () {
        page_id = this.props.page_id;
        page_name = this.props.page_name;
        page_status = this.props.page_status;
        var data = JSON.stringify({
            'request_type': 'change_page_status',
            'argument_list': {
                'page_id': page_id,
                'page_name':page_name,
                'page_status': page_status
            }
        });
        $.ajax({
            url: '/api/data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    if(page_status == '关闭')
                    {
                        alert("关闭成功");
                    }
                    else if(page_status == "打开")
                    {
                        alert("打开成功");
                    }
                    this.props.loadPageList();
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

    render: function () {
        var msg = null;
        var msg1 = '确定关闭此充值页面?';
        var msg2 = '确定打开此充值页面?';

        if( this.props.page_status == "关闭")
        {
            msg= msg1;
        }
        else if (this.props.page_status == "打开")
        {
            msg = msg2;
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
                                <div className="col-md-8"><h4>{msg}</h4><h5>页面名称：{this.props.page_name}</h5></div>
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
React.render(
    <PagePanel />
    ,
    document.getElementById('main-content')
);
