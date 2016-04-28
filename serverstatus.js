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
	getStatusInfo()
		.then(result=> {
				globalCache.statusArray = result;
				setTimeout(globalCache.refresh,5000);});
	
}
globalCache.refresh();



function getStatusInfo(){

	//run the nmon logging
	execSync("nmon -F "+NMON_LOGFILE_PATH+" -s 0 -c 1");
		
	
	//it should take a bit less than 2 secs to complete writing the logfile 
	return new Promise((resolve,reject)=>{
		setTimeout(()=>
			{
				var logStringArray = 
				fs.readFileSync(NMON_LOGFILE_PATH,{encoding:"ascii"})
					.split('\n');
				resolve(handleLogs(logStringArray));
			
			},2000);
	});
	
	
	function handleLogs(logArray){
		//console.log(logArray.length);
		//console.log(getMemory(logArray));
		//console.log(getCPU(logArray));
		//console.log(getNetUse(logArray));
		//console.log(getUptime(logArray));
		//console.log(getLoadAverages(logArray));
		let returnArray = [];
		returnArray.push(getMemory(logArray));
		returnArray.push(getCPU(logArray));
		returnArray.push(getNetUse(logArray));
		returnArray.push(getUptime(logArray));
		returnArray.push(getLoadAverages(logArray));
		return returnArray;
		
		function getMemory(logArray){
			//console.log(logArray
			//			.filter(string=>string.match("BBBP,074"))[0]);
			return {
				"totalmem":logArray
						.filter(string=>string.match('BBBP,074,/proc/meminfo,"MemTotal:'))[0]
						.match(/(\d+) kB"$/i)[1],
				"freemem":parseInt(logArray
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
				"receiveddata":netMatch[3],
				"sentdata":netMatch[6],
				"units":"kB"
			};
		}
		
		function getUptime(logArray){
			const uptimeMatch = logArray
							.filter(string=>string.match('BBBP,254,uptime,"'))[0]
							.match(/^BBBP,254,uptime," \d+:\d+:\d+ up (\d+ days,\s\d+:\d+)/i);
			return {
				"uptime":uptimeMatch[1],
			};
		}
		
		function getLoadAverages(logArray){
			const loadAvgMatch = logArray
							.filter(string=>string.match('BBBP,254,uptime,"'))[0]
							.match(/load average: (\d+.\d+, \d+.\d+, \d+.\d+)"$/i);
			return {
				"loadAverages":loadAvgMatch[1],
			};
		}
	}
}  



app.get('/status', 
	(req, res)=>{
		res.send(globalCache.statusArray);
	}
);


			

http.listen(9010, function(){ 
  console.log('listening on *:9010');
});
