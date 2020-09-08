let util=require("../util");

class PositionBuilder {

	constructor(board, gameModel, node, buildPositionOnly) {
		this.board = board;
		this.gameModel = gameModel;
		this.boardSize = gameModel.boardSize;
		this.curNode = node;
		this.buildPositionOnly = buildPositionOnly || false;

		this.basePosition = null;
		this.position = [];
	}

	getPointColor(x, y) {
		var status = (this.position[x] || this.basePosition[x])[y];
		if (status) {
			return status.color;
		}
		return null;
	}

	setPointColor(x, y, color) {
		var status = null;
		if (color) {
			status = {
				color : color,
				node : this.curNode
			};
		}
		if (this.position[x]) {
			this.position[x][y] = status;
			return;
		}
		this.position[x] = [];
		for (let yi = 0; yi < this.basePosition[x].length; yi++) {
			this.position[x][yi] = this.basePosition[x][yi];
		}
		this.position[x][y] = status;
	}

	getFinalPosition() {
		for (let x = 0; x < this.boardSize; x++) {
			if (!this.position[x]) {
				this.position[x] = this.basePosition[x];
			}
		}
		return this.position;
	}

	setPointsStatus(points, color) {
		for (let i = 0; i < points.length; i++) {
			var point = points[i];
			this.setPointColor(point.x, point.y, color);
		}
	}

	getAdjacentPointsStatus(point) {
		var adjacentPoints = [ {
			x : point.x - 1,
			y : point.y
		}, {
			x : point.x,
			y : point.y - 1
		}, {
			x : point.x + 1,
			y : point.y
		}, {
			x : point.x,
			y : point.y + 1
		} ];
		var boardSize = this.boardSize;
		for (let direction = 0; direction < 4; direction++) {
			var adjacentPoint = adjacentPoints[direction];
			var x = adjacentPoint.x, y = adjacentPoint.y;
			if (x >= 0 && y >= 0 && x < boardSize && y < boardSize) {
				adjacentPoint.color = this.getPointColor(x, y);
			} else {
				adjacentPoints[direction] = null;
			}
		}
		return adjacentPoints;
	}

	traverseGroup(startPoint, color, callback) {

		var checkedPoints = {};

		var builder = this;
		function doTraverseGroup(point, comingDirection) {
			var key = 'x' + point.x + 'y' + point.y;
			if (checkedPoints[key]) {
				return;
			}
			var pointsStatus = builder.getAdjacentPointsStatus(point);

			var result = callback(point, pointsStatus);
			if (result === false) {
				return false;
			}

			checkedPoints[key] = true;

			for (let direction = 0; direction < 4; direction++) {
				var pointStatus = pointsStatus[direction];
				if (pointStatus == null) {
					continue;
				}
				if (pointStatus.color == color && comingDirection !== direction) {
					var oppositeDirection = (comingDirection + 2) % 4;
					var result = doTraverseGroup(pointStatus, oppositeDirection);
					if (result === false) {
						return false;
					}
				}
			}
		}

		return doTraverseGroup(startPoint);
	}

	checkGroupLiberties(startPoint, color) {

		var groupPoints = [];
		var callback = function(point, adjacentPointsStatus) {
			groupPoints.push(point);
			for (let direction = 0; direction < 4; direction++) {
				var pointStatus = adjacentPointsStatus[direction];
				if (pointStatus == null) {
					continue;
				}
				if (pointStatus.color == null) {
					return false;
				}
			}
		}

		var result = this.traverseGroup(startPoint, color, callback);
		if (result === false) {
			return {
				hasLiberty : true
			};
		} else {
			return {
				hasLiberty : false,
				groupPoints : groupPoints
			};
		}
	}

	removeStones(points, processRange) {
		if (processRange) {
			for (let i = 0; i < points.length; i++) {
				var point = points[i];
				if (point.coorFrom) {
					var rangePoints = util.evaluatePointRange(point.coorFrom,
							point.coorTo);
					this.removeStones(rangePoints, false);
				} else {
					this.setPointColor(x, y, null);
					if (!this.buildPositionOnly) {
						this.board.removeStone(point);
					}
				}
			}
		} else {
			this.setPointsStatus(points, null);
			if (!this.buildPositionOnly) {
				this.board.removeStones(points);
			}
		}
	}

