/* eslint-disable */
define('$util', function() {
	var util = {};
	util.clone = function(obj) {
		return JSON.parse(JSON.stringify(obj));
	};

	function _alert(text, time) {
		var el, winW, winH,
			self = _alert;
		if (el = self.el) {
			self._timeCon && clearTimeout(self._timeCon);
			el.style.display = 'block';
			el.innerText = text;
			//计算在页面中显示的位置
			//BUG:: 多次调用时，会重复监听
			window.addEventListener('resize', function() {
				self.setPos();
			}, false);
			self.setPos();
			//设置消失时间
			self._timeCon = setTimeout(function() {
				abort();
			}, (time || 1) * 1000);
			return abort;
		} else {
			throw new Error('未指定弹出框元素');
		}

		function abort() {
			self._timeCon && clearTimeout(self._timeCon);
			el.style.display = 'none';
		};
	}
	_alert.setEl = function(el) {
		this.el = el[0] || el;
	};
	_alert.setPos = function() {
		var el = this.el,
			win = window;
		el.style.position = 'fixed';
		el.style.left = Math.ceil((win.innerWidth - el.offsetWidth) / 2) + 'px';
		el.style.top = Math.ceil((win.innerHeight - el.offsetHeight) / 2) + 'px';
	};
	util.alert = _alert;
	//获取页面hash字符串
	util._getFragment = function(hash) {
		// IE6直接用location.hash取hash，可能会取少一部分内容
		// 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
		// ie6 => location.hash = #stream/xxxxx
		// 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
		// firefox 会自作多情对hash进行decodeURIComponent
		// 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
		// firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
		// 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
		var path = (window || this).location.href;
		if (hash) {
			path = hash.charAt(0) === '#' ? hash : '#' + hash;
		} else {
			path = (window || this).location.href;
			~path.indexOf("#") || (path = path + '#');
		}
		path = path.slice(path.indexOf("#") + 1);
		if (path.indexOf("/") === 0)
			return path.slice(1)
		if (path.indexOf("!/") === 0)
			return path.slice(2)
		return path;
	};
	//解析hash字符串成对象
	util.parseHash = function(hash) {
		hash = util._getFragment(hash);
		//返回 'ct.ac' 和 解析后的parse参数
		var paramArr = hash.split('/'),
			params = {},
			i = 0,
			j = paramArr.length,
			de = decodeURIComponent;
		for (; i < j; i = i + 2) {
			var val = paramArr[i + 1];
			paramArr[i] && (params[paramArr[i]] = val ? de(val) : null);
		}
		return params;
	};
	util.genPHash = function(page, params) {
		params = params || {};
		params = JSON.parse(JSON.stringify(params));
		if (page) {
			page = page.split('/');
			params['ct'] = page[0] + (page[1] || '');
		}
		page = [];
		for (var n in params) {
			page.push(n, encodeURIComponent(params[n]));
		}
		return page.join('/');
	};
	//将对象拼接成hash字符串
	util.stringifyHash = function(params) {
		return '#!/' + this.genPHash('', params);
	};
	//解析search参数
	util.parseSearch = function(search) {
		search = search || location.search;
		if (!search) {
			return {};
		}
		search = search.charAt(0) === '?' ? search.slice(1) : search;
		search = search.split('&');
		var option,
			params = {},
			de = function(str) {
				try { //这里是预防 参数中存在 %不合法的格式 而报错
					str = window.decodeURIComponent(str);
				} catch (_e) {}
				return str;
			};
		for (i=0,j = search.length; i<j; i++) {
			option = search[i];
			_addVal(option.split('=')[0],de(option.substr(option.indexOf('=') + 1)));
		}
		return params;
		function _addVal(key,val){
			var cut = 0;
			if(/\[\]$/.test(key)){ // 是否以[]结尾
				cut = 2;
			}else if(/%5B%5D$/.test(key)){
				cut = 6;
			}
			if(cut){
				key = key.slice(0,-cut);
				//这里不必检测数组类型，因为在search参数中，出了数组也只有字符串
				if(!params[key] || typeof params[key]!=='object')
					params[key] = [];
				params[key].push(val);
			}else{
				params[key] = val;
			}
		}
	}

	//command: 'push' || 'place'
	util.history = function(command, page, params) {
		window['history'][command + 'State']({}, '', '#!/' + this.genPHash(page, params));
	}
	return {
		collection: util,
		set: function(key, val, context) {
			/* util.user.alert , val, null */
			var keys = key.split('.'),
				i = 0,
				j = keys.length,
				treeKey = this.collection,
				curKey;
			for (; i < j; i++) {
				curKey = keys[i];
				//当这里已经有值了
				if (treeKey[curKey]) {
					if (Object.prototype.toString.call(treeKey[curKey]) === '[object Object]') {
						treeKey = i + 1 === j ? setVal(curKey, val) : treeKey[curKey];
					} else {
						setVal(curKey, val);
					}
					//当还没有值得时候
				} else {
					treeKey = setVal(curKey, i + 1 === j ? val : {});
				}
			}

			function setVal(key, val) {
				treeKey[key] = context ?
					function() {
						val.apply(context, arguments);
					} : val;
				return treeKey[key];
			}
			return this;
		},
		bindTo: function(object) {
			var _util = util;
			for (var n in _util) {
				if (_util.hasOwnProperty(n) && !object[n]) {
					if (n.charAt(0) === '_')
						continue;
					object[n] = _util[n];
				}
			}
		}
	}
});