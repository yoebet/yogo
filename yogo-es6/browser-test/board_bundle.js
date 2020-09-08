(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

let yogo=require('../src/util')
let Board=require('../src/board/board')

var statTime=new Date().getTime();

var boardContainer=document.getElementById("boardContainer");

var boardSize=9;

var board=new Board(boardContainer,boardSize);

board.drawBoard();

var endTime=new Date().getTime();
yogo.logInfo('cost '+(endTime-statTime)+' ms.','draw board');

board.placeStone({x:3,y:3},'W');
board.placeStone({x:3,y:2},'B');
board.placeStone({x:1,y:2},'B');
board.placeStone({x:1,y:3},'W');
board.placeStone({x:0,y:1},'B');
board.placeStone({x:0,y:2},'W');
board.placeStone({x:3,y:1},'W');
board.placeStone({x:1,y:4},'B');
board.placeStone({x:2,y:4},'W');
board.placeStone({x:1,y:0},'W');
board.placeStone({x:2,y:0},'B');
// board.placeStone({x:3,y:4},'W');
// board.placeStone({x:4,y:3},'B');
// board.placeStone({x:4,y:2},'B');
// board.placeStone({x:2,y:3},'W');
// board.placeStone({x:2,y:2},'W');
// board.placeStone({x:15,y:16},'B');
// board.placeStone({x:3,y:16},'W');

// board.addStones([{x:12,y:12},{x:13,y:16}],'B');
// board.removeStones([{x:2,y:2},{x:3,y:16}]);

//board.hideCoordinate();
//board.showCoordinate();

board.setMarker({x:0,y:0},'TR');
board.setMarker({x:3,y:3},'TR');
board.setMarker({x:3,y:2},'TR');
board.setMarker({x:2,y:2},'TR');
board.setMarker({x:2,y:1},'SQ');
board.setMarker({x:1,y:2},'SQ');
board.setMarker({x:1,y:3},'SQ');
board.setMarker({x:0,y:1},'CR');
board.setMarker({x:0,y:2},'CR');
board.setMarker({x:0,y:3},'CR');
board.setMarker({x:3,y:1},'MA');
board.setMarker({x:4,y:1},'MA');
board.setMarker({x:3,y:0},'MA');
board.setMarker({x:1,y:0},'TB');
board.setMarker({x:4,y:0},'TB');
board.setMarker({x:2,y:0},'TW');
board.setMarker({x:0,y:4},'TW');

board.setLabel({x:1,y:4},'W');
board.setLabel({x:2,y:4},'J');
board.setLabel({x:3,y:4},'Y');
board.setLabel({x:6,y:2},'V');

// board.paper.forEach(function(e){
//     e.rotate(90,202.5,202.5)
// });

board.setLabel({x:5,y:4},'W');
board.setLabel({x:6,y:4},'J');
board.setLabel({x:7,y:4},'Y');

//board.removeAllMarkers();
//board.removeAllLabels();

//board.placeStone({x:2,y:4},'B');

// board.setLabel({x:1,y:4},'Q');
//    board.setLabel({x:2,y:4},'A');
//    board.setLabel({x:3,y:4},'Z');
//    board.setLabel({x:3,y:0},'Z');
//    board.setLabel({x:3,y:0},'R');

// board.setMarker({x:0,y:0},'TR');
// board.removeAllMarkers();

// board.setMarker({x:0,y:0},'TR');
// board.removeAllMarkers();

// board.setMarker({x:0,y:0},'TR');

// board.setMarker({x:3,y:3},'TR');
// board.setMarker({x:3,y:2},'TR');
// board.setMarker({x:2,y:2},'TR');
// board.setMarker({x:2,y:1},'SQ');
// board.setMarker({x:1,y:2},'SQ');
// board.setMarker({x:1,y:3},'SQ');
// board.setMarker({x:0,y:1},'CR');
// board.setMarker({x:0,y:2},'CR');
// board.setMarker({x:0,y:3},'CR');
// board.setMarker({x:3,y:1},'MA');
// board.setMarker({x:4,y:1},'MA');
// board.setMarker({x:3,y:0},'MA');

//board.clearBoard();

window.board=board;

},{"../src/board/board":2,"../src/util":10}],2:[function(require,module,exports){
let yogo=require("../util");
let BoardDrawer=require("./board_drawer");
let BoardSetting=require("./board_setting");
let BoardTransformer=require("./board_transformer");
let CoordinateManager=require("./coordinate_manager");
let LabelManager=require("./label_manager");
let MarkerManager=require("./marker_manager");
let StoneManager=require("./stone_manager");

class Board {

	constructor(boardContainer, boardSizeOrSetting, paper) {

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
			this.boardSetting = new BoardSetting(boardSizeOrSetting);
		} else if (typeof (boardSizeOrSetting) === 'object') {
			this.boardSetting = boardSizeOrSetting;
		}
		this.boardSize = this.boardSetting.boardSize;

		this.pointStatusMatrix = [];
		this.lineOrStarMatrix = [];

		for (var x = 0; x < this.boardSize; x++) {
			this.pointStatusMatrix[x] = [];
			this.lineOrStarMatrix[x] = [];
		}

		this.boardDrawer=new BoardDrawer(this);

		this.centralPoint;

		this.coordinateManager = new CoordinateManager(this);
		yogo.exportFunctions.call(this, this.coordinateManager, [ 'drawCoordinate',
				'hideCoordinate', 'showCoordinate', 'boardCoorToViewBoxCoor',
				'setXCoordinateType', 'setYCoordinateType', 'coordinateStatus',
				'setFullCoordinate' ]);

		this.stoneManager = new StoneManager(this);
		yogo.exportFunctions.call(this, this.stoneManager, [ 'placeStone',
				'removeStone', 'addStones', 'removeStones', 'showMoveNumber',
				'showMoveNumbers', 'hideMoveNumbers', 'unmarkCurrentMoveNumber' ]);

		this.markerManager = new MarkerManager(this);
		yogo.exportFunctions.call(this, this.markerManager,
				[ 'setMarker', 'setMarkers', 'removeMarker', 'removeAllMarkers',
						'markCurrentMove' ]);

		this.labelManager = new LabelManager(this);
		yogo.exportFunctions.call(this, this.labelManager, [ 'setLabel',
				'setLabels', 'removeLabel', 'removeAllLabels',
				'removeBranchPointLabels' ]);

		this.boardTransformer=new BoardTransformer(this);
		yogo.exportFunctions.call(this, this.boardTransformer, [ 'zoomBoard',
				'flipHorizontal', 'flipVertical', 'rotateRight',
				'rotateLeft', 'rotate180', 'resetPerspective' ]);

		this.pointClickHandler = function(coor, elementType) {
			yogo.logWarn('pointClickHandler not set', 'board');
		};

		this.pointMouseupHandler = function(coor, mousekey) {
			yogo.logWarn('pointMouseupHandler not set', 'board');
		};

		var theBoard = this;
		this._pointClickHandler = function(e) {
			theBoard.pointClickHandler(this.data('coor'));
		};
		this._pointMouseupHandler = function(e) {
			if (e.which === 1) {
				return false;
			}
			theBoard.pointMouseupHandler(this.data('coor'), e.which);
		};
	}


	get reversed(){
		return this.boardTransformer.reversed;
	}

	get rotate90(){
		return this.boardTransformer.rotate90;
	}

	drawBoard() {

		var paper = this.paper;
		var boardSetting = this.boardSetting;
		var viewBoxSize = boardSetting.viewBoxSize;

		yogo.logInfo('viewBox size:' + viewBoxSize, 'board');

		this.setViewBox();

		// paper.image("board/bambootile_warm.jpg", 0, 0, viewBoxSize,
		// viewBoxSize);//board/purty_wood.jpg

		var boardOrigin = boardSetting.boardOrigin;
		var gridWidth = boardSetting.gridWidth;
		var boardOuterEdge = boardSetting.boardOuterEdge;

		var ox = boardOrigin.x, oy = boardOrigin.y;

		var halfBoard = gridWidth * (this.boardSize - 1) / 2;
		this.centralPoint = {
			x : ox + halfBoard,
			y : oy + halfBoard
		};

		var boardEdgeWidth = gridWidth * (this.boardSize - 1) + boardOuterEdge
				* 2;
		var boardEdgeRect = paper.rect(ox - boardOuterEdge,
				oy - boardOuterEdge, boardEdgeWidth, boardEdgeWidth);
		boardEdgeRect.attr({
			'stroke-width' : 0,
			fill : '#DCB35C'
		});// #DCB35C,#DEC090

		this.coordinateManager.drawCoordinate();
		this.boardDrawer.drawLines();
		this.boardDrawer.drawStars();

		this._setupMask();
	}

	_setupMask() {
		var boardSetting = this.boardSetting;
		var paper = this.paper;
		var gridWidth = boardSetting.gridWidth;
		var board = this;

		var coordinateManager = this.coordinateManager;
		var maskClickHandler = function(e) {
			var oriCoor = this.data('coor');
			if (board.reversed || board.rotate90 > 0) {
				oriCoor = coordinateManager._reverseTransformCoor(oriCoor,
						false);
			}
			if (e.which === 1) {
				board.pointClickHandler(oriCoor);
			} else {
				board.pointMouseupHandler(oriCoor, e.which);
			}
		};
		var maskMouseupHandler = function(e) {
			if (e.which === 1) {
				return false;
			}
			maskClickHandler.call(this, e);
		};

		var maskRadius = gridWidth / 2;
		for (let x = 0; x < this.boardSize; x++) {
			for (let y = 0; y < this.boardSize; y++) {
				let coor = {x,y};
				let vbCoor = this.coordinateManager
						.boardCoorToViewBoxCoor(coor);
				let mask = paper.rect(vbCoor.x - maskRadius,
						vbCoor.y - maskRadius, gridWidth, gridWidth).attr({
					'stroke-width' : 0,
					fill : 'white',
					'fill-opacity' : 0
				})
				mask.data('coor', coor);
				mask.click(maskClickHandler);
				mask.mouseup(maskMouseupHandler);
			}
		}
	}

	_setElementEventHandler(element) {
		element.click(this._pointClickHandler);
		element.mouseup(this._pointMouseupHandler);
	}

	clearBoard() {
		for (let x = 0; x < this.pointStatusMatrix.length; x++) {
			let pointStatusX = this.pointStatusMatrix[x];
			for (let y = 0; y < pointStatusX.length; y++) {
				let pointStatus = pointStatusX[y];
				if (pointStatus && pointStatus.color) {
					this.removeStone({x,y});
				}
			}
		}
		this.removeAllMarkers();
		this.removeAllLabels();
		this.removeBranchPointLabels();
		this.hideMoveNumbers();
		this.markCurrentMove(null);
	}

	setViewBox() {
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
	}

	resize() {
		var width = this.boardContainer.offsetWidth;
		this.paper.setSize(width, width);
	}

}

module.exports=Board;

},{"../util":10,"./board_drawer":3,"./board_setting":4,"./board_transformer":5,"./coordinate_manager":6,"./label_manager":7,"./marker_manager":8,"./stone_manager":9}],3:[function(require,module,exports){
let yogo=require("../util");

class BoardDrawer {

	constructor(board) {
		this.board=board;
		this.boardSetting=board.boardSetting;
		this.paper=board.paper;
		this.lineOrStarMatrix = board.lineOrStarMatrix;
	}

	_drawLinesSimple() {

		var boardSetting = this.boardSetting;
		var paper = this.paper;

		var boardSize = boardSetting.boardSize;
		var boardOrigin = boardSetting.boardOrigin;
		var gridWidth = boardSetting.gridWidth;
		var strokes = boardSetting.strokes;

		var ox = boardOrigin.x, oy = boardOrigin.y;

		var outerBorderLineRect = paper.rect(ox, oy, gridWidth * (boardSize - 1),
				gridWidth * (boardSize - 1));
		outerBorderLineRect.attr({
			'stroke-width' : strokes.outerBorderLine
		});

		var hpath = '', vpath = '';
		for (var i = 0; i < (boardSize - 2); i++) {
			hpath += 'M' + ox + ' ' + ((oy + gridWidth) + gridWidth * i) + 'H'
					+ (ox + gridWidth * (boardSize - 1));
			vpath += 'M' + ((ox + gridWidth) + gridWidth * i) + ' ' + oy + 'V'
					+ (oy + gridWidth * (boardSize - 1));
		}

		paper.path(hpath).attr({
			'stroke-width' : strokes.borderLine
		});
		paper.path(vpath).attr({
			'stroke-width' : strokes.borderLine
		});
	}


	_drawLines() {

		var boardSetting = this.boardSetting;
		var paper = this.paper;

		var lineOrStarMatrix = this.lineOrStarMatrix;
		var er = boardSetting.labels.eraseRadius;

		var boardSize = boardSetting.boardSize;
		var boardOrigin = boardSetting.boardOrigin;
		var gridWidth = boardSetting.gridWidth;
		var strokes = boardSetting.strokes;

		var ox = boardOrigin.x, oy = boardOrigin.y;
		var rightX = ox + gridWidth * (boardSize - 1);
		var bottomY = oy + gridWidth * (boardSize - 1);

		for (var i = 1; i < (boardSize - 1); i++) {
			var xi = ox + gridWidth * i, yi = oy + gridWidth * i;

			var pathL = 'M' + ox + ' ' + yi + 'h' + er;
			var pathLE = paper.path(pathL).attr({
				'stroke-width' : strokes.borderLine
			});
			lineOrStarMatrix[0][i].push(pathLE);
			var pathLO = 'M' + ox + ' ' + (yi - er) + 'v' + (er * 2);
			var pathLOE = paper.path(pathLO).attr({
				'stroke-width' : strokes.outerBorderLine
			});
			lineOrStarMatrix[0][i].push(pathLOE);

			var pathR = 'M' + (rightX - er) + ' ' + yi + 'h' + er;
			var pathRE = paper.path(pathR).attr({
				'stroke-width' : strokes.borderLine
			});
			lineOrStarMatrix[boardSize - 1][i].push(pathRE);
			var pathRO = 'M' + rightX + ' ' + (yi - er) + 'v' + (er * 2);
			var pathROE = paper.path(pathRO).attr({
				'stroke-width' : strokes.outerBorderLine
			});
			lineOrStarMatrix[boardSize - 1][i].push(pathROE);

			var pathT = 'M' + xi + ' ' + oy + 'v' + er;
			var pathTE = paper.path(pathT).attr({
				'stroke-width' : strokes.borderLine
			});
			lineOrStarMatrix[i][0].push(pathTE);
			var pathTO = 'M' + (xi - er) + ' ' + oy + 'h' + (er * 2);
			var pathTOE = paper.path(pathTO).attr({
				'stroke-width' : strokes.outerBorderLine
			});
			lineOrStarMatrix[i][0].push(pathTOE);

			var pathB = 'M' + xi + ' ' + (bottomY - er) + 'v' + er;
			var pathBE = paper.path(pathB).attr({
				'stroke-width' : strokes.borderLine
			});
			lineOrStarMatrix[i][boardSize - 1].push(pathBE);
			var pathBO = 'M' + (xi - er) + ' ' + bottomY + 'h' + (er * 2);
			var pathBOE = paper.path(pathBO).attr({
				'stroke-width' : strokes.outerBorderLine
			});
			lineOrStarMatrix[i][boardSize - 1].push(pathBOE);
		}

		var pathTL = 'M' + (ox + er) + ' ' + oy + 'h-' + er + 'v' + er;
		var pathTLE = paper.path(pathTL).attr({
			'stroke-width' : strokes.outerBorderLine
		});
		lineOrStarMatrix[0][0].push(pathTLE);

		var pathTR = 'M' + (rightX - er) + ' ' + oy + 'h' + er + 'v' + er;
		var pathTRE = paper.path(pathTR).attr({
			'stroke-width' : strokes.outerBorderLine
		});
		lineOrStarMatrix[boardSize - 1][0].push(pathTRE);

		var pathBL = 'M' + ox + ' ' + (bottomY - er) + 'v' + er + 'h' + er;
		var pathBLE = paper.path(pathBL).attr({
			'stroke-width' : strokes.outerBorderLine
		});
		lineOrStarMatrix[0][boardSize - 1].push(pathBLE);

		var pathBR = 'M' + (rightX - er) + ' ' + bottomY + 'h' + er + 'v-' + er;
		var pathBRE = paper.path(pathBR).attr({
			'stroke-width' : strokes.outerBorderLine
		});
		lineOrStarMatrix[boardSize - 1][boardSize - 1].push(pathBRE);

		for (var x = 1; x < (boardSize - 1); x++) {
			for (var y = 1; y < (boardSize - 1); y++) {
				var xc = ox + gridWidth * x;
				var yc = oy + gridWidth * y;
				var path = 'M' + (xc - er) + ' ' + yc + 'h' + (er * 2) + 'M' + xc
						+ ' ' + (yc - er) + 'v' + (er * 2);
				var lineElement = paper.path(path).attr({
					'stroke-width' : strokes.borderLine
				});
				lineOrStarMatrix[x][y].push(lineElement);
			}
		}

		var remain = gridWidth * 0.5 - er;
		if (remain < 0.1) {
			return;
		}

		for (var y = 0; y < boardSize; y++) {
			var path = '';
			for (var x = 0; x < boardSize - 1; x++) {
				path += 'M' + (ox + gridWidth * x + er) + ' '
						+ (oy + gridWidth * y) + 'h' + (remain * 2);
			}
			var stroke = (y == 0 || y == boardSize - 1) ? strokes.outerBorderLine
					: strokes.borderLine;
			paper.path(path).attr({
				'stroke-width' : stroke
			});
		}

		for (var x = 0; x < boardSize; x++) {
			var path = '';
			for (var y = 0; y < boardSize - 1; y++) {
				path += 'M' + (ox + gridWidth * x) + ' '
						+ (oy + gridWidth * y + er) + 'v' + (remain * 2);
			}
			var stroke = (x == 0 || x == boardSize - 1) ? strokes.outerBorderLine
					: strokes.borderLine;
			paper.path(path).attr({
				'stroke-width' : stroke
			});
		}
	}

	drawLines() {
		if (this.boardSetting.labels.eraseBoardLine) {
			let boardSize=this.boardSetting.boardSize;
			for (var x = 0; x < boardSize; x++) {
				for (var y = 0; y < boardSize; y++) {
					this.lineOrStarMatrix[x][y] = [];
				}
			}
			this._drawLines();
		}else{
			this._drawLinesSimple();
		}
	}

	drawStars() {
		var boardSetting = this.boardSetting;
		var paper = this.paper;

		var gridWidth = boardSetting.gridWidth;
		var strokes = boardSetting.strokes;
		var boardOrigin = boardSetting.boardOrigin;
		var ox = boardOrigin.x, oy = boardOrigin.y;

		var starPoints = boardSetting.starPoints;
		for (var i = 0; i < starPoints.length; i++) {
			var point = starPoints[i];
			var x = ox + gridWidth * point.x;
			var y = oy + gridWidth * point.y;
			var star = paper.circle(x, y, strokes.star).attr({
				fill : 'black'
			});

			if (boardSetting.labels.eraseBoardLine) {
				this.lineOrStarMatrix[point.x][point.y].push(star);
			}
		}
	}

}

module.exports=BoardDrawer;

},{"../util":10}],4:[function(require,module,exports){
let yogo=require("../util");

class BoardSetting {


	constructor(boardSize) {
		if (isNaN(boardSize) || boardSize < 5 || boardSize > 25) {
			yogo.logError('wrong board size: ' + boardSize, 'board');
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

},{"../util":10}],5:[function(require,module,exports){
let yogo=require("../util");

class BoardTransformer {

	constructor(board) {

		this.board=board;

		this.paper=board.paper;

		this.zoomMode = null;// TL/TR/BL/BR

		this.reversed = false;

		this.rotate90 = 0;

	}


	zoomBoard(zoomMode) {
		let paper=this.paper;
		let boardSetting=this.board.boardSetting;
		let coordinateManager=this.board.coordinateManager;

		this.zoomMode = zoomMode;

		var viewBoxSize = boardSetting.viewBoxSize;
		var axisWidth = coordinateManager.getOneAxisWidth();
		var showCoordinate = coordinateManager.show;
		var fullCoordinate = coordinateManager.fullCoordinate;

		if ('TL TR BL BR'.indexOf(zoomMode) < 0) {
			this.board.setViewBox();
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
		var gridWidth = boardSetting.gridWidth;
		var size = (ct - cf + gridWidth) / 2;

		if (zoomMode === 'TL') {
			paper.setViewBox(cf, cf, size, size);
		} else if (zoomMode === 'TR') {
			paper.setViewBox(ct - size, cf, size, size);
		} else if (zoomMode === 'BL') {
			paper.setViewBox(cf, ct - size, size, size);
		} else if (zoomMode === 'BR') {
			paper.setViewBox(ct - size, ct - size, size, size);
		}
	}

	flipHorizontal() {
		this.reversed = !this.reversed;
		var r = (this.rotate90 % 2 === 0) ? 1 : 3;
		this.rotate90 = (this.rotate90 + r) % 4;
		this._transform();
	}

	flipVertical() {
		this.reversed = !this.reversed;
		var r = (this.rotate90 % 2 === 0) ? 3 : 1;
		this.rotate90 = (this.rotate90 + r) % 4;
		this._transform();
	}

	rotateRight() {
		this.rotate90 = (this.rotate90 + 1) % 4;
		this._transform();
	}

	rotateLeft() {
		this.rotate90 = (this.rotate90 + 3) % 4;
		this._transform();
	}

	rotate180() {
		this.rotate90 = (this.rotate90 + 2) % 4;
		this._transform();
	}

	resetPerspective() {
		this.reversed = false;
		this.rotate90 = 0;
		this._transform();
	}

	_transform() {
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
}

module.exports=BoardTransformer;

},{"../util":10}],6:[function(require,module,exports){
let yogo=require("../util");

class CoordinateManager {

	constructor(board) {
		this.board = board;
		this.boardSize = board.boardSize;
		this.boardSetting = board.boardSetting;
		this.paper = board.paper;
		this.setting = this.boardSetting.coordinate;
		this.fullCoordinate = this.setting.fullCoordinate;

		this.show = this.setting.show;
		this.xType = this.setting.xType;
		this.yType = this.setting.yType;

		this.drawed = false;
		this.xCoordinateLabels1 = [];
		this.yCoordinateLabels1 = [];
		this.xCoordinateLabels2 = [];
		this.yCoordinateLabels2 = [];

		var coordinateManager = this;

		this.onCircleCoordinateChange = function() {
			var coor = this.data('coor');
			var vbCoor = coordinateManager.boardCoorToViewBoxCoor(coor);
			this.attr({
				cx : vbCoor.x,
				cy : vbCoor.y
			});
		};

		this.onLabelCoordinateChange = function() {
			var coor = this.data('coor');

			if (coordinateManager.boardSetting.labels.eraseBoardLine) {
				var lineOrStarElements = this.data('lineOrStarElements');
				if (lineOrStarElements) {
					for (var i = 0; i < lineOrStarElements.length; i++) {
						lineOrStarElements[i].show();
					}
					var newPhCoor = coordinateManager._transformCoor(coor, false);
					lineOrStarElements = coordinateManager.board.lineOrStarMatrix[newPhCoor.x][newPhCoor.y];
					for (var i = 0; i < lineOrStarElements.length; i++) {
						lineOrStarElements[i].hide();
					}
					this.data('lineOrStarElements', lineOrStarElements);
				}
			}

			var vbCoor = coordinateManager.boardCoorToViewBoxCoor(coor);
			this.attr({
				x : vbCoor.x,
				y : vbCoor.y
			});
		};

		this.onCoordLabelCoordinateChange = function() {
			var coor = this.data('coor');
			var vbCoor = coordinateManager._transformCoor(coor, true);
			this.attr({
				x : vbCoor.x,
				y : vbCoor.y
			});
		};
	}

	_transformCoor(coor, isViewBoxCoor) {
		var coorMax = isViewBoxCoor ? this.boardSetting.viewBoxSize
				: (this.boardSize - 1);
		var x = coor.x, y = coor.y;
		if (this.board.reversed) {
			x = y;
			y = coor.x;
		}
		var rotate90 = this.board.rotate90;
		while (rotate90 > 0) {
			var tmp = y;
			y = x;
			x = coorMax - tmp;
			rotate90--;
		}
		return {
			x : x,
			y : y
		};
	}

	_reverseTransformCoor(coor, isViewBoxCoor) {
		var coorMax = isViewBoxCoor ? this.boardSetting.viewBoxSize
				: (this.boardSize - 1);

		var x = coor.x, y = coor.y;
		var rotate90 = (4 - this.board.rotate90) % 4;
		while (rotate90 > 0) {
			var tmp = y;
			y = x;
			x = coorMax - tmp;
			rotate90--;
		}
		if (this.board.reversed) {
			var tmp = x;
			x = y;
			y = tmp;
		}

		return {
			x : x,
			y : y
		};
	}

	boardCoorToViewBoxCoor(coor) {
		var tc = this._transformCoor(coor, false);
		var boardOrigin = this.boardSetting.boardOrigin;
		var gridWidth = this.boardSetting.gridWidth;
		var vx = boardOrigin.x + gridWidth * tc.x;
		var vy = boardOrigin.y + gridWidth * tc.y;
		return {
			x : vx,
			y : vy
		};
	}

	generateCoordinateLabel(coor, type) {
		var label = '' + (coor + 1);

		if (type === '1') {
			;
		} else if ('aA⒜🄐ⓐⒶ'.indexOf(type) >= 0) {
			if (coor >= 26) {
				if (type === 'a') {
					type = 'A';
				} else if (type === '⒜') {
					type = '🄐';
				} else if (type === 'ⓐ') {
					type = 'Ⓐ';
				}
				coor = coor % 26;
			}
			label = String.fromCharCode(type.charCodeAt(0) + coor);
		} else if (type === '一') {
			var zhArray = '一二三四五六七八九十'.split('');
			label = zhArray[coor % 10];
			if (coor > 9) {
				zhArray[0] = zhArray[9];
				label = zhArray[parseInt(coor / 10) - 1] + label;
			}
		} else if ('①⑴⒈'.indexOf(type) >= 0) {
			coor = coor % 20;
			label = String.fromCharCode(type.charCodeAt(0) + coor);
		}
		return label;
	}

	drawCoordinate() {
		if (!this.show || this.drawed) {
			return;
		}

		var gridWidth = this.boardSetting.gridWidth;
		var boardOrigin = this.boardSetting.boardOrigin;
		var viewBoxSize = this.boardSetting.viewBoxSize;

		for (var coor = 0; coor < this.boardSize; coor++) {
			var oriX = boardOrigin.x + gridWidth * coor;
			var oriY = this.setting.baseCoor;

			var tc = this._transformCoor({
				x : oriX,
				y : oriY
			}, true);
			var xlabel = this.generateCoordinateLabel(coor, this.xType);
			var xlabelElement = this.paper.text(tc.x, tc.y, xlabel).attr({
				'font-size' : this.setting.fontSize
			});
			xlabelElement.data({
				type : 'coordinate',
				boardElement : true,
				coor : tc,
				onCoordinateChange : this.onCoordLabelCoordinateChange
			});
			this.xCoordinateLabels1.push(xlabelElement);

			if (this.fullCoordinate) {
				var tc2 = this._transformCoor({
					x : oriX,
					y : viewBoxSize - oriY
				}, true);
				var xlabelElement2 = xlabelElement.clone().attr({
					x : tc2.x,
					y : tc2.y
				});
				xlabelElement2.data({
					type : 'coordinate',
					boardElement : true,
					coor : tc2,
					onCoordinateChange : this.onCoordLabelCoordinateChange
				});
				this.xCoordinateLabels2.push(xlabelElement2);
			}
		}

		for (var coor = 0; coor < this.boardSize; coor++) {
			var oriX = this.setting.baseCoor;
			var oriY = boardOrigin.y + gridWidth * coor;

			var tc = this._transformCoor({
				x : oriX,
				y : oriY
			}, true);
			var ylabel = this.generateCoordinateLabel(coor, this.yType);
			var ylabelElement = this.paper.text(tc.x, tc.y, ylabel).attr({
				'font-size' : this.setting.fontSize
			});
			ylabelElement.data({
				type : 'coordinate',
				boardElement : true,
				coor : tc,
				onCoordinateChange : this.onCoordLabelCoordinateChange
			});
			this.yCoordinateLabels1.push(ylabelElement);

			if (this.fullCoordinate) {
				var tc2 = this._transformCoor({
					x : viewBoxSize - oriX,
					y : oriY
				}, true);
				var ylabelElement2 = ylabelElement.clone().attr({
					x : tc2.x,
					y : tc2.y
				});
				ylabelElement2.data({
					type : 'coordinate',
					boardElement : true,
					coor : tc2,
					onCoordinateChange : this.onCoordLabelCoordinateChange
				});
				this.yCoordinateLabels2.push(ylabelElement2);
			}
		}

		this.drawed = true;
	}

	setXCoordinateType(type) {
		if (this.xType == type) {
			return;
		}
		this.xType = type;
		if (!this.drawed) {
			return;
		}
		for (var i = 0; i < this.boardSize; i++) {
			var label = this.generateCoordinateLabel(i, type);
			this.xCoordinateLabels1[i].attr({
				text : label
			});
			if (this.fullCoordinate) {
				this.xCoordinateLabels2[i].attr({
					text : label
				});
			}
		}
	}

	setYCoordinateType(type) {
		if (this.yType == type) {
			return;
		}
		this.yType = type;
		if (!this.drawed) {
			return;
		}
		for (var i = 0; i < this.boardSize; i++) {
			var label = this.generateCoordinateLabel(i, type);
			this.yCoordinateLabels1[i].attr({
				text : label
			});
			if (this.fullCoordinate) {
				this.yCoordinateLabels2[i].attr({
					text : label
				});
			}
		}
	}

	redrawCoordinate() {
		while (this.xCoordinateLabels1.length > 0) {
			this.xCoordinateLabels1.pop().remove();
		}
		while (this.yCoordinateLabels1.length > 0) {
			this.yCoordinateLabels1.pop().remove();
		}
		while (this.xCoordinateLabels2.length > 0) {
			this.xCoordinateLabels2.pop().remove();
		}
		while (this.yCoordinateLabels2.length > 0) {
			this.yCoordinateLabels2.pop().remove();
		}
		this.drawed = false;
		this.drawCoordinate();
	}

	setFullCoordinate(full) {
		if (full === this.fullCoordinate) {
			return;
		}
		this.fullCoordinate = full;
		this.redrawCoordinate();
		this.board.setViewBox();
	}

	showCoordinate() {
		if (this.show) {
			return;
		}
		this.show = true;
		this.board.setViewBox();

		if (!this.drawed) {
			this.drawCoordinate();
			return;
		}
		for (var i = 0; i < this.boardSize; i++) {
			this.xCoordinateLabels1[i].show();
			this.yCoordinateLabels1[i].show();
			if (this.fullCoordinate) {
				this.xCoordinateLabels2[i].show();
				this.yCoordinateLabels2[i].show();
			}
		}
	}

	hideCoordinate() {
		if (!this.show) {
			return;
		}
		for (var i = 0; i < this.boardSize; i++) {
			this.xCoordinateLabels1[i].hide();
			this.yCoordinateLabels1[i].hide();
			if (this.fullCoordinate) {
				this.xCoordinateLabels2[i].hide();
				this.yCoordinateLabels2[i].hide();
			}
		}
		this.show = false;
		this.board.setViewBox();
	}

	coordinateStatus() {
		return {
			show : this.show,
			xType : this.xType,
			yType : this.yType
		};
	}

	getOneAxisWidth() {
		return this.setting.coordinatePadding + this.setting.coordinateWidth;
	}
}


module.exports=CoordinateManager;

},{"../util":10}],7:[function(require,module,exports){
let yogo=require("../util");

class LabelManager {

	constructor(board) {
		this.board = board;
		this.boardSetting = board.boardSetting;
		this.paper = board.paper;
		this.pointStatusMatrix = board.pointStatusMatrix;
		this.coordinateManager = board.coordinateManager;
		this.lineOrStarMatrix = board.lineOrStarMatrix;

		this.labelPoints = [];
		this.branchPoints = [];
	}

	setLabel(coor, labelChar, type) {
		if (!labelChar) {
			yogo.logError('label missing: (' + coor.x + ',' + coor.y + ')',
					'setLabel');
			return;
		}
		if (labelChar.length > 2) {
			if (!(/^\d+$/.test(labelChar) && labelChar.length == 3)) {
				yogo.logError('label too long: ' + labelChar, 'setLabel');
				return;
			}
		}
		var pointStatus = this.pointStatusMatrix[coor.x][coor.y];
		var stoneColor = null;
		var label = null;
		if (pointStatus) {
			stoneColor = pointStatus.color;
			label = pointStatus.label;
		} else {
			pointStatus = {};
			this.pointStatusMatrix[coor.x][coor.y] = pointStatus;
		}

		if (label) {
			// yogo.logWarn('point ('+coor.x+','+coor.y+') has a label:
			// '+label,'setLabel');
			pointStatus.labelElement.remove();
		}

		var labelColor = 'black';
		if (stoneColor == 'B') {
			labelColor = 'white';
		}
		if (type === 'branch_point') {
			labelColor = 'blue';
			if (stoneColor) {
				yogo.logWarn('branch point (' + coor.x + ',' + coor.y
						+ ') has a stone', 'setLabel');
			}
		}
		var labelSetting = this.boardSetting.labels;
		var fontSize = labelSetting.fontSize;
		if (labelChar.length == 2) {
			fontSize -= 1;
		} else if (labelChar.length >= 3) {
			fontSize -= 2;
		}
		var vbCoor = this.coordinateManager.boardCoorToViewBoxCoor(coor);
		var labelElement = this.paper.text(vbCoor.x, vbCoor.y, labelChar).attr(
				{
					'font-size' : fontSize,
					fill : labelColor
				});
		labelElement.data({
			type : 'label',
			boardElement : true,
			coor : {
				x : coor.x,
				y : coor.y
			},
			onCoordinateChange : this.coordinateManager.onLabelCoordinateChange
		});
		pointStatus.labelElement = labelElement;
		pointStatus.label = labelChar;
		if (type === 'branch_point') {
			this.branchPoints.push(coor);
			labelElement.data('branch', labelChar);
		} else {
			this.labelPoints.push(coor);
		}

		if (!stoneColor && labelSetting.eraseBoardLine) {
			var phCoor = this.coordinateManager._transformCoor(coor, false);
			var lineOrStarElements = this.lineOrStarMatrix[phCoor.x][phCoor.y];
			for (var i = 0; i < lineOrStarElements.length; i++) {
				lineOrStarElements[i].hide();
			}
			labelElement.data('lineOrStarElements', lineOrStarElements);
		}

		this.board._setElementEventHandler(labelElement);
	}

	setLabels(coorLabels) {
		for (var i = 0; i < coorLabels.length; i++) {
			var coorLabel = coorLabels[i];
			this.setLabel(coorLabel, coorLabel.label);
		}
	}

	removeLabel(coor) {
		var pointStatus = this.pointStatusMatrix[coor.x][coor.y];
		if (!pointStatus || !pointStatus.label) {
			// yogo.logWarn('no label at
			// ('+coor.x+','+coor.y+')','removeLabel');
			return;
		}
		var lineOrStarElements = pointStatus.labelElement
				.data('lineOrStarElements');
		if (lineOrStarElements) {
			for (var i = 0; i < lineOrStarElements.length; i++) {
				lineOrStarElements[i].show();
			}
		}
		pointStatus.labelElement.remove();
		pointStatus.labelElement = null;
		pointStatus.label = null;
	}

	removeAllLabels() {
		while (this.labelPoints.length > 0) {
			this.removeLabel(this.labelPoints.pop());
		}
	}

	removeBranchPointLabels() {
		while (this.branchPoints.length > 0) {
			this.removeLabel(this.branchPoints.pop());
		}
	}
}


module.exports=LabelManager;

},{"../util":10}],8:[function(require,module,exports){
let yogo=require("../util");

class MarkerManager {

	constructor(board) {
		this.board = board;
		this.boardSetting = board.boardSetting;
		this.paper = board.paper;
		this.pointStatusMatrix = board.pointStatusMatrix;
		this.coordinateManager = board.coordinateManager;

		this.currentMoveMarker = null;
		this.markerPoints = [];
		
		this._templateMarkerPoint = {
			x : -this.boardSetting.gridWidth,
			y : -this.boardSetting.gridWidth
		};
		this.markerTemplates = this.setupMarkerTemplates();
	}


	setupMarkerTemplates(){

		var paper=this.paper;
		var gridWidth=this.boardSetting.gridWidth;
		var strokes=this.boardSetting.strokes;
		var mp=this._templateMarkerPoint;

		var crMarkerW=paper.circle(mp.x, mp.y, gridWidth*0.23).attr({'stroke-width':gridWidth*0.1});
		var crMarkerB=crMarkerW.clone().attr({stroke:'white'});

		var sqSide=gridWidth*0.4;
		var sqMarkerB=paper.rect(mp.x, mp.y, sqSide, sqSide).attr({'stroke-width':0,fill:'white'});
		var sqMarkerW=sqMarkerB.clone().attr({fill:'black'});

		var twMarker=paper.circle(mp.x, mp.y, gridWidth*0.13).attr({'stroke-width':gridWidth*0.04,fill:'white'});
		var tbMarker=twMarker.clone().attr({fill:'black'});

		var maSide=gridWidth*0.32;
		var maStroke=gridWidth*0.1;
		var generateMaMarker=function(coor,stoneColor){
			var maMarker=paper.path('M'+(coor.x-maSide/2)+' '+(coor.y-maSide/2)+'l'+maSide+' '+maSide+'M'
				+(coor.x-maSide/2)+' '+(coor.y+maSide/2)+'l'+maSide+' '+(-maSide));
			maMarker.attr({'stroke-width':maStroke,'stroke-linecap':'round'});
			if(stoneColor==='W'||stoneColor==='E'){
				return maMarker;
			}
			return maMarker.attr({stroke:'white'});
		}

		var trSide=gridWidth*0.5;
		var trHigh=trSide*Math.sin(Math.PI/3);
		var trGravityHigh=(trSide/2)*Math.tan(Math.PI/6);

		var generateTrMarker=function(coor,stoneColor){
			var trMarker=paper.path('M'+(coor.x-trSide/2)+' '+(coor.y+trGravityHigh)+'h'+trSide+'l'+(-trSide/2)+' '+(-trHigh)+'Z');
			trMarker.attr({'stroke-width':strokes.borderLine,fill:'white'});
			if(stoneColor==='B'){
				return trMarker;
			}
			return trMarker.attr({'stroke-width':0,fill:'black'});
		}

		return {
			'CR_B': crMarkerB,
			'CR_W': crMarkerW,
			'CR_E': crMarkerW,
			'SQ_B': sqMarkerB,
			'SQ_W': sqMarkerW,
			'SQ_E': sqMarkerW,
			'MA_B': generateMaMarker,
			'MA_W': generateMaMarker,
			'MA_E': generateMaMarker,
			'TR_B': generateTrMarker,
			'TR_W': generateTrMarker,
			'TR_E': generateTrMarker,
			'TW': twMarker,
			'TB': tbMarker
		};
	}

	markCurrentMove(coor){
		var gridWidth=this.boardSetting.gridWidth;
		if(this.currentMoveMarker){
			this.currentMoveMarker.remove();
			this.currentMoveMarker=null;
		}
		if(coor){
			var vbCoor=this.coordinateManager.boardCoorToViewBoxCoor(coor);
			var radius=gridWidth*0.15;
			var color='red';
			this.currentMoveMarker=this.paper.circle(vbCoor.x, vbCoor.y, radius).attr({'stroke-width':0,fill:color});
			this.currentMoveMarker.data({type: 'marker', boardElement: true, marker: 'currentMoveMarker',
					coor: {x:coor.x,y:coor.y}, onCoordinateChange: this.coordinateManager.onCircleCoordinateChange});

			this.board._setElementEventHandler(this.currentMoveMarker);
		}
	}

	// markerType: TR/CR/SQ/MA
	setMarker(coor,markerType){
		var pointStatus=this.pointStatusMatrix[coor.x][coor.y];
		var stoneColor=null;
		var marker=null;
		if(pointStatus){
			stoneColor=pointStatus.color;
			marker=pointStatus.marker;
		}else{
			pointStatus={};
			this.pointStatusMatrix[coor.x][coor.y]=pointStatus;
		}

		if(marker){
			yogo.logWarn('point ('+coor.x+','+coor.y+') has a marker','setMarker');
			pointStatus.markerElement.remove();
		}

		var markerElement=null;
		var markerKey=markerType+'_'+(stoneColor||'E');
		if(markerType=='TW'||markerType=='TB'){
			if((stoneColor=='W'&&markerType=='TW')||(stoneColor=='B'&&markerType=='TB')){
				return;
			}
			markerKey=markerType;
		}

		var coordinateManager=this.coordinateManager;
		var vbCoor=coordinateManager.boardCoorToViewBoxCoor(coor);

		var markerTemplate=this.markerTemplates[markerKey];
		if(!markerTemplate){
			yogo.logError('markerTemplate '+markerKey+' not found','setMarker');
			return;
		}
		if(typeof(markerTemplate)==='function'){
			markerElement=markerTemplate.call(this,vbCoor,stoneColor||'E');
			var onCoordinateChange=function(){
				var oriVbCoor=this.data('vbCoor');
				var coor=this.data('coor');
				var vbCoor=coordinateManager.boardCoorToViewBoxCoor(coor);
				markerElement.transform('t'+(vbCoor.x-oriVbCoor.x)+','+(vbCoor.y-oriVbCoor.y));
			};
			markerElement.data({onCoordinateChange: onCoordinateChange, vbCoor: vbCoor});
		}else{
			markerElement=markerTemplate.clone();
		}
		markerElement.data({type: 'marker', boardElement: true, marker: markerType, coor: {x:coor.x,y:coor.y}});

		this.board._setElementEventHandler(markerElement);
		// yogo.logInfo('marker '+markerKey+' from template','setMarker');

		if(markerType=='CR'||markerType=='TW'||markerType=='TB'){
			markerElement.attr({cx:vbCoor.x,cy:vbCoor.y});
			markerElement.data({onCoordinateChange: coordinateManager.onCircleCoordinateChange});
		}else if(markerType=='SQ'){
			var bbox=markerElement.getBBox();
			markerElement.attr({x:vbCoor.x-bbox.width/2,y:vbCoor.y-bbox.height/2});
			var onCoordinateChange=function(){
				var coor=this.data('coor');
				var vbCoor=coordinateManager.boardCoorToViewBoxCoor(coor);
				var bbox=this.getBBox();
				this.attr({x:vbCoor.x-bbox.width/2,y:vbCoor.y-bbox.height/2})
			};
			markerElement.data({onCoordinateChange: onCoordinateChange});
		}else if(markerType=='TR'){
			;
		}else if(markerType=='MA'){
			;
		}else{
			yogo.logWarn('do translate','setMarker');
			markerElement.translate(vbCoor.x-this._templateMarkerPoint.x,vbCoor.y-this._templateMarkerPoint.y);
		}
		markerElement.show();
		pointStatus.marker=markerType;
		pointStatus.markerElement=markerElement;
		if(!marker){
			this.markerPoints.push(coor);
		}
	}

	setMarkers(coors,markerType){
		for(var i=0;i<coors.length;i++){
			this.setMarker(coors[i],markerType);
		}
	}

	removeMarker(coor){
		var pointStatus=this.pointStatusMatrix[coor.x][coor.y];
		if(!pointStatus||!pointStatus.marker){
			yogo.logWarn('no marker at ('+coor.x+','+coor.y+')','removeMarker');
			return;
		}
		pointStatus.marker=null;
		pointStatus.markerElement.remove();
		pointStatus.markerElement=null;
	}

	removeAllMarkers(){
		while(this.markerPoints.length>0){
			this.removeMarker(this.markerPoints.pop());
		}
	}
}


module.exports=MarkerManager;

},{"../util":10}],9:[function(require,module,exports){
let yogo=require("../util");

class StoneManager {

	constructor(board) {
		this.board = board;
		this.boardSize = board.boardSize;
		this.boardSetting = board.boardSetting;
		this.paper = board.paper;
		this.pointStatusMatrix = board.pointStatusMatrix;
		this.coordinateManager = board.coordinateManager;

		this.stoneTemplates = this.setupStoneTemplates();
		this.moveNumberElements = [];
		this.currentMoveNumberElement = null;
	}

	setupStoneTemplates() {
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
	}

	placeStone(coor, color) {
		if (color != 'B' && color != 'W') {
			yogo.logWarn('wrong color:' + color, 'place stone');
			return;
		}

		var pointStatus = this.pointStatusMatrix[coor.x][coor.y];
		if (!pointStatus) {
			pointStatus = {};
		}
		if (pointStatus.color) {
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

		this.board._setElementEventHandler(thisColorStone);
	}

	removeStone(coor) {
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
	}

	addStones(coors, color) {
		for (var i = 0; i < coors.length; i++) {
			var coor = coors[i];
			this.placeStone(coor, color);
		}
	}

	removeStones(coors) {
		for (var i = 0; i < coors.length; i++) {
			this.removeStone(coors[i]);
		}
	}

	showMoveNumber(mn) {
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

		this.board._setElementEventHandler(mnElement);
	}

	unmarkCurrentMoveNumber() {
		if (this.currentMoveNumberElement) {
			var oriColor = this.currentMoveNumberElement.data('oriColor');
			this.currentMoveNumberElement.attr({
				fill : oriColor
			});
			this.currentMoveNumberElement = null;
		}
	}

	showMoveNumbers(moveNumbers) {
		for (var i = 0; i < moveNumbers.length; i++) {
			this.showMoveNumber(moveNumbers[i]);
		}
	}

	hideMoveNumbers() {
		while (this.moveNumberElements.length > 0) {
			this.moveNumberElements.pop().hide();
		}
	}

}


module.exports=StoneManager;

},{"../util":10}],10:[function(require,module,exports){
var yogo = {
	_uid : 1024,
	nextuid : function() {
		yogo._uid++;
		return yogo._uid;
	},

	log : function(msg, category, level) {
		var func = console[level];
		if (!func)
			func = console['log'];
		if (func instanceof Function) {
			if (!category)
				category = 'yogo';
			try {
				func.call(console, category + ':', msg);
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

module.exports=yogo;

},{}]},{},[1]);
