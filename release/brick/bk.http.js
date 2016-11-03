define('$DeferByPromise', function() {
	/**
		这里是做了一个基于Promise的defer类，
		但和$.Deferred还是有些区别：
			resolve,reject 只接受一个参数
			$.Deferred(fn) 这里的fn将接受到原生Promise的两个触发方法
		处理了fail队列触发时异常处理
	*/
	if (!window.Promise) return;

	//为Promise实例绑定done,fail方法
	Promise.prototype.done = function() {
		var defer = this;
		(function add(args) {
			[].forEach.call(args, function(arg) {
				if (typeof arg === "function") {
					return defer.then(arg, function() {}); // ?? why ??
				} else if (arg && arg.length && typeof arg !== 'string') {
					add(arg)
				}
			});
		})(arguments);
		return this;
	}
	Promise.prototype.fail = function() {
			var defer = this;
			(function add(args) {
				[].forEach.call(args, function(arg) {
					if (typeof arg === "function") {
						return defer.then(null, arg);
					} else if (arg && arg.length && typeof arg !== 'string') {
						add(arg)
					}
				});
			})(arguments);
			return this;
		}
		//处理抛异常的情况
	Promise.prototype._then = Promise.prototype.then;
	Promise.prototype.then = function(done, fail) {
		var newPro = new Promise();

		function handlerReturn(returned) {
			returned instanceof Promise &&
				returned.done(newPro.resolve).fail(newPro.reject)
		}
		this._then(function(res) {
			handlerReturn(done && done(res));
		}, function(res) {
			handlerReturn(fail && fail(res));
		});
		return newPro;
	}
	window._Promise = Promise;
	//为Promise实例绑定resolve,reject方法
	window.Promise = function(callback) {
		var res, rej;
		var pro = new _Promise(function(resolve, reject) {
			res = function(res) {
				resolve(res);
			};
			rej = function(res) {
				reject(res);
			};
			callback && callback(res, rej);
		});
		pro.resolve = res;
		pro.reject = rej;
		return pro;
	}
	Promise.prototype = _Promise.prototype;
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
	//这里需要对zepto强化一些操作： then,when
	var xhr = window.$ && $.ajax,
		support = !!xhr,
		config = require('$config'),
		Deferred, sessionStore;
	//屏蔽掉$上的ajaxAPI,让开发者强制使用$http模块
	if (support) {
		Deferred = $ && $.Deferred ?
			$.Deferred :
			window.Promise ?
			(require('$DeferByPromise'), Promise) : null;
		delete $.ajax, delete $.get, delete $.post;
		sessionStore = require('$dataCacheBySession');
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
		var result;
		var url = options.url,
			type = options.type,
			data = options.data,
			dataType = options.dataType,
			success = options.success,
			defer;
		if (options.cache) {
			sessionStore.setHash(options.cacheHash);
			result = sessionStore.get(url, type, data);
			//根据请求类型返回对应结果： json,text
			if (result && dataType === 'json') {
				try {
					result = JSON.parse(result);
				} catch (_e) {};
			}
			if (result) {
				if(Deferred){ //创建一个defer对象，将回调添加进去
					defer = new Deferred();
					success && defer.done(success);
				}
				setTimeout(function() {
					defer ?
						defer.resolve(result, 'success') : 
						success && success(result,'success') ;
				}, 4);
				return defer;
			}
		}

		//发送请求
		return xhr({
			url: url,
			type: type,
			data: data,
			dataType: dataType,
			timeout: options.timeout,
			cache: options.cache,
			success: function(result) {
				var pass;
				if (options.cache) {
					pass = typeof options.cacheFilter === 'function' ?
						!!options.cacheFilter(result) : false;
					pass && sessionStore.set(url, type, data, result);
				}
				success && success(result);
			},
			error: function(result) {
				options.error && options.error(result);
			}
		});
	}

	var http = {
		ajax: function(options) {
			if (!support)
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