	addStones(points, color, processRange) {
		if (processRange) {
			for (let i = 0; i < points.length; i++) {
				var point = points[i];
				if (point.coorFrom) {
					var rangePoints = util.evaluatePointRange(point.coorFrom,
							point.coorTo);
					this.addStones(rangePoints, color, false);
				} else {
					this.setPointColor(point.x, point.y, color);
					if (!this.buildPositionOnly) {
						this.board.placeStone(point, color);
					}
				}
			}
		} else {
			this.setPointsStatus(points, color);
			if (!this.buildPositionOnly) {
				this.board.addStones(points, color);
			}
		}
	}

	checkOpponentLiberties(point, opponentColor) {
		var capturedStones = [];
		var adjacentPointsStatus = this.getAdjacentPointsStatus(point);
		for (let direction = 0; direction < 4; direction++) {
			var pointStatus = adjacentPointsStatus[direction];
			if (!pointStatus) {
				continue;
			}
			if (pointStatus.color == opponentColor) {
				var libertyStatus = this.checkGroupLiberties(pointStatus,
						pointStatus.color);
				if (!libertyStatus.hasLiberty) {
					var groupPoints = libertyStatus.groupPoints;
					this.removeStones(groupPoints, false);
					capturedStones = capturedStones.concat(groupPoints);
				}
			}
		}

		return capturedStones;
	}

	evaluateMove() {
		var curNode = this.curNode;
		var color = curNode.move.color;
		var point = curNode.move.point;

		var pointColor = this.getPointColor(point.x, point.y);
		if (pointColor) {
			util.logWarn('point occupied: (' + point.x + ',' + point.y + ','
					+ color + ')', 'play move');
			return false;
		}

		if (!this.buildPositionOnly) {
			this.board.placeStone(point, color);
		}
		this.setPointColor(point.x, point.y, color);

		var opponentColor = (color == 'B') ? 'W' : 'B';
		var capturedStones = this.checkOpponentLiberties(point, opponentColor);

		if (capturedStones.length > 0) {
			if (capturedStones.length == 1) {
				var capturedStone = capturedStones[0];
				var previousNode = curNode.previousNode;
				if (previousNode && previousNode.status.capture
						&& previousNode.move.capturedStones.length == 1) {
					var pcs = previousNode.move.capturedStones[0];
					var pmove = previousNode.move[opponentColor];
					if (pmove && capturedStone.x == pmove.x
							&& capturedStone.y == pmove.y && point.x == pcs.x
							&& point.y == pcs.y) {
						util.logWarn('ko, cann\'t recapture immediately: ('
								+ point.x + ',' + point.y + ',' + color + ')',
								'play move');
						if (!previousNode.status.ko) {
							previousNode.status.startKo = true;
						}
						return false;
					}
				} else {
					// find ko
				}
				if (previousNode && previousNode.previousNode
						&& previousNode.previousNode.previousNode) {
					var ppp = previousNode.previousNode.previousNode;
					if (ppp.status.capture
							&& ppp.move.capturedStones.length == 1) {
						var pppcs = ppp.move.capturedStones[0];
						var pppmove = ppp.move[opponentColor];
						if (pppmove && capturedStone.x == pppmove.x
								&& capturedStone.y == pppmove.y
								&& point.x == pppcs.x && point.y == pppcs.y) {
							curNode.status.ko = true;
							if (!ppp.status.ko) {
								if (curNode.belongingVariation.realGame === ppp.belongingVariation.realGame) {
									ppp.status.startKo = true;
								}
							}
							// util.logInfo('ko: (' + point.x + ',' + point.y
							// + ',' + color + ')', 'play move');
						}
					}
				}
			}
			// if(capturedStones.length>0){
			// util.logInfo('('+point.x+','+point.y+') capture '+opponentColor+'
			// '+capturedStones.length+' stone(s)','play move');
			// }

			curNode.status.capture = true;
			curNode.move.capturedStones = capturedStones;
			var ac = curNode.move.accumulatedCaptures;
			ac = {
				B : ac.B,
				W : ac.W
			};
			ac[color] = ac[color] + capturedStones.length;
			curNode.move.accumulatedCaptures = ac;
		} else {
			var libertyStatus = this.checkGroupLiberties(point, color);
			if (!libertyStatus.hasLiberty) {
				util.logWarn('is self capture? (' + point.x + ',' + point.y
						+ ',' + color + ')', 'play move');
				this.setPointColor(point.x, point.y, null);
				if (!this.buildPositionOnly) {
					this.board.removeStone(point);
				}
				return false;
			}
		}

		return true;
	}

