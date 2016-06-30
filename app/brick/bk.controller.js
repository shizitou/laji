//负责业务模块的管理和控制
define('$controller',['$config','$template'],function(require,exports){
    'use strict';
	var win = window,
        doc = win.document,
        config = require('$config'),
        template = require('$template'),
        //页面模块存放在此
        pageModuleCache = {},
        //存放一些简单的工具函数
        viewUtil,
        //空的div, 用来将domStr转换成dom结构
        noopDiv = doc.createElement('div'),
        //页面的脚本结构
        rootView,
        //页面间跳转的提示框
        loadingDOM,
        loadingDelay,
        //页面的宽度和高度
        winH,winW,
        //时间控制器
        loadingControl,
        controlMod,
        pageStatus;
    pageStatus = {
        UNLOAD: 1,
        LOADED: 2,
        INITED: 3
    }

    //页面模块
    function pageModule(pageId){
        //标志模块是否被加载完毕
        this.status = pageStatus.UNLOAD;
        //模块ID的标示
        this.pageID = pageId;
        //页面模块执行完毕后的开放东西
        this.exports = null;
        //页面滚动高度,这里最小值为1是为了屏蔽滚动条
        this.scrollTop = 1;
        //是否复原本次的Y轴记录,
        this.notRecoveryTop = false;
        //模块在页面中的显示情况
        this.viewStatus = false;
    };
    pageModule.prototype = {
        //加载完毕后初始化自身的模块
        init: function(){
            //先将页面主模块嵌入到rootView中
            var self = this,
                exports = self.exports,
                mainElem = exports.el;
            //这是为了让 init 里可以对DOM进行操作
            var view = exports.pageView;
            if (view) {
                noopDiv.innerHTML = view;
                self.pageView = noopDiv.children[0];
                noopDiv.innerHTML = "";
                self.appendView();
            }
            //这里主要是对页面级别的对象进行处理
            if (mainElem) {
                if(typeof mainElem==='object'){
                    mainElem = '#'+(mainElem[0] ? mainElem[0].id : mainElem.id );
                }
                mainElem = self.el = doc.getElementById(mainElem.substr(1));
                exports.el = window.$ && $.fn ? $(mainElem) : mainElem;
            } else {
                throw new Error('未指定mainElem');
            }
            self.status = pageStatus.INITED;
            exports.init && exports.init(self.params);
        },
        appendView: function(){
            var self = this;
            if(!self.viewStatus){
                self.viewStatus = true;
                rootView.children.length ? 
                    rootView.insertBefore(self.pageView, rootView.children[0]) :
                    rootView.appendChild(self.pageView);
            }
        },
        //scTop: Number,true,undefined
        setScroll: function(scTop){
            var selfTop = this.scrollTop;
            //系统级别调用
            if(scTop===true){
                selfTop = this.notRecoveryTop ? 1 : selfTop ;
                this.notRecoveryTop = false;
            //用户触发
            }else{
                selfTop = scTop===undefined ? selfTop : 1 ;
            }
            selfTop || (selfTop = 1);
            //需要与DOM渲染的线程错开滞后执行
            setTimeout(function(){
                win.scrollTo(0, selfTop);
            },4);
        },
        saveScroll: function(){
            this.scrollTop = win.pageYOffset || win.scrollY || 1;
        }
    };

	function Controller(){
		//当前页面成功加载后,存放前一个页面控制器
		this.prevPage = undefined;
		this.runningPage = undefined;
	}
	//供页面控制器使用的内置方法
	Controller.builtIn = {
        //清除当前页面模块
        __cleanCache: function(){
            this.__pageModule.status = pageStatus.LOADED;
        },
		//离开页面时, 将自身页面scrollTop清除
		__cleanScrollTop: function(){
            this.__pageModule.notRecoveryTop = true;
        },
        //设置页面的scrollTop,如果不传递参数,就用上一次保存的
        __setScrollTop: function(scTop){
            this.__pageModule.setScroll(scTop);
        },
        __hideLoading: function(){
            //触发时必须是当前运行的模块时,才可以触发
            if(controlMod.runningPage === this.__pageModule){
                loadingControl && clearTimeout(loadingControl);
                loadingDOM && viewUtil.hide(loadingDOM);
            }
        },
        __loading: function(){
            controlMod.loading();
        }
	};
	Controller.prototype = {
		constructor: Controller,
        init: function(){
            rootView = config.rootView || doc.body;
            loadingDOM = config.loading || null;
            if(!loadingDOM) return ;
            winW = win.innerWidth;
            winH = win.innerHeight;
            loadingDelay = config.loadingDelay || 1;
            //初始化样式
            viewUtil.css(loadingDOM,'position','fixed');
            var that = this;
            win.addEventListener('resize', function(){
                winW = win.innerWidth;
                winH = win.innerHeight;
                that.setLoadingEl();
            }, false);
        },
		firePageControl: function(page,params,options){
            //这里应当引发loading操作
            var pageModule = this.getPageMod(page);
            pageModule.options = options;
            pageModule.params = params;
            this.loading();
            pageModule.status > pageStatus.LOADED ?
                this.execPage(pageModule) :
                this.loadPage(pageModule) ;
		},
        getPageMod: function(page){
            return pageModuleCache[page] || (pageModuleCache[page] = new pageModule(page));
        },
        //启动跳转页面时的提示窗
        loading: function(){
            if(!loadingDOM) return;
            loadingControl && clearTimeout(loadingControl);
            var that = this;
            loadingControl = setTimeout(function(){
                that.showLoading();
            },loadingDelay);
        },
        showLoading: function(){
            //计算显示位置
            viewUtil.show(loadingDOM);
            this.setLoadingEl();
        },
        setLoadingEl: function(){
            var load = loadingDOM;
            viewUtil.
                css(load,'left',Math.ceil((winW - load.offsetWidth)/2)+'px').
                css(load,'top',Math.ceil((winH - load.offsetHeight)/2)+'px');
        },
        //执行跳转
        execPage: function(pageModule){
            var pageExports = pageModule.exports,
                pageView = pageModule.pageView,
                prevModule = this.runningPage,
                prevExports,
                prevView;

            //设置当前运行的模块
            this.runningPage = pageModule;

            //解决当前显示中的模块离开
            if(prevModule){
                prevExports = prevModule.exports;
                this.prevPage = prevModule;
                //这里的参数: 执行离开的模块的参数,当前显示的模块的参数 ,pageModule.params
                prevExports.leave && prevExports.leave(prevModule.params);
                BK.trigger('afterLeave',[pageModule.params]);
                prevModule.saveScroll();
                prevView = prevModule.pageView
                if( prevView )
                    prevView.parentNode.removeChild(prevView),
                    prevModule.viewStatus = false;
            }

            //先触发新的模块,将结构显示显示到页面中
            pageModule.status > pageStatus.LOADED ?
                pageModule.appendView() :
                pageModule.init();
            
            BK.trigger('beforeEnter',[pageModule.params]);
            //参数：当前模块的参数,上一个模块的参数 ,prevModule.params
            pageExports.enter && pageExports.enter(pageModule.params);
            
            //前一个页面移除完毕后设置当前模块缓存住的y轴
            //如果此跳转是来自用户从页面点击进入的,则不设置y轴
            //如果是由浏览器或history引发的页面变更,则恢复y轴 
            pageModule.options.formUser || pageModule.setScroll(true);
        },
        //加载页面模块
        loadPage: function(pageModule){
            var that = this;
            require.async(pageModule.pageID,function(module){
                //将请求的模块进行保存
                if(module){
                    BK.extend(module, Controller.builtIn);
                    module.__pageModule = pageModule;
                    pageModule.exports = module;
                    pageModule.status = pageStatus.LOADED;
                    that.execPage(pageModule);
                //网络问题,请求失败,可以提示用户刷新页面
                }else{
                    BK.trigger('loadFail',[pageModule.pageID]);
                    pageModuleCache[pageModule.pageID] = null;
                }
            });
        }
	};
    controlMod = new Controller;

    viewUtil = {
        css: function(el,key,val){
            el['style'][key] = val;
            return this;
        },
        show: function(el){
            return this.css(el,'display','block');
        },
        hide: function(el){
            this.css(el,'display','none');
        }
    };
	return controlMod;
});