var Script = function () {
	$(".alter_list").bind("click",function(){//价格调整
		var _this = $(this);
		var _tr = _this.parent().parent();
		var txt = _tr.find(".price_color");
		var txt_2 = _tr.find("input");
		if(_this.hasClass("li_on")){
			for(var j=0;j<txt_2.length;j++){
				_tr.find(".price_color").eq(j).html(txt_2.eq(j).val());
				//alert(txt_2.eq(j).val())
			}
			_this.html("修改").removeClass("li_on");
		}else{
			for(var i=0;i<txt.length;i++){
				_tr.find(".price_color").eq(i).html("<input type='text' size='5' value='" + txt.eq(i).text() + "'/>");
			}
			_this.html("保存").addClass("li_on");
		}
	});
}();