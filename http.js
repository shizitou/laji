var http = require('http'),
	appServer = require('httpServer')('./release/');

//开启HTTP监听
http.createServer(function(request,response){
	new appServer(request,response);
}).listen(100);