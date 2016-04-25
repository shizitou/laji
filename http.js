var http = require('http'),
	appServer = require('httpServer')('./release/');
// console.dir(http);
//开启HTTP监听
http.createServer(function(request,response){
	// console.dir(request);
	// new appServer(request,response);
}).listen(100);