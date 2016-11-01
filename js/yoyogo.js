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
	
	diffPosition : function(fromPosition, toPosition) {

		var stonesToRemove = [];
		var stonesToAddW = [];
		var stonesToAddB = [];
		var boardSize = fromPosition.length;
		for (var x = 0; x < boardSize; x++) {
			var fx = fromPosition[x];
			var tx = toPosition[x];
			if (fx === tx) {
				continue;
			}
			for (var y = 0; y < boardSize; y++) {
				var fromStatus = fx[y];
				var toStatus = tx[y];
				if (fromStatus === toStatus || (!fromStatus && !toStatus)) {
					continue;
				}
				var toRemove = false, toAdd = false;
				if (!toStatus) {
					toRemove = true;
				} else if (!fromStatus) {
					toAdd = true;
				} else if (fromStatus.color != toStatus.color) {
					toRemove = true;
					toAdd = true;
				}
				var point = {
					x : x,
					y : y
				};
				if (toRemove) {
					stonesToRemove.push(point);
				}
				if (toAdd) {
					if (toStatus.color == 'B') {
						stonesToAddB.push(point);
					} else {
						stonesToAddW.push(point);
					}
				}
			}
		}
		return {
			stonesToRemove : stonesToRemove,
			stonesToAddB : stonesToAddB,
			stonesToAddW : stonesToAddW
		};
	}
};
