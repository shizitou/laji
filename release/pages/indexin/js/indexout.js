define('indexout', ['defer'], function(require) {
	var defer = require('defer');
	var ls = require('$localStorage');
	var template = require('$template');
	return {
		el: '#page_index',
		pageView: "<div id=\"page_index\">\r\n\t<h1>hello index</h1>\r\n</div>",
		init: function(params) {
			console.log('init', params);
		},
		enter: function(params) {
			var data = {
				"title": "包质量宠文，不看后悔",
				"desc": "保质保量，一生一世一双人，宠文，爽文。",
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
			console.log( template("<div>\r\n\t<header>数据标题</header>\r\n\t<div><%= this.require('comp-novel') %></div>\r\n</div>",data) );
		},
		leave: function() {

		}
	}
});

define('comp-novelList',function (require, exports, module) {
  module.exports = require('$Compenent')({
    tpl: '<li>novellist</li>',
    css: 'li{color:red;}'
  });
})

define('comp-novel',function (require, exports, module) {
  module.exports = require('$Compenent')({
    tpl: '<ul><%= this.require("comp-novelList") %></ul>',
    css: 'div{background:black;}'
  });
})

/****
<template>
  <html>
    <div><%= this.require("novellist") %></div>
  </html>
</template>

define(function (require, exports, module) {
  $('#header').append($(require('header').render({
    a:1, b:2
  }))
  require('footer').render({
    a:1, b:2
  })
})
************/

/*
var brick = function(_) {
	var __comps = {}
	var __context = null
	var brick = {}
	brick.add = function(name, template) {
		__comps[name] = function(context) {
			if (typeof context == 'undefined') {
				return _.template(template).call(__comps, __context[0])
			} else {
				__context.unshift(context)
				var html = _.template(template).call(__comps, context)
				__context.shift()
				return html
			}
		}
		return brick
	}

	brick.render = function(context, template, element) {
		var tplFunc = _.template(template)
		__context = [context]
		var html = tplFunc.call(__comps, __context[0])
		element.innerHTML = html
		__context = null
	}
	return brick
}(window._.noConflict())
brick.add('List', '<% for (var i = 0, l = data.length; i < l; i++) { %> <li><%- data[i] %></li> <% } %>')
brick.render({
	data: [1, 2, 3, 4]
}, '<ul><%= this.List() %></ul>', document.body)

*/