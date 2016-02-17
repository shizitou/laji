define('$brick',['$router','$config','$util'],function(require,exports,module){
	'use strict';
	var BK;
	var originModule = window.module;
	delete window.module;
	var f = function(){};
	f.prototype = originModule;
	BK = window.BK = new f();
	
	var routerMod = require('$router');
	var utilMod = require('$util');
	var appConfig = {};
	BK.config = function(options){
		//留下业务中需要的配置项,其他的交给模块加载器处理
		filterConfig(options,appConfig);
		originModule.config(options);
	}
	BK.start = function(options){
		//留下业务中需要的配置项,其他的交给模块加载器处理
		if(options){
			filterConfig(options,appConfig);
			originModule.config(options);
		}
		//将收集的API绑定给BK
		utilMod.bindTo(BK);
		//开启整个项目
		routerMod.start(appConfig);
	};
	BK.paths = function(paths){
		this.config({
			paths: paths
		});
	};
	BK.deplist = function(deplist){
		this.config({
			deplist: deplist
		});
	};
	BK._event = {};
	//globalEvent是为了兼容旧代码的调用
	BK.bind = BK.globalEvent = function(type,fn){
		(BK._event[type] || (BK._event[type] = [])).push(fn);
	};
	BK.unbind = function(type,fn){
		if(fn){
			var events = BK._event[type];
			events && events.forEach(function(item,index,events){
				item===fn && events.splice(index,1);
			});
		}else{
			BK._event[type] = [];
		}
	};
	BK.trigger = function(type,args){
		var events = BK._event[type],j;
		args = args || [];
		if(events){
			if(j = events.length){
				for(var i=0;i<j;i++){
					events[i] = function(fn){
						fn.apply(window,args);
					};
				}
			}
		}
	}
	var appConfigs = require('$config');
	function filterConfig(from,to){
		var item;
		for(var n in appConfigs){
			item = from[n];
			if(typeof item!=='undefined'){
				to[n] = item;
				delete from[n];
			}
		}
	}
});
module.use('$brick');