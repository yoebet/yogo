Board.Coordinate = function(board) {
	this.board = board;
	this.boardSize = board.boardSize;
	this.boardSetting = board.boardSetting;
	this.paper = board.paper;
	this.setting = this.boardSetting.coordinate;

	this.coordinateLabels = [];
	this.coordinateShowed = false;
}

Board.Coordinate.prototype = {

	generateCoordinateLabel : function(coor, type) {
		var label = '' + (coor + 1);
		if (type === 'a' || type === 'A') {
			if (coor >= 26) {
				label = String.fromCharCode(65 + (coor - 26));
			} else if (type === 'a') {
				label = String.fromCharCode(97 + coor);
			} else if (type === 'A') {
				label = String.fromCharCode(65 + coor);
			}
		}
		return label;
	},

	drawCoordinate : function() {
		var gridWidth = this.boardSetting.gridWidth;
		var boardOrigin = this.boardSetting.boardOrigin;
		for (var coor = 0; coor < this.boardSize; coor++) {
			var xx = boardOrigin.x + gridWidth * coor;
			var xlabel = this
					.generateCoordinateLabel(coor, this.setting.x.type);
			var xlabelElement = this.paper.text(xx, this.setting.x.basey,
					xlabel).attr({
				'font-size' : this.setting.fontSize
			});
			this.coordinateLabels.push(xlabelElement);

			var yy = boardOrigin.y + gridWidth * coor;
			var ylabel = this
					.generateCoordinateLabel(coor, this.setting.y.type);
			var ylabelElement = this.paper.text(this.setting.y.basex, yy,
					ylabel).attr({
				'font-size' : this.setting.fontSize
			});
			this.coordinateLabels.push(ylabelElement);
		}
		this.coordinateShowed = true;
	},

	hideCoordinate : function() {
		if (!this.coordinateShowed) {
			return;
		}
		for (var i = 0; i < this.coordinateLabels.length; i++) {
			var coordinateLabel = this.coordinateLabels[i];
			coordinateLabel.hide();
		}
		this.coordinateShowed = false;

		var coorTotalWidth = this.setting.coordinatePadding
				+ this.setting.coordinateWidth;
		var viewBoxSize = this.boardSetting.viewBoxSize;
		this.paper.setViewBox(coorTotalWidth, coorTotalWidth, viewBoxSize
				- coorTotalWidth, viewBoxSize - coorTotalWidth);
	},

	showCoordinate : function() {
		if (this.coordinateShowed) {
			return;
		}
		var viewBoxSize = this.boardSetting.viewBoxSize;
		this.paper.setViewBox(0, 0, viewBoxSize, viewBoxSize);
		for (var i = 0; i < this.coordinateLabels.length; i++) {
			var coordinateLabel = this.coordinateLabels[i];
			coordinateLabel.show();
		}
		this.coordinateShowed = true;
	},

	coordinateStatus : function() {
		return this.coordinateShowed;
	},

	boardCoorToViewBoxCoor : function(coor) {
		var boardOrigin = this.boardSetting.boardOrigin;
		var gridWidth = this.boardSetting.gridWidth;
		var x = boardOrigin.x + gridWidth * coor.x;
		var y = boardOrigin.y + gridWidth * coor.y;
		return {
			x : x,
			y : y
		};
	}
};
