# brick.js
## 框架简介
本框架适用于移动端项目开发。  
当前版本 3.5

## 框架文件概述
* module.js //模块加载器，采用cmd格式
* module.ext.cache.js //缓存模块至本地存储
* brick.js //满足实现业务的基本代码
* bk.config.js //业务的配置信息
* bk.router.js //对路由的处理
* bk.controller.js //用来调用页面模块管理器
* bk.template.js //来自underscore.template模板引擎
* bk.util.js //工具方法，这里所谓的工具有对内也有对外
* bk.http.js //用来发送ajax,该模块会拦截$.ajax,$.get,$.post
* bk.localstorage.js //用来调用本地存储的模块

## 框架的使用
### 文件引入
**module.js**	
module.ext.cache.js	 
**bk.config.js**	
**bk.controller.js**	
**bk.util.js**	
bk.ext.router.js		
bk.template.js	
bk.http.js	
bk.localstorage.js	
**brick.js**	

#### 文件说明：
加粗的为必要引入，不可缺少。  
引入顺序如上图所示
#### 可选文件介绍:
<dl>
	<dt>module.ext.cache.js</dt>
	<dd>引此时，框架会将模块内容缓存至本地存储。</dd>
	<dt>bk.ext.router.js</dt>
	<dd>引此时，框架将进行路由监听(SPA模式需要)</dd>
	<dt>bk.template.js</dt>
	<dd>引此时，可使用系统模板模块"$template"</dd>
	<dt>bk.http.js</dt>
	<dd>引此时，可使用系统模板模块"$http",<br />
	在使用时,需要在额外引入一个支持$.ajax的类库</dd>
	<dt>bk.localstorage.js</dt>
	<dd>引此时，可使用系统模板模块"$localStorage"</dd>
</dl>

#### 引入方式：
可以使用`<script src="brick.js"></script>`形式逐个加载进页面,
也可以使用工程化将其载入页面,例如fis的文件引入  		
eg: `<script src="brick.js?__inline"></script>`

### 参数配置
```
var config = {
	defController: '', //默认控制器('ct')
	rootView: null, //页面的跟视图区域(DOM元素)
	loading: null,//页面间跳转时显示的loading元素(DOM元素)
	loadingDelay: 1, //延迟显示loading元素,
	cache: true, //是否使用本地存储来缓存模块
	hash: 'v1.0.0', //版本号发生变更时,首次打开页面会清空模块缓存
	ajaxTimeout: 15000,//$http请求时的超时时间
	ajaxDataType: 'json',//$http请求时的数据类型
	ajaxCache: false, //$http请求时是否添加动态时间戳
	timeout: 15, //模块请求的超时时间
	paths: {}, //模块id与请求路径的映射
	deplist: {}, //模块依赖关系的配置表
	combo: null, //配置函数用以来启用combo
	baseUrl: "", //请求模块的前缀路径,拼接path后作为完整请求地址
};
BK.config(config);
BK.paths({}); //设置请求路由的便捷方式
BK.deplist({}); //设置依赖关系的便捷方式
BK.start(); //开启框架 
```
#### 部分参数详解：
<dl>
	<dt>defController</dt>
	<dd>当通过hash参数找不到ct时,执行此项配置的模块</dd>
	<dt>rootView</dt>
	<dd>不设置时，指向body元素</dd>
	<dt>ajaxTimeout, ajaxDataType, ajaxCache</dt>
	<dd>架构没有自身的ajax请求功能,使用的是外部模块$.ajax，<br />
	所以此项参数会按照 timeout, dataType, cache 传递给外部的ajax</dd>
	<dt>cache, hash</dt>
	<dd>这两个参数需要在引入 model.ext.cache.js 时才会生效</dd>
</dl>

### 开始使用
#### 定义页面模块：
```
define('modelId',['depId'],function(require,exports,model){
	exports.pageView = '<div id="pageid"></div>';
	exports.el = '#pageid';
	exports.init = function(params){};
	exports.enter = function(params){};
	exports.leave = function(params){};
})
```
#### 代码详解：
* modelId: 
  * 当路由的ct参数与此相同时，框架则会调度进入这个模块
* exports.pageView: 
  * 是页面html字符串，在框架运行时，会将其插入到视图区
  * [这里手写字符串肯定是很艰难的，建议采用工程化的文件引入功能]
* exports.el: 
  * 是当前页面的控制节点，这个通常指的是页面的最外层DOM元素
  * 在模块内部代码使用exports.el时,会被转换成DOM对象
  * [特别声明:**pageView**,**el**,是**必要**的]
  * [特别声明:el指向的必须是元素的id]
  * [特别声明:当页面引入了jq,zepto时,el会变成$对象,否则则是原生DOM对象]
* params:  
  * 是指当前路由的hash部分解析过后的key/value参数对象
  * 这里的路由参数是删除了ct,ac之后的[后面会介绍到路由参数] 
* exports.init: 
  * 页面初始化(第一次进入页面时触发一次，后续不在触发)
* exports.enter: 
  * 进入页面时触发
* exports.leave: 
  * 离开页面时触发
  * [页面跳转时，先执行当前页的leave,在执行下个页面的enter]
  * [params指的是URL地址的hash部分解析后的对象,这里剔除掉了ct,ac]
  
