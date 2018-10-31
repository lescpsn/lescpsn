var PagePanel = React.createClass({displayName: "PagePanel",

    getInitialState: function () {
        return {
            page_list: [],
            page: 1,
            max: 0,
            size: 20
        };
    },

    componentDidMount: function () {
        this.loadPageList('测试用户');
    },


    loadPageList: function (user_id) {
        var data = JSON.stringify({
            'user_id': user_id,
            'request_type': 'get_all_page',
            'argument_list': null
        });
        $.ajax({
            url: '/admin/quxun_data_card/manage/recharge_page',
            dataType: 'json',
            type: 'post',
            data: data,
            success: function (resp) {
                if(resp.status == 'success'){
                    this.setState({page_list: resp.data})   
                }
            }.bind(this),
            fail: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        return (
            React.createElement("section", {className: "wrapper"}, 
                React.createElement(PageList, {page_list: this.state.page_list, 
                          loadPageList: this.loadPageList}
                    )
            )
        );
    }
});

var PageList = React.createClass({displayName: "PageList",
    onEditLevel: function () {
        $('#openPage').modal('show');
    }, 

    render: function () {
        var rechargeNode = this.props.page_list.map(function (page, index) {
                return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, page.page_id), 
                        React.createElement("td", null, page.name), 
                        React.createElement("td", null), 
                        React.createElement("td", null, page.create_time), 
                        React.createElement("td", null), 
                        React.createElement("td", null), 
                        React.createElement("td", null, "绑定")
                    )
                )
            }.bind(this)
        );

        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-lg-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "充值页面管理"), 
                            React.createElement("span", {className: "pull-right"}, 
                                React.createElement("a", {href: "javascript:;", className: "btn btn-primary", onClick: this.onEditLevel}, React.createElement("i", {className: "icon-credit-card"}), React.createElement("span", null, " 新建页面"))
                            )
                        ), 
                        React.createElement("div", {className: "panel-body table-responsive"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "序号"), 
                                    React.createElement("th", null, "页面名称"), 
                                    React.createElement("th", null, "URL"), 
                                    React.createElement("th", null, "生成时间"), 
                                    React.createElement("th", null, "状态"), 
                                    React.createElement("th", null, "操作"), 
                                    React.createElement("th", null, "充值类别")
                                )
                                ), 
                                React.createElement("tbody", null, 
                                    rechargeNode
                                )
                            )
                        )
                    ), 
                    React.createElement(AddPageBox, {
                        loadPageList: this.props.loadPageList}
                    )
                )
            )
        );
    }
});

//新增
var AddPageBox = React.createClass({displayName: "AddPageBox",

    get_all_page: function () {
        return {
            get_page_list: [],
        };
    },

    componentDidMount: function () {
        this.get_all_page();
    },

    get_page_list: function () {
        var data = JSON.stringify({
            'user_id': '测试用户',
            'request_type': 'add',
            'argument_list':{'name':'页面2'}
        });

        $.ajax({
            url: '/admin/quxun_data_card/manage/recharge_page',
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

    render: function () {
    return (
            React.createElement("div", {className: "modal", id: "openPage", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "priceModalLabel", "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h5", {className: "modal-title", id: "priceModalLabel"}, "新建充值页面")
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 
                                React.createElement("input", {type: "hidden", id: "to_product"}), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "页面名称"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_name"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "批次"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("div", {className: "serial_li"}, 
                                        React.createElement("span", {className: "tm-tag"}, React.createElement("span", null, "测试用户000007"), React.createElement("a", {className: "tm-remove", href: "javascript:;"}))
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "生效时间"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_name"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "状态"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_name"})
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "状态"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "open_name"})
                                )
                            )

                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {type: "button", className: "btn btn-danger", onClick: this.pageUpdate}, "新建"), 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                        )
                    )
                )
            )
        )
    }
});



React.render(
    React.createElement(PagePanel, null)
    ,
    document.getElementById('main-content')
);
