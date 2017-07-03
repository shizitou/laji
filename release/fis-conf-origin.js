fis.match('/components/(**.html)', {
	// release: '/js/$1',
	parser: fis.plugin(function(content, file, options) {
		//给文件名加个系统前缀
		// file.filename = 'comp-'+file.filename;
		file.filename = file.filename+file.ext;
		// 让 style 的inline解析生效
		file.isJsLike = true;
		// 把html变成js文件
		//这里只是处理编译后的文件的命名，至于编译到何处，不管
		file.release = file.release+'.js';
		file.url = file.url+'.js';
		// console.error('---');
		// error warning 
		// fis.log.warning('%s %s \n%s', 'ark'.red, 'lhm'.red, '自定义错误');
		// file.release = file.release.replace(/\/\w+\.html/,'/'+file.filename+'.js');
		// file.url = file.url.replace(/\/\w+\.html/,'/'+file.filename+'.js');
		return content;
	}),
	postprocessor: fis.plugin(function(content, file, options) {
		//提取出style样式，这里就是找所有的style标签
		var style = [];
		content = content.replace(/<style[^\>]*>([\s\S]*?)<\/style>/ig,function(all,$1){
			$1 = $1.trim();
			if(!/^['"].*['"]$/.test($1)){
				$1 = JSON.stringify($1);
			}
			$1 = $1.slice(1,$1.length-1);
			style.push($1.trim());
			return '';
		});
		style = '"'+style.join('\\n')+'"';
		//提取出所有的依赖
		//$require("datalist2D.html",{a:"{}()[]"})%>'.match(/\$require\(['"]([\w\d\.\_\-]+)['"]+/ig)
		var dependent = [];
		/*
			这样提取也有一个弊端，那就是当模块是以变量形式传进来的时候，就分析不出来了
		*/
		content = content.replace(/\$require\(\s*['"]([\w\d\.\_\-]+)['"]/ig,function(all,$1){
			dependent.push($1);
			return all;
		});
		// content = content.replace(/<require([^\/\>]*)\/?>/ig,function(all,$1){
		// 	var attrMap = {};
		// 	$1 = $1.trim();
		// 	$1 = $1.split(/\s+/);
		// 	$1.forEach(function(attribute){ //每一个DOM属性 key='val'
		// 		attribute = attribute.split('=');
		// 		var attrVal = attribute[1];
		// 		if(/^[\'\"]/.test(attrVal)){ // "val" 'val'
		// 			attrVal = attrVal.slice(1,attrVal.length-1);
		// 		}
		// 		attrMap[attribute[0]] = attrVal;
		// 	});
		// 	dependent.push(attrMap);
		// 	return '';
		// });
		var depStr = '';
		// dependent.forEach(function(depInfo){
		// 	var compName = depInfo['comp'] || depInfo['component'];
		// 	depStr += 'require("'+compName+'");';
		// });
		dependent.forEach(function(reqMod){
			depStr += 'require("'+reqMod+'");';
		});
		content = content.trim();
		
		//编译文件
		content = "define('"+file.filename+"',function (require, exports, module) {\
			"+depStr+"\
			module.exports = require('$component')('"+file.filename+"',{\
				tpl: "+JSON.stringify(content)+",\
				css: "+style+"\
			});\
		})";
		return content;
	}),
})