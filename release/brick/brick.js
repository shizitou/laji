/* eslint-disable */
define('$brick', ['$router', '$config', '$util', '$controller'], function(require, exports, module) {
	'use strict';
	var BK;
	var originModule = window.module;
	delete window.module;
	var f = function() {};
	f.prototype = originModule;
	BK = window.BK = new f();
	var appConfigs = require('$config');
	BK.config = function(options) {
		//留下业务中需要的配置项,其他的交给模块加载器处理
		var item;
		for (var n in appConfigs) {
			item = options[n];
			if (typeof item !== 'undefined') {
				appConfigs[n] = item;
				delete options[n];
			}
		}
		originModule.config(options);
	}
	BK.paths = function(paths) {
		this.config({ paths: paths });
	};
	BK.deplist = function(deplist) {
		this.config({ deplist: deplist });
	};
	BK.start = function(options) {
		options && this.config(options);
		//这里将模块的载入放到start里面，是为了在各自模块中在引用$config时，是已经处理完毕的
		var utilMod = require('$util'); 
		var routerMod = require('$router');
		var controlMod = require('$controller');
		//将收集的API绑定给BK
		utilMod.bindTo(BK);
		if (routerMod) {
			routerMod.start();
		} else {
			controlMod.init();
			BK.trigger('afterRun');
			var hashParam = BK.parseHash();
			var controller = '';
			if (hashParam['ct']) {
				controller = hashParam['ct'] + (hashParam['ac'] || '');
				delete hashParam['ct'], delete hashParam['ac'];
			} else if (appConfigs.defController) {
				controller = appConfigs.defController;
			}
			controlMod.firePageControl(controller, hashParam, {});
		}
	};
	var events = {};
	//globalEvent是为了兼容旧代码的调用
	BK.bind = BK.globalEvent = function(type, fn) {
		(events[type] || (events[type] = [])).push(fn);
	};
	BK.unbind = function(type, fn) {
		if (fn) {
			var eventList = events[type];
			eventList && eventList.forEach(function(item, index, events) {
				item === fn && events.splice(index, 1);
			});
		} else {
			events[type] = [];
		}
	};
	BK.trigger = function(type, args) {
		var eventList = events[type],
			j;
		args = args || [];
		if (eventList) {
			if (j = eventList.length) {
				for (var i = 0; i < j; i++) {
					eventList[i].apply(window, args);
				}
			}
		}
	}

});
module.use('$brick');