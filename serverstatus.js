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
	var startTime = new Date().getTime();
	getStatusInfo()
		.then(result=> {
				globalCache.statusArray = result;
				setTimeout(globalCache.refresh,5000 - (new Date().getTime() - startTime));});

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
			
			},2500);
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
			return {
				"totalmem":parseInt(logArray
						.filter(string=>string.match(/BBBP.*MemTotal:/))[0]
						.match(/(\d+) kB"$/i)[1]),
				"freemem":parseInt(logArray
						.filter(string=>string.match(/BBBP.*MemFree:/))[0]
						.match(/(\d+) kB"$/i)[1]) +
					   parseInt(logArray
						.filter(string=>string.match(/BBBP.*Inactive:/))[0]
						.match(/(\d+) kB"$/i)[1]),
				"units":"kB",
				"totalswap":parseInt(logArray
						.filter(string=>string.match(/BBBP.*SwapTotal:/))[0]
						.match(/(\d+) kB"$/i)[1]),
				"freeswap":parseInt(logArray
						.filter(string=>string.match(/BBBP.*SwapFree:/))[0]
						.match(/(\d+) kB"$/i)[1])
			};
		}
		function getCPU(logArray){
			const cpuList = logArray
							.filter(string=>string.match(/^CPU\d\d\d,T/))
			return cpuList
							.map(cpuLine=>{
								const matchArray = cpuLine
										.match(/CPU\d\d(\d),T\d\d\d\d,(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d)$/i);
								return {
										"Num":matchArray[1],
										"User%":matchArray[2],
										"Sys%":matchArray[3],
										"Wait%":matchArray[4],
										"Idle%":matchArray[5]
									}})
		}
		function getNetUse(logArray){
			const netMatch = logArray
							.filter(string=>string.match('NET,T0001,'))[0]
							.match(/NET,T0001,(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d),(\d+.\d),$/i);
			return {
				"receiveddata":netMatch[1],
				"sentdata":netMatch[4],
				"units":"kB"
			};
		}
		
		function getUptime(logArray){
			const uptimeMatch = logArray
							.filter(string=>string.match(/BBBP,\d\d\d,uptime,"/))[0]
							//NOTE! uptime might be in form '333 days, 2 min' OR 
							//'333 days, 2:32' OR 
							//maybe something else
							.match(/BBBP,\d\d\d,uptime," \d+:\d+:\d+ up ([^,]+,\s+[^,]+),/i);
			return {
				"uptime":uptimeMatch ? uptimeMatch[1] : "error",
			};
		}
		
		function getLoadAverages(logArray){
			const loadAvgMatch = logArray
							.filter(string=>string.match(/BBBP,\d\d\d,uptime,"/))[0]
							.match(/load average: (\d+.\d+, \d+.\d+, \d+.\d+)"$/i);
			return {
				"loadAverages":loadAvgMatch ? loadAvgMatch[1] : "error",
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
