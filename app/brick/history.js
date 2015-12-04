//负责解析hash，监听hash的改变
define('$history', ['$router', '$util', '$config'], function(require) {
	//是否支持h5的state事件啊
	var monitorMode = !!(window.onpopstate) ? 'popstate' : 'hashchange',
		router = require('$router'),
		util = require('$util'),
		config = require('$config');

	function History() {};
	History.prototype = {
		constructor: History,
		start: function(options) {
			if (History.isStart)
				return;
			History.isStart = true;
			//讲配置信息加载给$config
			for (var n in options) {
				config[n] = options[n];
			}

			router.init();
			//获取当前路由碎片
			this.fragment = this.getFragment()
			var that = this;
			//hash发生改变时触发
			function checkUrl() {
				var pageHash = that.getFragment(),
					hash;
				if (pageHash !== that.fragment) {
					hash = pageHash;
				}
				if (hash !== void 0) {
					that.fragment = hash;
					that.fireRouteChange(hash);
				}
			}
			switch (monitorMode) {
				case 'popstate':
					window.addEventListener('popstate', checkUrl);
					break;
				case 'hashchange':
					window.addEventListener('hashchange', checkUrl);
					break;
			}
			BK.trigger('afterRun');
			//DOM加载完毕后触发第一次的加载
			this.fireRouteChange(this.getFragment());
			//TODO 缺少对页面A标签的监听
		},
		fireRouteChange: function(hash) {
			var option = {
				formUser: History.fromUser
			};
			History.fromUser = undefined;
			router.navigate(hash, option);
		},
		getFragment: function() {
			// IE6直接用location.hash取hash，可能会取少一部分内容
			// 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
			// ie6 => location.hash = #stream/xxxxx
			// 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
			// firefox 会自作多情对hash进行decodeURIComponent
			// 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
			// firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
			// 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
			var path = (window || this).location.href;
			~path.indexOf("#") || (path = path + '#');
			path = path.slice(path.indexOf("#") + 1);
			if (path.indexOf("/") === 0)
				return path.slice(1)
			if (path.indexOf("!/") === 0)
				return path.slice(2)
			return path;
		}
	};

	// $.genUrl('def/in',{})
	util.
		set('genPHash', function(page, params) {
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
		})
		// $.link('ct/ac',{})
		.set('link', function(page, params) {
			History.fromUser = true;
			window.location.hash = '!/' + this.genPHash(page, params);
		})
		// commend: 'replace','push'
		.set('history', function(commend, page, params) {
			window['history'][commend + 'State']({}, '', '#!/' + this.genPHash(page, params));
		})
		.set('_getOriHash', function() {
			return History.prototype.getFragment();
		})
		.set('stringifyHash', function(params) {
			return '#!/' + this.genPHash('', params);
		});
		
	//将收集到的util绑定到brick开放给外部

	return new History;
});