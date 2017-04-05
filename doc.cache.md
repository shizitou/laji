需要引入的文件：`module.ext.cache.js`

### 功能介绍

这是对 模块加载器 的扩展，对请求的模块使用localStorage进行存储

### 如何使用

在框架配置项处进行全局配置

```
BK.config({
	cache: false, //是否启用缓存功能
	hash: '', //作为存储key的一部分，当hash发生变化时，会清空一次，重新发起请求
});
```
