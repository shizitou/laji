## 使用文档

### 文件引入
module.js  
bk.config.js  	
bk.controller.js	
bk.util.js	
bk.template.js	
bk.http.js	
bk.localstorage.js	
brick.js	

### 框架配置项
```
BK.config({
	defController: '', //默认控制器('ct')
	rootView: document.body, //页面的跟视图区域(DOM元素)
	loading: null,//页面间跳转时显示的loading元素(DOM元素)
	loadingDelay: 1, //延迟显示loading元素(毫秒),
	ajaxTimeout: 15000,//$http请求时的超时时间(毫秒)
	ajaxDataType: 'json',//$http请求时的数据类型($.ajax的dataType参数)
	timeout: 15, //模块请求的超时时间(秒)
	paths: {}, //模块id与请求路径的映射({modId:path})
	deplist: {}, //模块依赖关系的配置表({modId:['modId2',['modId3']]})
	combo: null, //配置函数用以来启用combo
	baseUrl: "/", //请求模块的前缀路径,拼接path后作为完整请求地址
});
```
```
BK.paths({}); //设置请求路由的便捷方式
//等同于 BK.config({paths:{}});
```
```
BK.deplist({}); //设置依赖关系的便捷方式
//等同于 BK.config({deplist:{}})
```
### 参数详解：

defController  

* 用途：默认控制器，当从hash参数中解析不到ct参数时使用
* 类型：<font color=#FF6600 >string</font>
* 默认值：<font color=#FF6600 >''</font>

rootView  

* 用途：用来设定框架的运行的容器
* 类型：<font color=#FF6600 >HTMLElement</font>
* 默认值：<font color=#FF6600 >document.body</font>

loading  

* 用途：页面间跳转时显示的loading DOM元素
* 类型：<font color=#FF6600 >HTMLElement</font>
* 默认值：<font color=#FF6600 >null</font>

loadingDelay  

* 用途：页面间loadingDOM延迟展示时间
* 类型：<font color=#FF6600 >number(毫秒)</font>
* 默认值：<font color=#FF6600 >1</font>

ajaxTimeout  

* 用途：使用`$http`发送xhr时的超时时间
* 类型：<font color=#FF6600 >number(毫秒)</font>
* 默认值：<font color=#FF6600 >15000</font>

ajaxDataType  

* 用途：使用`$http`发送xhr时返回的数据类型( jquery的ajax时的dataType )
* 类型：<font color=#FF6600 >string</font>
* 默认值：<font color=#FF6600 >'json'</font>

timeout  

* 用途：加载某个模块时的请求超时
* 类型：<font color=#FF6600 >number(秒)</font>
* 默认值：<font color=#FF6600 >15</font>

paths  

* 用途：指定模块id与加载路径的映射关系
* 类型：<font color=#FF6600 >object</font>
* 默认值：<font color=#FF6600 >{}</font>

deplist  

* 用途：指定模块id对应的依赖模块id（数组）
* 类型：<font color=#FF6600 >object</font>
* 默认值：<font color=#FF6600 >{}</font>

combo  

* 用途：设置函数，返回合并后的请求地址
* 类型：<font color=#FF6600 >function</font>
* 默认值：<font color=#FF6600 >null</font>
* 举个例子：

``` 
combo: function(mods) {
	var baseUrl = '/combo.php?';
	return baseUrl + mods.join('.js,') + '.js?t=' + this.hash;
}
```

baseUrl  

* 用途：框架请求js模块时的前缀
* 类型：<font color=#FF6600 >string</font>
* 默认值：<font color=#FF6600 >'/'</font>

### 定义页面模块：
页面模块值得就是放在 /pages/ 下面的文件夹和其内的文件  

/pages/default/default.js

```
var $http = require('$http');
exports.pageView = '<div id="page_default"></div>';
exports.el = '#page_default';
exports.init = function(params){
    console.log( this.el );
    console.log( this.__hideLoading() ); 
};
exports.enter = function(params){};
exports.leave = function(params){};
```
```
var $http = require('$http');
return {
    pageView: '<div id="page_default"></div>',
    el: '#page_default',
    init: function(params){
        console.log( this.el );
        console.log( this.__hideLoading() ); 
    },
    enter: function(params){},
    leave: function(params){}
};	
```
### 代码详解：
* modelId
  * 文件的名称会被工程化编译成模块id
  * 当页面hash参数中的ct参数与模块id相同时，执行这个文件
* exports.pageView
  * 页面自身容器的DOM字符串
  * 当文件第一次本执行时，框架会将这个字符串编译成DOM节点插入到`rootView`容器中
* exports.el
  * 是当前页面的控制节点，这个通常指的是页面的最外层DOM元素
  * 在模块内部代码使用`exports.el`时,会被转换成DOM对象
  * <font color=#FF6600>特别声明：el指向的必须是元素的id</font>
  * <font color=#FF6600>特别声明：当页面引入了jq，zepto时，el会变成$对象，否则则是原生DOM对象</font>
* params
  * 是指当前路由的hash部分解析过后的 key/value 参数对象
  * 这里的路由参数是删除了ct,ac之后的【后面会介绍到路由参数】
* exports.init【非必须设定项】
  * 页面初始化
  * 第一次进入页面时触发一次，后续不在触发
* exports.enter【非必须设定项】
  * 每次进入页面时触发
* exports.leave【非必须设定项】
  * 每次离开页面时触发
  * 页面跳转时，先执行当前页的leave，再执行下个页面的enter
  
