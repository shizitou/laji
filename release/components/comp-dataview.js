define('comp-dataview',function (require, exports, module) {
	require('comp-datahead');require('comp-datalist');
	module.exports = require('$Compenent')('comp-dataview',{
		tpl: '<div class="cp-datalist">\
				<%= $require("comp-datahead") %>\
				<div class="cp-dl-desc"><%- desc %></div>\
				<%= $require("comp-datalist") %>\
			</div>',
		css: '.cp-datalist{\
				margin:0 10px 10px;\
				color:black;\
				text-align:left;\
				background:#00B3FF;\
			}\
			.cp-dl-desc{\
				line-height:16px;\
				font-size:12px;\
				margin:5px 0 5px 0;\
				text-indent:2em;\
				margin-bottom:2px;\
				border-bottom:1px solid #f1f1f1;\
			}'
	});
})