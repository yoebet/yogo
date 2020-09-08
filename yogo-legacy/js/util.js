yogo = {
	_uid : 1024,
	nextuid : function() {
		yogo._uid++;
		return yogo._uid;
	},

	log : function(msg, category, level) {
		if (!window.console)
			return;
		var func = window.console[level];
		if (!func)
			func = window.console['log'];
		if (func instanceof Function) {
			if (!category)
				category = 'yogo';
			try {
				func.call(window.console, category + ':', msg);
			} catch (e) {
			}
		}
	},

	logInfo : function(msg, category) {
		yogo.log(msg, category, 'info');
	},

	logWarn : function(msg, category) {
		yogo.log(msg, category, 'warn');
	},

	logError : function(msg, category) {
		yogo.log(msg, category, 'error');
	},

	exportFunctions : function(obj, funcNames) {
		for (var i = 0; i < funcNames.length; i++) {
			var funcName = funcNames[i];
			var func = obj[funcName];
			if (typeof (func) !== 'function') {
				yogo.logWarn(funcName + ' is not a function');
				continue;
			}
			this[funcName] = func.bind(obj);
		}
	},

	evaluatePointRange : function(coorFrom, coorTo) {
		var rangePoints = [];
		var fromX = coorFrom.x, toX = coorTo.x;
		var fromY = coorFrom.y, toY = coorTo.y;
		for (var x = fromX; x <= toX; x++) {
			for (var y = fromY; y <= toY; y++) {
				rangePoints.push({
					x : x,
					y : y
				});
			}
		}
		return rangePoints;
	},

	findPoint : function(coorArray, coor) {
		for (var i = 0; i < coorArray.length; i++) {
			var c = coorArray[i];
			if (c.x === coor.x && c.y === coor.y) {
				return i;
			}
		}
		return -1;
	},

	removePoint : function(coorArray, coor) {
		if (!coorArray) {
			return false;
		}
		var index = yogo.findPoint(coorArray, coor);
		if (index >= 0) {
			coorArray.splice(index, 1);
			return true;
		}
		return false;
	}

};
