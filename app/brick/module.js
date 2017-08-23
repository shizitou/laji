/* eslint-disable */
/*
	TODO: 
		解决循环引用的问题
		解决重复发起模块加载请求的问题
	version: 4.4
		brick强制支持 Promise 标准，polyfill采用的是 then/promise 
		对 Promise 实例添加 .done 扩展方法,用于将捕捉到的异常抛出到window
	version: 4.3
		新增 对 匿名模块的支持
	version: 4.2.2
        新增BK.bind(insertCSS,function(css){}) 全局事件
    version: 4.2.1
		修正 upbychar 插件的更新机制：
			如果定义的模块来自于本地存储，则不再次调用本地存储
			IOS7,8从接口传递过来的字符串与函数进行 toString() 之后的不同
	version: 4.2.0
		新增 bigpipe 功能
	version: 4.1.4
		优化 $from, $to,将其位置移到第二位参数
	version: 4.1.3
		在init, enter, leave中 添加 $from, $to 标明来源和去向
	version: 4.1.2
		优化 BK.parseSearch() 的返回结果，支持多值数组
	version: 4.1.1
		$http检测xhr的时机进行修正，由 初始化时 改为 发起时
	version: 4.0.0
		UI组件化研发完毕，正式投入使用
		修复：BK.parseSearch() 参数带问号的bug
	version: 3.8.0
		新增功能插件模块 $KFC。
		提取开源fastClick代码为项目订制改写，新增点击态功能。
		具体使用情况，见文档。
	version: 3.7.6
		暂时取消sessionStorage的缓存机制（有风险还需进一步讨论）
	version: 3.7.5
		$http 添加 complete 配置项
		将crossOrigin变成配置项，默认不开启，
		因为如果开启的话必须要服务器端进行配合才可以使用
   	version: 3.7.4
		修复：用户手动触发跳转时，页面的y轴没有被正确设置【bk.controller.js】
	version: 3.7.3
		$http的$defer中不改写原生Promise 【bk.http.js】
		模块加载器支持绝对路径：
			判定规则是以 http:// 或 https:// 开头的path
			绝对路径的模块不进行处理url处理，也不会进入到genUrl挂载点
	version: 3.7.2 
		在发起 script请求的时候，对标签添加上 crossOrigin 属性【module.js】
		修复：未载入bk.ext.router.js插件时，defController失效
		增强$http模块的cache功能：
			识别 dataType:'json'
		UIcomponent的样式修正：针对一些特定的style进行处理
	version: 3.7.1
		配合工程化动态加载，新增define.reload功能：
			define.reload('modId'[,successFun(require)][,failFun(require)]);
		此函数会清楚模块对应的内存缓存，并触发模块请求;
	version: 3.7.0
		合并了 3.6 与 3.5 版本;
		增加了按字符更新的缓存插件:module.ext.upbychar.js
		添加 define.redefine(factory) 方法
		此方法用来重定义 window.define 方法，并将旧有的 window.define方法复制给factory
		修复: 引用ext.upbychar.js 后 define身上静态方法失效的问题
	version: 3.5.2
		为$http添加了sessionStorage的数据缓存操作:
			开启参数为： ajaxCache
			过滤器：ajaxCacheFile
			添加后缀：ajaxCacheHash
		当使用缓存得到数据时,框架会尽量返回$.Deferred实例
			如果引用的zepto没有引入Deferred则使用原生Promise,否则则返回undefined;
	version: 3.5.1
		修复： $http.post, $http.get 方法
		参数与 zepto,jquery 官网文档保持一致
			( url, data, success, dataType )
**/
(function(global, undefined) {
	'use strict';
	
	var modCore = {
		version: '4.4',
		configs: {
			timeout: 15, // 请求模块的最长耗时(秒)
			paths: {}, // 模块对应的路径
			deplist: {}, // 依赖配置表
			combo: null, // 配置函数来启用combo
			baseUrl: "", // 后面用来拼接path作为完整请求地址
			crossOrigin: false, //发起JS加载时，是否带有改属性
		}
	};
	//所有执行了define之后的模块都会被缓存到这个对象中
	var moduleCache = {};
	//所有define时没有id的模块都会暂存到这里，等待认领
	var lostModule = [];
	/**
	config: 在config之后触发(可以用来对配置信息进行一些处理)  
	defined: 在defined之后触发(可以用来对处理好id,deps,fn进行缓存) 
	fetchModuleFilter: 过滤掉不需要加载(已缓存的)的模块,当返回true时则请求该模块
	genUrl: 在进行模块请求时触发,当返回url时,则不触发后续的路由处理(包括combo) 
		特别声明: 虽然设置该节点后,combo不会触发,但是必须设置combo,才会接受多id的数组
	**/
	var mounts = {
		list: {},
		add: function(node, fn) {
			this.list[node] = typeof fn === 'function' ? fn : null;
		},
		remove: function(node) {
			delete this.list[node];
		},
		dispatch: function(node, args /*array*/ ) {
			var handle = this.list[node];
			if (handle && !handle.fire) {
				handle.fire = true;
				var res = handle.apply(modCore, args);
				handle.fire = false;
				return res;
			}
			return undefined;
		}
	};
	//这个变量是个标记，当解析完deplist后，加载的模块中含有deps数组，则需要重新进行一遍解析运算
	var deplistChange = false;
	//配置信息对象
	var coreConfig = modCore.configs;
	// 获取模块在配置中对应的别名
	function parsePaths(id) {
		var paths = coreConfig.paths;
		return paths && type(paths[id]) === 'string' ? paths[id] : id;
	}
	var STATUS = {
		// 0 - 刚刚被初始化
		INIT: 1,
		// 2 - 请求成功，执行了define来进行存储模块
		SAVED: 2,
		// 3 - 模块正在被解析
		EXECUTING: 3,
		// 4 - 模块已经解析完毕
		EXECUTED: 4
	}

	function define(id, deps, factory) {
		//处理参数
		var argsLen = arguments.length;
		// define(factory)
		if (argsLen === 1) {
			factory = id
			id = undefined
		} else if (argsLen === 2) {
			factory = deps
				// define(deps, factory)
			if (type(id) === 'array') {
				deps = id
				id = undefined
			}
			// define(id, factory)
			else {
				deps = [];
			}
		}
		if (id) {
			var mod = Module.get(id);
			// 当mod模块还未被保存的时候将其保存,
			if (mod.status < STATUS.SAVED) {
				mod.dependencies = deps || [];
				mod.factory = factory;
				mod.status = STATUS.SAVED;
				mounts.dispatch('defined', [mod.clone()]);
			}
		}else{
			lostModule.push({
				dependencies: deps || [],
				factory: factory,
			});
		}
	};
	define.amd = {}; //为了让amd模块进行 define包装报错,比如 jquery
	define.redefine = function(factory) {
		//将当前window的define函数上的静态方法，全部复制给新函数
		var originDefine = global.define;
		for (var n in originDefine) {
			factory[n] = originDefine[n];
		}
		factory['originDefine'] = originDefine;
		global.define = factory;
	};
	define.mount = function(node, handle) {
		mounts.add(node, handle);
		return this;
	};
	define.unmount = function(node) {
		mounts.remove(node);
		return this;
	};
	/* 	接收要加载模块的ID集合
	 * 	ids: 一定是个数组，如果开启combo,则这里会接收到几个id组合的数组
	 * 		[id,id,id]
	 * 	如果没有开启combo,则是一个一个的请求，这里接受到的就是只有一个长度的数组
	 * 		[id]
	 **************/
	define.load = function(ids, loaded) {
		if (!ids.length) {
			setTimeout(loaded, 4);
			return;
		}
		/* 	过滤绝对地址的请求
			如果是以 http:// https:// 开头的path，则不处理路由了，
			直接进行加载
		****/
		var paths = coreConfig.paths;
		var fetchModules = [];
		//过滤掉 HTTP开头的请求
		for (var i = ids.length - 1; i >= 0; i--) {
			var path = paths[ids[i]];
			if (/^(http:\/\/|https:\/\/)/.test(path)) {
				// fetchModules.push(path);
				fetchModules.push({
					id: ids[i],
					url: path,
				});
				ids.splice(i, 1)
			}
		}
		//处理加载路径
		if (ids.length) {
			var isCombo = ids.length === 1 ? false : true;
			var pushObj = {
				id: isCombo ? 'COMBO' : ids[0],
				url: '',
			}
			//生成请求的URL，这里可能是进行combo处理，也可能只是单个URL
			var queryUrl = mounts.dispatch('genUrl', [ids]);
			if (type(queryUrl) !== 'string') {
				queryUrl = Module.genUrl(ids);
			}
			// fetchModules.push(queryUrl);
			pushObj['url'] = queryUrl;
			fetchModules.push(pushObj);
		}

		/* 并发加载模块 */
		var waiting = fetchModules.length; //请求的url个数
		fetchModules.forEach(function(modObj) { //真正的请求地址
			define.fetch(modObj, function(status) {
				--waiting || loaded(status);
			});
		});
	};
	define.fetch = (function() {
		var doc = document;
		var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
		var baseElement = head.getElementsByTagName("base")[0];
		return function(modObj, loaded) {
			//使用js标签进行加载
			var node = doc.createElement("script");
			var tid = setTimeout(function() {
				clearTimeout(tid);
				nodeHandle('TIMEOUT');
			}, (coreConfig.timeout || 15) * 1000);
			node.async = true;
			if (coreConfig.crossOrigin) {
				node.crossOrigin = true;
			}
			node.src = modObj.url;
			//这里得把ID穿过来，而且还得考虑Combo问题
			node.dataset.requiremodule = modObj.id;
			if ('onload' in node) {
				node.onload = function(evt) {
					var node = evt.currentTarget || evt.srcElement;
					var modId = node.dataset.requiremodule;
					//一次请求多个模块时，不做处理
					if(modId==='COMBO'){
						return nodeHandle('LOAD');
					}
					var module = Module.get(modId); // nulll
					//状态已经是保存成功了，说明这里模块是有ID的
					if(module.status !== STATUS.SAVED){
						//走到这里的模块，在执行时没有defineId,从 lostModule 中领取一个
						//领取到模块后，再次执行define
						var findModContent = lostModule.shift();
						module.undefinedId = true;
						define(modId,findModContent.dependencies,findModContent.factory);
					}
					clearTimeout(tid);
					nodeHandle('LOAD');
				};
			} else {
				node.onreadystatechange = function() {
					if (/loaded|complete/.test(this.readyState)) {
						clearTimeout(tid);
						nodeHandle('LOAD');
					}
				};
			}
			node.onerror = function() {
				clearTimeout(tid);
				nodeHandle('ERROR');
			};
			//插入DOM
			baseElement ?
				head.insertBefore(node, baseElement) :
				head.appendChild(node);
			//status: LOAD, ERROR, TIMEOUT
			function nodeHandle(status) {
				loaded(status);
				head.removeChild(node);
			}
		};
	})();
	define.reload = function(modId, success, fail) {
		//获取模块对象
		var mod = Module.get(modId);
		var oriStatus = mod.status;
		//设置状态为初始化状态
		mod.status = STATUS.INIT;
		define.load([modId], function(status) {
			if (status === 'LOAD') {
				success && success(require);
			} else {
				fail && fail(require);
				if (STATUS.EXECUTED === oriStatus) {
					mod.status = STATUS.EXECUTED;
				}
			}
		});

		function require(id) {
			return Module.get(id).exec();
		}
	};

	function Module(modId) {
		this.id = modId;
		// css,js
		this.fileType = '';
		this.dependencies = [];
		this.factory = undefined;
		this.exports = undefined;
		// 没有定义ID的UMD模块这里会被设置成true,
		this.undefinedId = false;
		//模块的状态
		this.status = STATUS.INIT;
		this.loaded = [];
	}
	//onload的监听函数
	// Module.prototype.loaded = [];
	//获取最基本的属性复制品
	Module.prototype.clone = function(){
		var obj = {};
		for(var n in this){
			obj[n] = this[n];
		}
		return obj;
	}
	Module.prototype.init = function() {
		//取出真实路径
		this.fileType = fileType(parsePaths(this.id)) || 'js';
	};
	//添加加载完毕后触发的操作列表
	Module.prototype.onload = function(onload) {
		this.loaded.push(onload);
	};
	//执行模块得到exports
	Module.prototype.exec = function() {
		var mod = this,
			factory,
			exports;
		// 执行过了则不需要再次执行
		if (mod.status >= STATUS.EXECUTING) {
			return mod.exports
		}

		function require(id) {
			return Module.get(id).exec();
		}
		require.async = function(ids, callback) {
				modCore.use.apply(modCore, arguments);
				return require;
			}
			//加载失败的时候
		if (mod.factory === undefined) {
			exports = undefined;
			// Exec factory
		} else {
			mod.status = STATUS.EXECUTING;
			factory = mod.factory;
			exports = type(factory) === 'function' ?
				factory(require, mod.exports = {}, mod) :
				factory;
			// 当模块体是函数时,将执行后赋值在模块exports的接口赋值给exports变量
			// 如果函数没有返回任何东西，只是执行的话，则赋值{}
			if (exports === undefined) {
				exports = mod.exports;
			}
			mod.status = STATUS.EXECUTED;
			mod.exports = exports;
			// 执行完毕删除模块对函数体的引用
			delete mod.factory;
		}
		return exports;
	};
	//加载完毕后来触发,这里需要解析自身模块的依赖关系到关系表中,并触发自身的回调
	Module.prototype.load = function() {
		//当factory不为空时,解析自身parse
		this.factory && this.dependencies.length && this.parseDepend();
		each(this.loaded, function(load) {
			load();
		});
	}
	Module.prototype.parseDepend = function() {
		// array
		var depend = this.dependencies,
			deplist = coreConfig.deplist,
			modId = this.id,
			// string, array, null
			selfDep = deplist[modId],
			depsLn, i;
		if (!selfDep || type(selfDep) === 'string') {
			selfDep = deplist[modId] = selfDep ? [selfDep] : [];
		}
		depsLn = selfDep.length;
		each(depend, function(newDep) {
			var isSame = false;
			for (i = 0; i < depsLn; i++) {
				if (selfDep[i] === newDep) {
					isSame = true;
					break;
				}
			}
			if (!isSame) {
				deplistChange = true;
				selfDep.push(newDep);
			}
		});
	}

	//获取模块,这里会进行缓存
	Module.get = function(modId) {
		var module = moduleCache[modId]
		if (!module) {
			module = moduleCache[modId] = new Module(modId);
			module.init();
		}
		return module;
	};
	//使用模块
	// modules: []
	Module.use = function(modules, callback) {
		//处理依赖列表
		var depModules = Module.getDeps(modules),
			waiting = 0,
			fetchModules = [];
		each(depModules, function(module) {
			//处理模块加载，以及为模块加载设置回调
			if (module.status < STATUS.SAVED) {
				module.onload(function() {
					if (--waiting === 0) {
						callback(depModules);
					}
				});
				fetchModules[waiting++] = module;
			}
		});
		if (fetchModules.length) {
			Module.fetch(fetchModules);
		} else {
			callback(depModules);
		}
	};
	//获取模块的所有依赖模块列表
	Module.getDeps = function(modIds) {
		var needModules = {},
			deplist = coreConfig.deplist;
		each(modIds, function(modId) {
			//添加模块到需要加载的列表中
			//如果是有缓存的话,这里会将modId模块中的依赖直接解析到依赖表中
			pushToNeed(modId);
			//查询出当前模块的依赖模块列表
			//这是一个递归,每一个依赖都进行递归查询，每次返回的数组都最终合并到一起，返回到顶级的 each
			each(getDepsModule(modId), function(modId) {
				//添加模块到需要加载的列表中
				pushToNeed(modId);
			});
		});
		return needModules;

		//return [];
		function getDepsModule(modId) {
			var result = [],
				deps;
			// []
			if (deps = deplist[modId]) {
				result = type(deps) === 'string' ? [deps] : deps;
				for (var i = 0, j = deps.length; i < j; i++) {
					result = result.concat(getDepsModule(deps[i]));
				}
			}
			return result;
		}

		function pushToNeed(modId) {
			//在这里接入别名挂载点
			if (!needModules[modId]) {
				needModules[modId] = Module.get(modId);
			}
		}
	};
	//加载模块
	Module.fetch = function(loadModules) {
		var config = coreConfig,
			waitingLoad = [],
			comboModels;
		//过滤掉不需要加载(缓存||已经加载完毕)的模块
		each(loadModules, function(mod, i) {
			//此控件返回true的时候,不加载次模块
			mounts.dispatch('fetchModuleFilter', [mod.id]) ?
				mod.load() :
				waitingLoad.push(mod);
		});
		if (!waitingLoad.length)
			return;
		//合并加载
		if (config.combo) {
			comboModels = {
				'js': [],
				'css': []
			};
			each(waitingLoad, function(mod) {
				comboModels[mod.fileType].push(mod.id);
			});
			comboModels['js'].length && fetch(comboModels['js']);
			comboModels['css'].length && fetch(comboModels['css']);
			//一般加载
		} else {
			each(waitingLoad, function(mod) {
				fetch([mod.id]);
			});
		}

		function fetch(ids) {
			define.load(ids.slice(0), function() {
				each(ids, function(modId) {
					moduleCache[modId].load();
				});
			});
		}
	};
	Module.genUrl = function(ids) {
		var comboFun = coreConfig.combo;
		var config = coreConfig;
		var queryUrl;
		if (comboFun && typeof comboFun === 'function') {
			queryUrl = comboFun.apply(config, [ids]);
		} else {
			queryUrl = config.baseUrl || '';
			ids = parsePaths(ids[0]);
			if (fileType(ids) !== 'js') {
				ids = ids + '.js';
			}
			queryUrl = ~queryUrl.indexOf('%s') ?
				queryUrl.replace('%s', ids) :
				queryUrl + ids;
			queryUrl = queryUrl + (~queryUrl.indexOf('?') ? '&' : '?') + '_hash=' + config.hash;
		}
		return queryUrl;
	}

	/******* 对外接口 *******/
	//配置
	modCore.config = function(obj) {
		var options = coreConfig;
		each(obj, function(value, key) {
			if (key === 'paths') { //对paths的设置项做特殊处理
				return comboPaths(value);
			}
			var t = type(value);
			if (t === 'object' || t === 'array') {
				//如果配置中初始化的就是对象的话
				value = JSON.parse(JSON.stringify(value));
			};
			options[key] = value;
		});
		// detect _debug=nocombo in location.search
		if (/\b_debug=([\w,]+)\b/.test(location.search)) {
			if (RegExp.$1.indexOf('nocombo'))
				options.combo = false;
		}
		mounts.dispatch('config');
	};

	function comboPaths(obj) { //{key: value}
		var pathsCon = coreConfig.paths; // {}
		each(obj, function(val, key) {
			pathsCon[key] = val;
		})
	}
	//使用模块 (mod1,mod2[,fn]); ([mod1,mod2],fn);
	modCore.use = function() {
		var needModulesId, callback;
		needModulesId = [].concat.apply([], arguments);
		callback = needModulesId[needModulesId.length - 1];
		callback = type(callback) === 'function' ?
			needModulesId.pop() :
			null;
		Module.use(needModulesId, process);
		//这里只是经过
		function process() {
			/*
				deplistChange能发生改变的主要是因为 define(,[dep1,dep2],fun) 有了依赖
				当经历过千山万苦在回到这里的时候,
				早有的记忆可能已经改变,
				无奈你需要重回起点，再次拾起那“遗失的记忆”
			********/
			if (deplistChange) {
				deplistChange = false;
				Module.use(needModulesId, process);
			} else {
				finalHandle();
			}
		}
		//最终走到这里
		function finalHandle() {
			var exports = [];
			each(needModulesId, function(moduleId, i) {
				exports[i] = moduleCache[moduleId].exec();
			});
			callback && callback.apply(global, exports);
		}
	};
	//扩展属性
	modCore.extend = function(obj, objExt) {
		if (objExt === undefined) {
			objExt = obj;
			obj = this;
		}
		for (var n in objExt) {
			if (objExt.hasOwnProperty(n) && !obj[n]) {
				obj[n] = objExt[n];
			}
		}
	};
	modCore.require = function(id) {
		return Module.get(id).exec()
	}	

	global.define = define;
	global.module = modCore;

	/******* 工具函数 *******/
	function each(obj, iterator, context) {
		if (!obj) return;
		var i, l, t = type(obj);
		context = context || obj;
		if (t === 'array') {
			for (i = 0, l = obj.length; i < l; i++) {
				if (iterator.call(context, obj[i], i, obj) === false)
					return;
			}
		} else {
			for (i in obj) {
				if (obj.hasOwnProperty(i)) {
					if (iterator.call(context, obj[i], i, obj) === false)
						return;
				}
			}
		}
	}

	function type(obj) {
		var t;
		if (obj == null) {
			t = String(obj);
		} else {
			t = Object.prototype.toString.call(obj).toLowerCase();
			t = t.substring(8, t.length - 1);
		}
		return t;
	}
	var TYPE_RE = /\.(js|css)(?=[?&,]|$)/i;

	function fileType(str) {
		var ext;
		str.replace(TYPE_RE, function(m, $1) {
			ext = $1;
		});
		return ext;
	}
})(this);