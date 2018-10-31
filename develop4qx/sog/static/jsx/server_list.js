var ServerList = React.createClass({	
  getServerList: function(){
    $.ajax({
      url: '/api/overview/list',
      type: 'get',
      dataType: 'json',
      success: function (resp_data) {
        if (resp_data.status == 'ok') {
          //console.info(resp_data.data);
          this.setState({
            server_list: resp_data.data,
          });
        }
        else {
          alert("查询主机列表出错" );
        }
      }.bind(this),
    });
  },


	handleConnetClick: function(){
		this.setState({host_ip: '192.168.1.11'});
	},
				  
  		
  componentDidMount: function () {
    this.getServerList();
  },

  getInitialState: function() {
    return {server_list: []
    	   };
  },
  render: function () {
    var serverNodes = this.state.server_list.map(function (server) {
      return (
          <div><button className="btn btn-primary" onClick={this.handleConnetClick}>{server.ip}连接</button></div>
        
      );
    }.bind(this));

    return(
        <li className="active">
	        <a className="" href="sog_execmd.html" >
	        	<i className="icon_table" />
	        	<span>日志查询</span>
	        </a>
	      
	        <ul className="sub">
	        	{serverNodes}
	      	</ul>
        </li>
    );
  }
});

React.render(
    <ServerList  />,
    document.getElementById('log_query')
);

