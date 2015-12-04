//负责 路由解析,调度各个页面模块
define('$router',['$config','$controller','$util'],function(require,exports){
	var config = require('$config'),
		control = require('$controller'),
		util = require('$util');
	function Router(){};
	Router.prototype = {
		constructor: Router,
		init: function(){
			this.defControl = config.defController;
			control.init();
		},
		navigate: function(hash,options){
			var con = this.parseHash(hash);
			control.firePageControl(con[0],con[1],options);
		},
		parseHash: function(hash){
			//返回 'ct.ac' 和 解析后的parse参数
			var controller,
				params = this.toObject(hash);
			if(params['ct'] && params['ac']){
				controller = params['ct']+params['ac'];
				params['__page'] = controller;
				delete params['ct'],delete params['ac'];
			}else if(this.defControl){
				controller = this.defControl;
			}
			if(controller){
				return [controller,params];
			}else{
				throw new Error('页面不存在');
			}
		},
		toObject: function(hash){
			//返回 'ct.ac' 和 解析后的parse参数
			var paramArr = hash.split('/'),
				params = {},
				i=0,j=paramArr.length,
				de = decodeURIComponent;
			for(;i<j;i=i+2){
				paramArr[i] && (params[paramArr[i]] = de(paramArr[i+1]));
			}
			return params;
		}
	};
	//解析页面中的hash参数
	util.set('parseHash', function(hash){
		return Router.prototype.toObject(hash || this._getOriHash());
	}).set('parseSearch', function(search){
		search = search || location.search;
		search = search.split('&');
		var ln = search.length-1,
			option,
			params = {},
			de = decodeURIComponent;
		for(;ln>=0;ln--){
			option = search[ln];
			params[option.split('=')[0]] = de(option.substr(option.indexOf('=')+1));
		}
		return params;
	});
	return new Router;
});