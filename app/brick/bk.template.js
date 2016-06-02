//模板引擎
define('$Compenent',['$template'],function (require,exports,module) {
    var $template = require('$template');
    var compsList = {};
    var rep_style = /((?:[^\{\}\s]+\s*)+)(\{.*?\})/g;
    var rep_nodeName = /^\s*<(\w+)/;
    var prefixId = 1;
    var style = document.createElement('style');
    var tableRow = document.createElement('tr');
    var containers = {
        'tr': document.createElement('tbody'),
        'td': tableRow,
        'th': tableRow,
        '*': document.createElement('div')
    };
    document.head.appendChild(style);
    function addStyle(css,prefixClass){
        var lineCss,styleKey;
        var result = "";
        while(lineCss = rep_style.exec(css)){
            styleKey = lineCss[1];
            styleKey = styleKey.split(/,\s*/).map(function(cssStr){
                return cssHandle(cssStr,'.'+prefixClass);
            }).filter(function(cssStr){
                return cssStr;
            });
            result += styleKey.join(',')+lineCss[2];
        }
        style.appendChild( document.createTextNode(result) );
    }
    function cssHandle(styleKey, prefixClass) {
        var mainKey;
        if (styleKey) {
            styleKey = styleKey.split(/\s+/);
            mainKey = styleKey.shift();
            styleKey = styleKey.length ? ' ' + styleKey.join(' ') : '';
            return mainKey + prefixClass + styleKey + ',' +
                prefixClass + ' ' + mainKey + styleKey;
        }
        return '';
    }
    function addClassToRenView(origin,profixClass){
        var nodeName,container;
        nodeName = origin.match(rep_nodeName);
        nodeName = nodeName && nodeName[1];
        container = containers[nodeName] || containers['*'];
        container.innerHTML = origin;
        origin = container.children;
        for(var i=origin.length-1;i>=0;i--){
            origin[i].className = origin[i].className+' '+profixClass;
        }
        return container.innerHTML;
    }
    module.exports = function (compId,compObj) {
        compObj.complie = $template(compObj.tpl);
        compsList[compId] = {
            resource: compObj,
            compStyle: null
        };
        compObj = null;
        return function(data, context) {
            var compObj = compsList[compId];
            var compResObj = compObj.resource;
            var compStyle = compObj.compStyle;
            //处理css到页面当中
            if (compResObj.css && !compStyle) {
                compObj.compStyle = compStyle = 'bkcomps-' + prefixId++;
                addStyle(compResObj.css, compStyle);
            }
            return addClassToRenView(
                compResObj.complie(data, context), compStyle
            );
        };
    }
});
define('$template',[],function(require){
	/****************
    这是从underscore源码中提取出来的模板引擎,
    源码中的调用方法是 _.template();
    ****************/
    return function(text, data, context) {
        //存放的是组合后的渲染函数
        var render,result,
            //匹配模板标签
            settings = {
                evaluate    : /<%([\s\S]+?)%>/g,
                interpolate : /<%=([\s\S]+?)%>/g,
                escape      : /<%-([\s\S]+?)%>/g
            },
            //转意成实体,用于过滤html标签
            entityMap = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;'
            },
            //转意实体的调用方法,当遇到 <%- %> 时,调用
            _escape = function (string) {
                if (string == null) 
                    return '';
                return ('' + string).replace( /[&<>"']/g , function(match){
                    return entityMap[ match ];
                });
            },
            //转意空格之类的字符
            escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g,
            escapes = {
                "'": "'",
                '\\': '\\',
                '\r': 'r',
                '\n': 'n',
                '\t': 't',
                '\u2028': 'u2028',
                '\u2029': 'u2029'
            },
            //解析模板标签的正则队列
            matcher = new RegExp([
                ( settings.escape ).source,
                ( settings.interpolate ).source,
                ( settings.evaluate ).source
            ].join('|') + '|$', 'g'),
            //最终拼接字符串时,跟中的下标
            index = 0,
            //最终执行的匹配后的字符串
            source = "__p+='";
        //拼接各种形式的语句 => source
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset){
            source += text.slice(index, offset).replace(escaper, function(match){ 
                return '\\' + escapes[match];
            });
            if(escape)
                source += "'+\n((__t=(" + escape + "))==null?'':_escape(__t))+\n'";
            if(interpolate)
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            if(evaluate)
                source += "';\n" + evaluate + "\n__p+='";
            index = offset + match.length;
            return match;
        });
        source += "';\n";
        source = 'with(obj||{}){\n' + source + '}\n';
        source = "var __t,__p='',__j=Array.prototype.join," +
            "print=function(){__p+=__j.call(arguments,'');};\n" +
            source + "return __p;\n";
        //这里可能会抛异常，请务必保持资源的合法性
        render = new Function('obj', '_escape' , source);
        //当没有传入data时 返回的方法: 颗粒模式
        if(data===undefined)
            return renderTemplate;
        else{
            return renderTemplate(data, context);
        }
        function renderTemplate(data, context){
            var compenent = {
                $require: function(compId,compData, compContext){
                    return require(compId)(compData || data, compContext || context);
                }
            };
            if(context && Object.prototype.toString.call(context) === '[object Object]'){
                //这里需要复刻新对象出来，如果传递原始的话，则不便处理绑定其上的$require
                compenent._ = function(){};
                compenent._.prototype = context;
                context = new compenent._();
                context.$require = compenent.$require;
            }else{
                context = compenent;
            } 
            result = render.call(context,data, _escape );
            // if(context!=compenent){
            //     delete context.$require;
            // }
            return result;
        }
    };
});