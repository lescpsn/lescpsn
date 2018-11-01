var StatisticsPanel = React.createClass({displayName: "StatisticsPanel",

    getInitialState: function () {
        return {
            profile_list: [],
            stat_list: [],
            current_profile: 0,
            count_down: 30
        };
    },

    setRefresh: function () {
        var t = this.state.count_down - 1;

        if (t <= 0) {
            this.loadStatistics(this.state.current_profile);
            t = 30;
        }

        this.setState({count_down: t});
    },

    componentDidMount: function () {
        this.loadProfileList();
        setInterval(this.setRefresh, 1000);
    },

    loadProfileList: function () {
        $.ajax({
            url: '/services/statistics/profiles',
            dataType: 'json',
            type: 'get',
            success: function (data) {
                this.setState({profile_list: data});

                this.loadStatistics(0);
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },

    loadStatistics: function (profile_id) {

        //alert(profile_id);

        $.ajax({
            url: '/services/statistics',
            dataType: 'json',
            type: 'post',
            data: JSON.stringify({
                profile: profile_id
            }),

            success: function (resp) {
                //console.info(JSON.stringify(resp));

                this.setState({stat_list: resp.stat_list});
            }.bind(this),

            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
                this.setState({stat_list: []});
            }.bind(this)
        });
    },

    onChangeProfile: function (profile_id) {
        //alert(profile_id);
        this.setState({current_profile: profile_id});
        this.loadStatistics(profile_id);
    },

    render: function () {
        var profileNode = this.state.profile_list.map(function (profile, i1) {
            return (
                React.createElement("div", {key: i1, className: "col-md-1 col-lg-1"}, 
                    React.createElement("a", {className: "btn btn-info", onClick: this.onChangeProfile.bind(this, i1)}, profile.name)
                )
            );
        }.bind(this));

        //alert(JSON.stringify(this.state.stat_map));

        var blockNodes = this.state.stat_list.map(function (stat_list, i2) {

            var at = 0;
            var as = 0;
            var af = 0;
            var ap = 0;

            var node = stat_list.stat.map(function (stat, i3) {
                var t = stat.t;
                var s = stat.s;
                var f = stat.f;
                var p = stat.p;

                at += t;
                as += s;
                af += f;
                ap += p;

                if (t > 0) {
                    sp = (s / t * 100).toFixed(1) + '%';
                    fp = (f / t * 100).toFixed(1) + '%';
                    pp = (p / t * 100).toFixed(1) + '%';
                } else {
                    sp = 0;
                    fp = 0;
                    pp = 0;
                }

                var th = (s / t * 100);
                if (th > 90) {
                    divStyle = {color: 'green'};
                } else if (th > 80) {
                    divStyle = {color: 'blue'};
                } else {
                    divStyle = {color: 'red'};
                }

                return (
                    React.createElement("tr", {key: i3, style: divStyle}, 
                        React.createElement("td", null, stat.area), 
                        React.createElement("td", {className: "text-right"}, t), 
                        React.createElement("td", {className: "text-right"}, s, "(", sp, ")"), 
                        React.createElement("td", {className: "text-right"}, f, "(", fp, ")"), 
                        React.createElement("td", {className: "text-right"}, p, "(", pp, ")")
                    )

                );
            }.bind(this));

            asp = (as / at * 100).toFixed(1) + '%';
            afp = (af / at * 100).toFixed(1) + '%';
            app = (ap / at * 100).toFixed(1) + '%';

            return (
                React.createElement("div", {key: i2, className: "col-md-6 col-lg-4"}, 
                    React.createElement("section", {className: "panel"}, 
                        React.createElement("header", {className: "panel-heading row"}, 
                            React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), stat_list.name)
                        ), 

                        React.createElement("div", {className: "panel-body table-responsive"}, 
                            React.createElement("table", {id: "order_result", className: "table table-striped table-hover"}, 
                                React.createElement("thead", null, 
                                React.createElement("tr", null, 
                                    React.createElement("th", null, "区域"), 
                                    React.createElement("th", {className: "text-right"}, "合计"), 
                                    React.createElement("th", {className: "text-right"}, "成功"), 
                                    React.createElement("th", {className: "text-right"}, "失败"), 
                                    React.createElement("th", {className: "text-right"}, "充值中")
                                )
                                ), 
                                React.createElement("tbody", null, 
                                React.createElement("tr", null, 
                                    React.createElement("td", null, "合计"), 
                                    React.createElement("td", {className: "text-right"}, at), 
                                    React.createElement("td", {className: "text-right"}, as, "(", asp, ")"), 
                                    React.createElement("td", {className: "text-right"}, af, "(", afp, ")"), 
                                    React.createElement("td", {className: "text-right"}, ap, "(", app, ")")
                                ), 
                                node
                                )
                            )
                        )

                    )
                )
            );
        }.bind(this));


        var profile_name = '';
        if (this.state.profile_list.length > 0) {
            profile_name = this.state.profile_list[this.state.current_profile]['name'];
        }

        return (
            React.createElement("section", {className: "wrapper"}, 

                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-lg-12"}, 
                        React.createElement("section", {className: "panel"}, 
                            React.createElement("header", {className: "panel-heading row"}, 
                                React.createElement("span", {className: "pull-left"}, React.createElement("i", {className: "icon-table"}), 
                                    "实时统计", 
                                    React.createElement("span", {className: "badge bg-important"}, profile_name)
                                ), 
                                React.createElement("span", {className: "pull-right"}, 
                                    React.createElement("span", {className: "badge bg-important"}, this.state.count_down)
                                )
                            ), 

                            React.createElement("div", {className: "panel-body row"}, 
                                profileNode
                            )
                        ), 

                        blockNodes
                    )
                )
            )
        );
    }
});


React.render(
    React.createElement(StatisticsPanel, null)
    ,
    document.getElementById('main-content')
);

