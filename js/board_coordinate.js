Board.Coordinate = function(board) {
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
		var vbCoor = coordinateManager.boardCoorToViewBoxCoor(coor);
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
		} else if (type === 'a' || type === 'A') {
			if (coor >= 26) {
				label = String.fromCharCode(65 + (coor - 26));
			} else if (type === 'a') {
				label = String.fromCharCode(97 + coor);
			} else if (type === 'A') {
				label = String.fromCharCode(65 + coor);
			}
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
		} else if ('⒜🄐ⓐⒶ'.indexOf(type) >= 0) {
			if (coor >= 26) {
				if (type === '⒜') {
					type = '🄐';
				} else if (type === 'ⓐ') {
					type = 'Ⓐ';
				}
				coor = coor % 26;
			}
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

			var tc = {
				x : oriX,
				y : oriY
			};
			// var tc=this._transformCoor({x:oriX,y:oriY},true);
			var xlabel = this.generateCoordinateLabel(coor, this.xType);
			var xlabelElement = this.paper.text(tc.x, tc.y, xlabel).attr({
				'font-size' : this.setting.fontSize
			});
			xlabelElement.data({
				type : 'coordinate',
				boardElement : true
			});
			this.xCoordinateLabels1.push(xlabelElement);

			if (this.fullCoordinate) {
				// var
				// tc2=this._transformCoor({x:oriX,y:viewBoxSize-oriY},true);
				var tc2 = {
					x : oriX,
					y : viewBoxSize - oriY
				};
				var xlabelElement2 = xlabelElement.clone().attr({
					x : tc2.x,
					y : tc2.y
				});
				xlabelElement2.data({
					type : 'coordinate',
					boardElement : true
				});
				this.xCoordinateLabels2.push(xlabelElement2);
			}
		}

		for (var coor = 0; coor < this.boardSize; coor++) {
			var oriX = this.setting.baseCoor;
			var oriY = boardOrigin.y + gridWidth * coor;

			// var tc=this._transformCoor({x:oriX,y:oriY},true);
			var tc = {
				x : oriX,
				y : oriY
			};
			var ylabel = this.generateCoordinateLabel(coor, this.yType);
			var ylabelElement = this.paper.text(tc.x, tc.y, ylabel).attr({
				'font-size' : this.setting.fontSize
			});
			ylabelElement.data({
				type : 'coordinate',
				boardElement : true
			});
			this.yCoordinateLabels1.push(ylabelElement);

			if (this.fullCoordinate) {
				// var
				// tc2=this._transformCoor({x:viewBoxSize-oriX,y:oriY},true);
				var tc2 = {
					x : viewBoxSize - oriX,
					y : oriY
				};
				var ylabelElement2 = ylabelElement.clone().attr({
					x : tc2.x,
					y : tc2.y
				});
				ylabelElement2.data({
					type : 'coordinate',
					boardElement : true
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
