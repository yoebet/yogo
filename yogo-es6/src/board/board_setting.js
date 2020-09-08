let util=require("../util");

class BoardSetting {

	constructor(boardSize) {
		if (isNaN(boardSize) || boardSize < 5 || boardSize > 25) {
			util.logError('wrong board size: ' + boardSize, 'board');
		}

		// boardSize,
		// viewBoxSize,
		// starPoints,
		// boardOrigin,
		
		// gridWidth,
		// boardOuterEdge,
		// coordinatePadding,
		// coordinateWidth,
		// boardPadding,

		// strokes,
		// labels,
		// coordinate,
		// moveNumbers

		this.boardSize=boardSize;
		this._setupViewSize();
		this._evaluateAll();
	}

	_evaluateAll(){
		this._evaluateOrigin();
		this._evaluateCoordinate();
		this._evaluateStrokes();
		this._evaluateLabels();
		this._evaluateMoveNumbers();
		this._evaluateStartPoints();
	}

	_setupViewSize(){

		var gridWidth = 20;
		var boardPadding = 2;
		var boardOuterEdge = 12;
		var coordinateWidth = 12;
		var coordinatePadding = 1;

		var coorTotalWidth = coordinateWidth + coordinatePadding;
		var totalOuterWidth = boardOuterEdge * 2 + boardPadding * 2
				+ coorTotalWidth * 2;
		var viewBoxSize = gridWidth * (this.boardSize - 1) + totalOuterWidth;// 414

		if (this.boardSize != 19) {
			var viewBoxSize19 = gridWidth * 18 + totalOuterWidth;
			// normalize
			var mul = viewBoxSize / viewBoxSize19;
			viewBoxSize = viewBoxSize19;
			gridWidth = gridWidth / mul;
			boardPadding = boardPadding / mul;
			coordinatePadding = coordinatePadding / mul;
			boardOuterEdge = boardOuterEdge / mul;
			coordinateWidth = coordinateWidth / mul;
		}

		this.gridWidth=gridWidth;
		this.viewBoxSize=viewBoxSize;
		this.boardOuterEdge=boardOuterEdge;
		this.coordinatePadding=coordinatePadding;
		this.coordinateWidth=coordinateWidth;
		this.boardPadding=boardPadding;
	}

	_evaluateOrigin(){

		var boardOriginX = this.boardPadding + this.coordinateWidth
				 + this.boardOuterEdge + this.coordinatePadding;
		this.boardOrigin = {
			x : boardOriginX,
			y : boardOriginX
		};
	}


	_evaluateCoordinate(){

		this.coordinate = {
			xType : 'A', // a/A/1/...
			yType : '1',
			show : true,
			fullCoordinate : true,
			fontSize : this.gridWidth / 2,
			coordinatePadding : this.coordinatePadding,
			coordinateWidth : this.coordinateWidth,
			baseCoor : this.boardPadding + this.coordinateWidth / 2
		};
	}

	_evaluateStrokes(){
		let gridWidth=this.gridWidth;
		this.strokes = {
			outerBorderLine : gridWidth * 0.03,
			borderLine : gridWidth * (this.boardSize <= 15? 0.018 : 0.025),
			star : gridWidth * 0.045,
			stone : gridWidth * 0.02,
			stoneSpacing : gridWidth * 0.01
		};
	}

	_evaluateLabels(){
		let gridWidth=this.gridWidth;
		this.labels = {
			fontSize : gridWidth / 2 + 3,
			eraseBoardLine : true,
			eraseRadius : gridWidth * 0.3
		};
	}

	_evaluateMoveNumbers(){
		let gridWidth=this.gridWidth;
		this.moveNumbers = {
			fontSize : gridWidth / 2 + 1
		};
	}


	_evaluateStartPoints(){

		let starPoints=this.starPoints = [];
		let boardSize=this.boardSize;

		if (boardSize % 2 == 1) {
			starPoints.push({
				x : (boardSize - 1) / 2,
				y : (boardSize - 1) / 2
			});
		}
		if (boardSize >= 15) {
			starPoints.push({
				x : 3,
				y : (boardSize - 1) / 2
			});
			starPoints.push({
				x : boardSize - 4,
				y : (boardSize - 1) / 2
			});
			starPoints.push({
				x : (boardSize - 1) / 2,
				y : 3
			});
			starPoints.push({
				x : (boardSize - 1) / 2,
				y : boardSize - 4
			});
		}
		if (boardSize > 11) {
			starPoints.push({
				x : 3,
				y : 3
			});
			starPoints.push({
				x : 3,
				y : boardSize - 4
			});
			starPoints.push({
				x : boardSize - 4,
				y : 3
			});
			starPoints.push({
				x : boardSize - 4,
				y : boardSize - 4
			});
		} else if (boardSize >= 8 && boardSize <= 11) {
			starPoints.push({
				x : 2,
				y : 2
			});
			starPoints.push({
				x : 2,
				y : boardSize - 3
			});
			starPoints.push({
				x : boardSize - 3,
				y : 2
			});
			starPoints.push({
				x : boardSize - 3,
				y : boardSize - 3
			});
		}
	}

}

module.exports=BoardSetting;
