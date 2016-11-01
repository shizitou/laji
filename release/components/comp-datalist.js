define('comp-datalist',function (require, exports, module) {
  module.exports = require('$component')('comp-datalist',{
    tpl: '<ul>\
	    	<%for(var i=0,j=items.length;i<j;i++){%>\
				<li><%= items[i].author %>：<%= items[i].title %></li>\
			<%}%>\
		</ul>',
    css: 'li{\
    		list-style:none;\
    		text-indent:20px;\
    		font-size:14px;\
    		height:20px;\
    		line-height:20px;\
    		position:relative;\
    	}\
    	li:before{\
    		position:absolute\
    		top:6px\
    		left:6px\
    		content:""\
    		width:8px\
    		height:8px\
    		background:red\
    		border-radius:50%;\
    	}'
  });
})