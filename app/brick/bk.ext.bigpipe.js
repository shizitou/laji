/*
 *	此模块需要配合php功能进行使用，
 * 	在页面第一次使用某接口时，使用缓冲输出的数据
 *	END 的逻辑：
 *		函数已有，数据没有 直接触发等待中的函数
 *		函数没有，数据已有 当函数过来时，正常触发
 *		函数没有，数据没有 当函数过来时，直接触发
 **/
define('$bigPipe', ['$config'], function(require, exports, module) {
	var dataMap = {};
	var waitingMap = {};
	var $config = require('$config');
	var timeout = $config.bigPipe || 15000; //默认15秒
	var timer;
	if(timeout)
		timer = setTimeout(_end,timeout);
	//window.onload 则说明，服务器返回数据结束
	window.addEventListener('load',_end,false);
	//掉线了，也就结束了
	window.addEventListener('offline',_end,false);
	function _end(){
		timer && clearTimeout(timer);
		window.removeEventListener('load',_end);
		window.removeEventListener('offline',_end);
		if(_end.ended) return;
		_end.ended = true;
		setTimeout(function(){
			bigPipe.end();
		},4);
	}
	var bigPipe = {
		gameover: false, //bigPipe结束了
		fire: function(id){
			var data = dataMap[id]; //数据
			var handlers = waitingMap[id]; //函数回调列表
			if(handlers){
				if(data){ //函数没有，数据已有 当函数过来时，正常触发
					if(data.beUsed){
						handlers.forEach(function(handler){
							handler(null);
						});
					}else{
						handlers.forEach(function(handler){
							handler(data.data);
						});
						if(data.once){
							data.beUsed = true;
							data.data = null;
						}
					}
					waitingMap[id] = []; //使用过一次后都制空
				}else if(this.gameover){ //函数没有，数据没有 当函数过来时，直接触发
					handlers.forEach(function(handler){
						handler(null);
					});
					waitingMap[id] = [];
				}
			}
		},
		use: function(id, callback){
			waitingMap[id] || (waitingMap[id] = []);
			waitingMap[id].push(callback);
			setTimeout(function(){
				bigPipe.fire(id);
			},1);
		},
		set: function(id,data,keep /*使用一次后就清理掉数据*/){
			if(this.gameover) return;
			data && (dataMap[id] = {
				beUsed: false,
				once: !keep, /* false:只使用一次, true: 一直使用 */
				data: data
			});
			this.fire(id);
		},
		end: function(){
			this.gameover = true;
			//函数已有，数据没有 直接触发等待中的函数
			for(var id in waitingMap){
				waitingMap[id].forEach(function(handler){
					handler(null);
				});
				waitingMap[id] = [];
			}
		}
	};
	return bigPipe;
});