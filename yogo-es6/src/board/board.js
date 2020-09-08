let util=require("../util");
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

		for (let x = 0; x < this.boardSize; x++) {
			this.pointStatusMatrix[x] = [];
			this.lineOrStarMatrix[x] = [];
		}

		this.boardDrawer=new BoardDrawer(this);

		this.centralPoint;

		this.coordinateManager = new CoordinateManager(this);
		util.exportFunctions.call(this, this.coordinateManager, [ 'drawCoordinate',
				'hideCoordinate', 'showCoordinate', 'boardCoorToViewBoxCoor',
				'setXCoordinateType', 'setYCoordinateType', 'coordinateStatus',
				'setFullCoordinate' ]);

		this.stoneManager = new StoneManager(this);
		util.exportFunctions.call(this, this.stoneManager, [ 'placeStone',
				'removeStone', 'addStones', 'removeStones', 'showMoveNumber',
				'showMoveNumbers', 'hideMoveNumbers', 'unmarkCurrentMoveNumber' ]);

		this.markerManager = new MarkerManager(this);
		util.exportFunctions.call(this, this.markerManager,
				[ 'setMarker', 'setMarkers', 'removeMarker', 'removeAllMarkers',
						'markCurrentMove' ]);

		this.labelManager = new LabelManager(this);
		util.exportFunctions.call(this, this.labelManager, [ 'setLabel',
				'setLabels', 'removeLabel', 'removeAllLabels',
				'removeBranchPointLabels' ]);

		this.boardTransformer=new BoardTransformer(this);
		util.exportFunctions.call(this, this.boardTransformer, [ 'zoomBoard',
				'flipHorizontal', 'flipVertical', 'rotateRight',
				'rotateLeft', 'rotate180', 'resetPerspective' ]);

		this.pointClickHandler = function(coor, elementType) {
			util.logWarn('pointClickHandler does not set', 'board');
		};

		this.pointMouseupHandler = function(coor, mousekey) {
			util.logWarn('pointMouseupHandler does not set', 'board');
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

		util.logInfo('viewBox size:' + viewBoxSize, 'board');

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
