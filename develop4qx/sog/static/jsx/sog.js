var HostsInfo = React.createClass({
	  getHostsInfo: function(){
	  	  $.ajax({
	  		    url: '/api/upstream',
	  		    type: 'get',
	  		    dataType: 'json',
            success: function (resp_data) {
                if (resp_data.status == 'ok') {
                    //console.info(resp_data.data); 
                    this.setState({
                        hosts_info: resp_data.data,
                    });
                } 
                else {
                    alert("查询主机列表出错出错" );
                }
            }.bind(this),
	  		});
	  },

    getInitialState: function () {
//				        id: 200001,
//				        notes: "趣讯开机主机", 
//				        hostname: "ubuntu",
//				        ip: "192.168.1.159",
//				        load: ["0.04", "0.04", "0.05"],
//				        memory: {"used": "500M", "total": "2.0G", "free": "1.5G"},
//				        disk: [{"disk": "/dev/sda1", "mount": "/", "used": "10%"}]

	  	  return {
	  	      hosts_info: []
	  	  };
	  },

    componentDidMount: function () {
        this.getHostsInfo();
    },

    render: function () {
        var hosts_info = this.state.hosts_info;
        var hosts = hosts_info.map(function (host) {
            return (
            <div className="col-sm-4">
                <section className="panel">
                    <header className="panel-heading">
                              {host.ip}({host.hostname})[{host.notes}]
                    </header>
                    <table className="table">
                              <tbody>
                                <tr>
                                  <td>磁盘</td>
                                  <td>disk: {host.disk[0].disk}</td>
                                  <td>used: {host.disk[0].used}</td>
                                  <td>mount: /</td>
                                </tr>
                                <tr>
                                  <td>内存</td>
                                <td>total: {host.memory.total}</td>
                                  <td>used: {host.memory.used}</td>
                                  <td>free: {host.memory.free}</td>
                                </tr>
                                <tr>
                                  <td>负载均值</td>
                                  <td>1分钟: {host.load[0]}</td>
                                  <td>5分钟: {host.load[1]}</td>
                                  <td>15分钟: {host.load[2]}</td>
                                </tr>
                              </tbody>
                    </table>
                </section>
            </div> 
            );
        });
        return (
            <div className="row">
                { hosts }
            </div>
            );
    }
});

React.render(    
    <HostsInfo  />, 
    
    document.getElementById('hostsinfo')
);
