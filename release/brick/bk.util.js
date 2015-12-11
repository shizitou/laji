define('$util', function() {
	var util = {};
	util.clone = function(obj){
		return JSON.parse(JSON.stringify(obj));
	};
	function _alert(text, time){
		var el,winW,winH,
			self = _alert;
		if(el = self.el){
			self._timeCon && clearTimeout(self._timeCon);
			el.style.display = 'block';
			el.innerText = text;
            //计算在页面中显示的位置
            window.addEventListener('resize', function(){
            	self.setPos();
            }, false);
            self.setPos();
            //设置消失时间
			self._timeCon = setTimeout(function(){
				abort();
			},(time || time===0 || 1)*1000);
			return abort;
		}else{
			throw new Error('未指定弹出框元素');
		}
		function abort(){
			self._timeCon && clearTimeout(self._timeCon);
			el.style.display = 'none';
		};
	}
	_alert.setEl = function(el){
		this.el = el[0] || el ;
	};
	_alert.setPos = function(){
		var el = this.el,
			win = window;
		el.style.position = 'fixed';
        el.style.left = Math.ceil((win.innerWidth - el.offsetWidth)/2)+'px';
		el.style.top = Math.ceil((win.innerHeight - el.offsetHeight)/2)+'px';
	};
	util.alert = _alert;

	return {
		collection: util,
		set: function(key, val, context) {
			/* util.user.alert , val, null */
			var keys = key.split('.'),
				i = 0,
				j = keys.length,
				treeKey = this.collection,
				curKey;
			for (; i < j; i++) {
				curKey = keys[i];
				//当这里已经有值了
				if (treeKey[curKey]) {
					if (Object.prototype.toString.call(treeKey[curKey]) === '[object Object]') {
						treeKey = i + 1 === j ? setVal(curKey, val) : treeKey[curKey];
					} else {
						setVal(curKey, val);
					}
				//当还没有值得时候
				} else {
					treeKey = setVal(curKey, i + 1 === j ? val : {});
				}
			}
			function setVal(key, val) {
				treeKey[key] = context ?
					function() {
						val.apply(context, arguments);
					} : val;
				return treeKey[key];
			}
			return this;
		},
		bindTo: function(object) {
			object.extend(this.collection);
		}
	}
});