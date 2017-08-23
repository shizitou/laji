/* eslint-disable */
;
(function() {
	var originDefine = window.define;
	var modulesVersion;
	var prefix = '';
	var modulesConfigs = {};
	var useStorage = {};
	var CRC32_STR = (function() {
		var T = (function() {
			var c = 0,
				table = new Array(256);
			for (var n = 0; n != 256; ++n) {
				c = n;
				c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				c = ((c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1));
				table[n] = c;
			}
			return typeof Int32Array !== 'undefined' ? new Int32Array(table) : table;
		})();
		return function(str, seed) {
			var C = seed ^ -1;
			for (var i = 0, L = str.length, c, d; i < L;) {
				c = str.charCodeAt(i++);
				if (c < 0x80) {
					C = (C >>> 8) ^ T[(C ^ c) & 0xFF];
				} else if (c < 0x800) {
					C = (C >>> 8) ^ T[(C ^ (192 | ((c >> 6) & 31))) & 0xFF];
					C = (C >>> 8) ^ T[(C ^ (128 | (c & 63))) & 0xFF];
				} else if (c >= 0xD800 && c < 0xE000) {
					c = (c & 1023) + 64;
					d = str.charCodeAt(i++) & 1023;
					C = (C >>> 8) ^ T[(C ^ (240 | ((c >> 8) & 7))) & 0xFF];
					C = (C >>> 8) ^ T[(C ^ (128 | ((c >> 2) & 63))) & 0xFF];
					C = (C >>> 8) ^ T[(C ^ (128 | ((d >> 6) & 15) | ((c & 3) << 4))) & 0xFF];
					C = (C >>> 8) ^ T[(C ^ (128 | (d & 63))) & 0xFF];
				} else {
					C = (C >>> 8) ^ T[(C ^ (224 | ((c >> 12) & 15))) & 0xFF];
					C = (C >>> 8) ^ T[(C ^ (128 | ((c >> 6) & 63))) & 0xFF];
					C = (C >>> 8) ^ T[(C ^ (128 | (c & 63))) & 0xFF];
				}
			}
			return C ^ -1;
		};
	})();
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
	originDefine.mount('config', function() {
		var self = this;
		var configs = self.configs;
		modulesConfigs = configs;
		if (!configs.cache) {
			return;
		}
		self.config({
			'prefix': configs.prefix || '__BRICK__'
		});
		//实验是否支持localStorage
		var storageKey = configs.prefix + (~~(Math.random() * 10000));
		try {
			localStorage.setItem(storageKey, '1');
			if (localStorage.getItem(storageKey)) {
				localStorage.removeItem(storageKey);
			}
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
		modulesConfigs = configs;
		if (modulesConfigs.cache) {
			modulesVersion = JSON.parse(localStorage.getItem(modulesConfigs.prefix + "moduleVersion")) || {}
		}
		originDefine.unmount('config');
	}).mount('fetchModuleFilter', function(id) {
		if (!modulesConfigs.cache) return;
		var node, factory, doc = document;
		factory = localStorage.getItem(modulesConfigs.prefix + id);
		if (factory && modulesConfigs.hash == modulesVersion[id]) {
			//如果存储出现异常情况导致没有获取到内容,则这里不考虑
			if (!factory || factory.substring(0, 3) !== 'fun') {
				return;
			}
			useStorage[id] = 1;
			node = doc.createElement('script');
			node.appendChild(doc.createTextNode('define("' + id + '",[],' + factory + ');'));
			doc.body.appendChild(node);
			setTimeout(function() {
				doc.body.removeChild(node);
			}, 4);
			return true;
		}
	}).mount('genUrl', function(ids) {
		//不处理combo
		if (modulesConfigs.combo || !modulesConfigs.cache) {
			return null;
		}
		//返回单个模块的请求地址 即可
		var queryUrl = modulesConfigs.baseUrl || '';
		var ids = ids[0]; // defin
		//判断当前差量的模块是否在范围之内，如果不在范围，则走请求全量
		//maps: ["1.0.1", "1.0.2", "1.0.3"];
		var maps = modulesConfigs.diffMap || [];
		//请求差量js内容 URL
		if(modulesVersion && modulesVersion[ids] && maps.indexOf(modulesVersion[ids]) > -1){
			ids = "/"+modulesVersion[ids] + "/" + ids + ".js";
		}else{
			var paths = modulesConfigs.paths;
			ids = paths && type(paths[ids]) === 'string' ? paths[ids] : ids;
		}
		queryUrl = ~queryUrl.indexOf('%s') ?
			queryUrl.replace('%s', ids) :
			queryUrl + ids;
		return queryUrl + (~queryUrl.indexOf('?') ? '&' : '?') + '_hash=' + modulesConfigs.hash;
	})
	define.redefine(function(id, deps, factory) {
		/* 处理参数: factory: function/string/array 差量
		 * 函数体: define("methodName", function(require, exports, module){ //code });
		 * 字符串: define("methodName", "function(require, exports, module){ //code }");
		 * 数组: define("methodName", [[0,2],".0.6/main-de",[3,8],"e 1.0.6\");\n var"]);
		 */
		var argsLen = arguments.length;
		if (argsLen === 1) {
			factory = id;
			id = undefined;
		} else if (argsLen === 2) {
			factory = deps;
			if (type(id) === 'array') {
				deps = id;
				id = undefined;
			} else {
				deps = [];
			}
		}
		//如果是匿名模块，就直接交给原框架处理
		if(!id) return originDefine(id, deps, factory); 
		/* 	将代码缓存到本地存储 开启缓存配置项&&模块不是$开头的系统模块
		 	id.charAt(0) !== '$' && modulesConfigs.cache 有可能是undefined,
		 	因为早在框架config()之前执行的define()模块，这里为了将值都进行统一化，在结尾进行了 || false
		 	比如inline进来的jquery
		*/
		var cacheToStorage = id.charAt(0) !== '$' && modulesConfigs.cache || false;
		// id deps factory{string,array,function}
		if (type(factory) === "array") {
			factory = getJsCode(id, factory);
			//如果返回了false,则表示进行编译时发生了异常,系统会自动刷新页面，这里不进行处理了
			if(factory===false) return; 
		} else if (type(factory) === 'function') {
			factory = factory.toString();
			if(useStorage[id]){ //如果这个函数是来自于本地存储，则这里就不在进行本地存储,并且删除对应模块标记，以免下次误碰
				cacheToStorage = false;
				delete useStorage[id];
			}
		}
		//最终处理到这里时，factory是一个可执行的最新的字符串，可进行存储
		if (cacheToStorage) {
			var prefix = modulesConfigs.prefix;
			try {
				localStorage.setItem(prefix + id, factory);
			} catch (e) {
				clean(prefix);
			}
			if (modulesConfigs.hash !== modulesVersion[id]) {
				try {
					//存储当前模块的版本号到localstorage
					modulesVersion[id] = modulesConfigs.hash;
					localStorage.setItem(prefix + "moduleVersion", JSON.stringify(modulesVersion));
				} catch (e) {
					clean(prefix);
				}
			}
		}
		try{
			new Function('f', 'f("' + id + '",[],' + factory + ');')(originDefine);
		}catch(error){
			errorAction(error);  // 出错处理
		}
	});
	function type(obj) {
		var varType = Object.prototype.toString.call(obj).toLowerCase();
		return varType.substring(8, varType.length - 1);
	}
	//当为差量时，提供完成的code
	function getJsCode(id, factory) {
		if(!modulesConfigs.cache){
			errorAction(new Error("未开启缓存，却请求到了数组DIFF响应？")); 
			return false;
		}
		//获取localstorage里面模块的js内容
		var localResource = localStorage.getItem(modulesConfigs.prefix + id);
		//如果当前模块的存储数据已经和版本号相等，则不需要进行比较，直接使用本地存储的数据
		modulesVersion = JSON.parse(localStorage.getItem(modulesConfigs.prefix+"moduleVersion")) || {};
		if(modulesVersion[id] == modulesConfigs.hash){
			return localResource;
		}else{
			//把差量js字符串内容合并到localstorage的模块js内容,得到新的js内容
			return mergejs(localResource, factory);
		}
	}
	//差量合并方法
	function mergejs(localResource, diffArray) {
		//define("tb_author", [[0,41],"i",[42,8],"r",[51,12],"a",[64,11],"i",[76,55],"s",[132,30],"u",[163,10],"d",[174,87],"r",[262,25],"a",[288,14],"d",[303,135],"p",[439,28],"u",[468,4],"p",[473,42],"a",[516,31],"p",[548,28],"d",[577,70],"p",[648,34],"s,",[682,2],"d",[687,12],"g",[700,69],"h",[770,16],"p=",[786,1],[789,9],"g",[799,81],"test-div\">this is diff test div.</div>\\n  <div c",[880,1],"ass=\"l",[881,78],"p",[960,23],"s",[984,6],"u",[991,13],"p",[1005,28],"i",[1034,8],"r",[1043,162]]);
		//define("tb_author", [[[0,41],"i",[42,8],"r"], crc]);
		var strResult = "";
		var crcValue = diffArray[1];
		diffArray = diffArray[0];  //更新增量数组，添加全量的内容crc
		try{
			//没有差量
			if (diffArray.length == 1) {
				return localResource.substr(diffArray[0][0], diffArray[0][1])
			}
			//增量合并
			for (var i = 0,j=diffArray.length; i < j; i++) {
				var code = diffArray[i];
				if (typeof(code) == 'string') {
					strResult += code;
				} else {
					var start = code[0];
					var len = code[1];
					var oldcode = localResource.substr(start, len);
					strResult += oldcode;
				}
			}
			// 将合并完之后的字符串进行CRC32校验，校验通过则认为本次合并无误
			if(CRC32_STR(strResult) == crcValue){
				new Function(strResult);
				return strResult;
			}else{
				errorAction(new Error("CRC32校验不通过"));  // 出错处理
				return false;
			}
		}catch(error){
			errorAction(error);  // 出错处理
		}
	}
	function errorAction(error) {
		error.message = " DiffError: " + error.message;
		console.warn(error.stack);
		// 清空localStorage
		clean(modulesConfigs.prefix);
		setTimeout(function(error) {
			throw error;
			//强制刷新页面
			setTimeout(function() {
				document.location.reload();
			}, 200);
		}, 4, error);
	}
})();