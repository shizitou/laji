
### 简介
UI组件化是基于字符串模板引擎的组件化，框架会自动处理样式的隔离问题。

**特别声明：此功能需要最新工程化来支持编译**，如果各位发现无法编译，直接升级系统的 b3 即可  

brick3 升级方式：

```
npm uninstall -g node-brick3 
npm install -g git+http://gitlab.alibaba-inc.com:literature-fe/node-brick3.git
```

### 目录结构
  
|- /  
|-- pages/  
|-- assets/  
|-- brick-modules/  
|-- modules/  
|-- **uicomponents/**  
|---- **titlebar/**  
|------ **titlebar.inline.scss**  
|------ **titlebar.html**  
|-- index.php

UI组件要放置在 /uicomponents/ 目录下，以文件夹来标明每一个组件

### 如何使用

```
/uicomponents/titlebar/titlebar.html

<link rel="stylesheet" href="titlebar.inline.scss?__inline" />

<header class="uicomponent top-header-wrap" >
    <div class="other-title-bg">
    	<h1 class="top-title">小说全搜</h1>
        <div class="bookshelf js-goShelf"></div>
        <div class="back-btn top-btn-lf js-back"></div>
    </div>
</header>

```
```
/uicomponents/titlebar/titlebar.inline.scss

/* 二级页面在IOS中的顶部 */
.uicomponent.top-header-wrap{
    display: none;
    color: red;  
    .other-title-bg { 
        height: 0.88rem;
        background: #ebebeb;
        color: #666;
    } 
    .top-title{
        height:0.88rem;
        line-height: 0.88rem;
        font-size: 0.36rem;
        padding-left: 0.72rem;
        font-weight: 400;
    }
}
```
```
 /pages/bookcover/bookcover.page.html 这是一个普通的页面 
 
 <div id="page_bookcover">
	<%= $require('titlebar.html') %>
	<div class="js-modelsView">
	</div>
 </div>
```
```
/pages/bookcover/bookcover.js 

require('titlebar.html');
exports.el = '#page_bookcover';
exports.pageView = __inline('bookcover.page.html');
```
说明：`$require()`方法是在使用$template编译时，注入其中的

### 关于数据
UI组件化支持子数据的传递, 直接看代码把  

```  
/pages/bookcover/bookcover.js

require('bookitem.html');
var $template = require('$template');
var bookViewHTML = $template(
	__inline('./tpls/bookview.tpl.html'), 
	{
		bookName: '大主宰'
	}
);
console.log(bookViewHTML);
```
```  
/pages/bookcover/tpls/bookview.tpl.html

 <div>
 	<h1><%= bookName %></h1>
 	<%= $require('bookitem.html', {bn: bookName}) %>
 </div>
```
```  
/uicomponents/bookview/bookitem.html

 <span><%= bn %></span>
```

最后说两句：  
UI组件所谓的样式隔离，是通过系统生成的唯一标示  
如果想定制样式，直接通过CSS的样式权重来重写对应的style即可