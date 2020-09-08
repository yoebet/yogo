let util = {
	_uid : 1024,
	nextuid : function() {
		util._uid++;
		return util._uid;
	},

	log : function(msg, category, level) {
		var func = console[level];
		if (!func)
			func = console['log'];
		if (func instanceof Function) {
			if (!category)
				category = 'util';
			try {
				func.call(console, category + ':', msg);
			} catch (e) {
				console.log(e);
			}
		}
	},

	logInfo : function(msg, category) {
		util.log(msg, category, 'info');
	},

	logWarn : function(msg, category) {
		util.log(msg, category, 'warn');
	},

	logError : function(msg, category) {
		util.log(msg, category, 'error');
	},

	exportFunctions : function(obj, funcNames) {
		for (let i = 0; i < funcNames.length; i++) {
			var funcName = funcNames[i];
			var func = obj[funcName];
			if (typeof (func) !== 'function') {
				util.logWarn(funcName + ' is not a function');
				continue;
			}
			this[funcName] = func.bind(obj);
		}
	},

	evaluatePointRange : function(coorFrom, coorTo) {
		var rangePoints = [];
		var fromX = coorFrom.x, toX = coorTo.x;
		var fromY = coorFrom.y, toY = coorTo.y;
		for (let x = fromX; x <= toX; x++) {
			for (let y = fromY; y <= toY; y++) {
				rangePoints.push({x,y});
			}
		}
		return rangePoints;
	}

};

module.exports=util;
