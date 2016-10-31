Board.prototype._drawBoardLineSimple= function() {

	var boardSetting = this.boardSetting;
	var paper = this.paper;

	var boardSize = boardSetting.boardSize;
	var boardOrigin = boardSetting.boardOrigin;
	var gridWidth = boardSetting.gridWidth;
	var strokes = boardSetting.strokes;

	var ox = boardOrigin.x, oy = boardOrigin.y;

	var outerBorderLineRect = paper.rect(ox, oy, gridWidth
			* (boardSize - 1), gridWidth * (boardSize - 1));
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

Board.prototype._drawBoardLine= function() {

	var boardSetting = this.boardSetting;
	var paper = this.paper;
	var lineOrStarMatrix=this.lineOrStarMatrix;
	var er=boardSetting.labels.eraseRadius;

	var boardSize = boardSetting.boardSize;
	var boardOrigin = boardSetting.boardOrigin;
	var gridWidth = boardSetting.gridWidth;
	var strokes = boardSetting.strokes;

	var ox = boardOrigin.x, oy = boardOrigin.y;
	var rightX=ox+gridWidth*(boardSize - 1);
	var bottomY=oy+gridWidth*(boardSize - 1);

	for (var i = 1; i < (boardSize - 1); i++) {
		var xi=ox+gridWidth*i,yi=oy+gridWidth*i;

		var pathL='M'+ox+' '+yi+'h'+er;
		var pathLE=paper.path(pathL).attr({
			'stroke-width' : strokes.borderLine
		});
		lineOrStarMatrix[0][i].push(pathLE);
		var pathLO='M'+ox+' '+(yi-er)+'v'+(er*2);
		var pathLOE=paper.path(pathLO).attr({
			'stroke-width' : strokes.outerBorderLine
		});
		lineOrStarMatrix[0][i].push(pathLOE);

		var pathR='M'+(rightX-er)+' '+yi+'h'+er;
		var pathRE=paper.path(pathR).attr({
			'stroke-width' : strokes.borderLine
		});
		lineOrStarMatrix[boardSize - 1][i].push(pathRE);
		var pathRO='M'+rightX+' '+(yi-er)+'v'+(er*2);
		var pathROE=paper.path(pathRO).attr({
			'stroke-width' : strokes.outerBorderLine
		});
		lineOrStarMatrix[boardSize - 1][i].push(pathROE);

		var pathT='M'+xi+' '+oy+'v'+er;
		var pathTE=paper.path(pathT).attr({
			'stroke-width' : strokes.borderLine
		});
		lineOrStarMatrix[i][0].push(pathTE);
		var pathTO='M'+(xi-er)+' '+oy+'h'+(er*2);
		var pathTOE=paper.path(pathTO).attr({
			'stroke-width' : strokes.outerBorderLine
		});
		lineOrStarMatrix[i][0].push(pathTOE);

		var pathB='M'+xi+' '+(bottomY-er)+'v'+er;
		var pathBE=paper.path(pathB).attr({
			'stroke-width' : strokes.borderLine
		});
		lineOrStarMatrix[i][boardSize - 1].push(pathBE);
		var pathBO='M'+(xi-er)+' '+bottomY+'h'+(er*2);
		var pathBOE=paper.path(pathBO).attr({
			'stroke-width' : strokes.outerBorderLine
		});
		lineOrStarMatrix[i][boardSize - 1].push(pathBOE);
	}

	var pathTL='M'+(ox+er)+' '+oy+'h-'+er+'v'+er;
	var pathTLE=paper.path(pathTL).attr({
		'stroke-width' : strokes.outerBorderLine
	});
	lineOrStarMatrix[0][0].push(pathTLE);

	var pathTR='M'+(rightX-er)+' '+oy+'h'+er+'v'+er;
	var pathTRE=paper.path(pathTR).attr({
		'stroke-width' : strokes.outerBorderLine
	});
	lineOrStarMatrix[boardSize-1][0].push(pathTRE);

	var pathBL='M'+ox+' '+(bottomY-er)+'v'+er+'h'+er;
	var pathBLE=paper.path(pathBL).attr({
		'stroke-width' : strokes.outerBorderLine
	});
	lineOrStarMatrix[0][boardSize-1].push(pathBLE);

	var pathBR='M'+(rightX-er)+' '+bottomY+'h'+er+'v-'+er;
	var pathBRE=paper.path(pathBR).attr({
		'stroke-width' : strokes.outerBorderLine
	});
	lineOrStarMatrix[boardSize-1][boardSize-1].push(pathBRE);


	for (var x = 1; x < (boardSize - 1); x++) {
		for (var y = 1; y < (boardSize - 1); y++) {
			var xc=ox+gridWidth*x;
			var yc=oy+gridWidth*y;
			var path='M'+(xc-er)+' '+yc+'h'+(er*2)+'M'+xc+' '+(yc-er)+'v'+(er*2);
			var lineElement=paper.path(path).attr({
				'stroke-width' : strokes.borderLine
			});
			var pointStatus=lineOrStarMatrix[x][y];
			pointStatus.push(lineElement);
		}
	}

	var remain=gridWidth*0.5-er;
	if(remain<0.1){
		return;
	}

	for (var y = 0; y < boardSize; y++) {
		var path='';
		for(var x=0;x<boardSize-1;x++){
			path+='M'+(ox+gridWidth*x+er)+' '+(oy+gridWidth*y)+'h'+(remain*2);
		}
		var stroke=(y==0||y==boardSize-1)? strokes.outerBorderLine:strokes.borderLine;
		paper.path(path).attr({
			'stroke-width' : stroke
		});
	}

	for (var x = 0; x < boardSize; x++) {
		var path='';
		for(var y=0;y<boardSize-1;y++){
			path+='M'+(ox+gridWidth*x)+' '+(oy+gridWidth*y+er)+'v'+(remain*2);
		}
		var stroke=(x==0||x==boardSize-1)? strokes.outerBorderLine:strokes.borderLine;
		paper.path(path).attr({
			'stroke-width' : stroke
		});
	}
};

Board.prototype._drawBoardStars= function() {
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
		var star=paper.circle(x, y, strokes.star).attr({
			fill : 'black'
		});

		if(boardSetting.labels.eraseBoardLine){
			var pointStatus=this.lineOrStarMatrix[point.x][point.y];
			pointStatus.push(star);
		}
	}
};
