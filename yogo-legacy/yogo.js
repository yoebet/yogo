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
	}

	this.pointStatusMatrix = [];
	this.lineOrStarMatrix = [];

	for (var x = 0; x < this.boardSize; x++) {
		this.pointStatusMatrix[x] = [];
	}
	if (this.boardSetting.labels.eraseBoardLine) {
		for (var x = 0; x < this.boardSize; x++) {
			this.lineOrStarMatrix[x] = [];
			for (var y = 0; y < this.boardSize; y++) {
				this.lineOrStarMatrix[x][y] = [];
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
	yogo.exportFunctions.call(this, this.labelManager, [ 'setLabel',
			'setLabels', 'removeLabel', 'removeAllLabels',
			'removeBranchPointLabels' ]);

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

Board.prototype = {

	drawBoard : function() {

		var boardSetting = this.boardSetting;
		var paper = this.paper;

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

		if (boardSetting.labels.eraseBoardLine) {
			this._drawBoardLine();
		} else {
			this._drawBoardLineSimple();
		}

		this.drawCoordinate();
		this._drawBoardStars();

		this._setupMask();
	},

	_setupMask : function() {
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
		for (var x = 0; x < this.boardSize; x++) {
			for (var y = 0; y < this.boardSize; y++) {
				var coor = {
					x : x,
					y : y
				};
				var vbCoor = this.coordinateManager
						.boardCoorToViewBoxCoor(coor);
				var mask = paper.rect(vbCoor.x - maskRadius,
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
	},

	_setElementEventHandler : function(element) {
		element.click(this._pointClickHandler);
		element.mouseup(this._pointMouseupHandler);
	},

	clearBoard : function() {
		for (var x = 0; x < this.pointStatusMatrix.length; x++) {
			var pointStatusX = this.pointStatusMatrix[x];
			for (var y = 0; y < pointStatusX.length; y++) {
				var pointStatus = pointStatusX[y];
				if (pointStatus && pointStatus.color) {
					this.removeStone({
						x : x,
						y : y
					});
				}
			}
		}
		this.removeAllMarkers();
		this.removeAllLabels();
		this.removeBranchPointLabels();
		this.hideMoveNumbers();
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

};Board.Coordinate = function(board) {
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

Board.Coordinate.prototype = {

	_transformCoor : function(coor, isViewBoxCoor) {
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
	},

	_reverseTransformCoor : function(coor, isViewBoxCoor) {
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
	},

	boardCoorToViewBoxCoor : function(coor) {
		var tc = this._transformCoor(coor, false);
		var boardOrigin = this.boardSetting.boardOrigin;
		var gridWidth = this.boardSetting.gridWidth;
		var vx = boardOrigin.x + gridWidth * tc.x;
		var vy = boardOrigin.y + gridWidth * tc.y;
		return {
			x : vx,
			y : vy
		};
	},

	generateCoordinateLabel : function(coor, type) {
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
	},

	drawCoordinate : function() {
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
	},

	setXCoordinateType : function(type) {
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
	},

	setYCoordinateType : function(type) {
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
	},

	redrawCoordinate : function() {
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
	},

	setFullCoordinate : function(full) {
		if (full === this.fullCoordinate) {
			return;
		}
		this.fullCoordinate = full;
		this.redrawCoordinate();
		this.board.setViewBox();
	},

	showCoordinate : function() {
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
	},

	hideCoordinate : function() {
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
	},

	coordinateStatus : function() {
		return {
			show : this.show,
			xType : this.xType,
			yType : this.yType
		};
	},

	getOneAxisWidth : function() {
		return this.setting.coordinatePadding + this.setting.coordinateWidth;
	}
};
Board.Label = function(board) {
	this.board = board;
	this.boardSetting = board.boardSetting;
	this.paper = board.paper;
	this.pointStatusMatrix = board.pointStatusMatrix;
	this.coordinateManager = board.coordinateManager;
	this.lineOrStarMatrix = board.lineOrStarMatrix;

	this.labelPoints = [];
	this.branchPoints = [];
}

Board.Label.prototype = {

	setLabel : function(coor, labelChar, type) {
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
	},

	setLabels : function(coorLabels) {
		for (var i = 0; i < coorLabels.length; i++) {
			var coorLabel = coorLabels[i];
			this.setLabel(coorLabel, coorLabel.label);
		}
	},

	removeLabel : function(coor) {
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
	},

	removeAllLabels : function() {
		while (this.labelPoints.length > 0) {
			this.removeLabel(this.labelPoints.pop());
		}
	},

	removeBranchPointLabels : function() {
		while (this.branchPoints.length > 0) {
			this.removeLabel(this.branchPoints.pop());
		}
	}
};Board.prototype._drawBoardLineSimple = function() {

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
};

Board.prototype._drawBoardLine = function() {

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
};

Board.prototype._drawBoardStars = function() {
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
};
Board.Marker = function(board) {
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

Board.Marker.prototype={

	setupMarkerTemplates: function(){

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
	},

	markCurrentMove: function(coor){
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
	},

	// markerType: TR/CR/SQ/MA
	setMarker: function(coor,markerType){
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
	},

	setMarkers: function(coors,markerType){
		for(var i=0;i<coors.length;i++){
			this.setMarker(coors[i],markerType);
		}
	},

	removeMarker: function(coor){
		var pointStatus=this.pointStatusMatrix[coor.x][coor.y];
		if(!pointStatus||!pointStatus.marker){
			yogo.logWarn('no marker at ('+coor.x+','+coor.y+')','removeMarker');
			return;
		}
		pointStatus.marker=null;
		pointStatus.markerElement.remove();
		pointStatus.markerElement=null;
	},

	removeAllMarkers: function(){
		while(this.markerPoints.length>0){
			this.removeMarker(this.markerPoints.pop());
		}
	}
};Board.getDefaultBoardSetting = function(boardSize) {
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
		outerBorderLine : gridWidth * 0.03,
		borderLine : gridWidth * (boardSize <= 15? 0.018 : 0.025),
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

		this.board._setElementEventHandler(mnElement);
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

};function Game(board, gameModel) {

	this.board = board;
	this.gameModel = gameModel;
	this.boardSize = gameModel.boardSize;

	this._initialNode = new Node(null, gameModel);
	var initialPosition = [];
	for (var x = 0; x < this.boardSize; x++) {
		initialPosition[x] = [];
	}
	this._initialNode.position = initialPosition;
	this._initialNode.nextNode = this.gameModel.nodes[0];

	this.curNode = this._initialNode;

	this._nodeHistory=[];
	this._nodeHistoryIndex=-1;
	this._nodeHistoryMaxIndex=-1;

	// view/find-move/edit
	this.mode = 'view';
	this.autoPlayIntervalSeconds = 1;

	this.board.pointClickHandler = this.onBoardClick.bind(this);
	this.board.pointMouseupHandler = this.onBoardMouseup.bind(this);
	this.onPlayNode = null;
	this.onNodeCreated = null;
	this.onNodeChanged = null;
	this.onNodeRemoved = null;

	this.nodeNavigator = new Game.NodeNavigator(this);
	yogo.exportFunctions.call(this, this.nodeNavigator, [ 'gotoNextX',
			'gotoLastX', 'gotoNode', 'gotoBeginning', 'gotoGameEnd',
			'fastFoward', 'fastBackward', 'goinBranch', 'gotoVariationBegin',
			'gotoVariationEnd', 'backFromVariation' ]);

	this.markersManager = new Game.Markers(this);
	yogo.exportFunctions.call(this, this.markersManager, [
			'setCurrentNodeMarkers', 'setMarkers', 'setMarkCurrentMove',
			'setMarkBranchPoints', 'markBranchPointsIfAny', 'resetMoveNumber',
			'setShowMoveNumber', 'hideMoveNumbers', 'handleMoveNumbers' ]);

	this.editManager = new Game.EditManager(this);
	yogo.exportFunctions.call(this, this.editManager, [ 'setEditMode' ]);
}

Game.prototype = {

	playNode : function(node, context) {
		if (!node) {
			return false;
		}
		var board = this.board;
		var lastNode = this.curNode;
		var curNode = this.curNode = node;
		var success = true;

		if (curNode.status.positionBuilt) {
			if (curNode == lastNode) {
				return false;
			}
			if (lastNode.nextNode == curNode && !curNode.status.capture
					&& !curNode.isSetup()) {
				var movePoint = curNode.move.point;
				if (movePoint) {
					board.placeStone(movePoint, curNode.move.color);
				}
			} else if (lastNode.previousNode == curNode
					&& !lastNode.status.capture && !lastNode.isSetup()) {
				var movePoint = lastNode.move.point;
				if (movePoint) {
					board.removeStone(movePoint);
				}
			} else {
				var diffStones = curNode.diffPosition(lastNode);
				board.removeStones(diffStones.stonesToRemove);
				board.addStones(diffStones.stonesToAddB, 'B');
				board.addStones(diffStones.stonesToAddW, 'W');
			}
		} else {
			var positionBuilder = new PositionBuilder(this.board,
					this.gameModel, curNode);
			success = positionBuilder.buildPosition();
		}
		this.setCurrentNodeMarkers();
		if (typeof (this.onPlayNode) === 'function') {
			this.onPlayNode();
		}

		if(!context || context.nodeHistory !== false){
			if(lastNode == this._initialNode ||
				(lastNode.nextNode !== curNode &&
				 lastNode.previousNode !== curNode)){
				var ni = this._nodeHistoryIndex;
				ni++;
				this._nodeHistory[ni] = curNode;
				this._nodeHistoryIndex = ni;
				this._nodeHistoryMaxIndex = ni;
			}
		}

		return success;
	},

	_historyVisit : function(ni) {
		if(ni < 0 || ni > this._nodeHistoryMaxIndex){
			return false;
		}
		var node = this._nodeHistory[ni];
		if(this.gameModel.nodeMap[node.id]){
			this._nodeHistoryIndex = ni;
			return this.playNode(node, {nodeHistory: false});
		}else {
			this._nodeHistory.splice(ni, 1);
			ni--;
			this._nodeHistoryIndex = ni;
			this._nodeHistoryMaxIndex--;
			return this._historyVisit(ni);
		}
	},

	historyGoback : function() {
		var ni = this._nodeHistoryIndex;
		this._historyVisit(ni-1);
	},

	historyGoforward : function() {
		var ni = this._nodeHistoryIndex;
		this._historyVisit(ni+1);
	},

	buildAllPositions : function() {
		var board = this.board;
		var gameModel = this.gameModel;
		var invalidMoves = [];
		var nodeCallback = function(node) {
			var positionBuilder = new PositionBuilder(board, gameModel, node,
					true);
			var success = positionBuilder.buildPosition();
			if (success === false) {
				invalidMoves.push(node);
				yogo.logWarn('invalid, node ' + node.id, 'buildPosition');
			}
		};
		this.gameModel.traverseNodes(nodeCallback);

		for (var i = 0; i < invalidMoves.length; i++) {
			var node = invalidMoves[i];
			yogo.logWarn('bad move: ' + node.id, 'game');
		}
		return invalidMoves;
	},

	inRealGame : function() {
		return this.curNode.belongingVariation.realGame;
	},

	nextMoveColor : function() {
		return this.curNode.nextMoveColor();
	},

	_boardClickView : function(coor) {
		var nextNode = this.curNode.nextNodeAt(coor);
		if (nextNode) {
			this.playNode(nextNode);
		}
	},

	_boardClickFindAMove : function(coor) {
		var nodeInRealGame;
		var pointMoves = this.gameModel.pointMovesMatrix[coor.x][coor.y];
		if (pointMoves) {
			nodeInRealGame = pointMoves[0];
			for (var i = 1; i < pointMoves.length; i++) {
				var node = pointMoves[i];
				if (node.move.globalMoveNumber <= this.curNode.move.globalMoveNumber) {
					nodeInRealGame = node;
				} else {
					break;
				}
			}
		}
		if (this.inRealGame()) {
			if (nodeInRealGame) {
				this.playNode(nodeInRealGame);
			}
			return;
		}

		var foundNode = this.curNode.findNodeInAncestors(function(node) {
			if (node.belongingVariation.realGame) {
				return false;
			}
			var status = node.position[coor.x][coor.y];
			if (status) {
				return status.node === node;
			}
			return false;
		});
		if (foundNode) {
			this.game.playNode(foundNode);
			return;
		}
		if (nodeInRealGame) {
			var rgbn = this.curNode.belongingVariation.realGameBaseNode();
			if (nodeInRealGame.move.globalMoveNumber <= rgbn.move.globalMoveNumber) {
				this.playNode(nodeInRealGame);
				return;
			}
		}

		foundNode = this.curNode.findNodeInSuccessors(function(node) {
			var status = node.position[coor.x][coor.y];
			if (status) {
				return status.node === node;
			}
			return false;
		});
		if (foundNode) {
			this.playNode(foundNode);
		}
	},

	onBoardClick : function(coor, elementType) {
		// yogo.logInfo('(' + coor.x + ',' + coor.y + ') clicked', 'board');
		if (this.mode === 'view') {
			this._boardClickView(coor);
			return;
		}
		if (this.mode === 'find-move') {
			this._boardClickFindAMove(coor);
			return;
		}
		if (this.mode === 'auto-play') {
			this.startAutoPlay();
			return;
		}
		if (this.mode === 'edit') {
			this.editManager.onBoardClick(coor);
			return;
		}
	},

	onBoardMouseup : function(coor, mousekey) {
		// yogo.logInfo('(' + coor.x + ',' + coor.y + ') mouseup, mousekey: '
		// 		+ mousekey, 'board');
		if (this.mode === 'edit') {
			this.editManager.onBoardMouseup(coor, mousekey);
			return;
		}
	},

	setMode : function(mode) {
		this.mode = mode;
	},

	passMove : function() {
		if (this.mode !== 'edit') {
			return false;
		}
		this.editManager.passMove();
	},

	removeLastNode : function() {
		if (this.mode !== 'edit') {
			return false;
		}
		this.editManager.removeLastNode();
	},

	setPlayFirst : function(color) {
		if (this.mode !== 'edit') {
			return false;
		}
		this.editManager.setPlayFirst(color);
	},

	startAutoPlay : function() {
		if(this.autoPlayHandler){
			return false;
		}
		var autoPlayFun;
		autoPlayFun=function(){
			var success=this.nextNode();
			if(success){
				this.autoPlayHandler=setTimeout(autoPlayFun, this.autoPlayIntervalSeconds * 1000);
			}else{
				this.stopAutoPlay();
			}
		}.bind(this);
		this.autoPlayHandler=setTimeout(autoPlayFun, this.autoPlayIntervalSeconds * 1000);
	},

	stopAutoPlay : function() {
		clearTimeout(this.autoPlayHandler);
		this.autoPlayHandler=null;
	},

	setAutoPlayInterval : function(seconds) {
		if(typeof(seconds)==='string'){
			seconds=parseFloat(seconds);
		}
		if(typeof(seconds)!=='number' || isNaN(seconds)){
			return;
		}
		this.autoPlayIntervalSeconds=seconds;
	}

};

Game.getHandicapPoints = function(boardSize, handicap) {
	var s = boardSize;
	var sd = 4;
	if (s < 13) {
		sd = 3;
	}

	var stars=[
		[{x:sd - 1,y:sd - 1},{x:(s - 1) / 2,y:sd - 1},{x:s - sd,y:sd - 1}],
		[{x:sd - 1,y:(s - 1) / 2},{x:(s - 1) / 2,y:(s - 1) / 2},{x:s - sd,y:(s - 1) / 2}],
		[{x:sd - 1,y:s - sd},{x:(s - 1) / 2,y:s - sd},{x:s - sd,y:s - sd}]
	];
	var r = [ stars[2][0], stars[0][2] ];
	if (handicap == 2) {
		return r;
	}
	r.push(stars[0][0]);
	if (handicap == 3) {
		return r;
	}
	r.push(stars[2][2]);
	if (handicap == 4) {
		return r;
	}
	if (handicap == 5) {
		r.push(stars[1][1]);
		return r;
	}
	r.push(stars[1][0]);
	r.push(stars[1][2]);
	if (handicap == 6) {
		return r;
	}
	if (handicap == 7) {
		r.push(stars[1][1]);
		return r;
	}
	r.push(stars[0][1]);
	r.push(stars[2][1]);
	if (handicap == 8) {
		return r;
	}
	r.push(stars[1][1]);
	return r;
};
Game.EditManager = function(game) {

	this.game = game;
	this.board = game.board;
	this.gameModel = game.gameModel;

	// play
	// setup: W/B
	// label: a/A
	// mark: CR/SQ/MA/TR
	// set-move-number: num
	// set-play-first: W/B
	this.editMode = 'play';

	this.modeParam = null;
	this._lastLabel = null;
	this._lastLabelNode = null;
};

Game.EditManager.prototype = {

	setEditMode : function(mode, param) {
		this.editMode = mode;
		this.modeParam = param;
		if (this.editMode === 'label') {
			this._lastLabel = null;
			this._lastLabelNode = null;
		}
	},

	onBoardClick : function(coor) {

		// yogo.logInfo('edit mode: ' + this.editMode + ' '
		// 		+ (this.modeParam || ''));
		if (this.editMode === 'play') {
			this.playMove(coor);
			return;
		}
		if (this.editMode === 'setup') {
			this.setup(coor);
			return;
		}
		if (this.editMode === 'label') {
			this.addLabel(coor);
			return;
		}
		if (this.editMode === 'mark') {
			this.addMarker(coor);
			return;
		}
	},

	onBoardMouseup : function(coor, mousekey) {
		// yogo.logInfo('edit mode: ' + this.editMode + ' '
		// 		+ (this.modeParam || ''));
		if (this.editMode === 'play' && mousekey === 3) {
			this.removeLastNode();
			return;
		}
		if (this.editMode === 'setup') {
			this.setup(coor, (mousekey === 3));
			return;
		}
		// if(this.editMode==='label'){
		// this.addLabel(coor);
		// return;
		// }
		// if(this.editMode==='mark'){
		// this.addMarker(coor);
		// return;
		// }
	},

	stillNewGame : function() {
		var curNode = this.game.curNode;
		var beginingNode = this.gameModel.nodes[0];
		return (curNode === beginingNode && !curNode.status.move && curNode
				.isVariationLastNode());
	},

	setPlayFirst : function(color) {
		var curNode = this.game.curNode;
		var nextColor = (curNode.move.color === 'B') ? 'W' : 'B';
		if (nextColor == color) {
			if (curNode.move['PL']) {
				curNode.move['PL'] = null;
			}
			return;
		}
		curNode.move['PL'] = color;
	},

	passMove : function() {
		if (this.editMode !== 'play') {
			return false;
		}

		var curNode = this.game.curNode;
		var color = curNode.nextMoveColor();

		var enn = curNode.nextPass(color);
		if (enn) {
			this.game.playNode(enn);
			return false;
		}

		var newNode = new Node(curNode);
		newNode.status.pass = true;
		newNode.move.color = color;

		return this._addNewNode(newNode);
	},

	playMove : function(coor) {
		var curNode = this.game.curNode;

		var enn = curNode.nextNodeAt(coor);
		if (enn) {
			this.game.playNode(enn);
			return false;
		}

		var pointStatus = curNode.position[coor.x][coor.y];
		if (pointStatus) {
			return false;
		}

		var color = curNode.nextMoveColor();
		var useCurrentNode = this.stillNewGame() && !curNode.isSetup()
				&& !curNode.move['PL'];
		if (!useCurrentNode) {
			createNewNode = true;
			curNode = new Node(curNode);
		}
		curNode.move.color = color;
		curNode.move[color] = {
			x : coor.x,
			y : coor.y
		};
		curNode.move.point = curNode.move[color];
		curNode.status.move = true;

		if (useCurrentNode) {
			PositionBuilder.amendAddStone(this.game, curNode, coor, color);
			curNode.setMoveNumber();
			this.game.setCurrentNodeMarkers();
			this.gameModel.indexNode(curNode);
			if (this.game.onNodeChanged) {
				this.game.onNodeChanged(curNode);
			}
		} else {
			return this._addNewNode(curNode);
		}
	},

	_addNewNode : function(newNode) {
		var curNode = this.game.curNode;
		var nextNode = curNode.nextNode;
		var variation = curNode.belongingVariation;

		newNode.belongingVariation = variation;
		var positionBuilder = new PositionBuilder(this.board, this.gameModel,
				newNode, true);
		var valid = positionBuilder.buildPosition();
		if (!valid) {
			return false;
		}

		if (curNode.isVariationLastNode()) {
			curNode.nextNode = newNode;
			if (variation.realGame) {
				this.gameModel.gameEndingNode = newNode;
			}
			variation.nodes.push(newNode);
		} else if (curNode.variations) {
			var newVariation = new Variation(curNode, variation);
			newVariation.index = curNode.variations.length;
			curNode.variations.push(newVariation);

			newNode.belongingVariation = newVariation;
			newVariation.nodes.push(newNode);

			curNode.setBranchPoints();
		} else if (nextNode) {
			curNode.nextNode = null;
			curNode.variations = [];

			var newVariation1 = new Variation(curNode, variation);
			newVariation1.realGame = variation.realGame;
			curNode.variations.push(newVariation1);

			var node = nextNode;
			while (node) {
				node.belongingVariation = newVariation1;
				newVariation1.nodes.push(node);
				if (node.variations) {
					for (var vi = 0; vi < node.variations.length; vi++) {
						var tv = node.variations[vi];
						tv.parentVariation = newVariation1;
					}
				}
				node = node.nextNode;
			}

			var pns = curNode.belongingVariation.nodes;
			var ci = pns.indexOf(curNode);
			var spliceLength = newVariation1.nodes.length;
			pns.splice(ci + 1, spliceLength);

			var newVariation2 = new Variation(curNode, variation);
			curNode.variations.push(newVariation2);
			newNode.belongingVariation = newVariation2;
			newVariation2.nodes.push(newNode);

			curNode.setBranchPoints();
		}

		newNode.setMoveNumber();
		this.gameModel.indexNode(newNode);

		newNode.status.alter = true;
		newNode.alter = {
			type : 'new-node'
		};

		this.game.playNode(newNode);

		if (this.game.onNodeCreated) {
			this.game.onNodeCreated(newNode);
		}

		return true;
	},

	removeLastNode : function() {
		if (this.editMode !== 'play') {
			return false;
		}

		var curNode = this.game.curNode;
		if (!curNode.isVariationLastNode()) {
			return false;
		}

		var baseNode = curNode.previousNode;
		var variation = curNode.belongingVariation;

		if (!curNode.isVariationFirstNode()) {
			baseNode.nextNode = null;
			if (variation.realGame) {
				this.game.gameEndingNode = baseNode;
			}

			this.gameModel.unindexNode(curNode);
			this.game.playNode(baseNode);

			if (this.game.onNodeRemoved) {
				this.game.onNodeRemoved(curNode);
			}
			return;
		}

		// first node of a variation

		var isBeginingNode = (curNode === this.gameModel.nodes[0]);
		if (isBeginingNode && !curNode.variations) {
			if (curNode.status.move) {
				PositionBuilder.amendRemoveStone(this.game, curNode);
				curNode.status.move = false;
				curNode.move.point = null;
				curNode.move.color = null;
				this.board.markCurrentMove(null);

				if (this.game.onNodeChanged) {
					this.game.onNodeChanged(curNode);
				}
			}
			return;
		}

		var newVariation0 = null;
		var variationToRemove = variation;
		var variations = baseNode.variations;
		var pVariation = baseNode.belongingVariation;
		var removeFirst = (variationToRemove.index == 0);
		if (removeFirst) {
			newVariation0 = variations[1];
		}
		var noVariations = false;
		if (variations.length == 2) {
			var remainVariation = variations[removeFirst ? 1 : 0];
			baseNode.nextNode = remainVariation.nodes[0];
			baseNode.variations = null;
			baseNode.branchPoints = null;
			noVariations = true;
		} else {// variations.length>2
			variations.splice(variationToRemove.index, 1);
			baseNode.setBranchPoints();
		}

		this.gameModel.unindexNode(curNode);

		if (removeFirst) {

			if (!noVariations) {
				if (newVariation0.index == 0
						&& newVariation0.parentVariation.realGame) {
					newVariation0.realGame = true;
				}
			}

			var gameModel = this.gameModel;
			var setNodeMN = function(node) {
				node.setMoveNumber();
				if (node.belongingVariation.realGame) {
					var mn = node.move.variationMoveNumber;
					gameModel.nodesByMoveNumber[mn] = node;
					if (node.isVariationLastNode()) {
						gameModel.gameEndingNode = node;
					}
				}
			};
			var node = newVariation0.nodes[0];
			while (node) {
				if (noVariations) {
					node.belongingVariation = pVariation;
				}
				setNodeMN.call(node, node);
				if (node.variations) {
					for (var vi = 0; vi < node.variations.length; vi++) {
						var tv = node.variations[vi];
						tv.parentVariation = node.belongingVariation;

						var variationCallback = null;
						if (vi == 0 && node.belongingVariation.realGame) {
							variationCallback = function(v) {
								if (v.index == 0 && v.parentVariation.realGame) {
									v.realGame = true;
								}
							};
							variationCallback.call(tv, tv);
						}
						tv.traverseNodes(setNodeMN, variationCallback);
					}
				}
				node = node.nextNode;
			}
		}

		this.game.playNode(baseNode);

		if (this.game.onNodeRemoved) {
			this.game.onNodeRemoved(curNode, newVariation0);
		}
	},

	setup : function(coor, reverse) {
		var curNode = this.game.curNode;
		var pointStatus = curNode.position[coor.x][coor.y];
		if (pointStatus) {
			if (pointStatus.node === curNode && curNode.isSetup()) {
				var positionBuilder = new PositionBuilder(this.board,
						this.gameModel, curNode);
				var reverseColor = 'W';
				var removed = yogo.removePoint(curNode.setup['AB'], coor);
				if (!removed) {
					removed = yogo.removePoint(curNode.setup['AW'], coor);
					reverseColor = 'B';
				}
				if (removed) {
					PositionBuilder.amendRemoveStone(this.game, curNode, coor);
				}
				if (reverse) {
					var pn = 'A' + reverseColor;
					if (!curNode.setup[pn]) {
						curNode.setup[pn] = [];
					}
					curNode.setup[pn].push({
						x : coor.x,
						y : coor.y
					});
					PositionBuilder.amendAddStone(this.game, curNode, coor,
							reverseColor);
				}
				return true;
			}
			return false;
		}
		if (this.modeParam !== 'B' && this.modeParam !== 'W') {
			return false;
		}

		var color = this.modeParam;
		if (reverse) {
			color = (color == 'B') ? 'W' : 'B';
		}
		var createNewNode = false;
		if ((curNode.status.alter && curNode.isSetup()) || this.stillNewGame()) {
			PositionBuilder.amendAddStone(this.game, curNode, coor, color);
			if (!curNode.isSetup() && this.game.onNodeChanged) {
				this.game.onNodeChanged(curNode);
			}
		} else {
			curNode = new Node(curNode);
			createNewNode = true;
		}

		if (!curNode.setup) {
			curNode.setup = {};
		}
		var propName = 'A' + color;
		if (!curNode.setup[propName]) {
			curNode.setup[propName] = [];
		}
		curNode.setup[propName].push({
			x : coor.x,
			y : coor.y
		});

		if (createNewNode) {
			return this._addNewNode(curNode);
		}

		return true;
	},

	addLabel : function(coor) {
		var curNode = this.game.curNode;
		if (this._lastLabelNode !== curNode) {
			this._lastLabel = null;
		}
		var label;
		if (this._lastLabel) {
			label = String.fromCharCode(this._lastLabel.charCodeAt(0) + 1);
		} else {
			label = this.modeParam;
		}

		var labels = curNode.marks && curNode.marks['LB'];
		var removed = false;
		if (labels) {
			removed = yogo.removePoint(labels, coor);
		}
		if (removed) {
			this.board.removeLabel(coor);
		} else {
			if (!curNode.marks) {
				curNode.marks = {};
			}
			if (!curNode.marks['LB']) {
				labels = curNode.marks['LB'] = [];
			}
			labels.push({
				x : coor.x,
				y : coor.y,
				label : label
			});
			this.board.setLabel(coor, label);
			this._lastLabel = label;
			this._lastLabelNode = curNode;
		}
		curNode.status.alter = true;
		if (!curNode.alter) {
			curNode.alter = {
				type : 'prop-changed'
			};
		}
	},

	addMarker : function(coor) {
		var curNode = this.game.curNode;
		var marker = this.modeParam;

		var markers = curNode.marks && curNode.marks[marker];
		var removed = false;
		if (markers) {
			removed = yogo.removePoint(markers, coor);
		}
		if (removed) {
			this.board.removeMarker(coor);
		} else {
			if (!curNode.marks) {
				curNode.marks = {};
			}
			if (!curNode.marks[marker]) {
				markers = curNode.marks[marker] = [];
			}
			markers.push({
				x : coor.x,
				y : coor.y
			});
			this.board.setMarker(coor, marker);
		}
		curNode.status.alter = true;
		if (!curNode.alter) {
			curNode.alter = {
				type : 'prop-changed'
			};
		}
	}
};
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
		this.showMoveNumbers();
	},

	showMoveNumbers : function() {
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
			if (node.move['MN']) {
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
		var curNode = this.game.curNode;
		if (curNode.hasMarks()) {
			this.hideMoveNumberTemporarily = true;
			this.hideMoveNumbers();
			return;
		}
		if (this.hideMoveNumberTemporarily) {
			this.hideMoveNumberTemporarily = false;
		}

		this.showMoveNumbers();
	},

	resetMoveNumber : function(mn) {
		var curNode = this.game.curNode;
		
		if (mn === 'undo'){
			if (typeof(curNode.move['MN']) === 'undefined') {
				return;
			}
			curNode.move['MN'] = null;
		} else {
			if (typeof(mn) === 'string'){
				mn=parseInt(mn);
			}
			mn = mn || 1;
			if(curNode.move['MN'] === mn){
				return;
			}
			curNode.move['MN'] = mn;
		}

		curNode.resetMoveNumber();
		this.handleMoveNumbers();
	}
};
Game.NodeNavigator = function(game) {
	this.game = game;
	this.gameModel = game.gameModel;

	var trueFunc = function() {
		return true
	};
	var hasVariation = function(node) {
		return !!node.variations;
	};
	var hasCommentOrVariation = function(node) {
		return node.hasComment() || !!node.variations;
	};
	var isKo = function(node) {
		var s = node.status;
		return s.positionBuilt && (s.startKo || s.ko);
	};
	var isCapture = function(node) {
		return node.status.positionBuilt && node.status.capture;
	};
	var notEvaluated = function(node) {
		return !node.status.positionBuilt;
	};

	var navigationFuncs = [ {
		name : 'Node',
		predicate : trueFunc
	}, {
		name : 'Branch',
		predicate : hasVariation
	}, {
		name : 'Comment',
		predicate : Node.prototype.hasComment
	}, {
		name : 'CommentOrBranch',
		predicate : hasCommentOrVariation
	}, {
		name : 'Remark',
		predicate : Node.prototype.hasRemark
	}, {
		name : 'Marks',
		predicate : Node.prototype.hasMarks
	}, {
		name : 'Ko',
		predicate : isKo
	}, {
		name : 'Capture',
		predicate : isCapture
	}, {
		name : 'NotEvaluated',
		predicate : notEvaluated
	} ];

	var newNavigation = function(navi, predicate) {
		return function() {
			return navi.call(this, predicate);
		}.bind(this);
	}.bind(this);

	for (var ni = 0; ni < navigationFuncs.length; ni++) {
		var nf = navigationFuncs[ni];
		var navi = nf.navi, predicate = nf.predicate;
		var nextFn = 'next' + nf.name, previousFn = 'previous' + nf.name;
		this.game[nextFn] = this[nextFn] = newNavigation(this.gotoNextX,
				predicate);
		this.game[previousFn] = this[previousFn] = newNavigation(
				this.gotoLastX, predicate);
	}
};

Game.NodeNavigator.prototype = {

	gotoNextX : function(predicate) {
		var node = this.game.curNode;
		var found = node.findNodeInMainline(predicate);
		if (found) {
			return this.game.playNode(found);
		}
		return false;
	},

	gotoLastX : function(predicate) {
		var node = this.game.curNode;
		var found = node.findNodeInAncestors(predicate);
		if (found) {
			return this.game.playNode(found);
		}
		return false;
	},

	gotoNode : function(obj) {
		var node;
		if(/^\d+$/.test(obj)){
			obj = parseInt(obj);
		}
		if (typeof (obj) === 'string') {
			node = this.gameModel.nodeMap[obj];
		} else if (typeof (obj) === 'number') {
			node = this.gameModel.nodesByMoveNumber[obj];
		} else if (obj instanceof Node) {
			node = obj;
		}
		if (node) {
			return this.game.playNode(node);
		}
		return false;
	},

	gotoBeginning : function() {
		var firstNode = this.gameModel.nodes[0];
		return this.game.playNode(firstNode);
	},

	gotoGameEnd : function() {
		return this.game.playNode(this.gameModel.gameEndingNode);
	},

	fastFoward : function(n) {
		n = n || 10;
		var node = this.game.curNode;
		for (; n > 0; n--) {
			if (node.nextNode) {
				node = node.nextNode;
			} else if (node.variations) {
				node = node.variations[0].nodes[0];
			} else {
				break;
			}
		}
		return this.game.playNode(node);
	},

	fastBackward : function(n) {
		n = n || 10;
		var node = this.game.curNode;
		for (; n > 0; n--) {
			if (node.previousNode) {
				node = node.previousNode;
			} else {
				break;
			}
		}
		return this.game.playNode(node);
	},

	goinBranch : function(branch) {
		var variations = this.game.curNode.variations;
		if (variations) {
			var variation;
			if (typeof (branch) === 'number') {
				variation = variations[branch];
			} else if (typeof (branch) === 'string' && branch.length == 1) {
				var vi = branch.charCodeAt(0) - 65;
				variation = variations[vi];
			}
			if (variation) {
				var node = variation.nodes[0];
				return this.game.playNode(node);
			}
		}
		return false;
	},

	gotoVariationBegin : function() {
		if (this.game.inRealGame()) {
			return false;
		}
		if (this.game.curNode.isVariationFirstNode()) {
			return false;
		}
		return this.gotoLastX(function(node) {
			return node.isVariationFirstNode();
		});
	},

	gotoVariationEnd : function() {
		if (this.game.inRealGame()) {
			return false;
		}
		if (this.game.curNode.isVariationLastNode()) {
			return false;
		}
		return this.gotoNextX(function(node) {
			return node.isVariationLastNode();
		});
	},

	backFromVariation : function() {
		if (this.game.inRealGame()) {
			return false;
		}
		return this.game
				.playNode(this.game.curNode.belongingVariation.baseNode);
	}
};
PositionBuilder = function(board, gameModel, node, buildPositionOnly) {
	this.board = board;
	this.gameModel = gameModel;
	this.boardSize = gameModel.boardSize;
	this.curNode = node;
	this.buildPositionOnly = buildPositionOnly || false;

	this.basePosition = null;
	this.position = [];
}

PositionBuilder.prototype = {

	getPointColor : function(x, y) {
		var status = (this.position[x] || this.basePosition[x])[y];
		if (status) {
			return status.color;
		}
		return null;
	},

	setPointColor : function(x, y, color) {
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
		for (var yi = 0; yi < this.basePosition[x].length; yi++) {
			this.position[x][yi] = this.basePosition[x][yi];
		}
		this.position[x][y] = status;
	},

	getFinalPosition : function() {
		for (var x = 0; x < this.boardSize; x++) {
			if (!this.position[x]) {
				this.position[x] = this.basePosition[x];
			}
		}
		return this.position;
	},

	setPointsStatus : function(points, color) {
		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			this.setPointColor(point.x, point.y, color);
		}
	},

	getAdjacentPointsStatus : function(point) {
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
		for (var direction = 0; direction < 4; direction++) {
			var adjacentPoint = adjacentPoints[direction];
			var x = adjacentPoint.x, y = adjacentPoint.y;
			if (x >= 0 && y >= 0 && x < boardSize && y < boardSize) {
				adjacentPoint.color = this.getPointColor(x, y);
			} else {
				adjacentPoints[direction] = null;
			}
		}
		return adjacentPoints;
	},

	traverseGroup : function(startPoint, color, callback) {

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

			for (var direction = 0; direction < 4; direction++) {
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
	},

	checkGroupLiberties : function(startPoint, color) {

		var groupPoints = [];
		var callback = function(point, adjacentPointsStatus) {
			groupPoints.push(point);
			for (var direction = 0; direction < 4; direction++) {
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
	},

	removeStones : function(points, processRange) {
		if (processRange) {
			for (var i = 0; i < points.length; i++) {
				var point = points[i];
				if (point.coorFrom) {
					var rangePoints = yogo.evaluatePointRange(point.coorFrom,
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
	},

	addStones : function(points, color, processRange) {
		if (processRange) {
			for (var i = 0; i < points.length; i++) {
				var point = points[i];
				if (point.coorFrom) {
					var rangePoints = yogo.evaluatePointRange(point.coorFrom,
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
	},

	checkOpponentLiberties : function(point, opponentColor) {
		var capturedStones = [];
		var adjacentPointsStatus = this.getAdjacentPointsStatus(point);
		for (var direction = 0; direction < 4; direction++) {
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
	},

	evaluateMove : function() {
		var curNode = this.curNode;
		var color = curNode.move.color;
		var point = curNode.move.point;

		var pointColor = this.getPointColor(point.x, point.y);
		if (pointColor) {
			yogo.logWarn('point occupied: (' + point.x + ',' + point.y + ','
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
						yogo.logWarn('ko, cann\'t recapture immediately: ('
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
							// yogo.logInfo('ko: (' + point.x + ',' + point.y
							// + ',' + color + ')', 'play move');
						}
					}
				}
			}
			// if(capturedStones.length>0){
			// yogo.logInfo('('+point.x+','+point.y+') capture '+opponentColor+'
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
				yogo.logWarn('is self capture? (' + point.x + ',' + point.y
						+ ',' + color + ')', 'play move');
				this.setPointColor(point.x, point.y, null);
				if (!this.buildPositionOnly) {
					this.board.removeStone(point);
				}
				return false;
			}
		}

		return true;
	},

	buildPosition : function() {
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
			for (var x = 0; x < this.boardSize; x++) {
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
				for (var pi = 0; pi < points.length; pi++) {
					var point = points[pi];
					if (point.coorFrom) {
						var rangePoints = yogo.evaluatePointRange(
								point.coorFrom, point.coorTo);
						for (var ri = 0; ri < rangePoints.length; ri++) {
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
};

PositionBuilder.amendAddStone = function(game, node, point, color) {

	var position = node.position;
	var x = point.x, y = point.y;
	if (position[x][y]) {
		yogo.logWarn('the point is not empty', 'amend');
		return;
	}

	var positionX = position[x];
	var newPositionX = [];
	for (var yi = 0; yi < positionX.length; yi++) {
		newPositionX[yi] = positionX[yi];
	}
	newPositionX[y] = {
		color : color,
		node : node
	};
	position[x] = newPositionX;

	var board = game.board;
	board.placeStone(point, color);
};

PositionBuilder.amendRemoveStone = function(game, node, point) {

	var position = node.position;
	point = point || node.move.point;
	var x = point.x, y = point.y;
	if (!position[x][y]) {
		yogo.logWarn('the point is empty', 'amend');
		return;
	}

	var positionX = position[x];
	var newPositionX = [];
	for (var yi = 0; yi < positionX.length; yi++) {
		newPositionX[yi] = positionX[yi];
	}
	newPositionX[y] = null;
	position[x] = newPositionX;

	var board = game.board;
	board.removeStone(point);
};
function GameModel() {
	this.realGame = true;
	this.boardSize = null;
	this.nodes = [];
	this.gameInfo = {};

	this.nodeMap = {};
	this.nodesByMoveNumber = [];
	this.pointMovesMatrix = [];

	this.gameEndingNode = null;
}

GameModel.newModel = function(boardSize, handicapPoints) {

	var gameModel = new GameModel();
	gameModel.boardSize = boardSize;
	for (var x = 0; x < gameModel.boardSize; x++) {
		gameModel.pointMovesMatrix[x] = [];
	}

	var firstNode = new Node(null, gameModel);
	gameModel.indexNode(firstNode);
	gameModel.nodes[0] = firstNode;
	gameModel.gameEndingNode = firstNode;

	if (handicapPoints && handicapPoints.length > 0) {
		var gameInfo = gameModel.gameInfo;
		gameInfo.rule = {};
		gameInfo.rule['HA'] = handicapPoints.length;
		firstNode.setup = {
			'AB' : handicapPoints
		};
	}

	return gameModel;
}

GameModel.prototype = {

	indexNode : function(node) {
		this.nodeMap[node.id] = node;
		var realGame = node.belongingVariation.realGame;
		if (realGame) {
			var point = node.move.point;
			if (point) {
				var pointMovesX = this.pointMovesMatrix[point.x];
				var pointMoves = pointMovesX[point.y];
				if (pointMoves) {
					pointMoves.push(node);
				} else {
					pointMoves = [ node ];
					pointMovesX[point.y] = pointMoves;
				}
			}
			if (node.move.color) {
				var mn = node.move.variationMoveNumber;
				this.nodesByMoveNumber[mn] = node;
			}
		}
	},

	unindexNode : function(node) {
		this.nodeMap[node.id] = null;
		var realGame = node.belongingVariation.realGame;
		if (realGame) {
			var point = node.move.point;
			if (point) {
				var pointMovesX = this.pointMovesMatrix[point.x];
				var pointMoves = pointMovesX[point.y];
				if (pointMoves) {
					var index = pointMoves.indexOf(node);
					if (index >= 0) {
						pointMoves.splice(index, 1);
					}
				}
			}
			if (node.move.color) {
				var mn = node.move.variationMoveNumber;
				this.nodesByMoveNumber[mn] = null;
			}
		}
	},

	traverseNodes : function(nodeCallback, variationCallback,
			variationCompleteCallback) {

		var nodes = this.nodes;
		for (var ni = 0; ni < nodes.length; ni++) {
			var node = nodes[ni];
			if (nodeCallback) {
				var ncr = nodeCallback.call(node, node);
				if (ncr === false) {
					return;
				}
			}
			var variations = node.variations;
			if (!variations) {
				continue;
			}
			for (var vi = 0; vi < variations.length; vi++) {
				var variation = variations[vi];
				if (variationCallback) {
					var vcr = variationCallback.call(variation, variation);
					if (vcr === false) {
						return;
					}
				}
				variation.traverseNodes(nodeCallback, variationCallback,
						variationCompleteCallback);
				if (variationCompleteCallback) {
					var vcr = variationCompleteCallback.call(variation,
							variation);
					if (vcr === false) {
						return;
					}
				}
			}
		}

		return;
	},

	selectNodes : function(predicate) {
		var nodes = [];
		this.traverseNodes(function(node) {
			if (predicate.call(node, node)) {
				nodes.push(node);
			}
		});
		return nodes;
	},

	findNode : function(predicate) {
		var found = [];
		this.traverseNodes(function(node) {
			var result = predicate.call(node, node);
			if (result === null) {
				return false;
			}
			if (result === true) {
				found.push(node);
				return false;
			}
		});

		return found[0] || null;
	}
};

function Variation(baseNode, parentVariation) {
	this.baseNode = baseNode;
	this.parentVariation = parentVariation;
	this.realGame = false;
	this.nodes = [];
	this.index = 0;
	this.id = 'v' + yogo.nextuid();
}

Variation.prototype = {
	nextVariation : function() {
		var variations = this.baseNode.variations;
		var nextVindex = (this.index + 1) % variations.length;
		if (nextVindex == 0) {
			nextVindex = 1;
		}
		return variations[nextVindex];
	},

	previousVariation : function() {
		var variations = this.baseNode.variations;
		var nextVindex = (this.index - 1 + variations.length)
				% variations.length;
		if (nextVindex == 0) {
			nextVindex = variations.length - 1;
		}
		return variations[nextVindex];
	},

	realGameBaseNode : function() {
		var variation = this;
		while (variation && !variation.realGame) {
			if (variation.parentVariation.realGame) {
				return variation.baseNode;
			}
			variation = variation.parentVariation;
		}
	}

};

Variation.prototype.traverseNodes = GameModel.prototype.traverseNodes;
Variation.prototype.selectNodes = GameModel.prototype.selectNodes;
Variation.prototype.findNode = GameModel.prototype.findNode;

function Node(previousNode, belongingVariation) {
	this.previousNode = previousNode;
	this.belongingVariation = belongingVariation;
	this.nextNode = null;
	this.props = {};
	this.basic = {};
	this.move = {};
	this.status = {};
	this.id = 'n' + yogo.nextuid();
	this.position = null;

	if (!previousNode) {
		this.setMoveNumber();
	}
}

Node.prototype = {

	isVariationFirstNode : function() {
		var pn = this.previousNode;
		return !pn || pn.belongingVariation !== this.belongingVariation;
	},

	isVariationLastNode : function() {
		return !this.nextNode && !this.variations;
	},

	isGameBegining : function() {
		var pn = this.previousNode;
		var v = this.belongingVariation;
		// !pn && v.realGame && !v.parentVariation
		return (!pn && v instanceof GameModel);
	},

	isSetup : function() {
		return !!this.setup;
	},

	hasComment : function() {
		return !!(this.basic && this.basic['C']);
	},

	hasMarks : function() {
		return !!this.marks;
	},

	hasRemark : function() {
		return !!this.remark;
	},

	findNodeInAncestors : function(predicate) {
		var node = this;
		while (true) {
			node = node.previousNode;
			if (!node) {
				return null;
			}
			var result = predicate.call(node, node);
			if (result === null) {
				return null;
			}
			if (result === true) {
				return node;
			}
		}
	},

	findNodeInMainline : function(predicate) {
		var node = this;
		while (true) {
			if (node.nextNode) {
				node = node.nextNode;
			} else if (node.variations) {
				node = node.variations[0].nodes[0];
			} else {
				return null;
			}
			var result = predicate.call(node, node);
			if (result === null) {
				return null;
			}
			if (result === true) {
				return node;
			}
		}
	},

	findNodeInSuccessors : function(predicate) {
		var node = this;
		while (true) {
			if (node.nextNode) {
				node = node.nextNode;
			} else if (node.variations) {
				for (var vi = 0; vi < node.variations.length; vi++) {
					var variation = node.variations[vi];
					var foundNode = variation.findNode(predicate);
					if (foundNode) {
						return foundNode;
					}
				}
			} else {
				return null;
			}
			var result = predicate.call(node, node);
			if (result === null) {
				return null;
			}
			if (result === true) {
				return node;
			}
		}
	},

	traverseSuccessorNodes : function(nodeCallback, variationCallback) {
		var node = this;
		while (true) {
			if (node.nextNode) {
				node = node.nextNode;
			} else if (node.variations) {
				for (var vi = 0; vi < node.variations.length; vi++) {
					var variation = node.variations[vi];
					if (variationCallback) {
						var vcr = variationCallback.call(variation, variation,
								null);
						if (vcr === false) {
							return false;
						}
					}
					var goon = variation.traverseNodes(nodeCallback,
							variationCallback);
					if (goon === false) {
						return false;
					}
				}
			} else {
				return true;
			}
			var goon = nodeCallback.call(node, node);
			if (goon === false) {
				return false;
			}
		}
	},

	nextNodeAt : function(coor) {
		var nextNode = this.nextNode;
		if (nextNode && nextNode.move.point) {
			var point = nextNode.move.point;
			if (coor.x === point.x && coor.y === point.y) {
				return nextNode;
			}
			return null;
		}
		if (this.branchPoints) {
			for (var i = 0; i < this.branchPoints.length; i++) {
				var point = this.branchPoints[i];
				if (coor.x === point.x && coor.y === point.y) {
					var variation = this.variations[i];
					return variation.nodes[0];
				}
			}
		}
		return null;
	},

	nextPass : function(color) {
		var nextNode = this.nextNode;
		if (nextNode && nextNode.status.pass) {
			if (nextNode.move.color == color) {
				return nextNode;
			}
			return null;
		}
		if (this.variations) {
			for (var i = 0; i < this.variations.length; i++) {
				var variation = this.variations[i];
				var node0 = variation.nodes[0];
				if (node0.status.pass && node0.move.color == color) {
					return node0;
				}
			}
		}
		return null;
	},

	nextMoveColor : function() {
		var color;
		if (this.move['PL']) {
			color = this.move['PL'];
		} else if (this.move.color) {
			color = (this.move.color === 'B') ? 'W' : 'B';
		} else if (this.isGameBegining()) {
			var v = this.belongingVariation;
			// v is GameModel
			if (v.gameInfo.rule && v.gameInfo.rule['HA']) {
				color = 'W';
			}
		}
		if (!color) {
			color = 'B';
		}
		return color;
	},

	setMoveNumber : function() {
		var playOrPass = this.status.move || this.status.pass;
		var mns;
		if (this.previousNode) {
			var lastMove = this.previousNode.move;
			mns = [ lastMove.displayMoveNumber + (playOrPass ? 1 : 0),
					lastMove.variationMoveNumber + (playOrPass ? 1 : 0) ];
		} else {
			mns = playOrPass ? [ 1, 1 ] : [ 0, 0 ];
		}

		this.move.displayMoveNumber = mns[0];
		this.move.variationMoveNumber = mns[1];

		var thisVariation = this.belongingVariation;
		var realGame = thisVariation.realGame;
		if (this.isVariationFirstNode() && !realGame && thisVariation.index > 0) {
			this.move.displayMoveNumber = playOrPass ? 1 : 0;
			this.move.variationMoveNumber = playOrPass ? 1 : 0;
		}

		if (this.move['MN']) {
			this.move.displayMoveNumber = this.move['MN'];
		}
	},

	resetMoveNumber : function() {
		this.setMoveNumber();
		var thisVariation = this.belongingVariation;
		var vcb = function(variation) {
			if (variation !== thisVariation && variation.index > 0) {
				return false;
			}
		};
		var ncb = function(node) {
			node.setMoveNumber();
		};
		this.traverseSuccessorNodes(ncb, vcb);
	},

	setBranchPoints : function() {
		if (!this.variations) {
			return;
		}
		var variations = this.variations;
		var branchPoints = [];
		for (var i = 0; i < variations.length; i++) {
			var variation = variations[i];
			variation.index = i;
			var node0 = variation.nodes[0];
			if (node0.status.move) {
				var coordinate = node0.move.point;
				branchPoints.push(coordinate);
			} else {
				branchPoints.push({
					x : 52,
					y : 52
				});
			}
		}
		this.branchPoints = branchPoints;
	},

	diffPosition : function(fromNode) {
		var fromPosition = fromNode.position;
		var toPosition = this.position;
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
if (!String.prototype.trim) {
	String.prototype.trim = function() {
		rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
		return this.replace(rtrim, "");
	}
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(searchElement, fromIndex) {
		var k;
		if (this == null) {
			throw new TypeError('');
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = +fromIndex || 0;
		if (Math.abs(n) === Infinity) {
			n = 0;
		}
		if (n >= len) {
			return -1;
		}
		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
		while (k < len) {
			var kValue;
			if (k in O && O[k] === searchElement) {
				return k;
			}
			k++;
		}
		return -1;
	};
}

if (!Function.prototype.bind) {
	Function.prototype.bind = function(oThis) {
		if (typeof this !== 'function') {
			throw new TypeError('');
		}
		var aArgs = Array.prototype.slice.call(arguments, 1);
		var fToBind = this;
		var fNOP = function() {
		};
		var fBound = function() {
			var self = this instanceof fNOP && oThis ? this : oThis;
			var args = aArgs.concat(Array.prototype.slice.call(arguments));
			return fToBind.apply(self, args);
		};
		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();
		return fBound;
	};
}
function SgfExport(gameModel) {
	this.gameModel = gameModel;

	this.app = 'yogo:0.5';
}

SgfExport.prototype = {

	_escape : function(value) {
		if (typeof (value) !== 'string') {
			return value;
		}
		return value.replace(/\\/g, '\\\\').replace(/]/g, '\\]');
	},

	_genProps : function(props, names) {
		var sgf = '';
		if (!props) {
			return sgf;
		}
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			var value = props[name];
			if (value) {
				if (name === 'C' || name === 'GC') {
					sgf += '\n';
				}
				value = this._escape(value);
				sgf += name + '[' + value + ']';
				sgf += '\n';
			}
		}
		return sgf;
	},

	genGameInfoSgf : function() {
		var gameInfo = this.gameModel.gameInfo;
		var root = gameInfo.root;

		var sgf = 'GM[1]FF[4]';
		sgf += 'SZ[' + this.gameModel.boardSize + ']';
		sgf += 'CA[UTF-8]';
		sgf += 'AP[' + this.app + ']\n';
		if (root && root['ST']) {
			sgf += 'ST[' + root['ST'] + ']\n';
		}

		var bl = gameInfo.blackPlayer;
		if (bl) {
			if (bl.name) {
				sgf += 'PB[' + this._escape(bl.name) + ']\n';
			}
			if (bl.rank) {
				sgf += 'BR[' + this._escape(bl.rank) + ']\n';
			}
			if (bl.species) {
				sgf += 'BS[' + this._escape(bl.species) + ']\n';
			}
			if (bl.term) {
				sgf += 'BT[' + this._escape(bl.term) + ']\n';
			}
		}
		var wl = gameInfo.whitePlayer;
		if (wl) {
			if (wl.name) {
				sgf += 'PW[' + this._escape(wl.name) + ']\n';
			}
			if (wl.rank) {
				sgf += 'WR[' + this._escape(wl.rank) + ']\n';
			}
			if (wl.species) {
				sgf += 'WS[' + this._escape(wl.species) + ']\n';
			}
			if (wl.term) {
				sgf += 'WT[' + this._escape(wl.term) + ']\n';
			}
		}

		sgf += this._genProps(gameInfo.basic, [ 'GN', 'EV', 'RO', 'DT', 'PC',
				'RE', 'GC' ]);
		sgf += this._genProps(gameInfo.rule, [ 'HA', 'KM', 'RU', 'TM', 'OT' ]);
		sgf += this._genProps(gameInfo.recorder, [ 'US', 'SO', 'AP' ]);
		sgf += this._genProps(gameInfo.misc, [ 'CP', 'ON', 'AN' ]);

		return sgf;
	},

	toSgfCoordinate : function(point) {
		var x = point.x, y = point.y;
		var xc, yc;
		if (x < 26) {
			xc = 97 + x;
		} else {
			xc = 65 + (x - 26);
		}
		if (y < 26) {
			yc = 97 + y;
		} else {
			yc = 65 + (y - 26);
		}

		return String.fromCharCode(xc) + String.fromCharCode(yc);
	},

	_genPointsSgf : function(name, points) {
		if (!points || points.length == 0) {
			return '';
		}
		var sgf = name;
		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			if (point.coorFrom) {
				var cf = this.toSgfCoordinate(point.coorFrom);
				var ct = this.toSgfCoordinate(point.coorTo);
				sgf += '[' + cf + ':' + ct + ']';
			} else {
				var c = this.toSgfCoordinate(point);
				sgf += '[' + c + ']';
			}
		}
		return sgf;
	},

	geneNodeSgf : function(node) {
		var sgf = '';

		sgf += this._genProps(node.basic, [ 'N' ]);

		var move = node.move;
		var color = move.color;
		if (move.point) {
			var cs = this.toSgfCoordinate(move.point);
			sgf += color + '[' + cs + ']';
		} else if (color) {
			sgf += color + '[]';
		}

		sgf += this._genProps(move,
				[ 'PL', 'MN', 'BL', 'WL', 'OB', 'OW', 'FG' ]);

		var setup = node.setup;
		if (setup) {
			for (var i = 0; i < 3; i++) {
				var sn = [ 'AB', 'AW', 'AE' ][i];
				if (setup[sn]) {
					sgf += this._genPointsSgf(sn, setup[sn]);
				}
			}
		}

		var marks = node.marks;
		if (marks) {
			var types = [ 'TR', 'CR', 'SQ', 'MA', 'TW', 'TB' ];
			var ms = '';
			for (var i = 0; i < types.length; i++) {
				var markerType = types[i];
				var points = marks[markerType];
				if (points) {
					ms += this._genPointsSgf(markerType, points);
				}
			}
			sgf += ms;
			var labels = marks['LB'];
			if (labels && labels.length > 0) {
				var ls = 'LB';
				for (var i = 0; i < labels.length; i++) {
					var pointAndLabel = labels[i];
					var cs = this.toSgfCoordinate(pointAndLabel);
					ls += '[' + cs + ':' + pointAndLabel.label + ']';
				}
				sgf += ls;
			}
		}

		var remark = node.remark;
		if (remark) {
			var types = [ 'GB', 'GW', 'UC', 'DM', 'TE', 'BM', 'DO', 'IT', 'HO' ];
			// SL AR LN
			for (var i = 0; i < types.length; i++) {
				var type = types[i];
				var value = remark[type];
				if (!value) {
					continue;
				}
				if (value === true) {
					value = 1;
				}
				sgf += type + '[' + value + ']';
			}
		}

		// inheritProps: PM DD VW

		sgf += this._genProps(node.basic, [ 'C' ]);

		return sgf;
	},

	generateSgf : function() {
		var gameInfoSgf = this.genGameInfoSgf();
		var firstNode = this.gameModel.nodes[0];

		var exp = this;

		var sgf = '(';

		var nodeCallback = function(node) {
			var nodeSgf = exp.geneNodeSgf(node);
			if (firstNode === node) {
				nodeSgf = gameInfoSgf + nodeSgf;
			}
			sgf += ';' + nodeSgf;
		};

		var variationBeginCallback = function(variation) {
			sgf += '(';
		};

		var variationCompleteCallback = function(variation) {
			sgf += ')';
		};

		this.gameModel.traverseNodes(nodeCallback, variationBeginCallback,
				variationCompleteCallback);

		sgf += ')';

		sgf = sgf.replace(/\)\(/g, ')\n(').replace(/\]\(/g, ']\n(');

		return sgf;
	}
};
function SgfParser() {

	var gameInfoGroupToNames = {
		root : 'GM FF AP SZ CA ST',
		basic : 'GN EV RO DT PC RE GC',
		rule : 'HA KM RU TM OT',
		blackPlayer : 'PB BR BS BT',
		whitePlayer : 'PW WR WS WT',
		recorder : 'US SO AP',
		misc : 'CP ON AN'
	};

	var nodeGroupToPropNames = {
		basic : 'N C',
		setup : 'AB AW AE',
		move : 'B W BL WL PL MN OB OW KO FG V',
		remark : 'GB GW UC DM TE BM DO IT HO',
		marks : 'LB TR CR SQ MA SL TW TB AR LN',
		inheritProps : 'PM DD DW'
	};

	var typeToPropNames = {
		integer : 'MN OB OW PM SZ HA ST',
		'float' : 'V KM',
		bool : 'DO IT KO',
		triple : 'GB GW UC DM TE BM HO',
		point : 'B W',
		lableList : 'LB',
		pointList : 'AB AW AE TR CR SQ MA SL AR LN TW TB DD VM',
		stringArray : ''
	};

	function reverseMap(map) {
		var reversed = {};
		for (groupName in map) {
			var names = map[groupName].split(' ');
			for (var i = 0; i < names.length; i++) {
				reversed[names[i]] = groupName;
			}
		}
		return reversed;
	}

	this.gameInfoPropNameToGroup = reverseMap(gameInfoGroupToNames);
	this.nodePropNameToGroup = reverseMap(nodeGroupToPropNames);
	this.propNameToType = reverseMap(typeToPropNames);
}

SgfParser.prototype = {

	parseSgf : function(sgfText) {
		// P=()[];\
		// /[P]|[^P]*/g
		var tokenPatt = /[()\[\];\\]|[^()\[\];\\]*/g;

		var gameCollection = [];
		var tokenState = null;// inProp,inPropValue

		var curGameModel;
		var curVariation;
		var curNode;
		var curPropName;
		var curPropValues;
		var curVariationDepth = 0;

		var tokens = sgfText.match(tokenPatt);
		var tokenBuffer = '';

		function finishPropertyIfAny() {
			if (curPropName) {
				curNode.props[curPropName] = curPropValues;
				curPropName = null;
				curPropValues = null;
			}
		}

		for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
			var token = tokens[tokenIndex];

			if (token == '\\') {
				if (tokenState == 'inPropValue') {
					token = tokens[++tokenIndex];
					if (token.startsWith('\n')) {
						token = token.substr(1);
					}
					tokenBuffer += token;
				} else {
					yogo.logError('unexpected token: \\', 'parse sgf');
				}
				continue;
			}

			if (tokenState == 'inPropValue') {
				if (token != ']') {
					tokenBuffer += token;
					continue;
				}
			}

			if (token == '(') {
				if (curVariationDepth == 0) {
					curGameModel = new GameModel();
					gameCollection.push(curGameModel);
					curVariation = curGameModel;
				} else {
					finishPropertyIfAny();
					var parentVariation = curVariation;
					curVariation = new Variation(curNode, parentVariation);
					var realGame = parentVariation.realGame
							&& !curNode.variations;
					if (realGame) {
						curVariation.realGame = true;
						curNode.variations = [];
					} else {
						curVariation.realGame = false;
						if (!curNode.variations) {
							curNode.variations = [];
						}
					}
					curVariation.index = curNode.variations.length;
					curNode.variations.push(curVariation);
				}
				tokenBuffer = '';
				tokenState = null;
				curVariation.variationDepth = curVariationDepth;
				curVariationDepth++;
			} else if (token == ')') {
				finishPropertyIfAny();
				tokenBuffer = '';
				curVariationDepth--;
				if (curVariationDepth < 0) {
					yogo.logError('dismatch parenthesis: )', 'parse sgf')
					continue;
				}
				curNode = curVariation.baseNode;
				if (curVariation.nodes.length == 0) {
					yogo.logWarn('empty variation!', 'parse sgf')
					curNode.variations.pop();
				}
				curVariation = curVariation.parentVariation;
				tokenState = null;
			} else if (token == ';') {
				finishPropertyIfAny();
				tokenBuffer = '';
				var previousNode = curNode;
				curNode = new Node(previousNode, curVariation);
				if (previousNode
						&& previousNode.belongingVariation === curVariation) {
					previousNode.nextNode = curNode;
				}
				curVariation.nodes.push(curNode);
				tokenState = 'inProp';
			} else if (token == '[') {
				tokenState = 'inPropValue';
			} else if (token == ']') {
				if (curPropName != 'C') {
					tokenBuffer = tokenBuffer.trim();
				}
				if (!curPropValues) {
					curPropValues = tokenBuffer
				} else if (curPropValues instanceof Array) {
					curPropValues.push(tokenBuffer);
				} else {
					curPropValues = [ curPropValues, tokenBuffer ];
				}
				tokenBuffer = '';
				tokenState = 'inProp';
			} else {
				if (tokenState == 'inProp') {
					tokenBuffer += token;
					tokenBuffer = tokenBuffer.trim();
					if (tokenBuffer == '') {
						continue;
					}
					if (/[a-zA-Z0-9]+/.test(tokenBuffer)) {
						finishPropertyIfAny();
						curPropName = tokenBuffer;
						tokenBuffer = '';
					} else {
						yogo.logError('unexpected property name: '
								+ tokenBuffer, 'parse sgf')
					}
				} else {
					tokenBuffer += token;
				}
			}
		}

		return gameCollection;
	},

	buildGoGameModel : function(gameCollection) {

		for (var gtIndex = 0; gtIndex < gameCollection.length; gtIndex++) {
			var gameModel = gameCollection[gtIndex];
			this.processGameInfo(gameModel);

			for (var x = 0; x < gameModel.boardSize; x++) {
				gameModel.pointMovesMatrix[x] = [];
			}

			var parser = this;

			var nodeCallback = function(node) {

				var props = node.props;
				for (name in props) {
					var group = parser.nodePropNameToGroup[name];
					if (!group) {
						if (parser.gameInfoPropNameToGroup[name]) {
							if (node.previousNode) {
								yogo.logWarn(
										'game info not at the first node: '
												+ name, 'node');
							}
						} else {
							yogo.logWarn('unknown property name: ' + name,
									'node');
						}
						continue;
					}
					var propValue = props[name];
					var type = parser.propNameToType[name];
					propValue = parser.propertyTypeConvert(propValue, type,
							gameModel.boardSize);

					if (!node[group]) {
						node[group] = {};
					}
					node[group][name] = propValue;
				}

				if (node.move['W'] && node.move['B']) {
					yogo.logWarn('both Black and White move in one node: B['
							+ node.props['B'] + '],W[' + node.props['W'] + ']',
							'node');
				}

				node.status.move = !!(node.move['W'] || node.move['B']);
				node.status.pass = node.move['W'] === null
						|| node.move === null;

				if (node.status.move) {
					var point = (node.move['W'] || node.move['B']);
					node.move.point = point;
					node.move.color = (node.move['B']) ? 'B' : 'W';
				}else if(node.status.pass){
					node.move.color = (node.move['B'] === null) ? 'B' : 'W';
				}

				if (node.isVariationLastNode()) {
					var realGame = node.belongingVariation.realGame;
					if (realGame) {
						gameModel.gameEndingNode = node;
					}
				}

			};

			gameModel.traverseNodes(nodeCallback);

			var nodeCallback2 = function(node) {

				node.setMoveNumber();

				node.setBranchPoints();

				gameModel.indexNode(node);
			};

			gameModel.traverseNodes(nodeCallback2);
		}
	},

	processGameInfo : function(gameModel) {

		if (!gameModel.gameInfo) {
			gameModel.gameInfo = {};
		}
		var gameInfo = gameModel.gameInfo;

		var gameInfoNode = gameModel.nodes[0];
		var props = gameInfoNode.props;
		if (props['GM'] && props['GM'] !== '1') {
			yogo.logError('unsupported game type: GM=' + props['GM'],
					'game info');
		}
		if (!props['SZ']) {
			yogo.logError('missing board size(SZ)', 'game info');
		}

		for (name in props) {
			var group = this.gameInfoPropNameToGroup[name];
			if (!group) {
				if (!(this.nodePropNameToGroup && this.nodePropNameToGroup[name])) {
					yogo.logWarn('unknown property name: ' + name, 'game info');
				}
				continue;
			}
			if (!gameInfo[group])
				gameInfo[group] = {};
			var value = props[name];
			if (this.propNameToType[name]) {
				value = this.propertyTypeConvert(value,
						this.propNameToType[name], gameModel.boardSize);
			}
			gameInfo[group][name] = value;
		}

		function changePropName(obj, names) {
			for (var i = 0; i < names.length; i++) {
				var name = names[i];
				var oriName = name[0], newName = name[1];
				obj[newName] = obj[oriName];
				delete obj[oriName];
			}
		}

		if (gameInfo.blackPlayer) {
			changePropName(gameInfo.blackPlayer, [ [ 'PB', 'name' ],
					[ 'BR', 'rank' ], [ 'BS', 'species' ], [ 'BT', 'term' ] ]);
		}
		if (gameInfo.whitePlayer) {
			changePropName(gameInfo.whitePlayer, [ [ 'PW', 'name' ],
					[ 'WR', 'rank' ], [ 'WS', 'species' ], [ 'WT', 'term' ] ]);
		}

		var boardSize = gameInfo.root['SZ'];
		if (isNaN(boardSize) || boardSize < 5 || boardSize > 51) {
			yogo.logError('wrong board size(SZ)', 'game info');
		}

		gameModel.boardSize = boardSize;
	},

	parseCoordinate : function(sgfPoint, boardSize) {
		if (!sgfPoint.match(/^[a-z][a-z]$/i)) {
			yogo.logWarn('wrong coordinate: ' + sgfPoint, 'node');
			return null;
		}
		var x = sgfPoint.charCodeAt(0);
		var y = sgfPoint.charCodeAt(1);
		if (x < 97) {
			x = 26 + x - 65;
		} else {
			x -= 97;
		}
		if (y < 97) {
			y = 26 + y - 65;
		} else {
			y -= 97;
		}
		if (x >= boardSize || y >= boardSize) {
			return null;
		}

		return {
			x : x,
			y : y
		};
	},

	propertyTypeConvert : function(propValue, type, boardSize) {

		var oriValue = propValue;
		if (type) {
			if ([ 'lableList', 'pointList', 'stringArray' ].indexOf(type) >= 0) {
				if (!(propValue instanceof Array)) {
					propValue = [ propValue ];
				}
			} else {
				if (propValue instanceof Array) {
					propValue = propValue[0] || '';
				}
			}

			if (type == 'point') {
				if (propValue == '') {
					propValue = null;
				} else {
					propValue = this.parseCoordinate(propValue, boardSize);
				}
			} else if (type == 'lableList') {
				var coordinates = [];
				for (var pi = 0; pi < propValue.length; pi++) {
					var coorStrAndLabel = propValue[pi].split(':');
					var coorStr = coorStrAndLabel[0];
					var label = coorStrAndLabel[1];
					if (!label)
						continue;
					var coor = this.parseCoordinate(coorStr, boardSize);
					if (coor != null) {
						coor.label = label;
						coordinates.push(coor);
					}
				}
				propValue = coordinates.length > 0 ? coordinates : null;
			} else if (type == 'pointList') {
				var coordinates = [];
				for (var pi = 0; pi < propValue.length; pi++) {
					var coorStr = propValue[pi];
					if (coorStr.indexOf(':') > 0) {
						var coorStrPair = coorStr.split(':');
						var coorFrom = this.parseCoordinate(coorStrPair[0],
								boardSize);
						var coorTo = this.parseCoordinate(coorStrPair[1],
								boardSize);
						if (coorFrom && coorTo) {
							var coorRange = {
								coorFrom : coorFrom,
								coorTo : coorTo
							};
							coordinates.push(coorRange);
						}
					} else {
						var coor = this.parseCoordinate(coorStr, boardSize);
						if (coor != null) {
							coordinates.push(coor);
						}
					}
				}
				propValue = coordinates.length > 0 ? coordinates : null;
			} else if (type == 'triple') {
				propValue = (propValue == '2') ? 2 : 1;
			} else if (type == 'bool') {
				propValue = true;
			} else if (type == 'integer') {
				propValue = parseInt(propValue);
				if (isNaN(propValue)) {
					yogo.logWarn("can't parse to Integer: " + name + ','
							+ oriValue, 'node');
				}
			} else if (type == 'float') {
				propValue = parseFloat(propValue);
				if (isNaN(propValue)) {
					yogo.logWarn("can't parse to Float: " + name + ','
							+ oriValue, 'node');
				}
			} else {
				yogo.logWarn('to do: ' + name, 'node');
			}
		}

		return propValue;
	}

};

SgfParser.parse = function(sgfText) {
	var sgfParser = new SgfParser();
	var gameCollection = sgfParser.parseSgf(sgfText);
	sgfParser.buildGoGameModel(gameCollection);
	return gameCollection;
}
function GameViewer(selector) {
	this.$v = $(selector);
	if (this.$v.length == 0) {
		yogo.logWarn('no game viewer by this selector: ' + selector,
				'game viewer');
	} else if (this.$v.length > 1) {
		yogo.logWarn('more than one game viewer by this selector: ' + selector,
				'game viewer');
		this.$v = $(this.$v.get(0));
	}

	this.board = null;
	this.gameModel = null;
	this.game = null;
	this.gameTree = null;

	this._lastWheelTS = null;
}

GameViewer.prototype = {

	init : function(event) {

		var viewer = this;
		var $v = this.$v;

		$('button.paste-sgf', $v).click(function() {
			$('.paste-sgf-container', $v).show();
			var $textarea = $('textarea.sgf-text', $v);
			$textarea.get(0).select();
		});

		$('button.parse-sgf', $v).click(function() {
			var sgfText = $('textarea.sgf-text', $v).val();
			if (!sgfText.trim()) {
				return;
			}
			// TODO: save current

			viewer.loadGameFromSgfText(sgfText);

			$('.paste-sgf-container', $v).hide();
		});

		$('button.parse-sgf-cancel', $v).click(function() {

			$('.paste-sgf-container', $v).hide();
		});

		$('button.export-sgf', $v).click(function() {
			$('.export-sgf-container', $v).show();

			if (!viewer.gameModel) {
				return;
			}
			var exp = new SgfExport(viewer.gameModel);

			var expSgf = exp.generateSgf();

			$('textarea.export-sgf-text').val(expSgf).get(0).select();
		});

		$('button.export-sgf-cancel', $v).click(function() {

			$('.export-sgf-container', $v).hide();
		});

		$('button.node-history', $v).click(function() {
			if (!viewer.game) {
				return;
			}

			var dir = $(this).data('value');
			if (dir === 'goback') {
				viewer.game.historyGoback();
			} else if (dir === 'goforward') {
				viewer.game.historyGoforward();
			}
		});

		$('button.new-game', $v).click(function() {
			// TODO: save current

			var bz = $('input.new-game-size', $v).val();
			var hc = $('input.new-game-handicap', $v).val();
			viewer.newGame(bz, hc);
		});

		$('button.perspective', $v).click(function() {
			if (!viewer.board) {
				return;
			}
			var perspective = $(this).data('value');
			var fn = viewer.board[perspective];
			if (typeof (fn) !== 'function') {
				return;
			}
			fn.call(viewer.board);
		});

		$('button.node-finder', $v).click(function() {
			if (!viewer.game) {
				return;
			}
			var navi = $(this).data('navi');
			var fn = viewer.game[navi];
			if (typeof (fn) !== 'function') {
				return;
			}
			fn.call(viewer.game);
		});

		$('input.game-op-mode', $v).click(function() {
			if (!viewer.game) {
				return;
			}
			var mode = $(this).val();
			viewer.game.setMode(mode);
			if (mode === 'auto-play') {
				viewer.game.startAutoPlay();
			} else {
				viewer.game.stopAutoPlay();
			}
		});

		$('input.game-edit-mode', $v).click(function() {
			if (!viewer.game) {
				return;
			}
			var mode = $(this).val();
			var param = $(this).data('param');
			viewer.game.setEditMode(mode, param);
		});

		$('button.play-mode', $v).click(function() {
			if (!viewer.game) {
				return;
			}
			var op = $(this).data('value');
			if (op == 'pass') {
				viewer.game.passMove();
			} else if (op == 'cancel-latest') {
				viewer.game.removeLastNode();
			} else if (op == 'black-first') {
				viewer.game.setPlayFirst('B');
			} else if (op == 'white-first') {
				viewer.game.setPlayFirst('W');
			}
		});

		$('button.auto-play', $v).click(function() {
			if (!viewer.game) {
				return;
			}
			var op = $(this).data('value');
			if (op == 'start') {
				viewer.game.startAutoPlay();
			} else if (op == 'stop') {
				viewer.game.stopAutoPlay();
			}
		});

		$('input.auto-play-interval', $v).change(function() {
			if (!viewer.game) {
				return;
			}
			viewer.game.setAutoPlayInterval(this.value);
		});

		$('button.goto-node', $v).click(function() {
			if (!viewer.game) {
				return;
			}
			var number = $('.move-number-input', $v).val();
			viewer.game.gotoNode(number);
		});

		$('input.move-number-input', $v).keydown(function(e) {
			if (!viewer.game) {
				return;
			}
			if (e.keyCode == 13) {
				viewer.game.gotoNode(this.value);
				this.blur();
			}
		});

		$('.branch-select', $v).on('click', 'button.branch', function() {
			var branch = $(this).data('branch');
			viewer.game.goinBranch(branch);
		});

		$('button.coordinate', $v).click(function() {
			var board = viewer.board;
			if (!board) {
				return;
			}
			var type = $(this).data('type');
			if (type === 'show' || type === true) {
				board.showCoordinate();
			} else if (type === 'hide' || type === false) {
				board.hideCoordinate();
			} else {
				type = '' + type;
				if (type.indexOf(',') >= 0) {
					var xy = type.split(',');
					if (xy[0]) {
						board.setXCoordinateType(xy[0]);
					}
					if (xy[1]) {
						board.setYCoordinateType(xy[1]);
					}
				} else {
					board.setXCoordinateType(type);
					board.setYCoordinateType(type);
				}
			}
		});

		$('button.move-number', $v).click(function() {
			var game = viewer.game;
			if (!game) {
				return;
			}
			var value = $(this).data('value');
			if (value === true || value === 'true') {
				game.setShowMoveNumber(true);
			} else if (value === false || value === 'false') {
				game.setShowMoveNumber(false);
			} else {
				game.setShowMoveNumber(value);
			}
		});

		$('button.reset-move-number', $v).click(function() {
			var game = viewer.game;
			if (!game) {
				return;
			}
			var value = $(this).data('value');
			game.resetMoveNumber(value);
		});

		$('button.mark-current-move', $v).click(function() {
			if (!viewer.game) {
				return;
			}
			var value = $(this).data('value');
			if (value === 'true') {
				value = true;
			} else if (value === 'false') {
				value = false;
			}
			viewer.game.setMarkCurrentMove(value);
		});

		$('button.zoom', $v).click(function() {
			if (!viewer.board) {
				return;
			}
			var zoom = $(this).data('zoom');
			if (zoom == 'reset') {
				zoom = null;
			}
			viewer.board.zoomBoard(zoom);
		});

		var $treeContainer = $('.game-tree-container', $v);
		$treeContainer.on('click', 'li.node-group-head, li.variation-head',
				function() {
					var $treeNodes = $(this).next();
					$treeNodes.toggle(200);
				}).on('click', 'li.tree-node', function() {
			viewer.game.gotoNode(this.id);
		});

		$('button.collapse-nodes', $treeContainer).click(function() {
			$('ul.tree-nodes:visible', $treeContainer).hide(200);
		});

		$('button.show-current-node', $treeContainer).click(function() {
			if (!viewer.gameTree || !viewer.game) {
				return;
			}
			viewer.gameTree.showNode(viewer.game.curNode.id, true);
		});

		$('select.node-group-count', $treeContainer).change(function() {
			if (!viewer.gameTree || !viewer.game) {
				return;
			}
			viewer.gameTree.setGroupMoveCount($(this).val());
		});

		this._handlerFullscreen();
	},

	_handlerFullscreen : function() {
		var viewer = this;
		var $v = this.$v;

		var lastFullscreenElement;
		var showCoordinate;
		var onfullscreenchange = function(e) {
			var isFullScreen = document.webkitIsFullScreen;
			if (typeof (isFullScreen) === 'undefined') {
				isFullScreen = document.mozFullScreen;
			}
			if (isFullScreen === true) {
				lastFullscreenElement = document.webkitFullscreenElement;
				if (!lastFullscreenElement) {
					lastFullscreenElement = document.mozFullScreenElement;
				}
				if (!lastFullscreenElement) {
					lastFullscreenElement = document.msFullscreenElement;
				}
				var $fe = $(lastFullscreenElement);
				if ($fe.is('.board-container')) {
					var width = $(window).width();
					var height = $(window).height();
					if (height < width) {
						width = height;
					}
					$fe.width(width).height(width);
				}
			} else if (isFullScreen === false && lastFullscreenElement) {
				var $fe = $(lastFullscreenElement);
				if ($fe.is('.board-container')) {
					var width = $fe.data('width');
					var height = $fe.data('height');
					$fe.width(width).height(height);
				}
				lastFullscreenElement = null;
				if (showCoordinate) {
					viewer.board.showCoordinate();
				} else {
					viewer.board.hideCoordinate();
				}
			}
		}

		$(document).on(
				'fullscreenchange webkitfullscreenchange mozfullscreenchange'
						+ ' fullscreenchange msfullscreenchange',
				onfullscreenchange);

		$('button.fullscreen', $v).click(function() {
			if (!viewer.board) {
				return;
			}

			var elem;
			var elemName = $(this).data('value');
			if (elemName === 'board') {
				elem = viewer.board.boardContainer;
			} else if (elemName === 'viewer') {
				elem = viewer.$v.get(0);
			}
			if (elem) {
				if (elem.requestFullscreen) {
					elem.requestFullscreen();
				} else if (elem.msRequestFullscreen) {
					elem.msRequestFullscreen();
				} else if (elem.mozRequestFullScreen) {
					elem.mozRequestFullScreen();
				} else if (elem.webkitRequestFullscreen) {
					elem.webkitRequestFullscreen();
				}

				if (elemName === 'board') {
					showCoordinate = viewer.board.coordinateStatus().show;
					viewer.board.hideCoordinate();
				}
			}
		});

		// exitFullscreen,webkitExitFullscreen,mozCancelFullScreen,msExitFullscreen
	},

	onPlayNode : function() {
		var $v = this.$v;
		var curNode = this.game.curNode;

		var comment = '';
		if (curNode.basic['C']) {
			comment = curNode.basic['C'];
		}
		$('.comment-box', $v).text(comment);

		var remarkText = '';
		if (curNode.remark) {
			var rns = [
					[ [ 'GB', 'Good for Black' ], [ 'GW', 'Good for White' ] ],
					[ [ 'UC', 'Unclear Position' ], [ 'DM', 'Even Position' ] ],
					[ [ 'TE', 'Tesuji' ], [ 'BM', 'Bad Move' ] ],
					[ [ 'DO', 'Doubtful' ], [ 'IT', 'Interesting' ] ],
					[ [ 'HO', 'Hotspot' ] ] ];
			var remark = curNode.remark;
			for (var i = 0; i < rns.length; i++) {
				var exclusiveGroup = rns[i];
				for (var j = 0; j < exclusiveGroup.length; j++) {
					var remProp = exclusiveGroup[0];
					var name = remProp[0], text = remProp[1];
					var value = remark[name];
					if (!value) {
						continue;
					}
					if (remarkText != '') {
						remarkText += '  ';
					}
					remarkText += text;
					if (value == 2) {
						remarkText += '!';
					} else {
						remarkText += '.';
					}
					break;
				}
			}
		}
		$('.remark', $v).text(remarkText);

		var captures = curNode.move.accumulatedCaptures;
		$(".play-status .black-capture", $v).text(captures['B']);
		$(".play-status .white-capture", $v).text(captures['W']);

		$('.branch-select', $v).hide().find('button.branch').hide();
		if (curNode.variations) {
			var indexFrom = curNode.belongingVariation.realGame ? 1 : 0;
			for (var vi = indexFrom; vi < curNode.variations.length; vi++) {
				var subVariation = curNode.variations[vi];
				var label = String.fromCharCode(65 + subVariation.index);
				var $branchButton = $('.branch-select button.branch' + label);
				if ($branchButton.length > 0) {
					$branchButton.show();
				} else {
					$('.branch-select', $v).append(
							'<button class="branch branch' + label
									+ '" data-branch="' + label + '">' + label
									+ '</button>');
				}
			}
			$('.branch-select', $v).show();
		}
		if (curNode.belongingVariation.realGame) {
			$('.in-branch', $v).hide();
		} else {
			$('.in-branch', $v).show();
		}

		if (this.gameTree) {
			this.gameTree.showNode(curNode.id);
		}
	},

	_initGame : function() {

		this.setPlayStatus();

		this.setGameInfo();

		this.setupGame();

		this.setupGameTree();

		this.bindKeyAndWheelEvent();

		this.game.onPlayNode = this.onPlayNode.bind(this);

		this.game.onNodeCreated = this.onNodeCreated.bind(this);

		this.game.onNodeChanged = this.onNodeChanged.bind(this);

		this.game.onNodeRemoved = this.onNodeRemoved.bind(this);

		this.game.gotoBeginning();
	},

	newGame : function(boardSize, handicap) {

		if (boardSize) {
			boardSize = parseInt(boardSize);
			if (!isNaN(boardSize)) {
				if (boardSize < 5) {
					boardSize = 5;
				} else if (boardSize > 23) {
					boardSize = 23;
				}
			}
		}
		boardSize = boardSize || 19;
		if (boardSize % 2 == 0) {
			boardSize += 1;
		}

		var handicapPoints = null;
		if (handicap) {
			handicap = parseInt(handicap);
			if (!isNaN(handicap)) {
				if (handicap < 2) {
					handicap = null;
				} else if (handicap > 9) {
					handicap = 9;
				}
			}
			if (handicap) {
				handicapPoints = Game.getHandicapPoints(boardSize, handicap);
			}
		}

		var gameModel = this.gameModel = GameModel.newModel(boardSize,
				handicapPoints);

		this.setupBoard();
		this._initGame();

		if (this.gameTree) {
			this.gameTree.showNode(gameModel.nodes[0].id);
		}

		$('input.game-op-mode[value=edit]', this.$v).click();
	},

	loadGameFromSgfText : function(sgfText) {

		var gameCollection = SgfParser.parse(sgfText);

		this.gameModel = gameCollection[0];
		if (!this.gameModel) {
			return;
		}

		this.setupBoard();

		this._initGame();

		$('input.game-op-mode[value=view]', this.$v).click();
	},

	setupBoard : function() {

		var $v = this.$v;
		if (!this.gameModel) {
			return;
		}

		if (this.board && this.board.boardSize === this.gameModel.boardSize) {
			this.board.clearBoard();
			return;
		}

		var existedPaper = this.game && this.game.board.paper;

		var $boardContainer = $(".board-container", $v);
		$boardContainer.data('width', $boardContainer.width());
		$boardContainer.data('height', $boardContainer.height());

		$boardContainer.bind('contextmenu', function() {
			return false;
		});
		this.board = new Board($boardContainer.get(0),
				this.gameModel.boardSize, existedPaper);

		this.board.drawBoard();
	},

	setupGame : function() {

		this.game = new Game(this.board, this.gameModel);
		this.game.buildAllPositions();

		$('input.auto-play-interval', this.$v).change();
	},

	setPlayStatus : function() {

		var $ps = $('.play-status', this.$v);
		var gameInfo = this.gameModel.gameInfo;
		var blackPlayer = gameInfo.blackPlayer;
		var whitePlayer = gameInfo.whitePlayer;

		var player = '';
		if (blackPlayer) {
			player = blackPlayer.name;
			if (blackPlayer.rank) {
				player = player + ' ' + blackPlayer.rank;
			}
		}
		$(".black-player-name", $ps).text(player);

		player = '';
		if (whitePlayer) {
			player = whitePlayer.name;
			if (whitePlayer.rank) {
				player = player + ' ' + whitePlayer.rank;
			}
		}
		$(".white-player-name", $ps).text(player);
	},

	setGameInfo : function() {
		var $gi = $('.game-info', this.$v);
		var gameInfo = this.gameModel.gameInfo;

		for (var pi = 0; pi < 2; pi++) {
			var color = (pi == 0) ? 'black' : 'white';
			var player = gameInfo[color + 'Player'];
			if (!player) {
				continue;
			}
			var $ec = $('.' + color + '-player', $gi);
			$('.name', $ec).text(player.name || '');
			$('.rank', $ec).text(player.rank || '');
			$('.species', $ec).text(player.species || '');
			$('.term', $ec).text(player.term || '');
		}

		var basic = gameInfo.basic || {};
		$('.game-name', $gi).text(basic['GN'] || '');
		$('.event', $gi).text(basic['EV'] || '');
		$('.round', $gi).text(basic['RO'] || '');
		$('.game-date', $gi).text(basic['DT'] || '');
		$('.place', $gi).text(basic['PC'] || '');
		var gameResult = basic['RE'] || '';
		if (gameResult) {
			// 0/?/Void/W+[Score/R/Resign/T/Time/F/Forfeit]
		}
		$('.game-result', $gi).text(gameResult);

		var rule = gameInfo.rule || {};
		$('.handicap', $gi).text(rule['HA'] || '');
		$('.komi', $gi).text(rule['KM'] || '');
		$('.time-limit', $gi).text(rule['TM'] || '');
		$('.byo-yomi', $gi).text(rule['OT'] || '');

		var recorder = gameInfo.recorder || {};
		$('.user', $gi).text(recorder['US'] || '');
		$('.source', $gi).text(recorder['SO'] || '');
		$('.app', $gi).text(recorder['AP'] || '');

		var misc = gameInfo.misc || {};
		$('.annotate-by', $gi).text(misc['ON'] || '');
		$('.game-comment', $gi).text(misc['CP'] || '');
		$('.copyright', $gi).text(misc['AN'] || '');
	},

	setupGameTree : function() {

		var $treeContainer = $('.game-tree-container', this.$v);
		this.gameTree = new GameTree($treeContainer, this.game);

		var groupMoveCount=$('select.node-group-count', $treeContainer).val();
		if(parseInt(groupMoveCount)){
			this.gameTree.groupMoveCount=groupMoveCount;
		}

		this.gameTree.setup();
	},

	bindKeyAndWheelEvent : function() {

		$('body').bind('keydown', this.keydownHandler.bind(this));

		var mousewheelHandler = this.mousewheelHandler.bind(this);

		$('.board-container').bind('mousewheel DOMMouseScroll',
				mousewheelHandler);
	},

	onNodeCreated : function(newNode) {
		if (this.gameTree) {
			this.gameTree.addNode(newNode);
		}
	},

	onNodeChanged : function(node) {
		if (this.gameTree) {
			this.gameTree.changeNodeInfo(node);
		}
	},

	onNodeRemoved : function(node, newVariation0) {
		if (this.gameTree) {
			this.gameTree.removeLastNode(node, newVariation0);
		}
	}
}
function GameTree($container, game) {
	this.$container = $container;
	this.game = game;
	this.gameModel = game.gameModel;

	this.elementTemplates = {
		gameTree : $('<div class="game-tree"></div>'),
		nodeGroup : $('<ul class="node-group"></ul>'),
		nodeGroupHead : $('<li class="node-group-head"></li>'),
		treeNodes : $('<ul class="tree-nodes"></ul>'),
		treeNode : $('<li class="tree-node"><span class="node-name"></span><span class="node-info"></span></li>'),
		variation : $('<ul class="variation"></ul>'),
		variationHead : $('<li class="variation-head"></li>')
	};

	this.groupMoveCount = 20;
}

GameTree.prototype = {

	setup : function() {
		var gameTree = this;

		$('.game-tree', this.$container).remove();

		this.render();
	},

	setGroupMoveCount : function(count) {
		if(typeof(count)==='string'){
			count=parseInt(count);
		}
		if(typeof(count)!=='number' || isNaN(count)){
			return;
		}
		if(count<3){
			return;
		}
		this.groupMoveCount=count;

		var gameTree = this;
		var gameModel = this.gameModel;

		var $nodeGroups = $('.node-group', this.$container).detach();
		var $nodes = $nodeGroups.find('> .tree-nodes > *');
		var $lastNode;
		$nodes.each(function() {
			var $li = $(this);
			if ($li.is('.tree-node')) {
				var node = gameModel.nodeMap[this.id];
				gameTree.setNodeInfo(node, $li);
				gameTree._appendRealGameNode($li);
				$lastNode = $li;
			} else {// ul.variation
				$lastNode.after($li);
			}
		});

		$('button.show-current-node', this.$container).click();
	},

	render : function() {

		var ets = this.elementTemplates;
		$treeNodesTmpl = ets.treeNodes;
		$treeNodeTmpl = ets.treeNode;

		var $tree = ets.gameTree.clone();
		// $tree.attr('id', 't' + yogo.nextuid());

		this.$container.append($tree);

		var $realGameNodeContainer;
		var $variationNodeContainer;

		var $currentNodeGroup;
		var groupMoveNumberFrom;
		var gameTree = this;

		var variationNodeContainerMap = {};

		var nodeCallback = function(node) {

			var belongingVariation = node.belongingVariation;

			if (belongingVariation.realGame) {
				var moveNumber = node.move.variationMoveNumber;
				var pn = node.previousNode;
				var pmn = pn && pn.move.variationMoveNumber;
				if (!$realGameNodeContainer
						|| (moveNumber > 1 && moveNumber !== pmn && moveNumber
								% gameTree.groupMoveCount == 1)) {
					if ($currentNodeGroup) {
						gameTree.setNodeGroupHead($currentNodeGroup,
								groupMoveNumberFrom, pmn);
					}

					groupMoveNumberFrom = moveNumber || 1;
					var ng = gameTree.createNodeGroup(groupMoveNumberFrom);
					$tree.append(ng.$nodeGroup);
					$realGameNodeContainer = ng.$treeNodes;
					$currentNodeGroup = ng.$nodeGroup;
				}
			}

			var $nodeContainer;
			if (belongingVariation.realGame) {
				$nodeContainer = $realGameNodeContainer;
			} else {
				var cv = belongingVariation;
				while (cv.index === 0) {
					cv = cv.parentVariation;
				}
				$nodeContainer = variationNodeContainerMap[cv.id];
			}

			var $treeNode = gameTree.createNode(node);
			$nodeContainer.append($treeNode);

			if (node.variations) {
				for (var vi = 1; vi < node.variations.length; vi++) {
					var subVariation = node.variations[vi];
					var nv = gameTree.createVariation(subVariation);
					var $subVariation = nv.$variation;
					var $subNodeContainer = nv.$treeNodes;
					$nodeContainer.append($subVariation);
					variationNodeContainerMap[subVariation.id] = $subNodeContainer;
				}
			}
		};

		this.gameModel.traverseNodes(nodeCallback);

		if ($currentNodeGroup) {
			var lastMoveNumber = this.gameModel.gameEndingNode.move.variationMoveNumber;
			this.setNodeGroupHead($currentNodeGroup, groupMoveNumberFrom,
					lastMoveNumber);
		}
	},

	setNodeInfo : function(node, $treeNode) {

		var realGame = node.belongingVariation.realGame;
		var moveNumber = node.move.variationMoveNumber;
		var nodeName;
		if (!node.status.move && node.isSetup()) {
			nodeName = '';
		} else {
			nodeName = '' + moveNumber;
			if (moveNumber === 0) {
				if (realGame) {
					nodeName = 'game info';
				} else {
					nodeName = '';
				}
			}
		}
		if (node.move.color) {
			$treeNode.addClass((node.move.color == 'B') ? 'black' : 'white');
		}
		var move = '';
		if (node.status.move) {
			var point = node.move.point;
			// move=' ('+node.id+') ['+(point.x+1)+','+(point.y+1)+']';
		} else if (node.status.pass) {
			move = 'pass';
		} else if (node.isSetup()) {
			move = 'setup';
		}
		if (move != '') {
			if (nodeName != '') {
				nodeName += ' ';
			}
			nodeName += move;
		}
		if (node.basic['N']) {
			nodeName += ' ' + node.basic['N'];
		}
		$treeNode.find('.node-name').text(nodeName);
		var nodeInfo = '';
		if (node.status.mark) {
			nodeInfo += ' mark';
		}
		if (node.status.ko) {
			nodeInfo += ' ko';
		} else if (node.status.capture) {
			nodeInfo += ' capture';
		}
		if (node.hasComment()) {
			nodeInfo += ' comment';
		}
		if (nodeName.charAt(0) == ' ') {
			nodeName = nodeName.substr(1);
		}
		$treeNode.find('.node-info').html(nodeInfo);

		var moveNumber = node.move.variationMoveNumber;
		$treeNode.data('mn', moveNumber);
	},

	createNode : function(node) {
		var ets = this.elementTemplates;
		var $treeNodeTmpl = ets.treeNode;
		var $treeNode = $treeNodeTmpl.clone();
		$treeNode.attr('id', node.id);
		var moveNumber = node.move.variationMoveNumber;
		$treeNode.data('mn', moveNumber);
		this.setNodeInfo(node, $treeNode);
		return $treeNode;
	},

	createVariation : function(variation) {
		var ets = this.elementTemplates;
		$variationTmpl = ets.variation;
		$variationHeadTmpl = ets.variationHead;
		$treeNodesTmpl = ets.treeNodes;

		$v = $variationTmpl.clone().attr('id', variation.id);
		$variationHead = $variationHeadTmpl.clone();
		$v.append($variationHead);
		this.setVariationHead(variation, $variationHead);
		var $treeNodes = $treeNodesTmpl.clone();
		$v.append($treeNodes);

		return {
			$variation : $v,
			$treeNodes : $treeNodes
		};
	},

	setVariationHead : function(variation, $variationHead) {
		if (!$variationHead) {
			var $variation = $('#' + variation.id, this.$container);
			$variationHead = $variation.find('> .variation-head');
		}
		var label = String.fromCharCode(65 + variation.index);
		$variationHead.html(label);
	},

	createNodeGroup : function(moveNumberFrom) {
		var ets = this.elementTemplates;
		$nodeGroupTmpl = ets.nodeGroup;
		$nodeGroupHeadTmpl = ets.nodeGroupHead;
		$treeNodesTmpl = ets.treeNodes;

		$nodeGroup = $nodeGroupTmpl.clone();
		$nodeGroup.append($nodeGroupHeadTmpl.clone());
		var $treeNodes = $treeNodesTmpl.clone();
		$nodeGroup.append($treeNodes);
		$nodeGroup.attr('id', 'node-group-' + moveNumberFrom);

		return {
			$nodeGroup : $nodeGroup,
			$treeNodes : $treeNodes
		};
	},

	setNodeGroupHead : function($nodeGroup, moveNumberFrom, moveNumberTo) {
		moveNumberTo = moveNumberTo || 1;
		var groupName = moveNumberFrom + '-' + moveNumberTo;
		$nodeGroup.find('> .node-group-head').text(groupName);
	},

	showNode : function(id, scrollIntoView) {
		$node = $('#' + id, this.$container);
		if ($node.length == 0) {
			return;
		}

		$('li.tree-node.current', this.$container).removeClass('current');
		$node.addClass('current');

		var collapsed = $node.parents('ul.tree-nodes:hidden');

		$node.parents('ul.tree-nodes').show();

		if (scrollIntoView && $node.length > 0) {
			var node = $node.get(0);
			if (node.scrollIntoViewIfNeeded) {
				node.scrollIntoViewIfNeeded();
			} else {
				node.scrollIntoView();
			}
		}
	},

	_appendRealGameNode : function($treeNode) {
		var moveNumber = $treeNode.data('mn');
		if (moveNumber === 0) {
			moveNumber = 1;
		}
		var $treeNodes;
		var groupStart = moveNumber - (moveNumber - 1) % this.groupMoveCount;
		var $nodeGroup = $('#node-group-' + groupStart, this.$container);
		if ($nodeGroup.length == 0) {
			var $tree = $('.game-tree', this.$container);
			var ng = this.createNodeGroup(groupStart);
			$tree.append(ng.$nodeGroup);
			$treeNodes = ng.$treeNodes;
			$nodeGroup = ng.$nodeGroup;
		} else {
			$treeNodes = $('> .tree-nodes', $nodeGroup);
		}
		$treeNodes.append($treeNode);
		this.setNodeGroupHead($nodeGroup, groupStart, moveNumber);
	},

	addNode : function(newNode) {
		var $treeNode = this.createNode(newNode);

		var variation = newNode.belongingVariation;
		if (variation.realGame) {
			this._appendRealGameNode($treeNode);
			this.showNode(newNode.id);
			return;
		}

		var cv = variation;
		while (cv.index === 0) {
			cv = cv.parentVariation;
		}
		var $variation = $('#' + cv.id, this.$container);
		if ($variation.length > 0) {
			var $treeNodes = $('> .tree-nodes', $variation);
			$treeNodes.append($treeNode);
			this.showNode(newNode.id);
			return;
		}

		var nv = this.createVariation(cv);
		$variation = nv.$variation;
		var $treeNodes = nv.$treeNodes;
		$treeNodes.append($treeNode);

		var $baseNode = $('#' + variation.baseNode.id, this.$container);
		var variations = variation.baseNode.variations;
		if (variations.length == 2) {
			$baseNode.after($variation);
		} else {
			var lastVariation = variations[variations.length - 2];
			var $lastVariation = $('#' + lastVariation.id, this.$container);
			$lastVariation.after($variation)
		}

		this.showNode(newNode.id);
	},

	removeLastNode : function(node, newVariation0) {
		if (!node.isVariationLastNode()) {
			return false;
		}

		if (!node.isVariationFirstNode()) {
			var $node = $('#' + node.id, this.$container);
			$node.remove();
			if (node.status.move || node.status.pass) {
				var moveNumber = node.move.variationMoveNumber;
				var groupStart = moveNumber - (moveNumber - 1)
						% this.groupMoveCount;
				var $nodeGroup = $('#node-group-' + groupStart, this.$container);
				var $nodes = $nodeGroup.find(' > ul.tree-nodes > li.tree-node');
				if ($nodes.length == 0) {
					$nodeGroup.remove();
				}else{
					var pn = node.previousNode;
					var pmn = pn && pn.move.variationMoveNumber;
					if(pmn){
						this.setNodeGroupHead($nodeGroup, groupStart, pmn);
					}
				}
			}
			return;
		}

		var baseNode = node.previousNode;
		var variation = node.belongingVariation;
		if (variation.index == 0) {
			var $node = $('#' + node.id, this.$container);
			$node.remove();
		} else {
			var $variation = $('#' + variation.id, this.$container);
			$variation.remove();
		}

		if (baseNode.variations) {
			for (var i = 0; i < baseNode.variations.length; i++) {
				var v = baseNode.variations[i];
				this.setVariationHead(v);
			}
		}

		if (!newVariation0) {
			return;
		}

		var $newVariation0 = $('#' + newVariation0.id, this.$container);
		var $remainVariationNodes = $newVariation0.find('> .tree-nodes > *');
		$newVariation0.detach();

		var gameTree = this;
		var gameModel = this.gameModel;
		var node0 = newVariation0.nodes[0];
		if (node0.belongingVariation.realGame) {
			var $lastNode;
			$remainVariationNodes.each(function() {
				var $li = $(this);
				if ($li.is('.tree-node')) {
					var node = gameModel.nodeMap[this.id];
					gameTree.setNodeInfo(node, $li);
					gameTree._appendRealGameNode($li);
					$lastNode = $li;
				} else {// ul.variation
					$lastNode.after($li);
				}
			});
		} else {
			var cv = baseNode.belongingVariation;
			while (cv.index === 0) {
				cv = cv.parentVariation;
			}
			var $container = $('#' + cv.id + '> .tree-nodes', this.$container);
			$remainVariationNodes.each(function() {
				var $li = $(this);
				if ($li.is('.tree-node')) {
					var node = gameModel.nodeMap[this.id];
					gameTree.setNodeInfo(node, $li);
				}
			});
			$container.append($remainVariationNodes);
		}
	},

	changeNodeInfo : function(node) {
		var $node = $('#' + node.id, this.$container);
		if ($node.length == 0) {
			return;
		}

		this.setNodeInfo(node, $node);
	}

};
GameViewer.prototype.keydownHandler = function(event) {
	var game = this.game;
	var ctrlKey = event.ctrlKey || event.metaKey;
	switch (event.keyCode) {
	case 37:// ArrowLeft
		if (ctrlKey) {
			game.previousCommentOrBranch();
		} else {
			game.previousNode();
		}
		break;
	case 39:// ArrowRight
		if (ctrlKey) {
			game.nextCommentOrBranch();
		} else {
			game.nextNode();
		}
		break;
	case 38:// ArrowUp
		var curNode = game.curNode;
		if (game.inRealGame()) {
			if (curNode.variations) {
				var variation = curNode.variations[curNode.variations.length - 1];
				var node = variation.nodes[0];
				game.gotoNode(node);
			}
		} else {
			if (curNode.isVariationFirstNode()) {
				var variation = curNode.belongingVariation;
				var previousVariation = variation.previousVariation();
				var pvNode = previousVariation.nodes[0];
				game.gotoNode(pvNode);
			} else {
				game.gotoVariationBegin();
			}
		}
		break;
	case 40:// ArrowDown
		var curNode = game.curNode;
		if (game.inRealGame()) {
			if (curNode.variations) {
				var variation = curNode.variations[1];
				var node = variation.nodes[0];
				game.gotoNode(node);
			}
		} else {
			if (curNode.isVariationLastNode()) {
				var variation = curNode.belongingVariation;
				var nextVariation = variation.nextVariation();
				var nvNode = nextVariation.nodes[0];
				game.gotoNode(nvNode);
			} else {
				game.gotoVariationEnd();
			}
		}
		break;
	default:
		;
	}
	return true;
};

GameViewer.prototype.mousewheelHandler = function(event) {
	event.preventDefault();
	if (!this._lastWheelTS) {
		this._lastWheelTS = new Date().getTime();
	} else {
		var now = new Date().getTime();
		var msDiff = now - this._lastWheelTS;
		if (msDiff < 100) {
			return false;
		}
		this._lastWheelTS = now;
	}
	var game = this.game;
	if (!event.wheelDelta && event.originalEvent) {
		event = event.originalEvent;
	}
	var scrollUp = false;
	if (typeof (event.wheelDelta) === 'number') {
		scrollUp = event.wheelDelta > 0;
	} else {
		scrollUp = event.detail < 0;
	}
	if (scrollUp) {
		game.previousNode();
	} else {
		game.nextNode();
	}
	return false;
};
function Layout(viewer){
	this.viewer=viewer;
}
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
