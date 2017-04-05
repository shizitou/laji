/* eslint-disable */
//模板引擎
define('$component', ['$template'], function(require, exports, module) {
    var $template = require('$template');
    var compsList = {};
    var rep_style = /((?:[^\{\}\s]+\s*)+)(\{[\D\d]*?\})/g;
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

    function addStyle(css, prefixClass) {
        //提出注释, 这里会对编译产生干扰
        css = css.replace(/\/\*[\s\S]*?\*\//g,'');
        // 先 提出@charset ''; 稍后再拼接上去
        var charset = '';
        css = css.replace(/@charset\s*['"][\w\d-_\.]*["'](\s*\;)/g,function(str){
            charset = str;
            return '';
        });
        css = css.replace(rep_style, function(all, key, val) {
            key = key.trim();
            all = key.charAt(0);
            if (+all == all || all == '@' ||
                key == 'from' || key == 'to') {} else {
                key = cssHandle(key, '.' + prefixClass);
            }
            return key + val;
        });
        css = charset+'\n'+css;
        style.appendChild(document.createTextNode(css));
    }

    function cssHandle(styleKey, prefixClass) {
        if (styleKey) {
            styleKey = styleKey.split(',');
            styleKey.forEach(function(key, arrKey, arr) {
                key = key.trim().split(/\s+/);
                var main = key.shift();
                var signPos = main.indexOf(':');
                key = key.length ? ' ' + key.join(' ') : '';
                if (~signPos) {
                    key = main.slice(signPos) + ' ' + key;
                    main = main.slice(0, signPos);
                }
                /*  .one:last-child .two
                    .one.x:last-child .two,.x .one:last-child .two
                **********/
                arr[arrKey] = main + prefixClass + key + ',' +
                    prefixClass + ' ' + main + key;
            });
            return styleKey.join(',');
        }
        return '';
    }
    /**
    .pop-top.medal.bkcomps-2,
    .bkcomps-2 .pop-top.medal.pop-top.medal.bkcomps-2,
    .bkcomps-2 .pop-top.medal,
    .pop-top.draw.bkcomps-2,
    .bkcomps-2 .pop-top.draw.pop-top.draw.bkcomps-2,
    .bkcomps-2 .pop-top.draw
    **/
    function addClassToRenView(origin, profixClass) {
        var nodeName, container;
        nodeName = origin.match(rep_nodeName);
        nodeName = nodeName && nodeName[1];
        container = containers[nodeName] || containers['*'];
        container.innerHTML = origin;
        origin = container.children;
        for (var i = origin.length - 1; i >= 0; i--) {
            origin[i].className = origin[i].className + ' ' + profixClass;
        }
        return container.innerHTML;
    }
    module.exports = function(compId, compObj) { // .a => index .a,.a.index {} class=" index"
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
define('$template', [], function(require) {
    //匹配模板标签
    var settings = {
            evaluate: /<%([\s\S]+?)%>/g,
            interpolate: /<%=([\s\S]+?)%>/g,
            escape: /<%-([\s\S]+?)%>/g
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
        _escape = function(string) {
            if (string == null)
                return '';
            return ('' + string).replace(/[&<>"']/g, function(match) {
                return entityMap[match];
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
            (settings.escape).source,
            (settings.interpolate).source,
            (settings.evaluate).source
        ].join('|') + '|$', 'g');
    return function(text, data, context) {
        //存放的是组合后的渲染函数
        var compile,
            //最终拼接字符串时,跟中的下标
            index = 0,
            //最终执行的匹配后的字符串
            source = "__p+='",
            tContext = this;
        //拼接各种形式的语句 => source
        text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
            source += text.slice(index, offset).replace(escaper, function(match) {
                return '\\' + escapes[match];
            });
            if (escape)
                source += "'+\n((__t=(" + escape + "))==null?'':_escape(__t))+\n'";
            if (interpolate)
                source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
            if (evaluate)
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
        compile = new Function('obj', '_escape',
            '$require',
            source
        );
        //当没有传入data时 返回的方法: 颗粒模式
        return data === undefined ? render : render(data, context);

        function render(data, context) {
            function $require(compId, compData, compContext) {
                return require(compId)(compData || data, compContext || context);
            }
            context || (context = this === window ? tContext : this);
            return compile.call(context, data, _escape, $require);
        }
    };
});