#### 启动框架：		
框架不会自动运作，需要执行`BK.start()`来开启。	
### 工作流程
* 框架在启动之后，会开启对hash的监听(如果引入了bk.ext.router.js),  
* 当hash发生改变时,框架会将ct,ac两个参数提取出来拼接在一起,执行相应的模块(如果没有解析到ct,ac则使用配置里的`defController`指向的模块)  
* 如果没有此模块，则去根据path路径进行加载(combo的使用会在后续进行介绍)  
* 加载完毕后运行此模块，设置`.el`属性为DOM元素，执行`.init`，`.enter`方法  
* 首次启动框架时，会触发一次页面模块的解析

### 路由解析
* 本框架的用URL的hash部分来当做路由参数
* 路由的形式为 #!/k/v/k2/v2，经由框架解析后，开发者在页面中接受到的是 `{k:v,k2:v2}`的对象参数[备注：这里不会进行变量格式转换，都是字符串]
* 本框架将路由中key为"ct","ac"对应的value拼接在一起作为页面模块的触发ID。
* 所以，在当使用BK.link进行页面跳转时,切勿在自定义参数(params)中传入"ct","ac"

## API详解
### 全局的工具方法
这里介绍的方法都是绑定在BK全局变量上的。  

* `BK.alert(text [,time]);`
  * 用于页面简单的提示语
  * time单位是秒,默认1秒
  * [特别声明]此方法在使用前需要使用 `BK.alert.setEl(element)` 指定一个DOM元素
* `BK.parseHash([hashStr]);`
  * 解析hashStr字符串成对象返回
  * 如若不传递的话,解析使用的是网页地址栏的hash字符串
  * [特别声明]这里所说的字符串是指"key/val"格式
* `BK.stringifyHash(obj);`
  * 将对象转换成"key/val"格式的字符串
* `BK.genPHash(ct [,obj]);`
  * 返回待控制参数的路由字符串
* `BK.parseSearch([searchStr]);`
  * 解析查询字符串成对象
  * 默认是解析当前页面的查询字符串
* `BK.history(command,ct [,params]);`
  * 设置地址为指定页面路由，但不刷新当前页面
  * command: 'push', 'replace' //pushState,replaceState
* `BK.link(ct [,params]);`
  * 跳转到其他页面
  * [特别声明] 次方法在引入 bk.ext.router.js 后才会有

### 事件
绑定事件`BK.bind(type,fn)`,解除绑定`BK.unbind(type[,fn])`。

#### 事件列表

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
   
#### 事件触发流程 
afterRun > beforeEnter > enter > leave > afterLeave > beforeEnter > enter 

### 系统模块的用法

* $template
  * $template(text, data, context) 模板渲染
* $localStorage
  * $localStorage.set(key, val) 存储
  * $localStorage.get(key) 获得
  * $localStorage.remove(key) 删除
  * $localStorage.refresh() 清空保存在内存变量中的数据
* $http
  * $http.ajax({});
  * $http.get({});
  * $http.post({});
  * $http.get(/\* url, data, success, dataType */);
  * $http.post(/\* url, data, success, dataType */);

特别声明：$template自定义的上下文对象中,给this进行赋值是无效的;  
eg: `{a:function(){this.b='c'}}` 渲染过后,`{}`上并没有`b`。

### 页面模块对象内置的方法
介绍：在页面模块的init,enter,leave方法中,有如下方法可以被调用

* this.__hideLoading()
  *  关闭系统开启的页面loading元素
* this.__cleanScrollTop()
  * 再次进入此页面时不会自动恢复y轴
* this.__loading()
  * 吊起页面loading元素 
* this.__setScrollTop([num])
  * 设置当前页面y轴, 若不传参数时使用上次离开时保存的y轴记录
* this.__cleanCache()
  * 清除页面模块在内存中的缓存
  * 当用此方法后,当再次进入此页面时,会触发`.init()`

## 深一层的了解
### 扩展加载器
在模块加载器中开放了几个可以添加扩展的节点。  
挂在节点 `define.mount(nodeName,fn)`, 解除节点 `define.mount(nodeName)`  
节点只能再挂一个函数，若重复挂在，后者将覆盖前者  
触发中的节点不会被再次触发，以免造成死循环  
在监听函数内部,可以通过`this.config`来访问加载器的配置对象；

* config 
  * 在触发模块加载器的config之后触发(可以用来对配置信息进行一些处理) 
* defined 
  * 在define参数处理完之后触发(可以用来对处理完的id,deps,fn进行缓存) 
* fetchModuleFilter
  * 在加载某模块之前触发，将要加载的模块id传递给监听函数
  * 过滤掉不需要加载(已缓存的)的模块
  * 当返回true时,则不在触发改模块的请求
* genUrl 
  * 在进行模块请求时触发此节点,会将要请求的模块id以数组的形式传递给监听函数
  * [特别声明]当返回请求地址字符串时,则不触发后续的路由处理(包括combo) 
  * [特别声明]若返回字符串，则配置的combo效果将得不到执行，若想继续使用combo只需返回null即可，例如：
  * `function(ids){ var con = this.configs;
		if(con.combo){ return null; } }`
		
备注：关于各节点的示例代码，可参考 model.ext.cache.js 里的使用

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
### 关于UI组件化的使用
敬请期待... T^T
