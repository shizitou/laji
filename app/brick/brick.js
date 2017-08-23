/* eslint-disable */
define('$brick', ['$router', '$config', '$util', '$controller'], function(require, exports, module) {
	'use strict';
	var originModule = window.module;
	delete window.module;
	var f = function() {};
	f.prototype = originModule;
	var BK = window.BK = new f();

	window.Promise || promisePolyfill();
	//给标准的promsie添加 .done 扩展
	if (typeof Promise.prototype.done !== "function") {
		Promise.prototype.done = function(onFulfilled, onRejected) {
			var self = arguments.length ? this.then.apply(this, arguments) : this;
			self.then(null, function(err) {
				setTimeout(function() {
					throw err;
				}, 0);
			});
		};
	}

	var appConfigs = require('$config');
	BK.config = function(options) {
		//留下业务中需要的配置项,其他的交给模块加载器处理
		var item;
		for (var n in appConfigs) {
			item = options[n];
			if (typeof item !== 'undefined') {
				appConfigs[n] = item;
				delete options[n];
			}
		}
		originModule.config(options);
	}
	BK.paths = function(paths) {
		this.config({ paths: paths });
	};
	BK.deplist = function(deplist) {
		this.config({ deplist: deplist });
	};
	BK.start = function(options) {
		options && this.config(options);
		//这里将模块的载入放到start里面，是为了在各自模块中在引用$config时，是已经处理完毕的
		var utilMod = require('$util');
		var routerMod = require('$router');
		var controlMod = require('$controller');
		//将收集的API绑定给BK
		utilMod.bindTo(BK);

		//这里就开始正式运行框架
		if (routerMod) {
			routerMod.start();
		} else {
			controlMod.init();
			BK.trigger('afterRun');
			var hashParam = BK.parseHash();
			var controller = '';
			if (hashParam['ct']) {
				controller = hashParam['ct'] + (hashParam['ac'] || '');
				delete hashParam['ct'], delete hashParam['ac'];
			} else if (appConfigs.defController) {
				controller = appConfigs.defController;
			}
			controlMod.firePageControl(controller, hashParam, {});
		}
	};
	var events = {};
	//globalEvent是为了兼容旧代码的调用
	BK.bind = BK.globalEvent = function(type, fn) {
		(events[type] || (events[type] = [])).push(fn);
	};
	BK.unbind = function(type, fn) {
		if (fn) {
			var eventList = events[type];
			eventList && eventList.forEach(function(item, index, events) {
				item === fn && events.splice(index, 1);
			});
		} else {
			events[type] = [];
		}
	};
	BK.trigger = function(type, args) {
		var eventList = events[type],
			j,
			returnResult;
		args = args || [];
		if (eventList) {
			if (j = eventList.length) {
				returnResult = [];
				for (var i = 0; i < j; i++) {
					returnResult.push(eventList[i].apply(window, args));
				}
			}
		}
		return returnResult || null;
	}
	define('$insertCSS', function() {
		return function(cssStr) {
			var styleNode;
			var handledCss = window.BK.trigger('insertCSS', [cssStr]);
			if (handledCss && handledCss[0]) { //接收返回值
				cssStr = handledCss[0];
				if (cssStr instanceof(window.HTMLStyleElement || window.HTMLElement)) {
					styleNode = cssStr; //返回的是一个style标签，可以被直接插入到head中
				} else { //普通文本
					styleNode = document.createElement('style');
					styleNode.appendChild(document.createTextNode(cssStr));
				}
			} else {
				styleNode = document.createElement('style');
				styleNode.appendChild(document.createTextNode(cssStr));
			}
			document.head.appendChild(styleNode);
		};
	});
	//4.2.0+，当用户载入 $bigPipe 模块时，给全局BK进行赋值
	var $bigPipe = require('$bigPipe');
	$bigPipe && (BK.$bigPipe = $bigPipe);

	function promisePolyfill() { // https://github.com/then/promise
		var runMods = {
			1: [function(require, module, exports) {
				var process = module.exports = {};
				process.nextTick = function() {
					var canSetImmediate = typeof window !== "undefined" && window.setImmediate;
					var canPost = typeof window !== "undefined" && window.postMessage && window.addEventListener;
					if (canSetImmediate) {
						return function(f) {
							return window.setImmediate(f);
						};
					}
					if (canPost) {
						var queue = [];
						window.addEventListener("message", function(ev) {
							var source = ev.source;
							if ((source === window || source === null) && ev.data === "process-tick") {
								ev.stopPropagation();
								if (queue.length > 0) {
									var fn = queue.shift();
									fn();
								}
							}
						}, true);
						return function nextTick(fn) {
							queue.push(fn);
							window.postMessage("process-tick", "*");
						};
					}
					return function nextTick(fn) {
						setTimeout(fn, 0);
					};
				}();
				process.title = "browser";
				process.browser = true;
				process.env = {};
				process.argv = [];

				function noop() {}
				process.on = noop;
				process.addListener = noop;
				process.once = noop;
				process.off = noop;
				process.removeListener = noop;
				process.removeAllListeners = noop;
				process.emit = noop;
				process.binding = function(name) {
					throw new Error("process.binding is not supported");
				};
				process.cwd = function() {
					return "/";
				};
				process.chdir = function(dir) {
					throw new Error("process.chdir is not supported");
				};
			}],
			2: [function(require, module, exports) {
				var asap = require("asap");
				module.exports = Promise;

				function Promise(fn) {
					if (typeof this !== "object") throw new TypeError("Promises must be constructed via new");
					if (typeof fn !== "function") throw new TypeError("not a function");
					var state = null;
					var value = null;
					var deferreds = [];
					var self = this;
					this.then = function(onFulfilled, onRejected) {
						return new self.constructor(function(resolve, reject) {
							handle(new Handler(onFulfilled, onRejected, resolve, reject));
						});
					};

					function handle(deferred) {
						if (state === null) {
							deferreds.push(deferred);
							return;
						}
						asap(function() {
							var cb = state ? deferred.onFulfilled : deferred.onRejected;
							if (cb === null) {
								(state ? deferred.resolve : deferred.reject)(value);
								return;
							}
							var ret;
							try {
								ret = cb(value);
							} catch (e) {
								deferred.reject(e);
								return;
							}
							deferred.resolve(ret);
						});
					}

					function resolve(newValue) {
						try {
							if (newValue === self) throw new TypeError("A promise cannot be resolved with itself.");
							if (newValue && (typeof newValue === "object" || typeof newValue === "function")) {
								var then = newValue.then;
								if (typeof then === "function") {
									doResolve(then.bind(newValue), resolve, reject);
									return;
								}
							}
							state = true;
							value = newValue;
							finale();
						} catch (e) {
							reject(e);
						}
					}

					function reject(newValue) {
						state = false;
						value = newValue;
						finale();
					}

					function finale() {
						for (var i = 0, len = deferreds.length; i < len; i++) handle(deferreds[i]);
						deferreds = null;
					}
					doResolve(fn, resolve, reject);
				}

				function Handler(onFulfilled, onRejected, resolve, reject) {
					this.onFulfilled = typeof onFulfilled === "function" ? onFulfilled : null;
					this.onRejected = typeof onRejected === "function" ? onRejected : null;
					this.resolve = resolve;
					this.reject = reject;
				}

				function doResolve(fn, onFulfilled, onRejected) {
					var done = false;
					try {
						fn(function(value) {
							if (done) return;
							done = true;
							onFulfilled(value);
						}, function(reason) {
							if (done) return;
							done = true;
							onRejected(reason);
						});
					} catch (ex) {
						if (done) return;
						done = true;
						onRejected(ex);
					}
				}
			}, {
				asap: 4
			}],
			3: [function(require, module, exports) {
				var Promise = require("./core.js");
				var asap = require("asap");
				module.exports = Promise;

				function ValuePromise(value) {
					this.then = function(onFulfilled) {
						if (typeof onFulfilled !== "function") return this;
						return new Promise(function(resolve, reject) {
							asap(function() {
								try {
									resolve(onFulfilled(value));
								} catch (ex) {
									reject(ex);
								}
							});
						});
					};
				}
				ValuePromise.prototype = Promise.prototype;
				var TRUE = new ValuePromise(true);
				var FALSE = new ValuePromise(false);
				var NULL = new ValuePromise(null);
				var UNDEFINED = new ValuePromise(undefined);
				var ZERO = new ValuePromise(0);
				var EMPTYSTRING = new ValuePromise("");
				Promise.resolve = function(value) {
					if (value instanceof Promise) return value;
					if (value === null) return NULL;
					if (value === undefined) return UNDEFINED;
					if (value === true) return TRUE;
					if (value === false) return FALSE;
					if (value === 0) return ZERO;
					if (value === "") return EMPTYSTRING;
					if (typeof value === "object" || typeof value === "function") {
						try {
							var then = value.then;
							if (typeof then === "function") {
								return new Promise(then.bind(value));
							}
						} catch (ex) {
							return new Promise(function(resolve, reject) {
								reject(ex);
							});
						}
					}
					return new ValuePromise(value);
				};
				Promise.all = function(arr) {
					var args = Array.prototype.slice.call(arr);
					return new Promise(function(resolve, reject) {
						if (args.length === 0) return resolve([]);
						var remaining = args.length;

						function res(i, val) {
							try {
								if (val && (typeof val === "object" || typeof val === "function")) {
									var then = val.then;
									if (typeof then === "function") {
										then.call(val, function(val) {
											res(i, val);
										}, reject);
										return;
									}
								}
								args[i] = val;
								if (--remaining === 0) {
									resolve(args);
								}
							} catch (ex) {
								reject(ex);
							}
						}
						for (var i = 0; i < args.length; i++) {
							res(i, args[i]);
						}
					});
				};
				Promise.reject = function(value) {
					return new Promise(function(resolve, reject) {
						reject(value);
					});
				};
				Promise.race = function(values) {
					return new Promise(function(resolve, reject) {
						values.forEach(function(value) {
							Promise.resolve(value).then(resolve, reject);
						});
					});
				};
				Promise.prototype["catch"] = function(onRejected) {
					return this.then(null, onRejected);
				};
			}, {
				"./core.js": 2,
				asap: 4
			}],
			4: [function(require, module, exports) {
				(function(process) {
					var head = {
						task: void 0,
						next: null
					};
					var tail = head;
					var flushing = false;
					var requestFlush = void 0;
					var isNodeJS = false;

					function flush() {
						while (head.next) {
							head = head.next;
							var task = head.task;
							head.task = void 0;
							var domain = head.domain;
							if (domain) {
								head.domain = void 0;
								domain.enter();
							}
							try {
								task();
							} catch (e) {
								if (isNodeJS) {
									if (domain) {
										domain.exit();
									}
									setTimeout(flush, 0);
									if (domain) {
										domain.enter();
									}
									throw e;
								} else {
									setTimeout(function() {
										throw e;
									}, 0);
								}
							}
							if (domain) {
								domain.exit();
							}
						}
						flushing = false;
					}
					if (typeof process !== "undefined" && process.nextTick) {
						isNodeJS = true;
						requestFlush = function() {
							process.nextTick(flush);
						};
					} else if (typeof setImmediate === "function") {
						if (typeof window !== "undefined") {
							requestFlush = setImmediate.bind(window, flush);
						} else {
							requestFlush = function() {
								setImmediate(flush);
							};
						}
					} else if (typeof MessageChannel !== "undefined") {
						var channel = new MessageChannel();
						channel.port1.onmessage = flush;
						requestFlush = function() {
							channel.port2.postMessage(0);
						};
					} else {
						requestFlush = function() {
							setTimeout(flush, 0);
						};
					}

					function asap(task) {
						tail = tail.next = {
							task: task,
							domain: isNodeJS && process.domain,
							next: null
						};
						if (!flushing) {
							flushing = true;
							requestFlush();
						}
					}
					module.exports = asap;
				}).call(this, require("_process"));
			}, {
				_process: 1
			}],
			6: [function(require, module, exports) {
				var asap = require("asap"); //4 1
				window.Promise = require("./lib/core.js"); //2 4
				require("./lib/es6-extensions.js"); //3
			}, {
				"./lib/core.js": 2,
				"./lib/es6-extensions.js": 3,
				asap: 4
			}]
		}
		var exportsCache = {};
		function run(runId) {
			if (!exportsCache[runId]) {
				var mod = exportsCache[runId] = {
					exports: {}
				};
				runMods[runId][0].call(mod.exports, function(e) {
					// runMods[runId][1]: {modLi:orderId}
					return run(runMods[runId][1][e]);
				}, mod, mod.exports);
			}
			return exportsCache[runId].exports;
		}
		run(6); // 6: 最开始执行的模块ID
	};
});
module.use('$brick');