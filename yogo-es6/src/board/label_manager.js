let util=require("../util");

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
			util.logError('label missing: (' + coor.x + ',' + coor.y + ')',
					'setLabel');
			return;
		}
		if (labelChar.length > 2) {
			if (!(/^\d+$/.test(labelChar) && labelChar.length == 3)) {
				util.logError('label too long: ' + labelChar, 'setLabel');
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
			// util.logWarn('point ('+coor.x+','+coor.y+') has a label:
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
				util.logWarn('branch point (' + coor.x + ',' + coor.y
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
			for (let i = 0; i < lineOrStarElements.length; i++) {
				lineOrStarElements[i].hide();
			}
			labelElement.data('lineOrStarElements', lineOrStarElements);
		}

		this.board._setElementEventHandler(labelElement);
	}

	setLabels(coorLabels) {
		for (let i = 0; i < coorLabels.length; i++) {
			var coorLabel = coorLabels[i];
			this.setLabel(coorLabel, coorLabel.label);
		}
	}

	removeLabel(coor) {
		var pointStatus = this.pointStatusMatrix[coor.x][coor.y];
		if (!pointStatus || !pointStatus.label) {
			// util.logWarn('no label at
			// ('+coor.x+','+coor.y+')','removeLabel');
			return;
		}
		var lineOrStarElements = pointStatus.labelElement
				.data('lineOrStarElements');
		if (lineOrStarElements) {
			for (let i = 0; i < lineOrStarElements.length; i++) {
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
