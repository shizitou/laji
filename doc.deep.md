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
  
```
function(ids){ 
	var con = this.configs;
	if(con.combo){ 
		return null; 
	} 
}
```
