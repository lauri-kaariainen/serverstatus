"use strict";
var app = require('express')();
var http = require('http').Server(app);

var getStatusInfo = require('./getstatus').getStatus;



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




app.get('/status', 
	(req, res)=>{
		res.send(globalCache.statusArray);
	}
);


			

http.listen(9010, function(){ 
  console.log('listening on *:9010');
});
