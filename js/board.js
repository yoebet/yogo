function Board(boardContainer, boardSizeOrSetting, paper) {

	this.boardContainer = boardContainer;

	if (typeof (boardContainer) === 'string') {
		this.boardContainer = document.getElementById(boardContainer);
	}
	if (paper) {
		paper.clear();
		this.paper = paper;
	} else {
		this.paper = Raphael(boardContainer);
	}

	if (typeof (boardSizeOrSetting) === 'number') {
		this.boardSize = boardSizeOrSetting;
		this.boardSetting = Board.getDefaultBoardSetting(this.boardSize);
	} else if (typeof (boardSizeOrSetting) === 'object') {
		this.boardSetting = boardSizeOrSetting;
		this.boardSize = this.boardSetting.boardSize;
	} else {
		// ...
	}

	this.pointStatusMatrix = [];
	this.lineOrStarMatrix = [];

	for (var x = 0; x < this.boardSize; x++) {
		this.pointStatusMatrix[x]=[];
	}
	if(boardSetting.labels.eraseBoardLine){
		for (var x = 0; x < this.boardSize; x++) {
			this.lineOrStarMatrix[x]=[];
			for (var y = 0; y < this.boardSize; y++) {
				this.lineOrStarMatrix[x][y]=[];
			}
		}
	}

	this.centralPoint;

	this.zoomMode = null;// TL/TR/BL/BR

	this.reversed = false;

	this.rotate90 = 0;

	this.coordinateManager = new Board.Coordinate(this);
	yogo.exportFunctions.call(this, this.coordinateManager, [ 'drawCoordinate',
			'hideCoordinate', 'showCoordinate', 'boardCoorToViewBoxCoor',
			'setXCoordinateType', 'setYCoordinateType', 'coordinateStatus',
			'setFullCoordinate' ]);

	this.stoneManager = new Board.Stone(this);
	yogo.exportFunctions.call(this, this.stoneManager, [ 'placeStone',
			'removeStone', 'addStones', 'removeStones', 'showMoveNumber',
			'showMoveNumbers', 'hideMoveNumbers', 'unmarkCurrentMoveNumber' ]);

	this.markerManager = new Board.Marker(this);
	yogo.exportFunctions.call(this, this.markerManager,
			[ 'setMarker', 'setMarkers', 'removeMarker', 'removeAllMarkers',
					'markCurrentMove' ]);

	this.labelManager = new Board.Label(this);
	yogo.exportFunctions.call(this, this.labelManager, [
			'setBranchPointOnclickHandler', 'setLabel', 'setLabels',
			'removeLabel', 'removeAllLabels', 'removeBranchPointLabels' ]);

}

