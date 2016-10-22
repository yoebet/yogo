function Board(boardContainer,boardSizeOrSetting,paper){

	this.boardContainer=boardContainer;

	if(typeof(boardContainer)==='string'){
		this.boardContainer=document.getElementById(boardContainer);
	}
	if(paper){
		paper.clear();
		this.paper=paper;
	}else{
		this.paper=Raphael(boardContainer);
	}

	if(typeof(boardSizeOrSetting)==='number'){
		this.boardSize=boardSizeOrSetting;
		this.boardSetting=Board.getDefaultBoardSetting(this.boardSize);
	}else if(typeof(boardSizeOrSetting)==='object'){
		this.boardSetting=boardSizeOrSetting;
		this.boardSize=this.boardSetting.boardSize;
	}else{
		//...
	}

	this.pointStatusMap={};

	this.zoomMode=null;// TL/TR/BL/BR


	var exportFunctions=function(obj,funcNames){
		for(var i=0;i<funcNames.length;i++){
			var funcName=funcNames[i];
			var func=obj[funcName];
			if(typeof(func)!=='function'){
				yogo.logWarn(funcName+' is not a function','board init');
				continue;
			}
			this[funcName]=func.bind(obj);
		}
	};

	this.coordinateManager=new Board.Coordinate(this);
	exportFunctions.call(this,this.coordinateManager,['drawCoordinate','hideCoordinate','showCoordinate','boardCoorToViewBoxCoor']);

	this.stoneManager=new Board.Stone(this);
	exportFunctions.call(this,this.stoneManager,['placeStone','removeStone','addStones','removeStones',
		'showMoveNumber','showMoveNumbers','hideMoveNumbers','unmarkCurrentMoveNumber']);

	this.markerManager=new Board.Marker(this);
	exportFunctions.call(this,this.markerManager,['setMarker','setMarkers','removeMarker','removeAllMarkers','markCurrentMove']);

	this.labelManager=new Board.Label(this);
	exportFunctions.call(this,this.labelManager,['setLabel','setLabels','removeLabel','removeAllLabels','removeBranchPointLabels']);

}


Board.getDefaultBoardSetting=function(boardSize){
	if(isNaN(boardSize)||boardSize<5||boardSize>51){
		yogo.logError('wrong board size: '+boardSize,'board');
	}

	var gridWidth=20;
	var boardPadding=3;
	var coordinatePadding=3;
	var boardOuterEdge=12;
	var coordinateWidth=12;

	var totalOutterWidth=boardOuterEdge*2+boardPadding*2+coordinateWidth+coordinatePadding;
	var viewBoxSize=gridWidth*(boardSize-1)+totalOutterWidth;// around 409

	if(boardSize!=19){
		var viewBoxSize19=gridWidth*18+totalOutterWidth;
		//normalize
		var mul=viewBoxSize/viewBoxSize19;
		viewBoxSize=viewBoxSize19;
		gridWidth=gridWidth/mul;
		boardPadding=boardPadding/mul;
		coordinatePadding=coordinatePadding/mul;
		boardOuterEdge=boardOuterEdge/mul;
		coordinateWidth=coordinateWidth/mul;
	}

	var boardOriginX=boardPadding+coordinateWidth+boardOuterEdge+coordinatePadding;
	var boardOrigin={
		x:boardOriginX,
		y:boardOriginX
	};
	var coordinateX=boardPadding+coordinateWidth/2;
	var coordinate={
		x: {
			basey:coordinateX,
			type:'A' // a/A/1
		},
		y: {
			basex:coordinateX,
			type:'1'
		},
		fontSize:gridWidth/2,
		coordinatePadding: coordinatePadding,
		coordinateWidth: coordinateWidth
	};
	var strokes={
		outerBorderLine: gridWidth*0.03,
		borderLine: gridWidth*0.025,
		star: gridWidth*0.045,
		stone: gridWidth*0.02,
		stoneSpacing:gridWidth*0.01
	};
	var labels={
		fontSize: gridWidth/2+3
	};
	var moveNumbers={
		fontSize: gridWidth/2+1
	};
	var starPoints=[];
	
	if(boardSize%2==1){
		starPoints.push({x:(boardSize-1)/2,y:(boardSize-1)/2});
		if(boardSize>=13){
			starPoints.push({x:3,y:(boardSize-1)/2});
			starPoints.push({x:boardSize-4,y:(boardSize-1)/2});
			starPoints.push({x:(boardSize-1)/2,y:3});
			starPoints.push({x:(boardSize-1)/2,y:boardSize-4});
		}
	}
	if(boardSize>=11){
		starPoints.push({x:3,y:3});
		starPoints.push({x:3,y:boardSize-4});
		starPoints.push({x:boardSize-4,y:3});
		starPoints.push({x:boardSize-4,y:boardSize-4});
	}else if(boardSize==8||boardSize==9){
		starPoints.push({x:2,y:2});
		starPoints.push({x:2,y:boardSize-3});
		starPoints.push({x:boardSize-3,y:2});
		starPoints.push({x:boardSize-3,y:boardSize-3});
	}

	return {
		viewBoxSize: viewBoxSize,
		boardSize: boardSize,
		starPoints: starPoints,
		boardOrigin: boardOrigin,
		gridWidth: gridWidth,
		boardOuterEdge: boardOuterEdge,
		strokes: strokes,
		labels: labels,
		coordinate: coordinate,
		moveNumbers: moveNumbers
	}
};


