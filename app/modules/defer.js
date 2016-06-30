/******
eg:
		
******/
define('defer', function() {
	// id: list
	var defs = {};
	//get defer Object of current key
	function getDefByKey(key) {
		var curDefObj = defs[key];
		if (!curDefObj)
			curDefObj = defs[key] = {
				done: [],
				fail: [],
				// resolved || rejected
				status: null,
				// arguemnts when first tirgger
				arguments: null
			};
		return curDefObj;
	}
	//action: 'done|fail',
	//fn: function | array
	function addHandle(key, action, fn) {
		var curDefObj = getDefByKey(key);
		// []
		var addFn = typeof fn === 'function' ? [fn] : fn;
		var curList = curDefObj[action];
		for (var i = 0, j = addFn.length; i < j; i++) {
			curList.push(addFn[i]);
		}
		curDefObj.status && fireHanlde(key);
	}
	//fire the deferlist
	function fireHanlde(key) {
		var curDefObj = getDefByKey(key);
		var status = curDefObj.status;
		var curList;
		var args;
		//选择触发线路
		if (status === 'resolved') {
			curList = curDefObj['done'];
		} else if (status === 'rejected') {
			curList = curDefObj['fail'];
		}
		//触发
		if (curList.length) {
			args = curDefObj.arguments || [];
			for (var i = 0, j = curList.length; i < j; i++) {
				curList[i].apply(null, args);
			}
			curList.length = 0;
		}
	}
	// args: []
	// state: resolved | rejected
	function trigger(key, state, args){
		var curDefObj = getDefByKey(key);
		var status = curDefObj.status;
		//触发过了就不在触发,除非清楚了状态
		if(status)
			return ;
		curDefObj['arguments'] = args;
		curDefObj.status = state;
		fireHanlde(key);
	}
	function clean(key){
		defs[key] = {
			done: [],
			fail: [],
			// resolved || rejected
			status: null,
			// arguemnts when first tirgger
			arguments: null
		};
	}

	function DeferObj(id) {
		this.deferKey = id;
	}
	DeferObj.prototype = {
		//添加
		done: function(fn) {
			fn && addHandle(this.deferKey, 'done', fn);
			return this;
		},
		//添加
		fail: function(fn) {
			fn && addHandle(this.deferKey, 'fail', fn);
			return this;
		},
		//触发
		resolve: function() {
			trigger(this.deferKey, 'resolved', arguments);
			return this;
		},
		//触发
		reject: function() {
			trigger(this.deferKey, 'rejected', arguments);
			return this;
		},
		clean: function(){
			clean(this.deferKey);
			return this;
		}
	};

	function defer(id, donefn, failfn) {
		var deferInstance = new DeferObj("" + id);
		deferInstance.done(donefn).fail(failfn);
		return deferInstance;
	}
	return defer;
});