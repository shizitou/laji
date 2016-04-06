;(function(){
	var originDefine = window.define;
	var modulesVersion;
	var modulesConfigs = {};
	function clean(prefixKey){
		try {
			for(var n in localStorage){
				if(prefixKey){
					~n.indexOf(prefixKey) &&
						localStorage.removeItem(n);
				}else{
					localStorage.removeItem(n);
				}
			}
		} catch (e) {}
	}
	originDefine.mount('config',function(){
		var self = this;
		var configs = self.configs;
		if(!configs.cache){
			return ;
		}
		self.config({ 'prefix': configs.prefix || '__BRICK__' });
		//实验是否支持localStorage
		var storageKey = configs.prefix+(~~(Math.random()*10000));
		try {
			localStorage.setItem(storageKey, '1');
			if(localStorage.getItem(storageKey)){
				localStorage.removeItem(storageKey);
			}
		} catch (e) {
			self.config({ 'cache': false });
		}
		// detect _debug=nocache in location.search
		if (/\b_debug=([\w,]+)\b/.test(location.search)) {
			if(RegExp.$1.indexOf('nocache')){
				clean(configs.prefix);
				self.config({ 'cache': false });
			}
		}
		modulesConfigs = configs;
		if(configs.cache){
			modulesVersion = JSON.parse(localStorage.getItem(configs.prefix + "moduleVersion")) || {}
		}
		originDefine.unmount('config');
	}).mount('fetchModuleFilter',function(id){
		var configs = this.configs;
		if (!configs.cache)
			return;
        var node, factory, doc = document;
        factory = localStorage.getItem(configs.prefix + id);
        if(factory && configs.hash == modulesVersion[id]){
        	//如果存储出现异常情况导致没有获取到内容,则这里不考虑
        	if(!factory || factory.substring(0,3)!=='fun'){
        		return ;
        	}
        	node = doc.createElement('script');
        	node.appendChild(doc.createTextNode('define("'+id+'",[],'+factory+');'));
            doc.body.appendChild(node);
            setTimeout(function(){
            	doc.body.removeChild(node);
            },4);
            return true;
        }
	})
	.mount('genUrl',function(ids){
		var configs = this.configs;
		if(configs.combo){
			return null;
		}
		//返回单个模块的请求地址 即可 
		var queryUrl = configs.baseUrl || '';
		var paths = configs.paths;
		var ids = ids[0];
		ids = paths && type(paths[ids])==='string' ? paths[ids] : ids;
   		queryUrl = ~queryUrl.indexOf('%s') ?
   			queryUrl.replace('%s', ids) :
   			queryUrl+ids;
   		return queryUrl + (~queryUrl.indexOf('?') ? '&' : '?') + '_hash=' + configs.hash+'&ver=3.0.0';
	})
	window.define = function(id, deps, factory){
		/* 处理参数: factory: function/string/array 差量
		 * 函数体: define("methodName", function(require, exports, module){ //code });
		 * 字符串: define("methodName", "function(require, exports, module){ //code }");
		 * 数    组: define("methodName", [[0,2],".0.6/main-de",[3,8],"e 1.0.6\");\n    var"]);
		 */
		var argsLen = arguments.length;
		if (argsLen === 1) {
			factory = id;
			id = undefined;
		} else if (argsLen === 2) {
			factory = deps;
			if (type(id)=== 'array') {
				deps = id;
				id = undefined;
			} else {
				deps = [];
			}
		}
		// id deps factory{string,array,function}	
		if(type(factory) === "array"){
			//差量
			factory = getJsCode(id,deps,factory);
		}else if(type(factory)==='function'){
			factory = factory.toString();
		}
		//最终处理到这里时，factory是一个可执行的最新的字符串，可进行存储
		if (modulesConfigs.cache && id.charAt(0) !== '$') {
			var prefix = modulesConfigs.prefix;
			try{
				localStorage.setItem(prefix + id, factory);
			}catch(e){
				clean(prefix);
			}
			if(modulesConfigs.hash !== modulesVersion[id]){
				try {
					//存储当前模块的版本号到localstorage
					modulesVersion[id] = modulesConfigs.hash;
					localStorage.setItem(prefix + "moduleVersion", JSON.stringify(modulesVersion));
				} catch (e) { 
					clean(prefix); 
				}
			}
		}
		new Function('f','f("'+id+'",[],'+factory+');')(originDefine);
	};
	function type(obj) {
		var varType = Object.prototype.toString.call(obj).toLowerCase();
		return varType.substring(8, varType.length - 1);
	}
})();