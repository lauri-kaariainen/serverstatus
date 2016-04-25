"use strict";
var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var execSync = require('child_process').execSync;


const NMON_LOGFILE_PATH = "nmon.txt";



var globalCache = {};
//declare all cached items here
globalCache.statusArray = "WARNING, CACHE IN INITIAL STATE";

globalCache.refresh = function(){
	globalCache.statusArray = getStatusInfo();
	setTimeout(globalCache.refresh,3000);
}
globalCache.refresh();



function getStatusInfo(){

	//run the nmon logging
	execSync("nmon -F "+NMON_LOGFILE_PATH+" -s 0 -c 1");
	
	//it should take a bit less than 2 secs to complete writing the logfile 
	setTimeout(()=>
		{
			var logStringArray = 
			fs.readFileSync(NMON_LOGFILE_PATH,{encoding:"ascii"})
			.split('\n');
			handleLogs(logStringArray);
		
		},2000);
	
	function handleLogs(logArray){
		console.log(logArray.length);
		console.log(getMemory(logArray));
		console.log(getCPU(logArray));
		console.log(getNetUse(logArray));
		
		function getMemory(logArray){
			//console.log(logArray
			//			.filter(string=>string.match("BBBP,074"))[0]);
			return {
				"total":logArray
						.filter(string=>string.match('BBBP,074,/proc/meminfo,"MemTotal:'))[0]
						.match(/(\d+) kB"$/i)[1],
				"free":parseInt(logArray
						.filter(string=>string.match('BBBP,075,/proc/meminfo,"MemFree:'))[0]
						.match(/(\d+) kB"$/i)[1]) +
					   parseInt(logArray
						.filter(string=>string.match('BBBP,080,/proc/meminfo,"Inactive:'))[0]
						.match(/(\d+) kB"$/i)[1]),
				"units":"kB"
						
			};
		}
		function getCPU(logArray){
			const cpu1Match = logArray
							.filter(string=>string.match('CPU001,T0001,'))[0]
							.match(/CPU001,T0001,(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d)$/i);
			const cpu2Match = logArray
							.filter(string=>string.match('CPU002,T0001,'))[0]
							.match(/CPU002,T0001,(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d)$/i);
			return {
				"cpu1":
					{
						"User%":cpu1Match[1],
						"Wait%":cpu1Match[3],
						"Idle%":cpu1Match[4]
					},
				"cpu2":
					{
						"User%":cpu2Match[1],
						"Wait%":cpu2Match[3],
						"Idle%":cpu2Match[4]
					},
						
			};
		}
		function getNetUse(logArray){
			const netMatch = logArray
							.filter(string=>string.match('NET,T0001,'))[0]
							.match(/NET,T0001,(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d),$/i);
			return {
				"recv":netMatch[3],
				"trans":netMatch[6],
				"units":"kB"
			};
		}
		
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
