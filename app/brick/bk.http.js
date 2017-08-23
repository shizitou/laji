/* eslint-disable */
define('$DeferByPromise', function() {
	/**
		这里是做了一个基于Promise的defer类，
		但和$.Deferred还是有些区别：
			resolve,reject 只接受一个参数
			$.Deferred(fn) 这里的fn将接受到原生Promise的两个触发方法
		处理了fail队列触发时异常处理
	*/
	if (!window.Promise)
		return console.error('当前浏览器不支持window.Promise | ' + navigator.userAgent);

	function Deferred() {
		var self = this;
		var _promise = new window.Promise(function(resolve, reject) {
			self.resolve = function(data) {
				resolve(data);
			};
			self.reject = function(data) {
				reject(data);
			};
		});
		self.done = function() {
			(function add(args) {
				[].forEach.call(args, function(arg) {
					if (typeof arg === "function") {
						return self.then(arg, function() {}); // ?? why ??
					} else if (arg && arg.length && typeof arg !== 'string') {
						add(arg)
					}
				});
			})(arguments);
			return this;
		};
		self.fail = function() {
			(function fail(args) {
				[].forEach.call(args, function(arg) {
					if (typeof arg === "function") {
						return self.then(null, arg);
					} else if (arg && arg.length && typeof arg !== 'string') {
						fail(arg)
					}
				});
			})(arguments);
			return this;
		};
		self.then = function(done, fail) {
			var newPro = new Deferred();

			function handlerReturn(returned) {
				returned instanceof Promise &&
					returned.done(newPro.resolve).fail(newPro.reject)
			}
			_promise.then(function(data) {
				handlerReturn(done && done(data));
			}, function(data) {
				handlerReturn(fail && fail(data));
			});
			return newPro;
		};
	}
	return Deferred;
});
define('$dataCacheBySession', function(require) {
	var hash = '';
	var sessionStorage = window.sessionStorage || function() {};

	function getItem(key) {
		try {
			return sessionStorage.getItem(key);
		} catch (_e) {}
	}

	function setItem(key, val) {
		try {
			this.sessionStorage.setItem(key, val);
		} catch (_e) {}
	}

	function getKey(queryUrl, type, data) {
		var loc = location;
		return hash + '|' + type.slice(0, 1) + '|' +
			normalize(loc.host + loc.pathname + '/' + queryUrl) + '|' +
			joinData(data);
	}
	return {
		setHash: function(h) {
			hash = h;
		},
		set: function(queryUrl, type, data, result) {
			typeof result === 'string' || (result = JSON.stringify(result));
			return setItem(getKey(queryUrl, type, data), result);
		},
		get: function(queryUrl, type, data) {
			return getItem(getKey(queryUrl, type, data));
		}
	};
	//路径处理，合理去除掉 ./ ../ //
	function normalize( /*pathA[,pathB,pathC]*/ ) {
		var path = [];
		var i, arg, parts;
		for (i = 0; i < arguments.length; i++) {
			arg = arguments[i];
			arg && path.push(arg);
		}
		// 利用帮助函数获取文件路径的信息
		parts = path.join('/').replace(/^[\/]{2,}/, '\\').split(/[\\\/]+/);
		path = [];
		// 遍历数组，处理数组中的相对路径字符 '.' 或者'..'
		for (i = 0; i < parts.length; i++) {
			// 取得当前的数组的字符
			var p = parts[i];
			// 对空或者'.'不处理
			if (!p || p === '.')
				continue;
			// 处理相对路径中的'..'
			if (p === '..') {
				if (path.length && path[path.length - 1] !== '..') {
					// 直接弹出返回队列，当没有到达根目录时
					path.pop();
				} else {
					path.push('..');
				}
			} else {
				// 非 '.' 和'..'直接插入返回队列。 
				path.push(p);
			}
		}
		return path.join('/');
	}

	function joinData(obj) {
		var resArr = [];
		for (var n in obj) {
			resArr.push('' + n + obj[n]);
		}
		return resArr.join('|');
	}
});
define('$http', ['$config'], function(require) {
	var config = require('$config'),
		bigPipe = require('$bigPipe'),
		Defer = require('$DeferByPromise'),
		xhr,
		Deferred, sessionStore;

	function checkXhr() {
		//已经有了
		if (xhr) return true;
		//当前页面还未加载jquery, zepto
		if (!window.$ || !window.$.ajax) return false;
		xhr = $.ajax;
		//屏蔽掉$上的ajaxAPI,让开发者强制使用$http模块
		delete $.ajax, delete $.get, delete $.post;
		// Deferred = $ && $.Deferred ?
		// 	$.Deferred :
		// 	window.Promise ? require('$DeferByPromise') : null;
		// sessionStore = require('$dataCacheBySession');
		return true;
	}

	function parseArguments(url, data, success, dataType) {
		if (typeof url === 'object') // {url:, data:, success:}
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

	function ajax(options) {
		var bigPipeTip;
		var xhrForBigPipe;
		var deferForBigPipe;
		if (options.$bigPipe && bigPipe) { //启用了 $bigpipe
			bigPipeTip = '-这里是$bigPipe的xhr中间层-';
			xhrForBigPipe = {
				_aborted: false,
				open: function(){
					// console.log(bigPipeTip+'open');
				},
				abort: function(statusText) {
					// console.log(bigPipeTip+'abort');
					xhrForBigPipe._aborted = statusText || true;
				},
				getAllResponseHeaders: function() {},
				getResponseHeader: function(key) { 
					// console.log(bigPipeTip+'getResponseHeader');
					return 'text/plain'; 
				},
				setRequestHeader: function(name, value) {
					// console.log(bigPipeTip+'setRequestHeader');
				},
				overrideMimeType: function(type) {
					// console.log(bigPipeTip+'overrideMimeType');
				},
				statusCode: function(map) {
					// console.log(bigPipeTip+'statusCode');
				},
				send: function(){
					// console.log(bigPipeTip+'send');
				},
				readyState: 1,
				status: 0,
				responseText: '',
			};
			options.xhr = function(){
				return xhrForBigPipe;
			}
			deferForBigPipe = xhr(options);
			//读取bigPipe缓存中的数据
			bigPipe.use(options.$bigPipe, function(pipeData) {
				//如果已经被执行了取消，则不需要执行后续了
				if(xhrForBigPipe._aborted){
					console.log('###### ',xhrForBigPipe._aborted);
					_readyStateChange({
						readyState: 4,
						status: 0,
						statusText: xhrForBigPipe._aborted === true ? '' : xhrForBigPipe._aborted
					});
				}else if(pipeData) { //有缓存的时候,直接触发 xhr 的返回操作
					typeof pipeData === 'string' || (pipeData = JSON.stringify(pipeData))
					_readyStateChange({
						readyState: 4,
						status: 200,
						responseText: pipeData
					});
				} else { //没缓存的时候，发起请求
					var sendXhr;
					delete options.xhr;
					if(options.beforeSend) delete options.beforeSend;
				    if(options.success) delete options.success;
				    if(options.error) delete options.error;
				    if(options.complete) delete options.complete;
				    options.complete = function(){
				    	delete options.complete;
				    	if(xhrForBigPipe._aborted){
				    		_readyStateChange({
								readyState: 4,
								status: 0,
								statusText: xhrForBigPipe._aborted === true ? '' : xhrForBigPipe._aborted
							});
				    	}else{
				    		_readyStateChange({
					    		readyState: sendXhr.readyState,
								response: sendXhr.response,
								responseText: sendXhr.responseText,
								responseType: sendXhr.responseType,
								responseURL: sendXhr.responseURL,
								responseXML: sendXhr.responseXML,
								state: sendXhr.state,
								status: sendXhr.status,
								statusText: sendXhr.statusText
					    	});
				    	}
				    }
					sendXhr = xhr(options);
				}
			});
			return deferForBigPipe;
		} else {
			return xhr(options);
		}
		function _readyStateChange(copyXhr){
			for(var n in copyXhr){
				xhrForBigPipe[n] = copyXhr[n];
			}
			xhrForBigPipe.onreadystatechange();
		}
	}
	var http = {
		ajax: function(options) {
			if (!checkXhr())
				throw new Error('your code must include $.ajax');
			//处理配置信息
			+ options.timeout === options.timeout ||
				(options.timeout = config.ajaxTimeout);
			options.dataType ||
				(options.dataType = config.ajaxDataType);
			typeof options.cache === 'undefined' &&
				(options.cache = config.ajaxCache);
			typeof options.cacheFilter === 'undefined' &&
				(options.cacheFilter = config.ajaxCacheFilter);
			options.cacheHash ||
				(options.cacheHash = config.ajaxCacheHash);
			options.$bigPipe ||
				(options.$bigPipe = config.ajax$bigPipe);
			return ajax(options);
		},
		get: function( /* url, data, success, dataType */ ) {
			var options = parseArguments.apply(null, arguments);
			options.type = 'GET';
			return http.ajax(options);
		},
		post: function( /* url, data, success, dataType */ ) {
			var options = parseArguments.apply(null, arguments);
			options.type = 'POST';
			return http.ajax(options);
		}
	};
	return http;
});