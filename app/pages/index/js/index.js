define('index',function(require) {
	require('index.css'); //使用CSS模块
	
	var ls = require('$localStorage');
	var template = require('$template');
	var $http = require('$http');
	require('dataview.html');
	require('dataview2.html');
	require('dataview3.html');
	//这里是一个编译过的函数，并不是字符串，使用的时候需要传入数据即可
	var a = require('dataview4.html'); 
	// console.log(a({
	// 	"title": "包质量宠文，不看后悔",
	// 	"desc": "保质保量，一生一世一双人，宠文，爽文。保质保量，一生一世一双人，宠文，爽文。",
	// 	"items": [{
	// 		"title": "淡定为妃",
	// 		"author": "风过水无痕",
	// 	}, {
	// 		"title": "八宝妆",
	// 		"author": "月下蝶影",
	// 	}, {
	// 		"title": "那村那人那傻瓜",
	// 		"author": "福宝",
	// 	}],
	// 	"flag": "new"
	// }));

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
			this.el[0].addEventListener('click',function(){
				BK.link('shelf',{});
			},false);
			// console.log(FastClick);

			/* 测试 $http 模块的cache是否生效 *
			var xhr = $http.ajax({
				url: '/a/b/../c/../../ajax.test.js',
				type: 'POST',
				data: {
					size: 10,
					page: 2,
				},
				$bigPipe: 'test-1',
				// cache: true,
				// cacheFilter: function(res){
				// 	return res === 10;
				// },
				cacheHash: '',
				dataType: 'text',
				success: function(res,status){
					console.log('success: ',res);
					// console.log(arguments);
					// console.log('options.success: ',res);
				},
				complete: function(res){
					// console.log('complete: ');
					// console.log(arguments);
				}
			}).done(function(res,status){
				// console.log('done: ',arguments);
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

			/* test load umd module */
			for(var i=1;i<=10;i++){
				(function(i){
					require.async('umdMod'+i, function(umdMod){
						console.log('load umdMod'+i,umdMod);
					});
				})(i);
			}
			require.async('./test.umd1.js', function(jquery){
				// define(function(){ exports.jquery = {} })
				console.log(jquery);
			});
			//*/
		},
		leave: function() {
		}
	}
});
define('shelf',function(){
	return {
		el: '#page_shelf',
		pageView: '<div id="page_shelf">书架页</div>',
		init: function(){},
		enter: function(){
		}
	}
})
