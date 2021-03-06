var fs = require('fs');
var execSync = require('child_process').execSync;

const NMON_LOGFILE_PATH = "nmon.txt";

function getStatus(){

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
		//console.log(getSda1Use(logArray));
		//console.log(getDiskWriteAndRead(logArray));
		
		return [			
			getMemory(logArray),
			getCPU(logArray),
			getNetUse(logArray),
			getUptime(logArray),
			getLoadAverages(logArray),
			getSda1Use(logArray),
			getDiskWriteAndRead(logArray)
		];

		
		function getMemory(logArray){
			//htop's calculation is straightforward, using numbers from /proc/meminfo.
			//It's basically (MemTotal - MemFree - (Buffers + Cached)) / 1024.
			return {
				"totalmem":parseInt(logArray
						.filter(string=>string.match(/BBBP.*MemTotal:/))[0]
						.match(/(\d+) kB"$/i)[1]),
				"buffers":parseInt(logArray
						.filter(string=>string.match(/BBBP.*Buffers:/))[0]
						.match(/(\d+) kB"$/i)[1]),
				"cached":parseInt(logArray
						.filter(string=>string.match(/BBBP.*Cached:/))[0]
						.match(/(\d+) kB"$/i)[1]),
				"freemem":parseInt(logArray
						.filter(string=>string.match(/BBBP.*MemFree:/))[0]
						.match(/(\d+) kB"$/i)[1]) ,
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
			const netInterfaceValues = 
						logArray
							.filter(string=>string.match('NET,T0001,'))[0]
							.split('NET,T0001,')[1]
							.split(',')
							.slice(0,-1);
			const receivedAmount = 
						netInterfaceValues
							.filter((value,i)=> i < netInterfaceValues.length/2)
							.reduce((a,b)=>a+parseFloat(b),0);
			const sentAmount = 
						netInterfaceValues
							.filter((value,i)=> i >= netInterfaceValues.length/2)
							.reduce((a,b)=>a+parseFloat(b),0);
							
			return {
				"receiveddata":receivedAmount,
				"sentdata":sentAmount,
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
		function getSda1Use(logArray){
			const sda1Match = logArray
							.filter(string=>string.match("/bin/df-m,\"ddev/sda1"))[0]
							.match(/sda1\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+%)/i);
			return {
				"name":"sda1Stats",
				"data":{
					"unit":"G",
					"all":Math.round(sda1Match[1]/1024),
					"used":Math.round(sda1Match[2]/1024),
					"available":Math.round(sda1Match[3]/1024),
					"usedpercentage":sda1Match[4],
				}
			};
		}
		function getDiskWriteAndRead(logArray){
			const diskReadValue = 
						logArray
							.filter(string=>string.match('DISKREAD,T0001,'))[0]
							.split('T0001,')[1]
							.split(',')[0];
			const diskWriteValue = 
						logArray
							.filter(string=>string.match('DISKWRITE,T0001,'))[0]
							.split('T0001,')[1]
							.split(',')[0];
			const unit = "KB/s";
							
			return {
				"name":"diskWriteAndRead",
				"data":{
					"unit":unit,
					"readPerSec":diskReadValue,
					"writePerSec":diskWriteValue,
					
				}
			};
		}
	}
} 

module.exports = {getStatus:getStatus};