let util=require("../util");

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

				util.logWarn('do transform', '_transform');

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
						util.logWarn('element no x attribute', '_transform');
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
