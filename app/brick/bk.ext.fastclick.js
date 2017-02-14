/* eslint-disable */
/*
 * bricKFastClick => KFC（因为BFC名词已经备占用了）
 * options:
 * 		touchBoundary: 10px 手指移动的到取消点击行为的阀值（阈值）
 *		tapTimeout: 500ms 按压超时则取消点击行为：默认500ms
 * 		active: false 是否开启对 data-kfc-active 的监听
 * 		useMouseEvent: false 是否监听mouse系列事件
 **/
define('$KFC', function(require, exports, module) {

	var ua = navigator.userAgent;
	var deviceIsWindowsPhone = ua.indexOf("Windows Phone") >= 0;
	var deviceIsAndroid = ua.indexOf('Android') > 0 && !deviceIsWindowsPhone;
	var deviceIsIOS = /iP(ad|hone|od)/.test(ua) && !deviceIsWindowsPhone;
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(ua);
	var deviceIsIOS67 = deviceIsIOS && (/OS [6-7]_\d/).test(ua);
	var body = window.document.body;
	var _getCompStyle = window.getComputedStyle || null;

	function FastClick(layer, options) { // new KFC(document. body || 指定范围,{})
		if (needNoFast())
			return;
		var self = this;
		options || (options = {});
		self.options = options;
		self.layer = layer;
		// touchstart时的时间戳
		self.trackingClickStart = 0;
		//从start开始进行标记，end时撤销
		this.trackingClick = false;
		// 点击的元素
		self.targetElement = null;
		// active元素的时间控制器，在start的时候，要在tapTimeout以后关闭
		self.activeTimer = null;
		// touchstart的x,y坐标
		self.touchStartX = 0;
		self.touchStartY = 0;
		// ID of the last touch, retrieved from Touch.identifier.
		self.lastTouchIdentifier = 0;
		// 手指移动的到取消点击行为的阀值（阈值）
		self.touchBoundary = options.touchBoundary || 10;
		// 按压超时则取消点击行为：默认500ms
		self.tapTimeout = options.tapTimeout || 500;
		// 是否开启active功能：默认为false
		self.listenActive = !!options.active;
		
		var events = ['onMouse', 'onClick', 'onTouchStart', 
			'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		for (var i = 0, l = events.length; i < l; i++) {
			self[events[i]] = bind(self[events[i]], self);
		}
		
		//是否监听 mouse 系列的事件
		if (deviceIsAndroid && options.useMouseEvent) {
			layer.addEventListener('mouseover', self.onMouse, true);
			layer.addEventListener('mousedown', self.onMouse, true);
			layer.addEventListener('mouseup', self.onMouse, true);
		}
		//这些事件都被使用了 bind 将 this 指向到了 fastClick
		layer.addEventListener('click', self.onClick, true);
		layer.addEventListener('touchstart', self.onTouchStart, false);
		layer.addEventListener('touchmove', self.onTouchMove, false);
		layer.addEventListener('touchend', self.onTouchEnd, false);
		layer.addEventListener('touchcancel', self.onTouchCancel, false);
	}
	FastClick.prototype = {
		constructor: FastClick,
		getElementFromTarget: function(target) {
			// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
			return target.nodeType === Node.TEXT_NODE ?
				target.parentNode : target;
		},
		isAbleScroll: function(elem) {
			var style;
			if (_getCompStyle) {
				try {
					style = _getCompStyle(elem);
					return style['overflow'] === 'auto' ||
						style['overflow'] === 'scroll' ||
						style['overflow-y'] === 'auto' ||
						style['overflow-y'] === 'scroll';
				} catch (__e) {
					_getCompStyle = null;
				}
			}
			return true;
		},
		updateScrollParent: function(targetElement) {
			// this.layer 遍历时的最外层应该是这个，而不是超出范围的 body || 指定范围
			var scrollParent, parentElement,
				activeElem,
				activeStart = this.listenActive,
				activeDataset,
				layer = body.contains(this.layer) ? this.layer : body;
			scrollParent = targetElement.kFCSP; //kFCSP: brickFastClickScrollParent
			activeElem = !!(targetElement.KFCH || targetElement.KFCHI); //KFCH: brickFastClickActive
			// 找到一个可以滚动的父级元素
			// 每次都要检查下包含关系，以免元素被移植走了
			// 这里就算是active也只遍历一遍
			if (!scrollParent ||
				!scrollParent.contains(targetElement)
			) {
				//先检查当前元素
				if (activeStart && !activeElem){
					activeDataset = targetElement.dataset;
					if(activeDataset.kfcActive || activeDataset.kfcActiveIgnore!==undefined){
						activeElem = true;
						if(activeDataset.kfcActive){
							targetElement.KFCH = targetElement;
						}else{
							targetElement.KFCHI = true;
						}
					}
				}
				parentElement = targetElement === layer ? layer : targetElement.parentNode;
				do {
					//先解决active的循环问题
					if (activeStart && !activeElem){
						activeDataset = parentElement.dataset;
						if(activeDataset.kfcActive || activeDataset.kfcActiveIgnore!==undefined){
							activeElem = true;
							if(activeDataset.kfcActive){
								targetElement.KFCH = parentElement;
							}else{
								targetElement.KFCHI = true;
							}
						}
					}
					// 这里需要检查一下元素的 overflow: auto|scroll
					if (parentElement.scrollHeight > parentElement.offsetHeight &&
						this.isAbleScroll(parentElement) ||
						parentElement === layer) {
						scrollParent = parentElement;
						targetElement.kFCSP = parentElement;
						break;
					}
					parentElement = parentElement.parentElement;
				} while (parentElement);
			}
			// 在touchstart时标记一个位置，在结束时，进行校对，如果有变动，则不处理点击行为，默认为滚动行为
			if (scrollParent) {
				scrollParent.lastScrollTop = scrollParent.scrollTop;
			}
		},
		addActive: function(elem) {
			var self = this;
			if (!self.listenActive) return;
			elem = elem && elem.KFCH;
			if (!elem) return;
			var activeClass = elem.dataset.kfcActive; //class
			elem.className += ' ' + activeClass;
			clearTimeout(self.activeTimer);
			//为了防止意外发生，我们默认一定时间后，将active移除
			self.activeTimer = setTimeout(function() {
				self.removeActive(elem);
			}, self.tapTimeout);
		},
		removeActive: function(elem) {
			if (!this.listenActive) return;
			elem = elem && elem.KFCH;
			if (!elem) return;
			clearTimeout(this.startActiveTimer);
			var activeReg = new RegExp(elem.dataset.kfcActive, 'g'); //class
			elem.className = elem.className.replace(activeReg, '');
		},
		sendClick: function(targetElement, event) {
			var clickEvent, touch;
			// 在一些安卓机器中，得让页面所存在的 activeElement（聚焦的元素，比如input）失焦，否则合成的click事件将无效
			if (document.activeElement && document.activeElement !== targetElement) {
				document.activeElement.blur();
			}
			touch = event.changedTouches[0];

			// 合成(Synthesise) 一个 click 事件
			// 通过一个额外属性确保它能被追踪（forwardedTouchEvent）
			clickEvent = document.createEvent('MouseEvents');
			clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
			clickEvent.forwardedTouchEvent = true;

			targetElement.dispatchEvent(clickEvent);
		},
		destroy: function() {
			var self = this;
			var layer = self.layer;
			if (deviceIsAndroid && self.options.useMouseEvent) {
				layer.removeEventListener('mouseover', self.onMouse, true);
				layer.removeEventListener('mousedown', self.onMouse, true);
				layer.removeEventListener('mouseup', self.onMouse, true);
			}
			layer.removeEventListener('click', self.onClick, true);
			layer.removeEventListener('touchstart', self.onTouchStart, false);
			layer.removeEventListener('touchmove', self.onTouchMove, false);
			layer.removeEventListener('touchend', self.onTouchEnd, false);
			layer.removeEventListener('touchcancel', self.onTouchCancel, false);
		},
		onTouchStart: function(event) {
			var targetElement, touch, selection, self;
			// 多指触控的手势则忽略
			if (event.targetTouches.length > 1) {
				return true;
			}
			self = this;
			//老的浏览器会将文本节点选中，这里需要返回其父级元素节点
			targetElement = self.getElementFromTarget(event.target);
			if (needsClick(targetElement)) {
				return true; //真实的点击行为不需要合成事件了，就放过了
			}
			touch = event.targetTouches[0];
			if (deviceIsIOS) {
				// 若用户已经选中了一些内容（比如选中了一段文本打算复制），则忽略
				selection = window.getSelection();
				if (selection.rangeCount && !selection.isCollapsed) {
					return true;
				}
				if (touch.identifier && touch.identifier === self.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}
				self.lastTouchIdentifier = touch.identifier;
			}
			//获取滚动父级的元素
			self.updateScrollParent(targetElement);
			self.addActive(targetElement);
			//做个标志表示开始追踪click事件了
			self.trackingClick = true;
			//标记下touch事件开始的时间戳
			self.trackingClickStart = event.timeStamp;
			self.targetElement = targetElement;
			//标记touch起始点的页面偏移值
			self.touchStartX = touch.pageX;
			self.touchStartY = touch.pageY;
			return true;
		},
		onTouchMove: function(event) {
			if (!this.trackingClick) {
				return true;
			}
			clearTimeout(this.startActiveTimer);
			// 如果移动了，就取消点击行为的监听
			if (this.targetElement === this.getElementFromTarget(event.target)) {
				//是否发生了偏移
				var touch = event.changedTouches[0],
					boundary = this.touchBoundary;
				if (Math.abs(touch.pageX - this.touchStartX) > boundary ||
					Math.abs(touch.pageY - this.touchStartY) > boundary
				) {
					this.removeActive(this.targetElement);
					this.trackingClick = false;
					this.targetElement = null;
				}
			} else {
				this.removeActive(this.targetElement);
				this.trackingClick = false;
				this.targetElement = null;
			}
			return true;
		},
		onTouchEnd: function(event) {
			var trackingClickStart, scrollParent, touch, targetElement = this.targetElement;
			this.removeActive(targetElement);
			if (!this.trackingClick) {
				return true;
			}
			if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
				return true; //时间过长了
			}

			//重置下属性
			this.trackingClick = false;
			this.trackingClickStart = 0;

			// iOS 6.0-7.*版本下有个问题 —— 如果layer处于transition或scroll过程，event所提供的target是不正确的
			// 所以咱们得重找 targetElement（这里通过 document.elementFromPoint 接口来寻找）
			// 这里所谓的错误，因该是在touchstart阶段就是错的
			if (deviceIsIOS67) {
				touch = event.changedTouches[0];
				// 有些情况下 elementFromPoint 里的参数是预期外/不可用的, 所以还得避免 targetElement 为 null
				targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
				targetElement.kFCSP = this.targetElement.kFCSP;
			}

			// 滚动容器的垂直滚动偏移改变了，说明是容器在做滚动而非点击，则忽略
			scrollParent = targetElement.kFCSP;
			if (scrollParent && scrollParent.lastScrollTop !== scrollParent.scrollTop) {
				return true;
			}

			// 不是白名单的则照旧预防穿透处理，立即触发合成的click事件
			event.preventDefault();
			this.sendClick(targetElement, event);

			return false;
		},
		onTouchCancel: function(event) {
			this.removeActive(this.targetElement);
			this.trackingClick = false;
			this.targetElement = null;
		},
		onMouse: function(event) {
			// touch事件一直没触发，放行
			if (!this.targetElement) {
				return true;
			}
			//触发的click事件是合成的 在 .sendClick函数中触发，放行
			if (event.forwardedTouchEvent) {
				return true;
			}
			//走到这里，则说明当前event不是来自于KFC合成的，而是浏览器触发的或者用户自己触发的

			// 用 preventDefault() 方法,则为true，否则则为false
			if (!event.cancelable) {
				return true;
			}

			// 当前元素需要真实的用户点击行为，放行
			if (needsClick(this.targetElement)) {
				return true;
			}

			//阻止冒泡
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			}
			//停止冒泡 && 取消默认行为
			event.stopPropagation();
			event.preventDefault();
			return false;
		},
		onClick: function(event) {
			var permitted;
			// 如果还有 trackingClick 存在，可能是某些UI事件阻塞了touchEnd 的执行
			// 放行..，顺便清理属性
			if (this.trackingClick) {
				this.removeActive(this.targetElement)
				this.targetElement = null;
				this.trackingClick = false;
				return true;
			}
			// ios怪异行为的处理 —— 如果用户点击了iOS模拟器里某个表单中的一个submit元素
			// 或者点击了弹出来的键盘里的“Go”按钮，会触发一个“伪”click事件（target是一个submit-type的input元素）
			// detail属性，表示在给定位置上发生了几次单击。
			// 在同一个元素上，相继的发生一次mousedown与一次mouseup算作一次单击。如果之间变换位置，则detail值清零
			if (event.target.type === 'submit' && event.detail === 0) {
				return true;
			}

			//如果不被允许，则在onMouse内部则进行了阻断
			permitted = this.onMouse(event);
			//如果不被允许, 则,制空
			if (!permitted) {
				this.removeActive(this.targetElement);
				this.targetElement = null;
			}
			return permitted;
		}
	};
	return FastClick;
	// function.bind
	function bind(fn, context) {
		return function() {
			return fn.apply(context, arguments);
		};
	}
	// 不需要使用 KFC
	function needNoFast() {
		/* 没玩过winPhone,跳过
		 * ios4太老了，不敢玩
		 * 不支持 stopImmediatePropagation 的事件，估计是安卓2.x，说实话，没测过，还不如不玩
		 */
		return typeof window.ontouchstart === 'undefined' ||
			deviceIsWindowsPhone ||
			deviceIsIOS4 ||
			!Event.prototype.stopImmediatePropagation;
	}
	// 是否需要一个真实的点击(不接受js合成的点击行为)
	function needsClick(element) {
		switch (element.nodeName.toLowerCase()) {
			case 'textarea': // 焦点问题
			case 'label': // 控制不好
			case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
			case 'video': // 未知效果
			case 'select': // 有些浏览器会无法打开
				return true;
			case 'input':
				// 文件元素 || 隐藏元素
				if (element.type === 'file' || element.disabled)
					return true;
				switch (element.type) { //除了下面这些元素外，其他的大多是输入框，有焦点问题
					case 'button':
					case 'checkbox':
					case 'image':
					case 'radio':
					case 'submit':
						return false;
					default:
						return true;
				}
				break;
			case 'button':
				if (element.disabled) //隐藏元素
					return true;
		}
		return (/\bneedsclick\b/).test(element.className);
	}
});