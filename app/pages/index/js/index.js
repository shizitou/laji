define('index',function(require) {
	var ls = require('$localStorage');
	var template = require('$template');
	var $http = require('$http');
	require('dataview.html');
	require('dataview2.html');
	require('dataview3.html');
	//这里是一个编译过的函数，并不是字符串，使用的时候需要传入数据即可
	var a = require('dataview4.html'); 
	console.log(a({
				"title": "包质量宠文，不看后悔",
				"desc": "保质保量，一生一世一双人，宠文，爽文。保质保量，一生一世一双人，宠文，爽文。",
				"items": [{
					"title": "淡定为妃",
					"author": "风过水无痕",
				}, {
					"title": "八宝妆",
					"author": "月下蝶影",
				}, {
					"title": "那村那人那傻瓜",
					"author": "福宝",
				}],
				"flag": "new"
			}));

	// var jq = require('jquery');
	/**
	define('temporary',function(require, exports, module){
		module.exports = require('$component')('temporary',{
			tpl: '<div>temporary</div>',
			css: __inline('big.css')
		});
	})
	template('<%= $require("temporary") %>',{});
	//*/
	return {
		el: '#page_index',
		pageView: __inline('../html/index.html'),
		init: function(params) {},
		enter: function(params) {
			var data = {
				"title": "包质量宠文，不看后悔",
				"desc": "保质保量，一生一世一双人，宠文，爽文。保质保量，一生一世一双人，宠文，爽文。",
				"items": [{
					"title": "淡定为妃",
					"author": "风过水无痕",
				}, {
					"title": "八宝妆",
					"author": "月下蝶影",
				}, {
					"title": "那村那人那傻瓜",
					"author": "福宝",
				}],
				"flag": "new"
			};
			var tools = {
				addPrefix: function(val){
					return val;
				}
			};
			/* 测试模块引擎的自定义context是否可用 */ 
			var dataStr = template(__inline('../tpl/index.tpl.html'),data,tools); 
			var dataStr = template(__inline('../tpl/index.tpl.html')).call(tools,data);
			var dataStr = template.call(tools, __inline('../tpl/index.tpl.html'), data); 
			var dataStr = template.call(tools,__inline('../tpl/index.tpl.html'))(data); 
			this.el[0].querySelector('.js-dataView').innerHTML = dataStr;
			// this.el[0].querySelector('.js-dataView').innerHTML = template('<%= $require("test.html") %>',{});
			//*/

			/* 测试 $http 模块的cache是否生效 */
			var xhr = $http.ajax({
				url: '/a/b/../c/../../ajax.test.js',
				type: 'POST',
				data: {
					size: 10,
					page: 2,
				},
				// cache: true,
				// cacheFilter: function(res){
				// 	return res === 10;
				// },
				cacheHash: '',
				dataType: 'text',
				success: function(res,status){
					console.log('success: ');
					console.log(arguments);
					// console.log('options.success: ',res);
				},
				complete: function(res){
					console.log('complete: ');
					console.log(arguments);
				}
			}).done(function(res,status){
				console.log('done: ',arguments);
			});
			// setTimeout(function(){ xhr.done(function(res,status){
			// 	console.log('timeout-done: ',res);
			// }) },1000);
			//*/
			
			/* 测试重载方法是否好用 define.redefine & define.reload *
			// define.redefine(function(modid,deps,factory){
			// 	console.log('redefine 之后的函数');
			// 	console.log('redefine:',modid,deps,factory);
			// });
			setTimeout(function () {
				define.reload('dataview.html',function(require){
					console.log(require('dataview.html'));
				},function () {
					console.log('reload-fail');
				});
			},1000);
			//*/
		},
		leave: function() {}
	}
});

/**
	TODO::
	【OK】1. 直接在<style>内写样式
	
	【OK】2. 取消前缀的添加
	
	【OK】3. 取消<require>的检索，改为检索 $require("", {})
	
	【OK】4. 保留文件后缀，使用时也保留(先实现，再讨论)
	
	【OK】5. require('xxx') 时,直接返回字符串内容
		!!但在业务中使用时，还是需要在顶部进行声明
*******/