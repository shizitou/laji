define('$localStorage', function() {
	var local = window.localStorage,
		//先检测是否支持ls
		supportLS = Math.random()+'',
		data = {};
	try{
		local.setItem(supportLS,'1');
		if(local.getItem(supportLS)){
			local.removeItem(supportLS);
			supportLS = true;
		}else{
			supportLS = false;
		}
	}catch(_e){
		supportLS = false;
	}
	return {
		set: function (key,val){
			data[key] = val;
			supportLS && local.setItem(key,val);
			return val;
		},
		get: function(key){
			var cache = data[key];
			if(!cache && supportLS)
				cache = data[key] = local.getItem(key);
			return cache;
		},
		remove: function(key){
			data[key] = undefined;
			supportLS && local.removeItem(key);
		},
		//刷新缓存中的数据
		refresh: function(){
			data = {};
		}
	}
});