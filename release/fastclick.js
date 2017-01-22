;(function () {
	'use strict';
	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/
	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		//绑定事件中的this指向
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}
		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		//安卓则做额外处理
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}
		//这些事件都被使用了 bind 将 this 指向到了 fastClick
		//注意这里的事件用的是事件捕捉
		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// 兼容不支持 stopImmediatePropagation（事件冒泡） 的浏览器(比如 Android 2)
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};
			//留意这里 callback.hijacked 中会判断 event.propagationStopped 是否为真来确保（安卓的onMouse事件）只执行一次
            //在 onMouse 事件里会给 event.propagationStopped 赋值 true
			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) { //组织事件冒泡
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		if (typeof layer.onclick === 'function') {
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};

	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		console.log('needsFocus');
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};

	//js触发一个点击事件
	FastClick.prototype.sendClick = function(targetElement, event) {
		console.log('send-click');
		var clickEvent, touch;

		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};

	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};

	/**
	 * 检查target是否一个滚动容器里的子元素，如果是则给它加个标记
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;
		scrollParent = targetElement.fastClickScrollParent;

		// 找到一个可以滚动的父级元素
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// 给滚动容器加个标志fastClickLastScrollTop，值为其当前垂直滚动偏移
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};

	//获取点中的元素节点
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};

	FastClick.prototype.onTouchStart = function(event) {
		console.log('touch-start');
		var targetElement, touch, selection;

		// 多指触控的手势则忽略
		if (event.targetTouches.length > 1) {
			return true;
		}
		//老的浏览器会将文本节点选中，这里需要返回其父级元素节点
		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// 若用户已经选中了一些内容（比如选中了一段文本打算复制），则忽略
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {
				/*
				怪异特性处理——若click事件回调打开了一个alert/confirm，
				用户下一次tap页面的其它地方时，新的touchstart和touchend
                事件会拥有同一个touch.identifier（新的 touch event 会跟上一次触发alert点击的 touch event 一样），
                为避免将新的event当作之前的event导致问题，这里需要禁用事件
                另外chrome的开发工具启用'Emulate touch events'后，iOS UA下的 identifier 会变成0，所以要做容错避免调试过程也被禁用事件了
				*/
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				/*
				如果target是一个滚动容器里的一个子元素(使用了 -webkit-overflow-scrolling: touch) ，而且满足:
                1) 用户非常快速地滚动外层滚动容器
                2) 用户通过tap停止住了这个快速滚动
                这时候最后的'touchend'的event.target会变成用户最终手指下的那个元素
                所以当快速滚动开始的时候，需要做检查target是否滚动容器的子元素，如果是，做个标记
                在touchend时检查这个标记的值（滚动容器的scrolltop）是否改变了，如果是则说明页面在滚动中，需要取消fastclick处理
				*/
				this.updateScrollParent(targetElement);
			}
		}
		//做个标志表示开始追踪click事件了
		this.trackingClick = true;
		//标记下touch事件开始的时间戳
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;
		//标记touch起始点的页面偏移值
		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		/*
		this.lastClickTime 是在 touchend 里标记的事件时间戳
        this.tapDelay 为常量 200 （ms）
        此举用来避免 phantom 的双击（200ms内快速点了两次）触发 click
		
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}
		*/
		return true;
	};

	FastClick.prototype.onTouchMove = function(event) {
		console.log('touch-move');
		if (!this.trackingClick) {
			return true;
		}
		// 如果移动了，就取消点击行为的监听
		if (this.targetElement === this.getTargetElementFromEventTarget(event.target)){
			//是否发生了偏移
			var touch = event.changedTouches[0], boundary = this.touchBoundary;
			if (Math.abs(touch.pageX - this.touchStartX) > boundary || 
				Math.abs(touch.pageY - this.touchStartY) > boundary
			) {
				this.trackingClick = false;
				this.targetElement = null;
			}
		}else{
			this.trackingClick = false;
			this.targetElement = null;
		}
		return true;
	};

	/**
	 * 找到label标签对应控制的元素节点
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};

	FastClick.prototype.onTouchEnd = function(event) {
		console.log('touch-end');
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		// if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
		// 	this.cancelNextClick = true;
		// 	return true;
		// }

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true; //时间过长了
		}

		// 得重置为false，避免input事件被意外取消
		this.cancelNextClick = false;
		this.lastClickTime = event.timeStamp;
		trackingClickStart = this.trackingClickStart;
		//重置下属性
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// iOS 6.0-7.*版本下有个问题 —— 如果layer处于transition或scroll过程，event所提供的target是不正确的
        // 所以咱们得重找 targetElement（这里通过 document.elementFromPoint 接口来寻找）
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];
			// 有些情况下 elementFromPoint 里的参数是预期外/不可用的, 所以还得避免 targetElement 为 null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {//是label则激活其指向的组件
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement); //焦点事件
				//安卓直接返回（无需合成click事件触发，因为点击和激活元素不同，不存在点透）
				if (deviceIsAndroid) {
					return false;
				}
				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) { //非label则识别是否需要focus的元素
			//手势停留在组件元素时长超过100ms，则置空this.targetElement并返回
            //（而不是通过调用this.focus来触发其聚焦事件，走的原生的click/focus事件触发流程）
            //这也是为何文章开头提到的问题中，稍微久按一点（超过100ms）textarea是可以把光标定位在正确的地方的原因
            //另外iOS下有个意料之外的bug——如果被点击的元素所在文档是在iframe中的，手动调用其focus的话，
            //会发现你往其中输入的text是看不到的（即使value做了更新），so这里也直接返回
            console.log(event.timeStamp - trackingClickStart);
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false; //走原生事件
			}

			this.focus(targetElement); //焦点事件
			this.sendClick(targetElement, event); //点击事件

			//iOS4下的 select 元素不能禁用默认事件（要确保它能被穿透），否则不会打开select目录
            //有时候 iOS6/7 下（VoiceOver开启的情况下）也会如此
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {
			// 滚动容器的垂直滚动偏移改变了，说明是容器在做滚动而非点击，则忽略
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// 查看元素是否无需处理的白名单内（比如加了名为“needsclick”的class）
        // 不是白名单的则照旧预防穿透处理，立即触发合成的click事件
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};

	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};

	//用于决定是否允许穿透事件（触发layer的click默认事件）
	FastClick.prototype.onMouse = function(event) {
		// touch事件一直没触发
		if (!this.targetElement) {
			return true;
		}
		//触发的click事件是合成的 在 .sendClick函数中触发
		if (event.forwardedTouchEvent) {
			return true;
		}
		// 编程派生的事件所对应元素事件可以被允许
        // 确保其没执行过 preventDefault 方法（event.cancelable 不为 true）即可
		if (!event.cancelable) {
			return true;
		}

		// 需要做预防穿透处理的元素，或者做了快速（200ms）双击的情况
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {
			//停止当前默认事件和冒泡
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {
				// 不支持 stopImmediatePropagation 的设备(比如Android 2)做标记，
                // 确保该事件回调不会执行
				event.propagationStopped = true;
			}
			// 取消事件和冒泡
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
		//允许穿透
		return true;
	};

	//click事件常规都是touch事件衍生来的，也排在touch后面触发。
    //对于那些我们在touch事件过程没有禁用掉默认事件的event来说，我们还需要在click的捕获阶段进一步
    //做判断决定是否要禁掉点击事件（防穿透）
    //注意：点击事件监听的是事件捕捉，不是事件冒泡阶段
	FastClick.prototype.onClick = function(event) {
		console.log('click');
		console.log('----------------');
		var permitted;

		// 如果还有 trackingClick 存在，可能是某些UI事件阻塞了touchEnd 的执行
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// ios怪异行为的处理 —— 如果用户点击了iOS模拟器里某个表单中的一个submit元素
        // 或者点击了弹出来的键盘里的“Go”按钮，会触发一个“伪”click事件（target是一个submit-type的input元素）
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		//如果点击是被允许的，将this.targetElement置空可以确保onMouse事件里不会阻止默认事件
		if (!permitted) {
			this.targetElement = null;
		}

		return permitted;
	};

	//销毁Fastclick所注册的监听事件
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};

	//检查是否需要监听
	FastClick.notNeeded = function(layer) {
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}
		//如果是 windows Phone 则不做处理，没踩过 wPhone 的坑
		if(deviceIsWindowsPhone){
			return true; 
		}
		return false;
	};

	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		define(function() { return FastClick; });
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());
