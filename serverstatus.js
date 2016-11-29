"use strict";
var app = require('express')();
var http = require('http').Server(app);
var getStatusInfo = require('./getstatus').getStatus;
var nodeStatic = require('node-static');


var file = new(nodeStatic.Server)();
function serveFile(req,res){
	if(req.url==="/")
		req.url = "/frontend/index.html";
	else
		req.url = "/frontend"+req.url;
	file.serve(req,res);
}


var globalCache = {};
//declare all cached items here
globalCache.statusArray = "WARNING, CACHE IN INITIAL STATE";

globalCache.refresh = function(){
	var startTime = new Date().getTime();
	getStatusInfo()
		.then(result=> {
				globalCache.statusArray = result;
				setTimeout(globalCache.refresh,5000 - (new Date().getTime() - startTime));});

}
globalCache.refresh();




app.get('/ajax/status', 
	(req, res)=>{
		res.send(globalCache.statusArray);
	}
);

app.get("/",serveFile);
app.get("/dominate.min.js",serveFile);
app.get("/ungrid.css",serveFile);
app.get("/promise.min.js",serveFile);

			

http.listen(9010, function(){ 
  console.log('listening on *:9010');
});



	
