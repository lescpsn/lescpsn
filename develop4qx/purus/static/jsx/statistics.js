var StatisticsPanel = React.createClass({

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
                <div key={i1} className='col-md-1 col-lg-1'>
                    <a className='btn btn-info' onClick={this.onChangeProfile.bind(this, i1)}>{profile.name}</a>
                </div>
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
                    <tr key={i3} style={divStyle}>
                        <td>{stat.area}</td>
                        <td className="text-right">{t}</td>
                        <td className="text-right">{s}({sp})</td>
                        <td className="text-right">{f}({fp})</td>
                        <td className="text-right">{p}({pp})</td>
                    </tr>

                );
            }.bind(this));

            asp = (as / at * 100).toFixed(1) + '%';
            afp = (af / at * 100).toFixed(1) + '%';
            app = (ap / at * 100).toFixed(1) + '%';

            return (
                <div key={i2} className="col-md-6 col-lg-4">
                    <section className="panel">
                        <header className="panel-heading row">
                            <span className="pull-left"><i className="icon-table"></i>{stat_list.name}</span>
                        </header>

                        <div className="panel-body table-responsive">
                            <table id="order_result" className="table table-striped table-hover">
                                <thead>
                                <tr>
                                    <th>区域</th>
                                    <th className="text-right">合计</th>
                                    <th className="text-right">成功</th>
                                    <th className="text-right">失败</th>
                                    <th className="text-right">充值中</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>合计</td>
                                    <td className="text-right">{at}</td>
                                    <td className="text-right">{as}({asp})</td>
                                    <td className="text-right">{af}({afp})</td>
                                    <td className="text-right">{ap}({app})</td>
                                </tr>
                                {node}
                                </tbody>
                            </table>
                        </div>

                    </section>
                </div>
            );
        }.bind(this));


        var profile_name = '';
        if (this.state.profile_list.length > 0) {
            profile_name = this.state.profile_list[this.state.current_profile]['name'];
        }

        return (
            <section className="wrapper">

                <div className="row">
                    <div className="col-lg-12">
                        <section className="panel">
                            <header className="panel-heading row">
                                <span className="pull-left"><i className="icon-table"></i>
                                    实时统计
                                    <span className="badge bg-important">{profile_name}</span>
                                </span>
                                <span className="pull-right">
                                    <span className="badge bg-important">{this.state.count_down}</span>
                                </span>
                            </header>

                            <div className="panel-body row">
                                {profileNode}
                            </div>
                        </section>

                        {blockNodes}
                    </div>
                </div>
            </section>
        );
    }
});


React.render(
    <StatisticsPanel />
    ,
    document.getElementById('main-content')
);

