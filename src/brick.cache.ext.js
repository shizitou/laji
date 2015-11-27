define.mount('config',function(){
	var self = this;
	var configs = self.config;
	var hashKey = (configs.prefix || '__BRICK__')+'HASH';
	// detect localStorage support and activate cache ability
	try {
		if (configs.hash !== localStorage.getItem(hashKey)) {
			self.clean();
			localStorage.setItem(hashKey, configs.hash);
		}
		self.config({ 'cache': true });
	} catch (e) {
		self.config({ 'cache': false });
	}
	// detect _debug=nocache in location.search
	if (/\b_debug=([\w,]+)\b/.test(location.search)) {
		if(RegExp.$1.indexOf('nocache')){
			self.clean();
			self.config({ 'cache': false });
		}
	}
	console.log(configs);
}).mount('load',function(){
	
}).mount('defined',function(){

});