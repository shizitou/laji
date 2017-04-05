需要引入的文件：`bk.ext.fastclick.js`  

此模块的id为`define('$KFC')` 

### 功能介绍   
解决部分手机浏览器的300ms点击延迟问题  
修正了在滚动状态下点击终止滚动的操作会产生点击响应的不良体验  
新增了点击态的功能，通过监听DOM属性：`data-kfc-active="hoverClass"`  
备注：这里可以使用 `data-kfc-active-ignore` DOM属性来取消active的响应  

### 如何使用
1.在框架配置项处进行全局配置

```  
BK.config({
	fastClick: {
		touchBoundary: 10 //手指移动的到取消点击行为的阀值（阈值）
		tapTimeout: 500 //按压超时则取消点击行为：默认500ms
		active: false //是否开启对 data-kfc-active 的监听（点击态）
		useMouseEvent: false  //是否监听mouse系列事件
	}
});
```
在页面模块中，有两个内置方法可以来进行管理：

```
exports.init = function(){
	this.__closeKFC(); //关闭某个页面的fastClick效果
	this.__openKFC();  //开启某个页面的fastClick效果，在使用时，可以传入新的配置项来覆盖之前的配置项，如果不传递，默认使用全局的配置项
}
```

2.对某个页面单独启用fastClick功能  
在导出的页面模块中调用自身内置方法`this.__closeKFC()`。  
PS：即使没有在全局配置项中开启fastClick，也可以使用此方法单独开启对某个页面的支持。  

3.完全自由的单独使用 KFC 模块  

```
var $KFC = require('$KFC');
var $kfc = new $KFC(elem/*DOM元素*/,{}/*配置项*/);
……
$kfc.destroy(); //注销掉$fastClick监听
```
