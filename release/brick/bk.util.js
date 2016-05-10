define('$util', function() {
	var util = {};
	util.clone = function(obj){
		return JSON.parse(JSON.stringify(obj));
	};
	function _alert(text, time){
		var el,winW,winH,
			self = _alert;
		if(el = self.el){
			self._timeCon && clearTimeout(self._timeCon);
			el.style.display = 'block';
			el.innerText = text;
            //计算在页面中显示的位置
            //BUG:: 多次调用时，会重复监听
            window.addEventListener('resize', function(){
            	self.setPos();
            }, false);
            self.setPos();
            //设置消失时间
			self._timeCon = setTimeout(function(){
				abort();
			},(time || 1)*1000);
			return abort;
		}else{
			throw new Error('未指定弹出框元素');
		}
		function abort(){
			self._timeCon && clearTimeout(self._timeCon);
			el.style.display = 'none';
		};
	}
	_alert.setEl = function(el){
		this.el = el[0] || el ;
	};
	_alert.setPos = function(){
		var el = this.el,
			win = window;
		el.style.position = 'fixed';
        el.style.left = Math.ceil((win.innerWidth - el.offsetWidth)/2)+'px';
		el.style.top = Math.ceil((win.innerHeight - el.offsetHeight)/2)+'px';
	};
	util.alert = _alert;
	//获取页面hash字符串
	util.getFragment=function(hash) {
		// IE6直接用location.hash取hash，可能会取少一部分内容
		// 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
		// ie6 => location.hash = #stream/xxxxx
		// 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
		// firefox 会自作多情对hash进行decodeURIComponent
		// 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
		// firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
		// 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
		var path = (window || this).location.href;
		if(hash){
			path = hash.charAt(0)==='#'? hash : '#'+hash;
		}else{
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
	util.parseHash = function(hash){
		hash = this.getFragment(hash);
		//返回 'ct.ac' 和 解析后的parse参数
		var paramArr = hash.split('/'),
			params = {},
			i=0,j=paramArr.length,
			de = decodeURIComponent;
		for(;i<j;i=i+2){
			paramArr[i] && (params[paramArr[i]] = de(paramArr[i+1]));
		}
		return params;
	};
	util.genPHash = function(page, params) {
		params = params || {};
		if (page) {
			page = page.split('/');
			params['ct'] = page[0];
			params['ac'] = page[1];
		}
		page = [];
		for (var n in params) {
			page.push(n, encodeURIComponent(params[n]));
		}
		return page.join('/');
	};
	//将对象拼接成hash字符串
	util.stringifyHash = function (params) {
		return '#!/' + this.genPHash('', params);
	};
	//解析search参数
	util.parseSearch = function (search) {
		search = search || location.search;
		search = search.split('&');
		var ln = search.length-1,
			option,
			params = {},
			de = decodeURIComponent;
		for(;ln>=0;ln--){
			option = search[ln];
			params[option.split('=')[0]] = de(option.substr(option.indexOf('=')+1));
		}
		return params;
	}
	//command: 'push' || 'place'
	util.history = function (command, page, params) {
		window['history'][commend + 'State']({}, '', '#!/' + this.genPHash(page, params));
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
			object.extend(this.collection);
		}
	}
});