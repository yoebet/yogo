Board.getDefaultBoardSetting = function(boardSize) {
	if (isNaN(boardSize) || boardSize < 5 || boardSize > 51) {
		yogo.logError('wrong board size: ' + boardSize, 'board');
	}

	var gridWidth = 20;
	var boardPadding = 2;
	var boardOuterEdge = 12;
	var coordinateWidth = 12;
	var coordinatePadding = 1;

	var coorTotalWidth = coordinateWidth + coordinatePadding;
	var totalOuterWidth = boardOuterEdge * 2 + boardPadding * 2
			+ coorTotalWidth * 2;
	var viewBoxSize = gridWidth * (boardSize - 1) + totalOuterWidth;// 414

	if (boardSize != 19) {
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

	var boardOriginX = boardPadding + coordinateWidth + boardOuterEdge
			+ coordinatePadding;
	var boardOrigin = {
		x : boardOriginX,
		y : boardOriginX
	};
	var coordinate = {
		xType : 'A', // a/A/1/...
		yType : '1',
		show : true,
		fullCoordinate : true,
		fontSize : gridWidth / 2,
		coordinatePadding : coordinatePadding,
		coordinateWidth : coordinateWidth,
		baseCoor : boardPadding + coordinateWidth / 2
	};
	var strokes = {
		outerBorderLine : gridWidth * 0.035,
		borderLine : gridWidth * 0.025,
		star : gridWidth * 0.045,
		stone : gridWidth * 0.02,
		stoneSpacing : gridWidth * 0.01
	};
	var labels = {
		fontSize : gridWidth / 2 + 3,
		eraseBoardLine : true,
		eraseRadius : gridWidth * 0.3
	};
	var moveNumbers = {
		fontSize : gridWidth / 2 + 1
	};

	var starPoints = [];

	if (boardSize % 2 == 1) {
		starPoints.push({
			x : (boardSize - 1) / 2,
			y : (boardSize - 1) / 2
		});
	}
	if (boardSize >= 13) {
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
	if (boardSize >= 11) {
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
	} else if (boardSize == 8 || boardSize == 9) {
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

	return {
		viewBoxSize : viewBoxSize,
		boardSize : boardSize,
		starPoints : starPoints,
		boardOrigin : boardOrigin,
		gridWidth : gridWidth,
		boardOuterEdge : boardOuterEdge,
		strokes : strokes,
		labels : labels,
		coordinate : coordinate,
		moveNumbers : moveNumbers
	}
};
