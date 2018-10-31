function getQueryStringByName(name) {
    var result = location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
    if (result == null || result.length < 1) {
        return "";
    }
    return result[1];
}

var MainContent = React.createClass({displayName: "MainContent",
    getInitialState: function () {
        return {
            account_list: [],
            user_list: [],
            product_list: [],
            copy_product_list: [],
            template_list: [],
            current_domain: null,
            page: 1,
            size: 10,
            max: 0
        };
    },

    loadProductList: function (filter, page) {
        if (!filter) {
            filter = this.state.filter;
        }
        filter['page'] = page || this.state.page;
        filter['size'] = this.state.size;

        $.ajax({
            url: '/api/product/list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(filter),
            success: function (resp) {
                this.setState({
                    product_list: resp.list,
                    page: resp.page,
                    max: resp.max,
                    filter: filter
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadTemplateList: function () {
        $.ajax({
            url: '/api/downstream/template',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({template_list: data});
            }.bind(this),
            error: function (xhr, status, err) {
            }.bind(this)
        });
    },

    getAccountList: function () {
        $.ajax({
            url: '/api/domain/list_all',
            dataType: 'json',
            type: 'post',

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    console.log(JSON.stringify(resp_data));
                    this.setState({
                        account_list: resp_data.data,
                    });
                } else {
                    alert("帐号列表加载错误 " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("帐号列表加载异常 " + err.toString());
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //获取上游用户列表
    loadUserList: function () {
        $.ajax({
            url: '/api/user/list_local',
            dataType: 'json',
            type: 'get',

            success: function (resp_data) {
                this.setState({user_list: resp_data});
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    componentDidMount: function () {
        this.getAccountList();
        this.loadUserList();
        this.loadTemplateList();
    },

    //点击新增帐号
    onClickAddAccount: function () {
        this.refs.AddAccountDlg.showDlg(this.state.user_list);
    },

    onSelectAccount: function (account_info) {
        this.loadProductList({'domain_id': account_info.domain_id});
        this.setState({current_domain: account_info});
    },

    //新增帐号
    onAddAccount: function (new_account_info) {
        console.log(typeof (new_account_info));

        $.ajax({
            url: '/api/domain/add',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(new_account_info),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                    alert(_.str.sprintf('新增帐号 %s 成功\n%s', new_account_info.domain_name, resp_data.msg));
                    this.refs.AddAccountDlg.hideDlg();
                } else {
                    console.log(resp_data);
                    alert(_.str.sprintf('新增帐号 %s 失败 %s!!!', new_account_info.domain_name, resp_data.msg));
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert(_.str.sprintf('新增帐号 %s 异常 %s!!!', new_account_info.domain_name, err.toString()));
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //删除帐号
    onDelAccount: function (account_info) {

        if (!window.confirm(_.str.sprintf('确认删除帐号 %s 吗?', account_info.domain_id))) {
            return;
        }

        var requ_data = {
            requ_type: 'remove',
            argu_list: {
                account_info: account_info,
            },
        };

        $.ajax({
            url: '/api/domain',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                    alert(_.str.sprintf('删除帐号 %s 成功', account_info.domain_id));
                }
                else {
                    alert(_.str.sprintf('删除帐号 %s 失败 %s!!!', account_info.domain_id, resp_data.msg));
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert(_.str.sprintf('删除帐号 %s 异常 %s!!!', account_info.domain_id, err.toString()));
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    //设置帐号状态
    setAccountConfig: function (domain_id, key, value) {
        var argu_list = {}
        argu_list["domain_id"] = domain_id;
        argu_list["key"] = key;
        argu_list["value"] = value;

        var requ_data = {
            requ_type: 'set_status',
            argu_list: argu_list,
        };

        $.ajax({
            url: _.str.sprintf('/admin/domain?requ_type=%s',
                encodeuricomponent(requ_type)
            ),
            type: 'post',
            datatype: 'json',
            data: json.stringify(requ_data),

            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    this.getAccountList();
                    alert(_.str.sprintf('帐号 %s 状态设置成功', domain_id));
                }
                else {
                    alert("修改帐号配置错误: " + resp_data.msg);
                }
            }.bind(this),

            error: function (xhr, status, err) {
                alert("修改帐号配置异常: " + err.tostring());
                console.error(this.props.url, status, err.tostring());
            }.bind(this)
        });
    },

    //状态打开
    onOpenAccountConfig: function (domain_id) {
        if (!window.confirm(_.str.sprintf('确认帐号 %s 打开吗?', domain_id))) {
            return;
        }
        this.setAccountConfig(domain_id, "status", "enabled");
    },

    //状态关闭
    onCloseAccountConfig: function (domain_id) {
        if (!window.confirm(_.str.sprintf('确认将帐号 %s 关闭吗?', domain_id))) {
            return;
        }
        this.setAccountConfig(domain_id, "status", "disabled");
    },

    onCopyProduct: function () {
        this.refs.copyProductDlg.showDlg();

        $.ajax({
            url: '/api/product/list',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify({page: 1, size: 10000}),
            success: function (resp) {
                this.setState({
                    copy_product_list: resp.list
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    doCopyProduct: function (product_list) {
        var data = {'domain_id': this.state.current_domain['domain_id'], 'product_list': product_list};
        alert(JSON.stringify(data));

        $.ajax({
            url: '/api/domain/copy_product',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify(data),
            success: function (resp) {
                alert(resp.msg);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    render: function () {
        var accountlist = this.state.account_list.map(function (account_info, index) {

            var title = account_info.title;
            var create_time = account_info.create_time;
            var domain_id = account_info.domain_id;
            var domain_name = account_info.domain_name;
            var hosts = account_info.hosts;
            var up_domain = account_info.up_domain;
            var up_user = account_info.up_user;

            var status = null;
            if (account_info.status == "enabled") {
                status = (
                    React.createElement("div", {className: "row"}, 
                        React.createElement("div", {className: "col-xs-6 border-1 p-left5 margin-none alert-success text-center"}, "状态: 打开"), 
                        React.createElement("div", {className: "col-xs-2 text-right"}, 
                            React.createElement("a", {href: "javascript:void(0);", className: "btn btn-danger btn-xs", 
                               onClick: this.onCloseAccountConfig.bind(this, domain_id)}, "关闭")
                        )
                    )
                );
            } else if (account_info.status == "disabled") {
                status = (
                    React.createElement("div", {className: "row"}, 
                        React.createElement("div", {className: "col-xs-6  border-1 p-left5 margin-none alert-danger text-center"}, "状态: 关闭"), 
                        React.createElement("div", {className: "col-xs-2"}, 
                            React.createElement("a", {href: "javascript:void(0);", className: "btn btn-info btn-xs", 
                               onClick: this.onOpenAccountConfig.bind(this, domain_id)}, "打开")
                        )
                    )
                );
            }

            var delbtn = (
                React.createElement("button", {type: "button", href: "javascript:void(0);", className: "btn btn-danger", 
                        onClick: this.onDelAccount.bind(this, account_info)}, React.createElement("i", {className: "icon-trash"}), " 删除")
            );

            var editbtn = (
                React.createElement("button", {type: "button", href: "javascript:void(0);", className: "btn btn-primary", 
                        onClick: this.onSelectAccount.bind(this, account_info)}, React.createElement("i", {className: "icon-edit-sign"}), " 详情"
                )
            );

            return (
                React.createElement("tr", null, 
                    React.createElement("td", null, domain_id), 
                    React.createElement("td", null, domain_name), 
                    React.createElement("td", null, title), 
                    React.createElement("td", null, hosts), 
                    React.createElement("td", null, up_domain), 
                    React.createElement("td", null, up_user), 
                    React.createElement("td", null, create_time), 
                    React.createElement("td", null, status), 
                    React.createElement("td", null, 
                        React.createElement("div", {className: "btn-toolbar pull-right", role: "toolbar", "aria-label": ""}, 
                            React.createElement("div", {className: "btn-group btn-group-xs", role: "group", "aria-label": ""}, 
                                delbtn, 
                                editbtn
                            )
                        )
                    )
                )
            );
        }.bind(this));

        return (
            React.createElement("div", {className: "wrapper"}, 
                React.createElement("div", {className: "col-md-12"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "帐号列表"), 
                            React.createElement("a", {className: "btn btn-info pull-right", href: "javascript:void(0);", 
                               onClick: this.onClickAddAccount}, React.createElement("i", {className: "icon-plus"}), " 新增帐号")
                        ), 
                        React.createElement("div", {className: "panel-body"}, 
                            React.createElement("table", {className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "域标识"), 
                                    React.createElement("th", null, "域名称"), 
                                    React.createElement("th", null, "标题"), 
                                    React.createElement("th", null, "域名"), 
                                    React.createElement("th", null, "上游域标识"), 
                                    React.createElement("th", null, "上游用户"), 
                                    React.createElement("th", null, "创建时间"), 
                                    React.createElement("th", null, 
                                        React.createElement("div", {className: "col-xs-6 text-right"}, "状态")
                                    ), 
                                    React.createElement("th", null, 
                                        React.createElement("div", {className: "col-xs-6 text-right"}, "操作")
                                    )
                                )
                                ), 
                                React.createElement("tbody", null, 
                                accountlist
                                )
                            )
                        )
                    )
                ), 

                React.createElement(ProductList, {
                    product_list: this.state.product_list, 
                    page: this.state.page, 
                    max: this.state.max, 
                    onLoadPage: this.loadProductList, 
                    onCopyProduct: this.onCopyProduct}
                ), 

                React.createElement(AddAccountDlg, {ref: "AddAccountDlg", 
                               onAddAccount: this.onAddAccount, 
                               user_list: this.state.user_list, 
                               account_list: this.state.account_list, 
                               template_list: this.state.template_list}
                ), 

                React.createElement(CopyProductDlg, {ref: "copyProductDlg", 
                                doCopyProduct: this.doCopyProduct, 
                                copy_product_list: this.state.copy_product_list})
            )
        );
    }
});

var ProductList = React.createClass({displayName: "ProductList",
    onLoadPage: function (page) {
        this.props.onLoadPage(undefined, page);
    },

    onCopyProduct: function () {
        this.props.onCopyProduct();
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
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default disabled", type: "button"}, 
                    React.createElement("i", {className: btn.icon})
                ));
            } else if (btn['icon']) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default", type: "button", 
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    React.createElement("i", {className: btn.icon})
                ));
            } else if (btn.index == p) {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-primary", type: "button", 
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    btn.title
                ));
            } else {
                return (React.createElement("button", {key: 'p' + i, className: "btn btn-default", type: "button", 
                                onClick: this.onLoadPage.bind(this, btn.index)}, 
                    btn.title
                ));
            }
        }.bind(this));

        return page_group;
    },

    render: function () {
        var productNode = this.props.product_list.map(function (product, index) {

                return (
                    React.createElement("tr", null, 
                        React.createElement("td", null, product.id), 
                        React.createElement("td", null, product.name), 
                        React.createElement("td", {className: "text-center"}, product.type_n), 
                        React.createElement("td", {className: "text-center"}, product.carrier_n), 
                        React.createElement("td", {className: "text-right"}, product.price), 
                        React.createElement("td", {className: "text-center"}, product.area_n), 
                        React.createElement("td", {className: "text-center"}, product.use_area_n), 
                        React.createElement("td", {className: "text-center"}, product.status_n), 
                        React.createElement("td", null, product.tsp)
                    )
                )
            }.bind(this)
        );

        var page_group = this.getPagination(this.props.page, this.props.max);

        return (
            React.createElement("div", {className: "col-lg-12"}, 
                React.createElement("section", {className: "panel"}, 
                    React.createElement("header", {className: "panel-heading row"}, 
                        React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), "下游产品列表"), 
                        React.createElement("a", {className: "btn btn-info pull-right", href: "javascript:void(0);", 
                           onClick: this.onCopyProduct}, React.createElement("i", {className: "icon-plus"}), " 添加产品")
                    ), 
                    React.createElement("div", {className: "panel-body table-responsive"}, 
                        React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                            React.createElement("thead", null, 
                            React.createElement("tr", null, 
                                React.createElement("th", null, "产品编号"), 
                                React.createElement("th", null, "产品名称"), 
                                React.createElement("th", null, "类型"), 
                                React.createElement("th", {className: "text-center"}, "运营商"), 
                                React.createElement("th", {className: "text-right"}, "面值"), 
                                React.createElement("th", {className: "text-center"}, "充值地区"), 
                                React.createElement("th", {className: "text-center"}, "使用地区"), 
                                React.createElement("th", {className: "text-center"}, "当前状态"), 
                                React.createElement("th", {className: "text-right"}, "采购价格"), 
                                React.createElement("th", {className: "text-center"}, "操作"), 
                                React.createElement("th", null, "上线日期")
                            )
                            ), 
                            React.createElement("tbody", null, 
                            productNode
                            )
                        )
                    ), 
                    React.createElement("div", {className: "row"}, 
                        React.createElement("div", {className: "col-sm-12"}, 
                            React.createElement("div", {className: "btn-row dataTables_filter"}, 
                                React.createElement("div", {id: "page_group", className: "btn-group"}, 
                                    page_group
                                )
                            )
                        )
                    )
                )
            )
        );
    }
});

//新增帐号弹窗
var AddAccountDlg = React.createClass({displayName: "AddAccountDlg",
    onOk: function () {
        var domain_name = $('#domain_name').val();
        var domain_id = $('#domain_id').val();

        //前台数据监测这个帐号名字是否已经存在了
        for (var i in this.props.account_list) {
            if (domain_name == this.props.account_list[i].domain_name) {
                alert("这个名字已经被使用了， 换一个!!!");
                return;
            }
        }

        if (domain_id.length < 6) {
            alert("域标识必须为6位数字!!!");
            return;
        }

        var template_list = [];

        $("#check_template").find("input").each(function (i) {
            if ($(this).prop('checked')) {
                template_list.push($(this).val())
            }
        });

        alert(JSON.stringify(template_list));

        var new_account_info = {
            domain_id: $('#domain_id').val(),
            domain_name: $('#domain_name').val(),
            title: $('#title').val(),
            hosts: $('#hosts').val(),
            up_domain: $('#up_domain').val(),
            up_user: $('#up_user').val(),
            id_start: $('#id_start').val(),
            id_end: $('#id_end').val(),
            template_list: template_list
        };

        this.props.onAddAccount(new_account_info);
    },

    onInputKeyUp: function (input_id) {
        $('#' + input_id).keydown(
            function (e) {
                if (!e) var e = window.event;
                if (input_id == 'domain_id') {
                    if (((e.keyCode >= 48) && (e.keyCode <= 57)) || ((e.keyCode >= 96) && (e.keyCode <= 105)) || e.keyCode == 9 || e.keyCode == 8 || e.keyCode == 37 || e.keyCode == 39) {
                    } else {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    ;
                } else {
                    if (e.keyCode == 32) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    ;
                }
                ;
            });

        var domain_id = $('#domain_id').val();
        var domain_name = $('#domain_name').val();
        var title = $('#title').val();
        var hosts = $('#hosts').val();

        if (domain_id.length > 0 && domain_name.length > 0 && title.length > 0 && hosts.length > 0) {
            $('#add_new_account_btn').removeClass('disabled');
        } else {
            $('#add_new_account_btn').addClass('disabled');
        }
        ;
    },

    showDlg: function () {
        $('#add_account_dlg').modal('show');
        $('#add_account_dlg input').val('');
        $('#add_new_account_btn').addClass('disabled');
        $('#up_user').selectpicker('val', '');
    },

    hideDlg: function () {
        $('#add_account_dlg').modal('hide');
    },

    render: function () {
        var up_domain_node = [];
        //console.log(this.props.user_list);
        if (this.props.user_list != null) {
            up_domain_node = this.props.user_list.map(function (u, i) {
                return (React.createElement("option", {value: u.id, "data-subtext": u.tags}, u.id, " - ", u.name));
            });
        }

        var templateNode = this.props.template_list.map(function (template, index) {
            return (
                React.createElement("div", {className: "checkbox"}, 
                    React.createElement("label", null, " ", React.createElement("input", {value: template.id, type: "checkbox"}), template.name)
                )
            );
        });

        return (
            React.createElement("div", {className: "modal fade", id: "add_account_dlg", tabIndex: "-1", role: "dialog", "aria-labelledby": "addModalLabel", 
                 "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title"}, "新增下级平台")
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 
                                React.createElement("label", {className: "col-md-2 control-label"}, "平台标识"), 
                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {maxLength: "6", className: "m-bot15 form-control input-sm", id: "domain_id", 
                                           placeholder: "6位数字", 
                                           onKeyUp: this.onInputKeyUp.bind(this,'domain_id')}
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "平台名称"), 
                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "domain_name", 
                                           onKeyUp: this.onInputKeyUp.bind(this,'domain_name')}
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "标题"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "title", 
                                           onKeyUp: this.onInputKeyUp.bind(this,'title')}
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "域名"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("input", {className: "m-bot15 form-control input-sm", id: "hosts", 
                                           onKeyUp: this.onInputKeyUp.bind(this, 'hosts')}
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "用户ID段"), 
                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {maxLength: "6", className: "m-bot15 form-control input-sm", id: "id_start", 
                                           placeholder: "开始"}
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "至"), 
                                React.createElement("div", {className: "col-md-4"}, 
                                    React.createElement("input", {maxLength: "6", className: "m-bot15 form-control input-sm", id: "id_end", 
                                           placeholder: "结束"}
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "上游用户"), 
                                React.createElement("div", {className: "col-md-10"}, 
                                    React.createElement("select", {className: "form-control input-sm m-bot15", id: "up_user", 
                                            "data-live-search": "true"}, 
                                        React.createElement("option", {value: ""}), 
                                        up_domain_node
                                    )
                                ), 

                                React.createElement("label", {className: "col-md-2 control-label"}, "用户模板"), 
                                React.createElement("div", {id: "check_template", className: "col-md-10"}, 
                                    templateNode
                                )

                            )
                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {id: "add_new_account_btn", type: "button", className: "btn btn-danger", 
                                    onClick: this.onOk}, "新建"
                            ), 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                        )
                    )
                )
            )
        )
    }
});

var CopyProductDlg = React.createClass({displayName: "CopyProductDlg",

    selectAll: function () {
        $("#full_product").find("input").prop('checked', $("#input_full").prop('checked'));
    },

    showDlg: function () {
        $('#copy_product_dlg').modal('show');
    },

    doCopyProduct: function () {
        var product_list = [];

        $("#full_product").find("input").each(function (i) {
            if ($(this).prop('checked')) {
                product_list.push($(this).val())
            }
        });
        console.debug(product_list);
        this.props.doCopyProduct(product_list);
    },

    render: function () {
        var productNode = this.props.copy_product_list.map(function (product, index) {
            return (
                React.createElement("div", {className: "checkbox"}, React.createElement("label", null, " ", React.createElement("input", {value: product.id, type: "checkbox"}), product.name)
                ));
        });

        return (
            React.createElement("div", {className: "modal fade", id: "copy_product_dlg", tabIndex: "-1", role: "dialog", 
                 "aria-labelledby": "addModalLabel", 
                 "aria-hidden": "true"}, 
                React.createElement("div", {className: "modal-dialog"}, 
                    React.createElement("div", {className: "modal-content"}, 
                        React.createElement("div", {className: "modal-header"}, 
                            React.createElement("h4", {className: "modal-title"}, "添加产品")
                        ), 
                        React.createElement("div", {className: "modal-body form-horizontal"}, 
                            React.createElement("div", {className: "form-group add-pro-body"}, 
                                React.createElement("div", {className: "col-md-12"}, 
                                    React.createElement("div", {className: "checkbox"}, React.createElement("label", null, 
                                        React.createElement("input", {id: "input_full", value: "", type: "checkbox", onClick: this.selectAll}), 
                                        "全选 "))
                                ), 
                                React.createElement("div", {id: "full_product", className: "col-md-12", 
                                     style: {'maxHeight': '300px', 'overflowY': 'scroll'}}, 
                                    productNode
                                )
                            )
                        ), 
                        React.createElement("div", {className: "modal-footer form-horifooter"}, 
                            React.createElement("button", {id: "add_new_account_btn", type: "button", className: "btn btn-danger", 
                                    onClick: this.doCopyProduct}, "确定"
                            ), 
                            React.createElement("button", {type: "button", className: "btn btn-default", "data-dismiss": "modal"}, "取消")
                        )
                    )
                )
            )
        );


    }
});

React.render(
    React.createElement(MainContent, null)
    ,
    document.getElementById('main-content')
);
