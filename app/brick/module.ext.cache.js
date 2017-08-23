/* eslint-disable */
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
	}).mount('defined', function(module) {
		var self = this;
		var configs = self.configs;
		if (!configs.cache) {
			return;
		}
		var id = module.id;
		// $开头 					的模块为系统模块，不进行缓存
		// module.undefinedId:true 	的模块时没有定义ID的匿名模块，不进行缓存
		if (id.charAt(0) !== '$' && !module.undefinedId) {
			var deps = module.dependencies || [];
			//缓存到本地
			try {
				localStorage.setItem(configs.prefix + id, deps.join(',') + '@@' + module.factory.toString());
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