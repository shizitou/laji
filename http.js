var http = require('http'),
	appServer = require('httpServer')('./release/');
//开启HTTP监听
http.createServer(function(request,response){
	new appServer(request,response);
}).listen(8080); //linux 下 1024 以下端口不可以