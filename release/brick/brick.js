define('$brick',['$history','$config','$util'],function(require,exports,module){
	var BK;
	var f = function(){};
	var originModule = window.module;
	delete window.module;
	f.prototype = originModule;
	BK = window.BK = new f();
	
	var configMod = require('$config');
	var historyMod = require('$history');
	var utilMod = require('$util');
	var appConfig = {};
	BK.config = function(options){
		//留下业务中需要的配置项,其他的交给模块加载器处理
		appConfig = options;
		originModule.config(options);
	}
	BK.start = function(options){
		//留下业务中需要的配置项,其他的交给模块加载器处理
		if(options){
			originModule.config(options);
		}
		//开启整个项目
		historyMod.start(appConfig);
		utilMod.bindTo(BK);
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
	BK.globalEvent = function(type,fn){
		(BK._event[type] || (BK._event[type] = [])).push(fn);
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
});
module.use('$brick');