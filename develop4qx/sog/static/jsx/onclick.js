var ExeCommandInput = React.createClass({
  handleSubmit: function(e){
    e.preventDefault();
    var command = $("#command").val();

    if (!command){
      return;
    }
    console.info(command);
    console.info("*************");

    $("#command").val("");

    return;

  },

  render: function(){
  	var request_data = {host_id: '200001', command: 'pwd'};
    return(
        <form className="execommandinput">
	        <input type="text" id="command"/>
	        <buttom type="submit" onClick={this.props.onCommandSubmit.bind(this,request_data)}>发送</buttom>
        </form>
    );
  }
});

var ExeCommandOutput = React.createClass({
  render: function(){
    return(
        <div className="execommandoutput">
        {this.props.output}
        </div>
    );
  }
});

var ExeCommandBox = React.createClass({
  getInitialState: function() {
    return ({output:["ddddd"]});
  },

  handleCommandSubmit: function(requst_data){
    $.ajax({
      url: 'http://192.168.1.159:9999/api/command/',
      dataType: 'json',
      type: 'post',
      data: JSON.stringify(requst_data),
      success: function(resp_data) {
      	if(resp_data.status== "ok"){
      		alert("11111");
        this.setState({output: resp_data.data});
      	}else{
      	alert("22222");
      	}
      }.bind(this)

    });
  },

  render: function(){
    return(
        <div className="execommandbox">
        <ExeCommandInput onCommandSubmit={this.handleCommandSubmit} />
        <ExeCommandOutput output={this.state.output}/>
        </div>
    );
  }
});

React.render(
    <ExeCommandBox />,
    document.getElementById('main-content')
);
