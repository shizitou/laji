define('$config',function(){
	//这里都是框架默认的配置选项
	return {
		//默认控制器: 'ctac'
		defController: '',
		//页面的跟视图区域: DOM元素
		rootView: null,
		//页面间跳转显示的loading图: DOM元素
		loading: null,
		//是否延迟显示
		loadingDelay: 0,
		//ajax默认时间
		ajaxTimeout: 15000,
		//ajax默认数据类型
		ajaxDataType: 'json',
		ajaxCache: false,
		ajaxCacheFilter: function(res){ return !!res; },
		ajaxCacheHash: ''
	};
});