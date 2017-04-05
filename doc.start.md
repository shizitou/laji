## 快速开始

### 使用工程化
安装工程化：

```
npm install --global git+http://gitlab.alibaba-inc.com/literature-fe/node-brick3.git
```
初始化项目(脚手架)： 

```
b3 init
```
项目目录介绍  

|- /  （项目的跟目录）  
|-- pages/  （项目的页面文件夹都放置在这里）  
|-- assets/ （静态资源存放位置，如图片等）  
|-- brick-modules/  （框架，框架功能模块会存放在这里,如brick,jquery）    
|-- modules/（业务自身的模块功能）  
|-- uicomponents/    (UI组件存放的位置)  
|-- index.php  （项目的入口文件）  

编译项目（研发中）：

```
b3 release -w -d {path}
```
这里使用的是 [fis3](http://fis.baidu.com) 的原生命令

### 直接使用代码
拉取代码：

```
git clone git+ssh://developer@100.85.4.87/~/brick-modules/brick.git
```
拉取后会有如下代码，下面来进行介绍：  
**特别声明：这里是以4.0.0版本来进行介绍的**  

**bk.config.js**  
**bk.controller.js**  
bk.ext.fastclick.js  
bk.ext.router.js  
**bk.http.js**  
**bk.localstorage.js**  
**bk.template.js**  
**bk.util.js**  
**brick.js**  
module.ext.cache.js  
module.ext.upbychar.js  
**module.js**  

以上文件列表中，**加粗的表示在项目中是必要进行加载的**，而其他文件均为可选  
在使用文档中，会进行详细说明。  
对使用时，文件的加载顺序说明如下：  
**`module.js`放在首位**，这里定义了`window.define(id,deps,func)`的操作函数  
其他文件均可放在其后，但是**`brick.js`要放置在最尾部**  
随后便可以在页面使用`BK.config({})`进行配置，  
最后运行`BK.start()`来启动框架  
`module.ext.cache.js, bk.ext.router.js`是常用扩展文件


