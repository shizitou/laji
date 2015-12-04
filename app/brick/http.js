define('$http',['$config'], function(require) {
	//这里需要对zepto强化一些操作： then,when
	var xhr = window.$ && $.ajax,
		support = !!xhr,
		config = require('$config');
	//屏蔽掉$上的ajaxAPI,让开发者强制使用$http模块
	if(xhr)
		delete $.ajax,delete $.get,delete $.post;
		
	function ajax(options){
		//这里可以做些处理
		options.timeout || (options.timeout = config.ajaxTimeout );
		options.dataType || (options.dataType = config.ajaxDataType );
		options.cache || (options.cache = config.ajaxCache );
		return xhr(options);
	}

	var http = {
		ajax: function(options){
			if(!support)
				throw new Error('your code must include jquery or zepto:ajax');
			return ajax(options);
		},
		get: function(options){
			options.type = 'get'
			return http.ajax(options);
		},
		post: function(options){
			options.type = 'post'
			return http.ajax(options);
		}
	};
	return http;
});