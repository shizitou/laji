define('index', function(require) {
	var ls = require('$localStorage');
	var template = require('$template');
	var $http = require('$http');
	require('comp-dataview');require('comp-dataview2');
	require('comp-dataview3');require('comp-dataview4');
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
					return 'BRICK_'+val;
				}
			};
			//模板相关逻辑
			var dataStr = template(__inline('../tpl/index.tpl.html'),data,tools); 
			var dataStr = template(__inline('../tpl/index.tpl.html')).call(tools,data);
			var dataStr = template.call(tools, __inline('../tpl/index.tpl.html'), data); 
			var dataStr = template.call(tools,__inline('../tpl/index.tpl.html'))(data); 
			this.el[0].querySelector('.js-dataView').innerHTML = dataStr;
			//$http
			$http.ajax({
				url: '/a/b/../c/../../ajax.test.js',
				type: 'POST',
				data: {
					size: 10,
					page: 2,
				},
				cache: true,
				// cacheFilter: function(res){
				// 	return res === 10;
				// },
				cacheHash: '543',
				dataType: 'text',
				success: function(res,status){
					console.log('options: ',status,JSON.parse(res));
				},
			}).done(function(res,status){
				console.log(status,JSON.parse(res));
			});
			console.log('ajax-----------');
			//define.reload
			// setTimeout(function () {
			// 	define.reload('comp-dataview',function(){
			// 		console.log('reload-success');
			// 	},function () {
			// 		console.log('reload-fail');
			// 	});
			// },1000);
		},
		leave: function() {}
	}
});