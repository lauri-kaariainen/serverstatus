"use strict";
var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var execSync = require('child_process').execSync;


const NMON_LOGFILE_PATH = "nmon.txt";


var logStringArray = 
	fs.readFileSync(NMON_LOGFILE_PATH,{encoding:"utf-8"})
	.split('\n');
console.log(logStringArray.length);

var globalCache = {};
//declare all cached items here
globalCache.statusArray = "WARNING, CACHE IN INITIAL STATE";

globalCache.refresh = function(){
	globalCache.statusArray = getStatusInfo();
	//setTimeout(globalCache.refresh,5000);
}
globalCache.refresh();



function getStatusInfo(){

	//run the nmon logging
	console.log(execSync("nmon -F "+NMON_LOGFILE_PATH+" -s 0 -c 1").toString());
	var logStringArray = 
		fs.readFileSync(NMON_LOGFILE_PATH,{encoding:"ascii"})
		.split('\n');
	console.log(logStringArray.length);
	setTimeout(()=>
		{
			var logStringArray = 
			fs.readFileSync(NMON_LOGFILE_PATH,{encoding:"ascii"})
			.split('\n');
			console.log(logStringArray.length);
		
		},150);

	return []
			.map(e=>({"name":e.name,"id":e.id,"status":callGrep(e.id)}));
	
	function callGrep(idString){
		try{ 
			return isEverythingOk(
						execSync(
							'grep -i "error\\|except" '+process.env['HOME']+'/.forever/' +idString+'.log'
					).toString())
		}
		catch(e){
			//this means grep didn't find anything
			if(e.status === 1){
				return true;
			}
			else throw e;
		}
		
			
	};

	function isEverythingOk(stdout){
		if(!stdout)
			return true;
		var lastErrorLine = stdout
								.trim()
								.split("\n")
								.pop();
		//console.log(lastErrorLine);
		if(lastErrorLine.match("error: Script restart attempt"))
			return true;
		else
			return false;
		
	}
	
			
}  



app.get('/statuses', 
	(req, res)=>{
		res.send(globalCache.statusArray);
	}
);


			

http.listen(9010, function(){ 
  console.log('listening on *:9010');
});