### 页面模块对象内置的方法
说明：在页面模块的init,enter,leave方法中,有如下方法可以被调用

* `this.__hideLoading()`
  *  关闭系统开启的页面loading元素
* `this.__cleanScrollTop()`
  * 再次进入此页面时不会自动恢复y轴，页面直接置顶显示
* `this.__loading()`
  * 吊起页面loading元素 
* `this.__setScrollTop(0)`
  * 设置当前页面y轴, 若不传参数时使用上次离开时保存的y轴记录
* `this.__cleanCache()`
  * 清除页面模块在内存中的缓存
  * 当用此方法后,当再次进入此页面时,会触发 `exports.init`
  
### 启动框架：		
框架不会自动运作，需要执行`BK.start()`来开启
	
### 运作流程
* 框架在启动之后，会开启对hash的监听(如果引入了bk.ext.router.js),  
* 当hash发生改变时，框架会将ct,ac两个参数提取出来拼接在一起，执行相应的模块(如果没有解析到ct,ac则使用配置里的`defController`指向的模块)  
* 如果没有此模块，则去根据path路径进行加载(combo的使用会在后续进行介绍)  
* 加载完毕后运行此模块，设置`.el`属性为DOM元素，执行`.init`，`.enter`方法  
* 首次启动框架时，会触发一次页面模块的解析

### 全局的工具方法
这里介绍的方法都是绑定在BK全局变量上的。  

`BK.alert(text, time)`  

* 用途：用于页面简单的提示语
* 参数：
  * text：必填参数，string，要提示的文本内容
  * time：可选参数，number(秒)，弹出框展示的时间
* 声明：此方法在使用前需要使用 `BK.alert.setEl(element)` 指定一个DOM元素

`BK.parseHash(hashStr);`

* 用途：解析页面URL的hash字符串，变成对象结构返回
* 参数：
  * hashStr：可选参数，string，解析的字符串，如果不传入则使用`location.hash`
* 声明：这里所说的字符串是指"key/val"格式

`BK.stringifyHash(obj);`

* 用途：将对象转换成"key/val"格式的字符串
* 参数：
  * obj：必填参数，object

`BK.genPHash(ct, obj);`

* 用途：返回待控制参数的路由字符串
* 参数：
  * ct：必填参数，string，页面模块的模块id
  * obj: 可选参数，object，要前往页面所携带的参数

`BK.parseSearch(searchStr);`

* 用途：解析查询字符串成对象
* 参数：
  * searchStr：可选参数，string，默认是解析当前页面的查询字符串

`BK.history(command, ct, params);`

* 用途：设置地址为指定页面路由，但不刷新当前页面
* 参数：
  * command：必填参数，string，'push', 'replace' //pushState,replaceState
  * ct：必填参数，string，页面模块的模块id
  * params: 必填参数，object，前往页面所携带的参数
  
`BK.link(ct, params);`

* 用途：跳转到其他页面
* 参数：
  * ct：必填参数，string，页面模块的模块id
  * params: 可选参数，object，前往页面所携带的参数
* 声明：次方法在引入 `bk.ext.router.js` 文件后才会有

### BK事件
绑定事件`BK.bind(type, fn)`  
解除绑定`BK.unbind(type [,fn])`

* afterRun
  * 此事件在`BK.start()`执行后,页面渲染之前触发一次。
* loadFail
  * 此事件在**页面模块**加载失败后(超时或者未找到)触发
  * 模块id会作为参数传递给监听函数
  * 特别声明：若是页面模块的某个强依赖模块加载失败，则不会执行该事件，而是正常的执行页面模块代码。
* beforeEnter
  * 在触发页面的enter之前触发
* afterLeave
  * 在触发页面的leave之后
   
### 事件触发流程 
afterRun > beforeEnter > enter > leave > afterLeave > beforeEnter > enter 

### 系统模块的用法

* $template
  * `$template(text, data, context)` 模板渲染
* $localStorage
  * `$localStorage.set(key, val)` 存储
  * `$localStorage.get(key)` 获得
  * `$localStorage.remove(key)` 删除
* $http
  * `$http.ajax({})`
  * `$http.get({})`
  * `$http.post({})`
  * `$http.get(/* url, data, success, dataType */)`
  * `$http.post(/* url, data, success, dataType */)`

### ajax配置选项详解  
jquery,zepto原本所需要的参数都可以传递过来，这里还可以接受一些框架需要的配置参数

* cache: Boolean //是否缓存结果(基于sessionStorage)【默认使用ajaxCache】
* cacheFilter: fun //对请求结果进行存储过滤【默认使用ajaxCacheFilter】
* cacheHash: '' //存储时使用后缀(对有问题的请求进行修正时可用)【默认使用ajaxCacheHash】 

特别声明：$template自定义的上下文对象中,给this进行赋值是无效的;  
eg: `{a:function(){this.b='c'}}` 渲染过后,`{}`上并没有`b`。

### 关于CSS模块化
本框架内置了一个模块$insertCSS用来对css进行模块化，  
使用起来颇为繁琐，如下：

```
//首先，css模块要这么写：
define('index.css',function(require){
	require('$insertCSS')('h1{\
		margin-bottom:10px;\
		background:yellow;\
		text-align:center\
	}');
});

//在页面模块内得进行对css模块的使用
define('index',function(require){
	require('xxx.css');
});

//需要声明模块的依赖
BK.deplist({
	index: 'xxx.css'
});

//需要声明模块路径
BK.path({
	'index.css': 'xx/xx/css/index.css'
});
```