Board.prototype = {

	drawBoard : function() {

		var boardSetting = this.boardSetting;
		var paper = this.paper;

		var viewBoxSize = boardSetting.viewBoxSize;

		yogo.logInfo('viewBox size:' + viewBoxSize, 'board');

		this.setViewBox();

		// paper.image("board/bambootile_warm.jpg", 0, 0, viewBoxSize,
		// viewBoxSize);//board/purty_wood.jpg

		var boardSize = boardSetting.boardSize;
		var boardOrigin = boardSetting.boardOrigin;
		var gridWidth = boardSetting.gridWidth;
		var boardOuterEdge = boardSetting.boardOuterEdge;

		var ox = boardOrigin.x, oy = boardOrigin.y;

		var boardEdgeWidth = gridWidth * (boardSize - 1) + boardOuterEdge * 2;
		var boardEdgeRect = paper.rect(ox - boardOuterEdge,
				oy - boardOuterEdge, boardEdgeWidth, boardEdgeWidth);
		boardEdgeRect.attr({
			'stroke-width' : 0
		});
		boardEdgeRect.attr({
			fill : '#DCB35C'
		});// #DCB35C,#DEC090

		if(boardSetting.labels.eraseBoardLine){
			this._drawBoardLine();
		}else{
			this._drawBoardLineSimple();
		}

		var halfBoard = gridWidth * (boardSize - 1) / 2;
		this.centralPoint = {
			x : ox + halfBoard,
			y : oy + halfBoard
		};

		this.drawCoordinate();
		this._drawBoardStars();
	},

	clearBoard : function() {
		for (var x = 0; x < this.boardSize; x++) {
			var pointStatusX=this.pointStatusMatrix[x];
			for (y in pointStatusX) {
				var pointStatus = pointStatusX[y];
				if (pointStatus.color) {
					this.removeStone(pointStatus.coor);
				}
			}
		}
		this.removeAllMarkers();
		this.removeAllLabels();
		this.markCurrentMove(null);
	},

	setViewBox : function() {
		var viewBoxSize = this.boardSetting.viewBoxSize;
		var axisWidth = this.coordinateManager.getOneAxisWidth();
		var showCoordinate = this.coordinateManager.show;
		var fullCoordinate = this.coordinateManager.fullCoordinate;
		if (showCoordinate) {
			if (fullCoordinate) {
				this.paper.setViewBox(0, 0, viewBoxSize, viewBoxSize);
			} else {
				this.paper.setViewBox(0, 0, viewBoxSize - axisWidth,
						viewBoxSize - axisWidth);
			}
		} else {
			var vbs = viewBoxSize - axisWidth;
			if (fullCoordinate) {
				this.paper.setViewBox(axisWidth, axisWidth, viewBoxSize
						- axisWidth * 2, viewBoxSize - axisWidth * 2);
			} else {
				this.paper.setViewBox(axisWidth, axisWidth, viewBoxSize
						- axisWidth, viewBoxSize - axisWidth);
			}
		}
	},

	zoomBoard : function(zoomMode) {
		this.zoomMode = zoomMode;
		var viewBoxSize = this.boardSetting.viewBoxSize;
		var axisWidth = this.coordinateManager.getOneAxisWidth();
		var showCoordinate = this.coordinateManager.show;
		var fullCoordinate = this.coordinateManager.fullCoordinate;

		if ('TL TR BL BR'.indexOf(zoomMode) < 0) {
			this.setViewBox();
			return;
		}

		var cf = 0, ct = viewBoxSize;
		if (!fullCoordinate) {
			ct -= axisWidth;
		}
		if (!showCoordinate) {
			cf = axisWidth;
			if (fullCoordinate) {
				ct -= axisWidth;
			}
		}
		var gridWidth = this.boardSetting.gridWidth;
		var size = (ct - cf + gridWidth) / 2;

		if (zoomMode === 'TL') {
			this.paper.setViewBox(cf, cf, size, size);
		} else if (zoomMode === 'TR') {
			this.paper.setViewBox(ct - size, cf, size, size);
		} else if (zoomMode === 'BL') {
			this.paper.setViewBox(cf, ct - size, size, size);
		} else if (zoomMode === 'BR') {
			this.paper.setViewBox(ct - size, ct - size, size, size);
		}
	},

	resize : function() {
		var width = this.boardContainer.offsetWidth;
		this.paper.setSize(width, width);
	},

	flipHorizontal : function() {
		this.reversed = !this.reversed;
		var r = (this.rotate90 % 2 === 0) ? 1 : 3;
		this.rotate90 = (this.rotate90 + r) % 4;
		this._transform();
	},

	flipVertical : function() {
		this.reversed = !this.reversed;
		var r = (this.rotate90 % 2 === 0) ? 3 : 1;
		this.rotate90 = (this.rotate90 + r) % 4;
		this._transform();
	},

	rotateRight : function() {
		this.rotate90 = (this.rotate90 + 1) % 4;
		this._transform();
	},

	rotateLeft : function() {
		this.rotate90 = (this.rotate90 + 3) % 4;
		this._transform();
	},

	rotate180 : function() {
		this.rotate90 = (this.rotate90 + 2) % 4;
		this._transform();
	},

	resetPerspective : function() {
		this.reversed = false;
		this.rotate90 = 0;
		this._transform();
	},

	_transform : function() {
		var deg = this.rotate90 * 90;
		var reversed = this.reversed;

		this.paper.forEach(function(elem) {
			if (elem.data('boardElement') === true) {
				var onCoordinateChange = elem.data('onCoordinateChange');
				if (typeof (onCoordinateChange) === 'function') {
					// stone,label,coordinate,moveNumber,marker
					onCoordinateChange.call(elem);
					return;
				}
				
				yogo.logWarn('do transform', '_transform');

				var tr = '';
				var rotateX = this.centralPoint.x;
				var rotateY = this.centralPoint.y;
				if (reversed) {
					var x = elem.attr('x'), y = elem.attr('y');
					if (x) {
						var dx = y - x, dy = x - y;
						tr += 't' + dx + ',' + dy;
						rotateX -= dx;
						rotateY -= dy;
					} else {
						yogo.logWarn('element no x attribute', '_transform');
					}
				}
				if (deg > 0) {
					tr += 'r' + deg + ',' + rotateX + ',' + rotateY + 'r-'
							+ deg;
				}

				elem.transform(tr);
			}
		}, this);

	}

};