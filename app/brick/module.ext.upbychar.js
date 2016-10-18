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
	}).mount('genUrl',function(ids){
		var configs = this.configs;
		if(configs.combo){
			return null;
		}
		//返回单个模块的请求地址 即可
		var queryUrl = configs.baseUrl || '';
		var paths = configs.paths;
		var ids = ids[0]; // defin

		//single module id
		//判断当前差量的模块是否在范围之内，如果不在范围，则走请求全量
		//var maps = ["1.0.1", "1.0.2", "1.0.3"];
		var maps = configs.diffMap;

		//请求差量js内容 URL
		try{
			if(modulesVersion[ids] && maps.indexOf(modulesVersion[ids]) > -1){
				//如果在等于提供的diff范围，否则额外请求
				ids = "/js/"+modulesVersion[ids] + "/" + ids + ".js";
				queryUrl = ~queryUrl.indexOf('%s') ? queryUrl.replace('%s', ids) : queryUrl+ids;
				return queryUrl + (~queryUrl.indexOf('?') ? '&' : '?') + '_hash=' + configs.hash;
			}
		}catch(e){
			console.log(e);
		}

		//请求全量
		ids = paths && type(paths[ids])==='string' ? paths[ids] : ids;
   		queryUrl = ~queryUrl.indexOf('%s') ?
   			queryUrl.replace('%s', ids) :
   			queryUrl+ids;
   		return queryUrl + (~queryUrl.indexOf('?') ? '&' : '?') + '_hash=' + configs.hash;
	})
	define.redefine(function(id, deps, factory){
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
	});
	function type(obj) {
		var varType = Object.prototype.toString.call(obj).toLowerCase();
		return varType.substring(8, varType.length - 1);
	}

	//当为差量时，提供完成的code
	function getJsCode(id,deps,factory){
		var prefix = modulesConfigs.prefix;
		//获取localstorage里面模块的js内容
		var localStorageSource = localStorage.getItem(prefix + id);
		//差量数组内容
		var diffArray = factory;
		//把差量js字符串内容合并到localstorage的模块js内容,得到新的js内容
		return mergejs(localStorageSource, diffArray);
	}

	//差量合并方法
	function mergejs(localStorageSource, diffArray) {
		//define("tb_author", [[0,41],"i",[42,8],"r",[51,12],"a",[64,11],"i",[76,55],"s",[132,30],"u",[163,10],"d",[174,87],"r",[262,25],"a",[288,14],"d",[303,135],"p",[439,28],"u",[468,4],"p",[473,42],"a",[516,31],"p",[548,28],"d",[577,70],"p",[648,34],"s,",[682,2],"d",[687,12],"g",[700,69],"h",[770,16],"p=",[786,1],[789,9],"g",[799,81],"test-div\">this is diff test div.</div>\\n  <div c",[880,1],"ass=\"l",[881,78],"p",[960,23],"s",[984,6],"u",[991,13],"p",[1005,28],"i",[1034,8],"r",[1043,162]]);
        var strResult = "";
        if(diffArray.length == 1){
        	return localStorageSource.substr(diffArray[0][0], diffArray[0][1])
        }
        for (var i = 0; i < diffArray.length; i++) {
            var code = diffArray[i];
            if (typeof (code) == 'string') {
                strResult += code;
            } else {
                var start = code[0];
                var len = code[1];
                var oldcode = localStorageSource.substr(start, len);
                strResult += oldcode;
            }
        }
        return strResult;
    }
})();