Board.prototype={


	drawBoard: function(){

		var boardSetting=this.boardSetting;
		var paper=this.paper;

		var viewBoxSize=boardSetting.viewBoxSize;

		yogo.logInfo('viewBox size:'+viewBoxSize,'board');

		paper.setViewBox(0, 0, viewBoxSize, viewBoxSize);
		//paper.image("board/bambootile_warm.jpg", 0, 0, viewBoxSize, viewBoxSize);//board/purty_wood.jpg

		var boardSize=boardSetting.boardSize;
		var boardOrigin=boardSetting.boardOrigin;
		var gridWidth=boardSetting.gridWidth;
		var boardOuterEdge=boardSetting.boardOuterEdge;
		var strokes=boardSetting.strokes;

		var boardEdgeWidth=gridWidth*(boardSize-1)+boardOuterEdge*2;
		var boardEdgeRect=paper.rect(boardOrigin.x-boardOuterEdge,boardOrigin.y-boardOuterEdge,boardEdgeWidth,boardEdgeWidth);
		boardEdgeRect.attr({'stroke-width':0});
		boardEdgeRect.attr({fill:'#DCB35C'});//#DCB35C,#DEC090
		var outerBorderLineRect=paper.rect(boardOrigin.x,boardOrigin.y,gridWidth*(boardSize-1),gridWidth*(boardSize-1));
		outerBorderLineRect.attr({'stroke-width':strokes.outerBorderLine});

		var hpath='',vpath='';
		for(var i=0;i<(boardSize-2);i++){
			hpath+='M'+boardOrigin.x+' '+((boardOrigin.y+gridWidth)+gridWidth*i)+'H'+(boardOrigin.x+gridWidth*(boardSize-1));
			vpath+='M'+((boardOrigin.x+gridWidth)+gridWidth*i)+' '+boardOrigin.y+'V'+(boardOrigin.y+gridWidth*(boardSize-1));
		}

		paper.path(hpath).attr({'stroke-width':strokes.borderLine});
		paper.path(vpath).attr({'stroke-width':strokes.borderLine});

		var starPoints=boardSetting.starPoints;
		for(var i=0;i<starPoints.length;i++){
			var point=starPoints[i];
			var x=boardOrigin.x+gridWidth*point.x;
			var y=boardOrigin.y+gridWidth*point.y;
			paper.circle(x, y, strokes.star).attr({fill:'black'});
		}

		this.drawCoordinate();
	},


	clearBoard: function(){
		for(statusKey in this.pointStatusMap){
			var pointStatus=this.pointStatusMap[statusKey];
			if(pointStatus.color){
				this.removeStone(pointStatus.coor);
			}
		}
		this.removeAllMarkers();
		this.removeAllLabels();
		this.markCurrentMove(null);
	},

	zoomBoard: function(zoomMode) {
		this.zoomMode=zoomMode;
		var viewBoxSize=this.boardSetting.viewBoxSize;
		var cs=this.boardSetting.coordinate;
		var coorTotalWidth=cs.coordinatePadding+cs.coordinateWidth;
		viewBoxSize-=coorTotalWidth;
		var gridWidth=this.boardSetting.gridWidth;
		var newViewBoxSize=viewBoxSize/2+gridWidth/2;
		var viewBoxFrom=coorTotalWidth;
		var viewBoxMiddleFrom=coorTotalWidth+viewBoxSize/2-gridWidth/2;
		if(this.coordinateManager.coordinateShowed){
			viewBoxFrom=0;
			viewBoxSize=this.boardSetting.viewBoxSize;
		}
		if(zoomMode==='TL'){
			this.paper.setViewBox(viewBoxFrom, viewBoxFrom, newViewBoxSize, newViewBoxSize);
		}else if(zoomMode==='TR'){
			this.paper.setViewBox(viewBoxMiddleFrom, viewBoxFrom, newViewBoxSize, newViewBoxSize);
		}else if(zoomMode==='BL'){
			this.paper.setViewBox(viewBoxFrom, viewBoxMiddleFrom, newViewBoxSize, newViewBoxSize);
		}else if(zoomMode==='BR'){
			this.paper.setViewBox(viewBoxMiddleFrom, viewBoxMiddleFrom, newViewBoxSize, newViewBoxSize);
		}else{
			this.paper.setViewBox(viewBoxFrom, viewBoxFrom, viewBoxSize, viewBoxSize);
		}
	},

	resize: function() {
		var width = this.boardContainer.offsetWidth;
		this.paper.setSize(width, width);
	}
	
};