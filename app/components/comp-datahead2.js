define('comp-datahead2',function (require, exports, module) {
  module.exports = require('$Compenent')('comp-datahead2',{
    tpl: '<header><%= title %></header>',
    css: 'header{\
    		height:30px;\
    		line-height:30px;\
    		font-size:24px;\
    		font-weight:bold;\
    		background: #f60;\
    	}'
  });
})