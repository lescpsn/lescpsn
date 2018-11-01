var FeeUser = React.createClass({displayName: "FeeUser",
    //
    changeQuotaDriver: function (request_type) {
        var number= $("#number_"+this.props.user_id).val();

        if(request_type == "sub")
        {
            number = -number;
            request_type = "add";
        }

        request_data = JSON.stringify({
            "request_type": request_type,
            "user_id": this.props.user_id,
            "number":number
        });

        $.ajax({
            url: this.props.url,
            type: 'POST',
            data: request_data,
            dataType: 'json',

            success: function (data) {
                this.setState({quota:data});
            }.bind(this),

            error: function (xhr, status, err) {
                console.info(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //设置用户限额
    setQuota: function () {
        this.changeQuotaDriver("set");
    },

    //加限额
    addQuota: function () {
        this.changeQuotaDriver("add");
    },

    //减限额
    subQuota: function () {
        this.changeQuotaDriver("sub");
    },

    //刷新限额
    flashQuota: function () {
        this.changeQuotaDriver("query");
    },

    getInitialState: function () {
        return {quota: this.props.quota};
    },

    render: function () {
       var id= "number_"+this.props.user_id;
       return(
                React.createElement("div", null, 
                    React.createElement("span", null, this.props.user_id, "  "), 
                    React.createElement("span", null, this.props.user_name, "  "), 
                    React.createElement("span", null, this.state.quota, "  "), 
                    React.createElement("input", {id: id, placeholder: "数值"}), 
                    React.createElement("button", {onClick: this.addQuota}, "加"), 
                    React.createElement("button", {onClick: this.subQuota}, "减"), 
                    React.createElement("button", {onClick: this.setQuota}, "设置"), 
                    React.createElement("button", {onClick: this.flashQuota}, "刷新")
                )
             );
    }
});

var FeeUserList = React.createClass({displayName: "FeeUserList",

    //获取所有用户的限额
    queryAllData : function (){
        request_data = JSON.stringify({'request_type':"query"});

        $.ajax({
            url: this.props.url,
            type: 'POST',
            data: request_data,
            dataType: 'json',

            success: function (data) {
                this.setState({user_list:data});
            }.bind(this),

            error: function (xhr, status, err) {
                console.info(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    getInitialState: function () {
        return {user_list: []};
    },

    componentDidMount: function () {
        this.queryAllData();
    },

    render: function () {
        var user_nodes = this.state.user_list.map(function(user_info){
            return (React.createElement(FeeUser, {url: this.props.url, user_id: user_info.user_id, user_name: user_info.user_name, quota: user_info.quota}));
        }.bind(this));

        return (
            React.createElement("div", {className: "FeeUserList"}, 
            user_nodes
            )
        );
    }
});


React.render(
    React.createElement(FeeUserList, {url: "/admin/fee_quota"}),
    document.getElementById('content')
);