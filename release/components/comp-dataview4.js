define('comp-dataview4',function (require, exports, module) {
	require('comp-datahead2');require('comp-datalist2');
	module.exports = require('$Compenent')('comp-dataview4',{
		tpl: '<div class="cp-datalist">\
				<%= this.$require("comp-datahead2") %>\
				<div class="cp-dl-desc"><%- desc %></div>\
				<%= this.$require("comp-datalist2") %>\
			</div>',
		css: '.cp-datalist{\
				margin:0 10px 10px;\
				color:black;\
				text-align:left;\
				background:#f0f;\
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