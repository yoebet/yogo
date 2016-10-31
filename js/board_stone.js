Board.Stone = function(board) {
	this.board = board;
	this.boardSize = board.boardSize;
	this.boardSetting = board.boardSetting;
	this.paper = board.paper;
	this.pointStatusMatrix = board.pointStatusMatrix;
	this.coordinateManager = board.coordinateManager;

	this.stoneTemplates = this.setupStoneTemplates();
	this.moveNumberElements = [];
	this.currentMoveNumberElement = null;

	var theBoard=this.board;
	this.stoneClickHandler=function(e){
		theBoard.pointClickHandler(this.data('coor'),'stone');
	};
	this.moveNumberClickHandler=function(e){
		theBoard.pointClickHandler(this.data('coor'),'moveNumber');
	};
}

Board.Stone.prototype = {

	setupStoneTemplates : function() {
		var gridWidth = this.boardSetting.gridWidth;
		var strokes = this.boardSetting.strokes;
		var stoneRadius = gridWidth / 2 - strokes.stoneSpacing;
		var invisiblePoint = {
			x : -this.boardSetting.gridWidth,
			y : -this.boardSetting.gridWidth
		};

		var blackStone = this.paper.circle(invisiblePoint.x, invisiblePoint.y,
				stoneRadius).attr({
			'stroke-width' : strokes.stone,
			fill : 'black'
		});
		return {
			blackStone : blackStone,
			whiteStone : blackStone.clone().attr({
				fill : 'white',
				stroke : '#666'
			})
		};
	},

	placeStone : function(coor, color) {
		if (color != 'B' && color != 'W') {
			yogo.logWarn('wrong color:' + color, 'place stone');
			return;
		}

		var pointStatus = this.pointStatusMatrix[coor.x][coor.y];
		if (pointStatus && pointStatus.color) {
			yogo.logWarn('point occupied: (' + coor.x + ',' + coor.y
					+ ',color:' + pointStatus.color + ')', 'place stone');
			if (color == pointStatus.color) {
				return;
			}
			var altColor = (color == 'B') ? 'W' : 'B';
			var altColorStone = pointStatus['stone' + altColor];
			if (altColorStone) {
				altColorStone.hide();
			}
		}
		if (!pointStatus) {
			pointStatus = {
				coor : coor
			};
		}
		pointStatus.color = color;

		var thisColorStone = pointStatus['stone' + color];
		if (thisColorStone) {
			thisColorStone.show();
			return;
		}

		var stone = (color == 'B') ? this.stoneTemplates.blackStone
				: this.stoneTemplates.whiteStone;
		thisColorStone = stone.clone();
		var vbCoor = this.coordinateManager.boardCoorToViewBoxCoor(coor);
		thisColorStone.attr({
			cx : vbCoor.x,
			cy : vbCoor.y
		});
		pointStatus['stone' + color] = thisColorStone;
		this.pointStatusMatrix[coor.x][coor.y] = pointStatus;

		thisColorStone
				.data({
					type : 'stone',
					boardElement : true,
					coor : {
						x : coor.x,
						y : coor.y
					},
					onCoordinateChange : this.coordinateManager.onCircleCoordinateChange
				});

		thisColorStone.click(this.stoneClickHandler);
	},

	removeStone : function(coor) {
		var pointStatus = this.pointStatusMatrix[coor.x][coor.y];
		if (!pointStatus) {
			yogo.logWarn('point empty: (' + coor.x + ',' + coor.y + ')',
					'remove stone');
			return;
		}
		var stone = pointStatus['stone' + pointStatus.color];
		if (stone) {
			stone.hide();
			if (pointStatus.moveNumberElement) {
				pointStatus.moveNumberElement.hide();
				pointStatus.moveNumberElement = null;
			}
		} else {
			yogo.logWarn('stone not exist: (' + coor.x + ',' + coor.y + ')',
					'remove stone');
		}
		pointStatus.color = null;
	},

	addStones : function(coors, color) {
		for (var i = 0; i < coors.length; i++) {
			var coor = coors[i];
			this.placeStone(coor, color);
		}
	},

	removeStones : function(coors) {
		for (var i = 0; i < coors.length; i++) {
			this.removeStone(coors[i]);
		}
	},

	showMoveNumber : function(mn) {
		var pointStatus = this.pointStatusMatrix[mn.x][mn.y];
		if (!pointStatus || !pointStatus.color) {
			yogo.logWarn('point empty: (' + mn.x + ',' + mn.y + ')',
					'show move number');
		}
		if (pointStatus.color != mn.color) {
			yogo.logWarn('wrong color: (' + mn.x + ',' + mn.y + ')',
					'show move number');
		}

		var currentMoveNumberColor = 'red';

		var moveNumber = mn.moveNumber;
		var stone = pointStatus['stone' + pointStatus.color];
		var mnElement = stone.data('mn_' + moveNumber);
		if (mnElement) {
			if (mn.current) {
				this.unmarkCurrentMoveNumber();
				mnElement.attr({
					fill : currentMoveNumberColor
				});
				this.currentMoveNumberElement = mnElement;
			}
			mnElement.show();
			this.moveNumberElements.push(mnElement);
			return;
		}

		var mnColor = 'black';
		if (pointStatus.color == 'B') {
			mnColor = 'white';
		}
		var oriColor = mnColor;
		if (mn.current) {
			mnColor = currentMoveNumberColor;
		}
		var mnSetting = this.boardSetting.moveNumbers;
		var fontSize = mnSetting.fontSize;
		if (moveNumber > 9) {
			fontSize -= 1;
		} else if (moveNumber > 99) {
			fontSize -= 2;
		}
		var vbCoor = this.coordinateManager.boardCoorToViewBoxCoor(mn);
		mnElement = this.paper.text(vbCoor.x, vbCoor.y, moveNumber).attr({
			'font-size' : fontSize,
			fill : mnColor
		});
		mnElement.data({
			type : 'moveNumber',
			oriColor : oriColor,
			boardElement : true,
			coor : {
				x : mn.x,
				y : mn.y
			},
			onCoordinateChange : this.coordinateManager.onLabelCoordinateChange
		});
		stone.data('mn_' + moveNumber, mnElement);
		pointStatus.moveNumberElement = mnElement;
		this.moveNumberElements.push(mnElement);
		if (mn.current) {
			this.unmarkCurrentMoveNumber();
			this.currentMoveNumberElement = mnElement;
		}

		mnElement.click(this.moveNumberClickHandler);
	},

	unmarkCurrentMoveNumber : function() {
		if (this.currentMoveNumberElement) {
			var oriColor = this.currentMoveNumberElement.data('oriColor');
			this.currentMoveNumberElement.attr({
				fill : oriColor
			});
			this.currentMoveNumberElement = null;
		}
	},

	showMoveNumbers : function(moveNumbers) {
		for (var i = 0; i < moveNumbers.length; i++) {
			this.showMoveNumber(moveNumbers[i]);
		}
	},

	hideMoveNumbers : function() {
		while (this.moveNumberElements.length > 0) {
			this.moveNumberElements.pop().hide();
		}
	}

};