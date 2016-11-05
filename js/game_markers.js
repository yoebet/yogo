Game.Markers = function(game) {
	this.game = game;
	this.board = game.board;

	this.markCurrentMove = true;

	this.markBranchPoints = true;

	this.showMoveNumber = false;

	this.showMoveNumberCount = 10;

	this.moveNumberMod = false;

	this.hideMoveNumberTemporarily = false;
};

Game.Markers.prototype = {

	setCurrentNodeMarkers : function() {
		var board = this.board;
		board.removeAllMarkers();
		board.removeAllLabels();
		board.removeBranchPointLabels();
		var curNode = this.game.curNode;

		if (this.markCurrentMove && !this.showMoveNumber) {
			board.markCurrentMove(curNode.move.point);
		} else {
			board.markCurrentMove(null);
		}

		if (curNode.hasMarks()) {
			if (curNode.marks['LB']) {
				board.setLabels(curNode.marks['LB']);
			}
			var markerTypes = [ 'TR', 'CR', 'SQ', 'MA', 'TW', 'TB' ];
			for (var mi = 0; mi < markerTypes.length; mi++) {
				var marker = markerTypes[mi];
				if (curNode.marks[marker]) {
					this.setMarkers(curNode.marks[marker], marker, true);
				}
			}
		}
		if (this.markBranchPoints) {
			this.markBranchPointsIfAny();
		}
		this.handleMoveNumbers();
	},

	setMarkers : function(points, marker, processRange) {
		var board = this.board;
		if (processRange) {
			for (var i = 0; i < points.length; i++) {
				var point = points[i];
				if (point.coorFrom) {
					var rangePoints = yogo.evaluatePointRange(point.coorFrom,
							point.coorTo);
					board.setMarkers(rangePoints, marker);
				} else {
					board.setMarker(point, marker);
				}
			}
		} else {
			board.setMarkers(points, marker);
		}
	},

	setMarkCurrentMove : function(mark) {
		this.markCurrentMove = mark;
		if (this.markCurrentMove) {
			this.board.markCurrentMove(this.game.curNode.move.point);
		} else {
			this.board.markCurrentMove(null);
		}
	},

	setMarkBranchPoints : function(markBranchPoints) {
		this.markBranchPoints = markBranchPoints;
		if (this.markBranchPoints) {
			this.markBranchPointsIfAny();
		} else {
			this.board.removeBranchPointLabels();
		}
	},

	markBranchPointsIfAny : function() {
		var branchPoints = this.game.curNode.branchPoints;
		if (branchPoints) {
			for (var i = 0; i < branchPoints.length; i++) {
				if (i > 25) {
					continue;
				}
				var point = branchPoints[i];
				if (point.x > 51) {
					continue;
				}
				var label = String.fromCharCode(65 + i);
				this.board.setLabel(point, label, 'branch_point');
			}
		}
	},

	setShowMoveNumber : function(show) {
		if (typeof (show) === 'boolean') {
			this.showMoveNumber = show;
			if (this.showMoveNumberCount == 0) {
				this.showMoveNumberCount = 1;
			}
		} else if (typeof (show) === 'number') {
			this.moveNumberMod = false;
			this.showMoveNumberCount = show;
			this.showMoveNumber = show > 0;
		} else if (show === 'all') {
			var bz = this.board.boardSize;
			this.showMoveNumberCount = bz * bz + 100;
			this.showMoveNumber = true;
		} else if (typeof (show) === 'string') {

			if (show.charAt(0) == '%') {
				this.moveNumberMod = true;
				show = show.substr(1);
			}
			var mnc = parseInt(show);
			if (!isNaN(mnc)) {
				this.showMoveNumberCount = mnc;
				this.showMoveNumber = mnc > 0;
			}
		}
		if (this.showMoveNumber) {
			this.board.markCurrentMove(null);
		} else {
			this.board.markCurrentMove(this.game.curNode.move.point);
		}
		this.resetMoveNumbers();
	},

	resetMoveNumbers : function() {
		if (!this.showMoveNumber) {
			this.board.hideMoveNumbers();
			return;
		}

		var moveNumbers = [];
		var count = this.showMoveNumberCount;
		var mod;
		if (this.moveNumberMod) {
			mod = count;
			count = this.game.curNode.move.displayMoveNumber % mod;
			if (count == 0) {
				count = mod;
			}
		}
		var node = this.game.curNode;
		var variation = node.belongingVariation;
		var curPosition = node.position;
		for (; count > 0; count--) {
			var point = node.move.point;
			if (point) {
				var pointCurStatus = curPosition[point.x][point.y];
				if (pointCurStatus && pointCurStatus.node === node) {
					var moveNumber = node.move.displayMoveNumber;
					if (this.moveNumberMod) {
						moveNumber = moveNumber % mod;
						if (moveNumber == 0) {
							moveNumber = mod;
						}
					}
					var mn = {
						x : point.x,
						y : point.y,
						color : node.move.color,
						moveNumber : moveNumber
					};
					if (node === this.game.curNode) {
						mn.current = true;
					}
					moveNumbers.push(mn);
				}
			}
			if (!variation.realGame
					&& (node.isVariationFirstNode() && node.belongingVariation.index > 0)) {
				break;
			}
			node = node.previousNode;
			if (!node) {
				break;
			}
		}
		this.board.hideMoveNumbers();
		this.board.showMoveNumbers(moveNumbers);
	},

	hideMoveNumbers : function() {
		this.board.hideMoveNumbers();
	},

	handleMoveNumbers : function() {
		var board = this.board;
		var curNode = this.game.curNode;
		if (curNode.hasMarks()) {
			this.hideMoveNumberTemporarily = true;
			this.hideMoveNumbers();
			return;
		}
		if (this.hideMoveNumberTemporarily) {
			this.hideMoveNumberTemporarily = false;
		}

		this.resetMoveNumbers();
	}
};
