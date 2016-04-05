/**
*******     版本更新         ********
*******     data 2016-03-21  ********
*******     author 井浩然    ********
*******						 ********
**/


var http = require('http');
var fs = require('fs');
var request = require('request');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;


var updateVersion = function(){
	
	// define the checkUpdate path
	var checkUpadteUrl = "http://192.168.1.205:9099/DataSync/sync/version/check";

	// FileDownRequest // 读取配置 版本控制请求body体
	var checkUpdate = JSON.parse(fs.readFileSync('./release.json'));

	// 1.版本检测
	var checkUpdateOptions = { 
	 	url: checkUpadteUrl,
	    headers: { 
	    	'Content-Type':'application/json;charset=UTF-8'
	    	},
	    	body: JSON.stringify(checkUpdate)
	};

    exec("echo %GLOBAL_HOME1%", function(err,stdout,stderr){
	    if(err) {
	        //createLog(logFile, "\r\n未找到该【环境变量】= %GLOBAL_HOME%....."+stderr);
	    } else {
	        var GLOBAL_HOME = stdout.toString().trim();

	        // 重点说明，所有目录变量结尾不能加'/'

	        // 1. define the local product file path;
			var localProudctPC = GLOBAL_HOME+"/MPOS/resources";

			//  后台war文件所在文件目录
			var localServerPC = GLOBAL_HOME+"/tomcat7/webapps/global-server";

			//  后台war文件所在文件目录
			var localAppPC = GLOBAL_HOME+"/tomcat7/webapps/app";

		    // define the unzip filepath
		    var unzipfilepath = GLOBAL_HOME+"/UNZIP";

		    var unzipServer = unzipfilepath+"/global-server";

		    var unzipApp = unzipfilepath+"/app";

		    var unzipProduct = unzipfilepath+"/resource";

		    // 产品更新压缩包
		    var localProductZIP = GLOBAL_HOME+"/product.zip"; //必须初始化建立

		    // 文件更新压缩包
		    var localFileZIP = GLOBAL_HOME+"/files.zip"; //必须初始化建立

		    //本地app缓存 字体
		    var localAppFont = GLOBAL_HOME+"/fonts/app"; // 必须初始化建立

		    // app所在字体模板
			var pcAppFont = GLOBAL_HOME+"/tomcat/webapp/app/modules/base/fonts";

		    //war档中字体所在目录
		  //  var pcServerFont = GLOBAL_HOME+"/font/server"; 

		    //本地server缓存字体
		   // var localServerFont = GLOBAL_HOME+"/tomcat/webapp/global-server/font";

		   //當前版本更新狀態
		   var productV = 0;
		   var fileV = 0;


			// 版本更新日志
			var logFile =  GLOBAL_HOME+"/MPOS.log";   //必须初始化 

			var winRAR = GLOBAL_HOME+"/tools/WinRAR/WinRAR";

			//写入版本检查配置信息，更新版本信息
			var writeVersion = function(JsonObj){
				fs.writeFileSync('./release.json', JSON.stringify(JsonObj));
			}

			// create file
			var createFile = function(filename){
				var flag = fs.existsSync(filename);
				if(flag == false){
					createLog(logFile, "\r\n创建新的【目标文件】： 目标文件不存在....."+filename);
					var exsit_floder = filename.substring(0, filename.lastIndexOf("/"));
					if(fs.existsSync(exsit_floder)){
						touchCmd(filename);
					}else{
						mdCmd(exsit_floder);
						createFile(filename);
					}	
			    }
			};

			var createFloder = function(filename){
				var flag = fs.existsSync(filename);
				if(flag == false){
					createLog(logFile, "\r\n创建新的【目标文件夹】： 目标文件不存在....."+filename);
					mdCmd(filename);	
			    }
			};

			// 文件覆盖更新， oldpath为下载要更新的文件路径， newpath为被覆盖掉的文件路径
			var xcopyCmd = function(oldpath, newpath){
				createLog(logFile, "\r\n执行文件复制.....【源路径】："+oldpath+"...【目标路径】："+newpath);
				var cmdStr = 'xcopy /s/i/e/y "'+oldpath+'" "'+newpath+'"';
				try{
					execSync(cmdStr);
					createLog(logFile, "\r\n执行文件复制successfully.....");
					return true;
				}catch(e){
					createLog(logFile, "\r\n执行文件复制失败...."+cmdStr);
					return false;
				}
			};

			// 删除某特定文件夹
			var rmCmd = function(floder){
				createLog(logFile, "\r\n执行文件删除....【目标路径】："+floder);
				var cmdStr = 'rmdir /s/q "'+floder+'"';
				try{
					execSync(cmdStr);
					createLog(logFile, "\r\n执行文件删除successfully.....");
					return true;
				}catch(e){
					createLog(logFile, "\r\n执行文件删除失败...."+cmdStr);
					return false;
				}
			}

			// 删除某特定文件夹
			var delCmd = function(floder){
				createLog(logFile, "\r\n执行文件删除....【目标路径】："+floder);
				var cmdStr = 'DEL /s/q "'+floder+'"';
				try{
					execSync(cmdStr);
					createLog(logFile, "\r\n执行文件删除successfully.....");
					return true;
				}catch(e){
					createLog(logFile, "\r\n执行文件删除失败...."+cmdStr);
					return false;
				}
			}

			/**
			* 解压zip文件
			  zipFile  zip文件路径
			  unzipfilepath  解压到指定文件路径下

			*/
			var unzipVersion = function(zipfile, unzipfilepath, code, data){
				var cmdStr = winRAR+' x -y -ibck "'+zipfile+'" "'+unzipfilepath+'"';
				exec(cmdStr, function(err,stdout,stderr){
					createLog(logFile, "\r\n执行文件压缩.....【源路径】："+zipfile+"...【目标路径】："+unzipfilepath);
				    if(err) {
				    	createLog(logFile, "\r\n执行文件压缩失败...."+stderr);
				    	$("#productV").val("1");
				        $("#fileV").val("1");
				        $("#005").replaceWith(" <b>系統發生異常，無法進行升級，失敗！</b>");
				    } else {
				    	createLog(logFile, "\r\n执行文件压缩successfully.....");
				    	$("#001").replaceWith(" <b>正在執行文件升級操作</b>");
				    	if(code==20){
				    		if(xcopyCmd(unzipProduct, localProudctPC) && xcopyCmd(unzipProduct+"/product", localProudctPC+"/data")){
				    			$("#productV").val("1");
				    			// 更新版本信息
				    			var checkUpdate = JSON.parse(fs.readFileSync('./release.json'));
				    			checkUpdate.dataSyncUpdatetime = data.releaseDate;
				    			writeVersion(checkUpdate);
				    			createLog(logFile, "\r\n产品文件版本更新成功...."+new Date());
				    			// 告诉版本检测界面 ，产品更新是否成功
				    			$("#003").replaceWith(" <b>產品文件版本升級成功</b>");
				    		}else{
				    			$("#productV").val("1");
				    			// 告诉版本检测界面 ，产品更新是否成功
				    			$("#003").replaceWith(" <b>產品文件版本升級失敗</b>");
				    		}
				    		
				    	}else if(code==10){
				    		var server_exists = fs.existsSync(unzipServer);
							var app_exists = fs.existsSync(unzipApp);
							var opt = false; // 版本更新过程是否成功
							
							if(server_exists){
								// 先进行备份 dataBak
							  // xcopyCmd(localServerPC, dataBakServer)
							   if(delCmd(localServerPC) && 
							   xcopyCmd(unzipServer, localServerPC) &&
							  // xcopyCmd(localServerFont, pcServerFont) &&
							   rmCmd(unzipServer)){
									opt = true;
								}else{
									createLog(logFile, "\r\nServer版本更新失败....");
									//xcopyCmd(dataBakServer, localServerPC); // 回退老版本
									opt = false;
								}
							}

							if(app_exists){
								// 先进行备份 dataBak
							   if(delCmd(localAppPC) &&
							   xcopyCmd(unzipApp, localAppPC) &&
							   xcopyCmd(localAppFont, pcAppFont) &&
							   rmCmd(unzipApp)){
							   		//判断Server是否有更新
							   		if(server_exists && opt){
							   			opt = true;
							   		}
								}else{
									createLog(logFile, "\r\nAPP版本更新失败....");
									opt = false;
								}
							} 

							if(opt){
								$("#fileV").val("1");
								// 更新版本信息
								var checkUpdate = JSON.parse(fs.readFileSync('./release.json'));
								checkUpdate.appSyncUpdatetime = data.releaseDate;
								checkUpdate.version = data.version;
								writeVersion(checkUpdate);
								createLog(logFile, "\r\n系统文件版本更新成功...."+new Date());
								// 告诉版本检测界面，版本更新是否成功
								$("#004").replaceWith(" <b>系統文件版本升級成功</b>");
							}else{
								$("#fileV").val("1");
								// 告诉版本检测界面，版本更新是否成功
								$("#004").replaceWith(" <b>系統文件版本升級失敗</b>");
							}
				    	}
				    }
				});
			};

			// record the process of opt in log files
			var createLog = function(logFile, record){
				// 3、追加内容
				fs.appendFile(logFile, record, function (error) {
					if (error) {
						// 出现错误
					}
					// 继续操作
				});
			};

			// 创建文件目录
			var mdCmd = function(floder){
				var cmdStr = 'md "'+floder+'"';
				exec(cmdStr, function(err,stdout,stderr){
				    createLog(logFile, "\r\n正在执行创建【文件目录】：....."+floder);
				    if(err) {
				        createLog(logFile, "\r\n执行创建新的【文件目录】失败....."+stderr); 
				    } else {
				         createLog(logFile, "\r\n执行创建新的【文件目录】successfully...."); 
				    }
				});
			};

			// 创建文件
			var touchCmd = function(floder){
				var cmdStr = 'copy nul "'+floder+'"';
				exec(cmdStr, function(err,stdout,stderr){
					createLog(logFile, "\r\n正在执行创建【文件】：....."+floder);
				    if(err) {
				        createLog(logFile, "\r\n执行创建新的【文件】失败....."+stderr); 
				    } else {
				         createLog(logFile, "\r\n执行创建新的【文件】successfully...."); 
				    }
				});
			};

			// 初始化文件检测

			createFloder(unzipfilepath);
			createFile(localProductZIP);
			createFile(localFileZIP);
			//createFloder(localAppFont);
			//createFloder(pcAppFont);
			//createFloder(localServerFont);
			//createFloder(pcServerFont);
			
			// http download interface
			/*
				code 操作类型 10增量更新 11全量更新  20产品文件更新
			*/
			var fileDownload = function(data, filepath, code){

				fs.exists(filepath, function(exists){
					if(exists){
						var file = fs.createWriteStream(filepath);
						createLog(logFile, "\r\n进行下载文件请求http URL....."+data.fileUrl+"\r\n将要下载的文件为....."+filepath);
						var dfileSize = 0;
						http.get(data.fileUrl, function(res) {
							if(res.statusCode==200 && code==20){
								var totalSize = data.fileLength;
								res.on('data', function(data) {
									dfileSize = dfileSize+data.length;
									$("#003").replaceWith("<span id='003'><b>產品當前下載進度"+dfileSize+"kbps/"+totalSize+"kbps</b></span>");
							        file.write(data);
							    }).on('end', function() {
							        file.end();
							        createLog(logFile, "\r\n下载文件成功....."+filepath);
							        $("#003").replaceWith("<span id='003'> <b>正在進行產品系統升級，請不要關閉窗口...</b></span>");
									unzipVersion(localProductZIP, unzipfilepath, code, data);
							    }).on('error',function(err){
							    	 createLog(logFile, "\r\n下载文件失败....."+err.message+filepath);
		        				});
							}else if(res.statusCode==200 && code==10){
								var totalSize = data.fileLength;
								res.on('data', function(data) {
									dfileSize = dfileSize+data.length;
									$("#004").replaceWith("<span id='004'> <b>文件當前下載進度"+dfileSize+"kbps/"+totalSize+"kbps</b></span>");
							        file.write(data);
							    }).on('end', function() {
							        file.end();
							        createLog(logFile, "\r\n下载文件成功....."+filepath);	
							        $("#004").replaceWith("<span id='004'> <b>正在進行文件系統升級，請不要關閉窗口...</b></span>");
									unzipVersion(localFileZIP, unzipfilepath, code, data);
							    }).on('error',function(err){
							    	 createLog(logFile, "\r\n下载文件失败....."+err.message+filepath);
		        				});
							}else{
								
								createLog(logFile, "\r\n网络请求返回失败"+res.statusCode);
							}
							
						});
					}
					
				});
			};

			// 7. send http request about check the PC  is updating?
			var requestCheck = function(checkUpdateOptions){
				createLog(logFile, "\r\n正在进行版本更新检查........");
				console.log(checkUpdateOptions);
				request.post(checkUpdateOptions, function(err,res,body){
					if(err){
						createLog(logFile, "\r\n版本更新网络请求失败........"+checkUpadteUrl+"====="+new Date()+"\r\n【原因】："+err);
					}else{
						var object = JSON.parse(body);
						var data = object.fileModel;
						data.msg="";
						data.files=[];
						console.log(data);
				        if(data.syncType=='1')
				        {
				        		fileV = 1;
				           // if(parseInt(data.fileLength)>0){
					           	createLog(logFile, "\r\n检测到系统文件更新");
					           	$("#002").append(" <b> 檢測到有系統文件更新，版本號為</b>"+data.version);
					            checkUpdate.appSyncUpdatetime = data.releaseDate;
					            checkUpdate.version = data.version;
					      	    fileDownload(data, localFileZIP, 10);
								createLog(logFile, "\r\n更新系统文件描述：");
 								var checkUpdateOptions = { 
									url: checkUpadteUrl,
									headers: { 
									    'Content-Type':'application/json;charset=UTF-8'
									    	},
									    body: JSON.stringify(checkUpdate)
								};
					      	    requestCheck(checkUpdateOptions); // 继续请求
				     
				           

				        }else if(data.syncType=='0' && parseInt(data.fileLength)>0){
				           productV = 1;
				           if(productV==1 && fileV==0){
				        		$("#fileV").val("1");
				        	}
				        	
				           $("#002").append(" <b> 檢測到有產品文件更新,版本號為</b>"+data.version);
				           createLog(logFile, "\r\n检测到产品文件更新.....");
				           checkUpdate.dataSyncUpdatetime = data.releaseDate;
						   fileDownload(data,localProductZIP, 20);
						   createLog(logFile, "\r\n更新产品文件描述：");
				        }else{
				        	if(productV==0 && fileV==0){
				        		$("#productV").val("1");
				        		$("#fileV").val("1");
				        		$("#001").append(" <b>當前系統已經是最新版本</b>");
				        	}
				        	if(productV==0 && fileV==1){
				        		$("#productV").val("1");
				        	}
				        	console.log("没有版本更新");
				        	createLog(logFile, "\r\n没有版本更新..............\r\n");
				        }
				     
					}

				});

			};

			
			$("#001").append(" <b>正在進行版本更新檢測.......，當前系統版本為【"+checkUpdate.version+"</b>");
			createLog(logFile, "\r\n\r\n******************版本启动检测【开始时间】："+new Date()+"******************\r\n");
			requestCheck(checkUpdateOptions);

	    }
	});
};

//updateVersion();

