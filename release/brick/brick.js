define('$brick',['$router','$config','$util','$controller'],function(require,exports,module){
	'use strict';
	var BK;
	var originModule = window.module;
	delete window.module;
	var f = function(){};
	f.prototype = originModule;
	BK = window.BK = new f();

	var utilMod = require('$util');
	var routerMod = require('$router');
	var controlMod = require('$controller');
	BK.config = function(options){
		//留下业务中需要的配置项,其他的交给模块加载器处理
		filterConfig(options);
		originModule.config(options);
	}
	BK.start = function(options){
		options && this.config(options);
		//将收集的API绑定给BK
		utilMod.bindTo(BK);
		if(routerMod){
			routerMod.start();
		}else{
			controlMod.init();
			BK.trigger('afterRun');
			var hashParam = BK.parseHash();
			var controller;
			if(hashParam['ct'] && hashParam['ac']){
				controller = hashParam['ct']+hashParam['ac'];
				hashParam['__page'] = controller;
				delete hashParam['ct'],delete hashParam['ac'];
			}else if(appConfigs.defController){
				controller = appConfigs.defController;
			}
			if(!controller){
				throw new Error('页面不存在');
			}
			controlMod.firePageControl(controller,hashParam,{});
		}
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
					events[i].apply(window,args);
				}
			}
		}
	}
	var appConfigs = require('$config');
	function filterConfig(from){
		var item;
		for(var n in appConfigs){
			item = from[n];
			if(typeof item!=='undefined'){
				appConfigs[n] = item;
				delete from[n];
			}
		}
	}
});
module.use('$brick');