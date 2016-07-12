define('$http',['$config'], function(require) {
	//这里需要对zepto强化一些操作： then,when
	var xhr = window.$ && $.ajax,
		support = !!xhr,
		config = require('$config');
	//屏蔽掉$上的ajaxAPI,让开发者强制使用$http模块
	if(xhr)
		delete $.ajax,delete $.get,delete $.post;

	function parseArguments(url, data, success, dataType) {
		if(typeof url === 'object') // {url:, data:, success:}
			return url;
		if (typeof data === 'function') // 'url', func, 'json'
			dataType = success, success = data, data = undefined;
		if (typeof success !== 'function') // 'url', {}, 'json' 
			dataType = success, success = undefined;
		return {
			url: url,
			data: data,
			success: success,
			dataType: dataType
		}
	}

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
				throw new Error('your code must include $.ajax');
			return ajax(options);
		},
		get: function(/* url, data, success, dataType */){
			var options = parseArguments.apply(null, arguments);
			options.type = 'GET';
			return http.ajax(options);
		},
		post: function(/* url, data, success, dataType */){
			var options = parseArguments.apply(null, arguments);
    		options.type = 'POST';
			return http.ajax(options);
		}
	};
	return http;
});