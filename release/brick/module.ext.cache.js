(function(define) {
	function clean(prefixKey) {
		try {
			for (var n in localStorage) {
				if (prefixKey) {
					~n.indexOf(prefixKey) &&
						localStorage.removeItem(n);
				} else {
					localStorage.removeItem(n);
				}
			}
		} catch (e) {}
	}
	define.mount('config', function() {
		var self = this;
		var configs = self.configs;
		if (!configs.cache) {
			return;
		}
		self.config({
			'prefix': configs.prefix || '__BRICK__'
		});
		var hashKey = configs.prefix + 'HASH';
		// detect localStorage support and activate cache ability

		try {
			if (configs.hash !== localStorage.getItem(hashKey)) {
				clean(configs.prefix);
				localStorage.setItem(hashKey, configs.hash);
			}
			self.config({
				'cache': true
			});
		} catch (e) {
			self.config({
				'cache': false
			});
		}
		// detect _debug=nocache in location.search
		if (/\b_debug=([\w,]+)\b/.test(location.search)) {
			if (RegExp.$1.indexOf('nocache')) {
				clean(configs.prefix);
				self.config({
					'cache': false
				});
			}
		}
		define.unmount('config');
	}).mount('defined', function(id, deps, factory) {
		var self = this;
		var configs = self.configs;
		if (!configs.cache) {
			return;
		}
		//缓存到本地
		if (id.charAt(0) !== '$') {
			try {
				localStorage.setItem(configs.prefix + id, deps.join(',') + '@@' + factory.toString());
			} catch (e) {
				self.config({
					cache: false
				});
			}
		}
	}).mount('fetchModuleFilter', function(id) {
		var configs = this.configs;
		if (!configs.cache)
			return;
		var raw, node, deps, factory,
			doc = document;
		raw = localStorage.getItem(configs.prefix + id);
		if (raw) {
			raw = raw.split('@@');
			factory = raw[1];
			//如果存储出现异常情况导致没有获取到内容,则这里不考虑
			if (factory) {
				deps = raw[0];
				deps = deps === "" ? false : deps.split(',');
				deps = deps ? '["' + deps.join('","') + '"]' : '[]';
				node = doc.createElement('script');
				node.appendChild(doc.createTextNode('define("' + id + '",' + deps + ',' + factory + ');'));
				doc.head.appendChild(node);
				setTimeout(function() {
					doc.head.removeChild(node);
				}, 4);
				return true;
			}
		}
	});
})(define)