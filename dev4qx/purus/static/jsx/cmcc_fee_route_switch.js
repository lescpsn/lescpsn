var AREA_MAP = {
    'BJ': '北京',
    'TJ': '天津',
    'HE': '河北',
    'SX': '山西',
    'NM': '内蒙古',
    'LN': '辽宁',
    'JL': '吉林',
    'HL': '黑龙江',
    'SH': '上海',
    'JS': '江苏',
    'ZJ': '浙江',
    'AH': '安徽',
    'FJ': '福建',
    'JX': '江西',
    'SD': '山东',
    'HA': '河南',
    'HB': '湖北',
    'HN': '湖南',
    'GD': '广东',
    'GX': '广西',
    'HI': '海南',
    'CQ': '重庆',
    'SC': '四川',
    'GZ': '贵州',
    'YN': '云南',
    'XZ': '西藏',
    'SN': '陕西',
    'GS': '甘肃',
    'QH': '青海',
    'NX': '宁夏',
    'XJ': '新疆',
    'TW': '台湾',
    'HK': '香港',
    'CN': '全国'
};


var MainContent = React.createClass({
    reloadData: function(){
        $.ajax({
            url: '/admin/cmcc_fee_route_switch/admin/maintenance',
            dataType: 'json',
            type: 'get',

            success: function (resp_data) {
                this.setState(
                    {
                        disable_price_list: resp_data.disable_price_list,
                        disable_area_list: resp_data.disable_area_list,
                        all_price_list: resp_data.all_price_list,
                        all_area_list: resp_data.all_area_list,
                    }
                );
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    
    setData: function(obj_type, requ_type, value){
        var l = [];
        if(value)
        {
            l = [value];
        }
        
        requ_data = {};
        requ_data["request_type"] = requ_type + "_" + obj_type;
        requ_data[obj_type + "_list"] = l; 
        
        $.ajax({
            url: '/admin/cmcc_fee_route_switch/admin/maintenance',
            type: 'post',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                this.reloadData();
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    
    getInitialState: function () {
        return {
            disable_price_list: [],
            disable_area_list: [],
            all_price_list: [],
            all_area_list: [],
        };
    },

    componentDidMount: function (){
        this.reloadData();
    },

    componentDidUpdate: function(){
    },

    render: function () {
        //<OperationPanel onClickSave={this.onClickSave}/>
        return (
            <div className="wrapper">
                <ObjPanel  all_list={this.state.all_area_list}   disable_list={this.state.disable_area_list}  obj_type="area" setData={this.setData}/>
            </div>
        );
    }
});


var ObjPanel = React.createClass({
    getInitialState: function () {
        return {};
    },

    componentDidMount: function (){
    },

    componentDidUpdate: function(){
    },

    render: function () {
        var show_name1 = "";
        if(this.props.obj_type == "price")
        {
            show_name1= "面值";
        }
        else if(this.props.obj_type == "area")
        {
            show_name1= "区域";
        }
        
        var priceListNodes = this.props.all_list.map(function(data,index){
            var data_name = data;
            if(this.props.obj_type == "area")
            {
                data_name = AREA_MAP[data] || data_name;
            }
            
            var status = "";
            var oper= null;
            if( $.inArray(data, this.props.disable_list) == -1)
            {
                status = "正常";
                oper = (<a href="javascript:void(0)" className="btn btn-danger btn-xs"
                        onClick={this.props.setData.bind(this, this.props.obj_type, "disable", data)}
                        >
                        <span>维护</span>
                        </a>);
            }
            else
            {
                status = "维护";
                oper = (<a href="javascript:void(0)" className="btn btn-info btn-xs"
                        onClick={this.props.setData.bind(this, this.props.obj_type, "enable", data)}
                        >                                           
                        <span>开启</span>
                        </a>);
            }
            
            return(
                <tr>
                    <td>{data_name}</td>
                    <td>{status}</td>
                    <td>{oper}</td>
                </tr>
            );
        }.bind(this));
            
        
        //<OperationPanel onClickSave={this.onClickSave}/>
        return (
            <section className="panel">
                <header className="panel-heading row">
                    <span className="pull-left"><i className="icon-list"></i>{show_name1+"列表"}</span>
                    <span className="pull-right">
                        <a href="javascript:void(0)" className="btn btn-info" onClick={this.props.setData.bind(this, this.props.obj_type, "enable_all", null)}>
                             <i className="icon-check-sign"></i>
                             <span>一键开启</span>
                        </a>
                        <a href="javascript:void(0)" className="btn btn-danger"  onClick={this.props.setData.bind(this, this.props.obj_type, "disable_all", null)}>
                             <i className="icon-warning-sign"></i>
                             <span>一键维护</span>
                        </a>
                    </span>
                </header>

                <div className="panel-body">
                        <div className="panel-body table-responsive">
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>{show_name1}</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceListNodes}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        );
    }
});

React.render(
    <MainContent />
    ,
    document.getElementById('main-content')
);
