yogo={};

yogo.log=function(msg,category,level){
	if(!window.console)return;
	var func=window.console[level];
	if(!func)func=window.console['log'];
	if(func instanceof Function){
		if(!category)category='yogo';
		try{func.call(window.console,category+':',msg);}catch(e){}
	}
}

yogo.logInfo=function(msg,category){
	yogo.log(msg,category,'info');
}

yogo.logWarn=function(msg,category){
	yogo.log(msg,category,'warn');
}

yogo.logError=function(msg,category){
	yogo.log(msg,category,'error');
}