	buildPosition() {
		var success = true;
		var curNode = this.curNode;
		if (curNode.status.positionEvaluated) {
			return success;
		}
		var previousNode = curNode.previousNode;
		if (previousNode) {
			if (!previousNode.status.positionBuilt) {
				var positionBuilder = new PositionBuilder(this.board, this.gameModel,
						previousNode);
				positionBuilder.buildPosition();
			}
			this.basePosition = previousNode.position;
			curNode.move.accumulatedCaptures = previousNode.move.accumulatedCaptures;
		} else {
			this.basePosition = [];
			for (let x = 0; x < this.boardSize; x++) {
				this.basePosition[x] = [];
			}
			curNode.move.accumulatedCaptures = {
				B : 0,
				W : 0
			};
		}
		if (curNode.status.move) {
			success = this.evaluateMove();
		}
		if (curNode.isSetup()) {
			if (curNode.setup['AB']) {
				this.addStones(curNode.setup['AB'], 'B', true);
			}
			if (curNode.setup['AW']) {
				this.addStones(curNode.setup['AW'], 'W', true);
			}
			if (curNode.setup['AE']) {
				var aeRemovedStones = curNode.setup.aeRemovedStones = [];
				var points = curNode.setup['AE'];
				var doAERemove = function(point) {
					var color = this.getPointColor(point.x, point.y);
					if (color) {
						aeRemovedStones.push({
							x : point.x,
							y : point.y,
							color : color
						});
						this.setPointColor(point.x, point.y, null);
						if (!this.buildPositionOnly) {
							this.board.removeStone(point);
						}
					}
				}.bind(this);
				for (let pi = 0; pi < points.length; pi++) {
					var point = points[pi];
					if (point.coorFrom) {
						var rangePoints = util.evaluatePointRange(
								point.coorFrom, point.coorTo);
						for (let ri = 0; ri < rangePoints.length; ri++) {
							doAERemove.call(this, rangePoints[ri]);
						}
					} else {
						doAERemove.call(this, point);
					}
				}
			}
		}
		curNode.position = this.getFinalPosition();
		curNode.status.positionBuilt = true;
		return success;
	}

	static amendAddStone(game, node, point, color) {

		var position = node.position;
		var x = point.x, y = point.y;
		if (position[x][y]) {
			util.logWarn('the point is not empty', 'amend');
			return;
		}

		var positionX = position[x];
		var newPositionX = [];
		for (let yi = 0; yi < positionX.length; yi++) {
			newPositionX[yi] = positionX[yi];
		}
		newPositionX[y] = {
			color : color,
			node : node
		};
		position[x] = newPositionX;

		var board = game.board;
		board.placeStone(point, color);
	}

	static amendRemoveStone(game, node, point) {

		var position = node.position;
		point = point || node.move.point;
		var x = point.x, y = point.y;
		if (!position[x][y]) {
			util.logWarn('the point is empty', 'amend');
			return;
		}

		var positionX = position[x];
		var newPositionX = [];
		for (let yi = 0; yi < positionX.length; yi++) {
			newPositionX[yi] = positionX[yi];
		}
		newPositionX[y] = null;
		position[x] = newPositionX;

		var board = game.board;
		board.removeStone(point);
	}
}


module.exports=PositionBuilder;
