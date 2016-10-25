Board.Label = function(board) {
	this.board = board;
	this.boardSetting = board.boardSetting;
	this.paper = board.paper;
	this.pointStatusMap = board.pointStatusMap;
	this.coordinateManager = board.coordinateManager;
	this.branchPointOnclickHandler;

	this.labelPoints = [];
	this.branchPoints = [];
}

Board.Label.prototype = {

	setBranchPointOnclickHandler : function(handler) {
		this.branchPointOnclickHandler = handler;
	},

	setLabel : function(coor, labelChar, type) {
		if (!labelChar) {
			yogo.logError('label missing: (' + coor.x + ',' + coor.y + ')',
					'setLabel');
			return;
		}
		if (labelChar.length > 2) {
			yogo.logError('label too long: ' + labelChar, 'setLabel');
			return;
		}
		var statusKey = 'x' + coor.x + 'y' + coor.y;
		var pointStatus = this.pointStatusMap[statusKey];
		var stoneColor = null;
		var label = null;
		if (pointStatus) {
			stoneColor = pointStatus.color;
			label = pointStatus.label;
		} else {
			pointStatus = {};
			this.pointStatusMap[statusKey] = pointStatus;
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
			labelElement.attr({
				cursor : 'pointer'
			});
			labelElement.data('branch', labelChar);
			var onclickHandler = this.branchPointOnclickHandler;
			labelElement.click(function(event) {
				if (typeof (onclickHandler) === 'function') {
					onclickHandler(this.data('branch'));
				}
			});
		} else {
			this.labelPoints.push(coor);
		}
	},

	setLabels : function(coorLabels) {
		for (var i = 0; i < coorLabels.length; i++) {
			var coorLabel = coorLabels[i];
			this.setLabel(coorLabel, coorLabel.label);
		}
	},

	removeLabel : function(coor) {
		var statusKey = 'x' + coor.x + 'y' + coor.y;
		var pointStatus = this.pointStatusMap[statusKey];
		if (!pointStatus || !pointStatus.label) {
			// yogo.logWarn('no label at
			// ('+coor.x+','+coor.y+')','removeLabel');
			return;
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
};