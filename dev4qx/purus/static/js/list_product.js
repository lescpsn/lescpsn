var Script = function () {
	$(".alter_list").bind("click",function(){//价格调整
		var _this = $(this);
		var _tr = _this.parent().parent();
		var txt =_tr.find(".price_color").text();
		var input = $("<input class='list_price' type='text' size='5' value='" + txt + "'/>");
		var txt_2 = _tr.find(".list_price").val();
		if(_tr.hasClass("list_tr")){
			return false;
		}else{
			if(_this.hasClass("li_on")){
				_this.html("修改").removeClass("li_on");
				_tr.find(".price_color").html(txt_2);
			}else{
				_this.html("保存").addClass("li_on");
				_tr.find(".price_color").html(input);
			}
			
		}
	});
	$(".list_open").bind("click",function(){//打开关闭
		var _this2 = $(this);
		var _tr2 = _this2.parent().parent();
		if(_this2.hasClass("list_on")){
			_this2.html("打开").removeClass("list_on");
			_tr2.removeClass("list_tr");
			_tr2.find('.alter_list').removeClass("alter_list");
		}else{
			_this2.html("关闭").addClass("list_on");
			_tr2.addClass("list_tr");
			_tr2.find('.alter_list').removeClass("alter_list");
		}
	});
}();