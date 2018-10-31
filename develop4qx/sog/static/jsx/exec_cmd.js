var CmdInput = React.createClass({		
  handleCommandSubmit: function(comment){
      $.ajax({
      	url: "/api/command",
      	dataType: 'json',
      	type: 'POST',
      	data: comment,
        success: function(resp_data) {
        	console.info("************t101:"); 
          this.setState({output: resp_data.data});
        }.bind(this)          
      
      });      
		this.props.onCommandSubmit({ host_id: host_id, command: command});
		this.refs.command='';
		return;  	
  },
      	
	getInitialState: function() {
  return {host_ip: "192.168.1.189" };
  },    
      
  render: function(){
    return(
        <div className="panel">
                <header className="panel-heading">
                执行命令
                </header>
                <div className="panel-body">
                    <div className="form">
                        <form className="form-validate form-horizontal" id="" method="post" action="">
                            <div className="form-group">
                                <label htmlFor="cname" className="control-label col-lg-1">{this.state.host_ip}<span className="required">*</span></label>
                                <div className="col-lg-9">
                                    <input className="form-control" id="cname" name="fullname" minlength="5" type="text" required />
                                </div>                                
                                <button className="btn btn-primary" id="" method="post" type="submit" onClick={this.handleCommandSubmit}>执行</button>
                            </div>                                
                        </form>
                    </div>
                </div>
        </div>
    );
  }
});

var CmdOutput = React.createClass({
  render: function(){
    var output = this.props.output;
    var outputLine = this.props.output.map(function (outputline) {
      return (
          <p>{outputline}</p>
      );
    });
    return(
        <div className="row">
        <div className="col-lg-12">
        <section className="panel">
        <header className="panel-heading">
        执行结果(192.168.1.1)
      </header>
        <div className="panel-body">
        {outputLine}
      </div>
        </section>
        </div>
        </div>
    );
  }
});

var ExecCmd = React.createClass({  	  	  	        
  getInitialState: function() {
    return {output: [
      "Filesystem     1K-blocks    Used Available Use% Mounted on",
      "udev             1000052       0   1000052   0% /dev",
      "tmpfs             203108    9140    193968   5% /run",
      "/dev/sda1       59732092 5892376  50782464  11% /",
      "tmpfs            1015528       0   1015528   0% /dev/shm",
      "tmpfs               5120       0      5120   0% /run/lock",
      "tmpfs            1015528       0   1015528   0% /sys/fs/cgroup",
      "tmpfs             203108       0    203108   0% /run/user/1000",
    ]
    };
  },
  render: function () {
    var output = this.state.output;
    return(
	<div className="commentBox">
  <CmdInput />  
	<CmdOutput output={output} />
	</div>
    );
  }
});

React.render(
    <ExecCmd  />,
  document.getElementById('main-content')
);




