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
	
};Board.Coordinate=function(board){
	this.board=board;
	this.boardSize=board.boardSize;
	this.boardSetting=board.boardSetting;
	this.paper=board.paper;
	this.setting=this.boardSetting.coordinate;

	this.coordinateLabels=[];
	this.coordinateShowed=false;
}

Board.Coordinate.prototype={

	generateCoordinateLabel: function(coor,type){
		var label=''+(coor+1);
		if(type==='a'||type==='A'){
			if(coor>=26){
				label=String.fromCharCode(65+(coor-26));
			}else if(type==='a'){
				label=String.fromCharCode(97+coor);
			}else if(type==='A'){
				label=String.fromCharCode(65+coor);
			}
		}
		return label;
	},

	drawCoordinate: function(){
		var gridWidth=this.boardSetting.gridWidth;
		var boardOrigin=this.boardSetting.boardOrigin;
		for(var coor=0;coor<this.boardSize;coor++){
			var xx=boardOrigin.x+gridWidth*coor;
			var xlabel=this.generateCoordinateLabel(coor,this.setting.x.type);
			var xlabelElement=this.paper.text(xx,this.setting.x.basey,xlabel).attr({'font-size':this.setting.fontSize});
			this.coordinateLabels.push(xlabelElement);

			var yy=boardOrigin.y+gridWidth*coor;
			var ylabel=this.generateCoordinateLabel(coor,this.setting.y.type);
			var ylabelElement=this.paper.text(this.setting.y.basex,yy,ylabel).attr({'font-size':this.setting.fontSize});
			this.coordinateLabels.push(ylabelElement);
		}
		this.coordinateShowed=true;
	},

	hideCoordinate: function(){
		if(!this.coordinateShowed){
			return;
		}
		for(var i=0;i<this.coordinateLabels.length;i++){
			var coordinateLabel=this.coordinateLabels[i];
			coordinateLabel.hide();
		}
		this.coordinateShowed=false;
		
		var coorTotalWidth=this.setting.coordinatePadding+this.setting.coordinateWidth;
		var viewBoxSize=this.boardSetting.viewBoxSize;
		this.paper.setViewBox(coorTotalWidth, coorTotalWidth, viewBoxSize-coorTotalWidth, viewBoxSize-coorTotalWidth);
	},

	showCoordinate: function(){
		if(this.coordinateShowed){
			return;
		}
		var viewBoxSize=this.boardSetting.viewBoxSize;
		this.paper.setViewBox(0, 0, viewBoxSize, viewBoxSize);
		for(var i=0;i<this.coordinateLabels.length;i++){
			var coordinateLabel=this.coordinateLabels[i];
			coordinateLabel.show();
		}
		this.coordinateShowed=true;
	},

	coordinateStatus: function(){
		return this.coordinateShowed;
	},

	boardCoorToViewBoxCoor: function(coor){
		var boardOrigin=this.boardSetting.boardOrigin;
		var gridWidth=this.boardSetting.gridWidth;
		var x=boardOrigin.x+gridWidth*coor.x;
		var y=boardOrigin.y+gridWidth*coor.y;
		return {x:x,y:y};
	}
};
Board.Label=function(board){
	this.board=board;
	this.boardSetting=board.boardSetting;
	this.paper=board.paper;
	this.pointStatusMap=board.pointStatusMap;
	this.coordinateManager=board.coordinateManager;

	this.labelPoints=[];
	this.branchPoints=[];
}

Board.Label.prototype={
	setLabel: function(coor,labelChar,type){
		if(!labelChar){
			yogo.logError('label missing: ('+coor.x+','+coor.y+')','setLabel');
			return;
		}
		if(labelChar.length>2){
			yogo.logError('label too long: '+labelChar,'setLabel');
			return;
		}
		var statusKey='x'+coor.x+'y'+coor.y;
		var pointStatus=this.pointStatusMap[statusKey];
		var stoneColor=null;
		var label=null;
		if(pointStatus){
			stoneColor=pointStatus.color;
			label=pointStatus.label;
		}else{
			pointStatus={};
			this.pointStatusMap[statusKey]=pointStatus;
		}

		if(label){
			//yogo.logWarn('point ('+coor.x+','+coor.y+') has a label: '+label,'setLabel');
			pointStatus.labelElement.remove();
		}

		var labelColor='black';
		if(stoneColor=='B'){
			labelColor='white';
		}
		if(type==='branch_point'){
			labelColor='blue';
			if(stoneColor){
				yogo.logWarn('branch point ('+coor.x+','+coor.y+') has a stone','setLabel');
			}
		}
		var labelSetting=this.boardSetting.labels;
		var fontSize=labelSetting.fontSize;
		if(labelChar.length==2){
			fontSize-=1;
		}
		var vbCoor=this.coordinateManager.boardCoorToViewBoxCoor(coor);
		var labelElement=this.paper.text(vbCoor.x,vbCoor.y,labelChar).attr({'font-size':fontSize,fill:labelColor});
		pointStatus.labelElement=labelElement;
		pointStatus.label=labelChar;
		if(type==='branch_point'){
			this.branchPoints.push(coor);
		}else{
			this.labelPoints.push(coor);
		}
	},

	setLabels: function(coorLabels){
		for(var i=0;i<coorLabels.length;i++){
			var coorLabel=coorLabels[i];
			this.setLabel(coorLabel,coorLabel.label);
		}
	},

	removeLabel: function(coor){
		var statusKey='x'+coor.x+'y'+coor.y;
		var pointStatus=this.pointStatusMap[statusKey];
		if(!pointStatus||!pointStatus.label){
			//yogo.logWarn('no label at ('+coor.x+','+coor.y+')','removeLabel');
			return;
		}
		pointStatus.labelElement.remove();
		pointStatus.labelElement=null;
		pointStatus.label=null;
	},

	removeAllLabels: function(){
		while(this.labelPoints.length>0){
			this.removeLabel(this.labelPoints.pop());
		}
	},

	removeBranchPointLabels: function(){
		while(this.branchPoints.length>0){
			this.removeLabel(this.branchPoints.pop());
		}
	}
};Board.Marker=function(board){
	this.board=board;
	this.boardSetting=board.boardSetting;
	this.paper=board.paper;
	this.pointStatusMap=board.pointStatusMap;
	this.coordinateManager=board.coordinateManager;

	this.templateMarkerPoint={x:-this.boardSetting.gridWidth,y:-this.boardSetting.gridWidth};
	this.currentMoveMarker=null;
	this.markerPoints=[];
	this.markerTemplates=this.setupMarkerTemplates();
}

Board.Marker.prototype={

	setupMarkerTemplates: function(){

		var paper=this.paper;
		var gridWidth=this.boardSetting.gridWidth;
		var strokes=this.boardSetting.strokes;
		var mp=this.templateMarkerPoint;

		var crMarkerW=paper.circle(mp.x, mp.y, gridWidth*0.23).attr({'stroke-width':gridWidth*0.1});
		var crMarkerB=crMarkerW.clone().attr({stroke:'white'});

		var sqSide=gridWidth*0.4;
		var sqMarkerB=paper.rect(mp.x, mp.y, sqSide, sqSide).attr({'stroke-width':0,fill:'white'});
		var sqMarkerW=sqMarkerB.clone().attr({fill:'black'});

		var trSide=gridWidth*0.5;
		var trHigh=trSide*Math.sin(Math.PI/3);
		var trGravityHigh=(trSide/2)*Math.tan(Math.PI/6);
		var trMarkerB=paper.path('M'+(mp.x-trSide/2)+' '+(mp.y+trGravityHigh)+'h'+trSide+'l'+(-trSide/2)+' '+(-trHigh)+'Z');
		var trMarkerW=trMarkerB.clone().attr({'stroke-width':0,fill:'black'});
		trMarkerB.attr({'stroke-width':strokes.borderLine,fill:'white'});
		var maSide=gridWidth*0.32;
		var maStroke=gridWidth*0.1;
		var maMarkerW=paper.path('M'+(mp.x-maSide/2)+' '+(mp.y-maSide/2)+'l'+maSide+' '+maSide+'M'+(mp.x-maSide/2)+' '+(mp.y+maSide/2)+'l'+maSide+' '+(-maSide));
		maMarkerW.attr({'stroke-width':maStroke,'stroke-linecap':'round'});
		var maMarkerB=maMarkerW.clone().attr({color:'white'});

		var twMarker=paper.circle(mp.x, mp.y, gridWidth*0.13).attr({'stroke-width':gridWidth*0.04,fill:'white'});
		var tbMarker=twMarker.clone().attr({fill:'black'});

		return {
			'CR_B': crMarkerB,
			'SQ_B': sqMarkerB,
			'TR_B': trMarkerB,
			'MA_B': maMarkerB,
			'CR_W': crMarkerW,
			'SQ_W': sqMarkerW,
			'TR_W': trMarkerW,
			'MA_W': maMarkerW,
			'CR_E': crMarkerW,
			'SQ_E': sqMarkerW,
			'TR_E': trMarkerW,
			'MA_E': maMarkerW,
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
			this.currentMoveMarker=this.paper.circle(vbCoor.x, vbCoor.y, gridWidth*0.15).attr({'stroke-width':0,fill:'red'});
		}
	},

	//markerType: TR/CR/SQ/MA
	setMarker: function(coor,markerType){
		var statusKey='x'+coor.x+'y'+coor.y;
		var pointStatus=this.pointStatusMap[statusKey];
		var stoneColor=null;
		var marker=null;
		if(pointStatus){
			stoneColor=pointStatus.color;
			marker=pointStatus.marker;
		}else{
			pointStatus={};
			this.pointStatusMap[statusKey]=pointStatus;
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
		var markerTemplate=this.markerTemplates[markerKey];
		if(!markerTemplate){
			yogo.logError('markerTemplate '+markerKey+' not found','setMarker');
			return;
		}
		markerElement=markerTemplate.clone();
		//yogo.logInfo('marker '+markerKey+' from template','setMarker');
		var vbCoor=this.coordinateManager.boardCoorToViewBoxCoor(coor);
		if(markerType=='CR'||markerType=='TW'||markerType=='TB'){
			markerElement.attr({cx:vbCoor.x,cy:vbCoor.y});
		}else if(markerType=='SQ'){
			var bbox=markerElement.getBBox();
			markerElement.attr({x:vbCoor.x-bbox.width/2,y:vbCoor.y-bbox.height/2});
		}else{
			var bbox=markerElement.getBBox();
			markerElement.transform('t'+(vbCoor.x-this.templateMarkerPoint.x)+','+(vbCoor.y-this.templateMarkerPoint.y));
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
		var statusKey='x'+coor.x+'y'+coor.y;
		var pointStatus=this.pointStatusMap[statusKey];
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
};Board.Stone=function(board){
	this.board=board;
	this.boardSize=board.boardSize;
	this.boardSetting=board.boardSetting;
	this.paper=board.paper;
	this.pointStatusMap=board.pointStatusMap;
	this.coordinateManager=board.coordinateManager;

	this.stoneTemplates=this.setupStoneTemplates();
	this.moveNumberElements=[];
	this.currentMoveNumberElement=null;
}

Board.Stone.prototype={

	setupStoneTemplates: function(){
		var gridWidth=this.boardSetting.gridWidth;
		var strokes=this.boardSetting.strokes;
		var stoneRadius=gridWidth/2-strokes.stoneSpacing;
		var invisiblePoint={x:-this.boardSetting.gridWidth,y:-this.boardSetting.gridWidth};
	
		var blackStone=this.paper.circle(invisiblePoint.x, invisiblePoint.y, stoneRadius).attr({'stroke-width':strokes.stone,fill:'black'});
		return {
			blackStone:blackStone,
			whiteStone:blackStone.clone().attr({fill:'white'})
		};
	},

	placeStone: function(coor,color){
		if(color!='B'&&color!='W'){
			yogo.logWarn('wrong color:'+color,'place stone');
			return;
		}

		var statusKey='x'+coor.x+'y'+coor.y;
		var pointStatus=this.pointStatusMap[statusKey];
		if(pointStatus&&pointStatus.color){
			yogo.logWarn('point occupied: ('+coor.x+','+coor.y+',color:'+pointStatus.color+')','place stone');
			if(color==pointStatus.color){
				return;
			}
			var altColor=(color=='B')? 'W':'B';
			var altColorStone=pointStatus['stone'+altColor];
			if(altColorStone){
				altColorStone.hide();
			}
		}
		if(!pointStatus){
			pointStatus={coor:coor};
		}
		pointStatus.color=color;
		
		var thisColorStone=pointStatus['stone'+color];
		if(thisColorStone){
			thisColorStone.show();
			return;
		}

		var stone=(color=='B')? this.stoneTemplates.blackStone:this.stoneTemplates.whiteStone;
		thisColorStone=stone.clone();
		var vbCoor=this.coordinateManager.boardCoorToViewBoxCoor(coor);
		thisColorStone.attr({cx:vbCoor.x,cy:vbCoor.y});
		pointStatus['stone'+color]=thisColorStone;
		this.pointStatusMap[statusKey]=pointStatus;
	},

	removeStone: function(coor){
		var statusKey='x'+coor.x+'y'+coor.y;
		var pointStatus=this.pointStatusMap[statusKey];
		if(!pointStatus){
			yogo.logWarn('point empty: ('+coor.x+','+coor.y+')','remove stone');
			return;
		}
		var stone=pointStatus['stone'+pointStatus.color];
		if(stone){
			stone.hide();
			if(pointStatus.moveNumberElement){
				pointStatus.moveNumberElement.hide();
				pointStatus.moveNumberElement=null;
			}
		}else{
			yogo.logWarn('stone not exist: ('+coor.x+','+coor.y+')','remove stone');
		}
		pointStatus.color=null;
	},


	addStones: function(coors,color){
		for(var i=0;i<coors.length;i++){
			var coor=coors[i];
			this.placeStone(coor,color);
		}
	},

	removeStones: function(coors){
		for(var i=0;i<coors.length;i++){
			this.removeStone(coors[i]);
		}
	},

	showMoveNumber: function(mn){
		var statusKey='x'+mn.x+'y'+mn.y;
		var pointStatus=this.pointStatusMap[statusKey];
		if(!pointStatus||!pointStatus.color){
			yogo.logWarn('point empty: ('+mn.x+','+mn.y+')','show move number');
		}
		if(pointStatus.color!=mn.color){
			yogo.logWarn('wrong color: ('+mn.x+','+mn.y+')','show move number');
		}

		var currentMoveNumberColor='red';

		var moveNumber=mn.moveNumber;
		var stone=pointStatus['stone'+pointStatus.color];
		var mnElement=stone.data('mn_'+moveNumber);
		if(mnElement){
			if(mn.current){
				this.unmarkCurrentMoveNumber();
				mnElement.attr({fill:currentMoveNumberColor});
				this.currentMoveNumberElement=mnElement;
			}
			mnElement.show();
			this.moveNumberElements.push(mnElement);
			return;
		}

		var mnColor='black';
		if(pointStatus.color=='B'){
			mnColor='white';
		}
		var oriColor=mnColor;
		if(mn.current){
			mnColor=currentMoveNumberColor;
		}
		var mnSetting=this.boardSetting.moveNumbers;
		var fontSize=mnSetting.fontSize;
		if(moveNumber>9){
			fontSize-=1;
		}else if(moveNumber>99){
			fontSize-=2;
		}
		var vbCoor=this.coordinateManager.boardCoorToViewBoxCoor(mn);
		mnElement=this.paper.text(vbCoor.x,vbCoor.y,moveNumber).attr({'font-size':fontSize,fill:mnColor});
		mnElement.data('oriColor',oriColor);
		stone.data('mn_'+moveNumber,mnElement);
		pointStatus.moveNumberElement=mnElement;
		this.moveNumberElements.push(mnElement);
		if(mn.current){
			this.unmarkCurrentMoveNumber();
			this.currentMoveNumberElement=mnElement;
		}
	},

	unmarkCurrentMoveNumber: function(){
		if(this.currentMoveNumberElement){
			var oriColor=this.currentMoveNumberElement.data('oriColor');
			this.currentMoveNumberElement.attr({fill:oriColor});
			this.currentMoveNumberElement=null;
		}
	},

	showMoveNumbers: function(moveNumbers){
		for(var i=0;i<moveNumbers.length;i++){
			this.showMoveNumber(moveNumbers[i]);
		}
	},


	hideMoveNumbers: function(){
		while(this.moveNumberElements.length>0){
			this.moveNumberElements.pop().hide();
		}
	}

};function Game(board,gameModel){

	this.board=board;
	this.gameModel=gameModel;
	this.boardSize=gameModel.boardSize;

	this.curNode=gameModel.nodes[0];

	this.markCurrentMove=true;

	this.markBranchPoints=true;

	this.showMoveNumber=false;

	this.showMoveNumberCount=10;

	this.hideMoveNumberTemporarily=false;

	this.gameEndingNode=null;

	this.onPlayNode=null;

	var variationMap=this.variationMap={};

	var nodeMap=this.nodeMap={};

	var nodesByMoveNumber=this.nodesByMoveNumber=[];


	var variationCallback=function(variation,context){
		variation.id='v'+context.seq++;
		variationMap[variation.id]=variation;
	};

	var game=this;

	var nodeCallback=function(node,context){
		node.id='n'+context.seq++;
		nodeMap[node.id]=node;
		if(node.belongingVariation.realGame){
			var mn=node.numbers.globalMoveNumber;
			if(mn&&!nodesByMoveNumber[mn]){
				nodesByMoveNumber[mn]=node;
			}
			if(!node.nextNode&&!node.variations){
				game.gameEndingNode=node;
			}
		}
	};

	this.gameModel.traverseNodes(variationCallback,nodeCallback,{seq:1000});


	var trueFunc=function(){return true};
	var hasVariations=function(node){return !!node.variations;};
	var hasRemark=function(node){return node.status.remark;};
	var hasComments=function(node){return node.status.comment;};
	var hasMarks=function(node){return node.status.mark;};
	var isKo=function(node){var s=node.status;return s.positionBuilt&&(s.startKo||s.ko);};
	var isCapture=function(node){return node.status.positionBuilt&&node.status.capture;};
	var notEvaluated=function(node){return !node.status.positionBuilt;};

	var navigationFuncs=[
		{name:'Node',predicate:trueFunc},
		{name:'Branch',predicate:hasVariations},
		{name:'Remark',predicate:hasRemark},
		{name:'Comment',predicate:hasComments},
		{name:'Marks',predicate:hasMarks},
		{name:'Ko',predicate:isKo},
		{name:'Capture',predicate:isCapture},
		{name:'NotEvaluated',predicate:notEvaluated}
	];

	var newNavigation=function(navi,predicate){
		return function(){
			return navi.call(this,predicate);
		};
	}.bind(this);

	for(var ni=0;ni<navigationFuncs.length;ni++){
		var nf=navigationFuncs[ni];
		var navi=nf.navi,predicate=nf.predicate;
		this['next'+nf.name]=newNavigation(this.gotoNextX,predicate);
		this['previous'+nf.name]=newNavigation(this.gotoLastX,predicate);
	}

}

Game.prototype={

	setCurrentNodeMarkers: function(){
		var board=this.board;
		board.removeAllMarkers();
		board.removeAllLabels();
		board.removeBranchPointLabels();
		var curNode=this.curNode;
		if(curNode.status.mark){
			if(curNode.marks['LB']){
				board.setLabels(curNode.marks['LB']);
			}
			var markerTypes=['TR','CR','SQ','MA','TW','TB'];
			for(var mi=0;mi<markerTypes.length;mi++){
				var marker=markerTypes[mi];
				if(curNode.marks[marker]){
					this.setMarkers(curNode.marks[marker],marker,true);
				}
			}
		}
		if(this.markBranchPoints){
			this.markBranchPointsIfAny();
		}

		if(this.markCurrentMove&&!this.showMoveNumber){
			board.markCurrentMove(curNode.move.point);
		}else{
			board.markCurrentMove(null);
		}
	},

	setMarkers: function(points,marker,processRange){
		var board=this.board;
		if(processRange){
			for(var i=0;i<points.length;i++){
				var point=points[i];
				if(point.coorFrom){
					var rangePoints=this.evaluatePointRange(point.coorFrom,point.coorTo);
					board.setMarkers(rangePoints,marker);
				}else{
					board.setMarker(point,marker);
				}
			}
		}else{
			board.setMarkers(points,marker);
		}
	},

	setMarkCurrentMove: function(mark){
		this.markCurrentMove=mark;
		if(this.markCurrentMove){
			this.board.markCurrentMove(this.curNode.move.point);
		}else{
			this.board.markCurrentMove(null);
		}
	},

	setMarkBranchPoints: function(markBranchPoints){
		this.markBranchPoints=markBranchPoints;
		if(this.markBranchPoints){
			this.markBranchPointsIfAny();
		}else{
			this.board.removeBranchPointLabels();
		}
	},


	markBranchPointsIfAny: function(){
		var branchPoints=this.curNode.branchPoints;
		if(branchPoints){
			for(var i=0;i<branchPoints.length;i++){
				if(i>25){
					continue;
				}
				var point=branchPoints[i];
				var label=String.fromCharCode(65+i);
				this.board.setLabel(point,label,'branch_point');
			}
		}
	},


	setShowMoveNumber: function(show){
		if(typeof(show)==='boolean'){
			this.showMoveNumber=show;
			if(this.showMoveNumberCount==0){
				this.showMoveNumberCount=1;
			}
		}else if(typeof(show)==='number'){
			this.showMoveNumberCount=show;
			this.showMoveNumber=show>0;
		}else if(typeof(show)==='string'){
			var mnc=parseInt(show);
			if(!NaN(mnc)){
				this.showMoveNumberCount=mnc;
				this.showMoveNumber=mnc>0;
			}
		}
		if(this.showMoveNumber){
			this.board.markCurrentMove(null);
		}else{
			this.board.markCurrentMove(this.curNode.move.point);
		}
		this.resetMoveNumbers();
	},

	resetMoveNumbers: function(){
		this.board.hideMoveNumbers();
		if(!this.showMoveNumber){
			return;
		}

		var moveNumbers=[];
		var count=this.showMoveNumberCount;
		var variation=this.curNode.belongingVariation;
		var node=this.curNode;
		var curPosition=this.curNode.position;
		for(;count>0;count--){
			var point=node.move.point;
			if(point){
				var pointCurStatus=curPosition[point.x][point.y];
				if(pointCurStatus&&pointCurStatus.node===node){
					var moveNumber=node.numbers.displayMoveNumber;
					var mn={x:point.x,y:point.y,color:node.move.color,moveNumber:moveNumber};
					if(node===this.curNode){
						mn.current=true;
					}
					moveNumbers.push(mn);
				}
			}
			if(!variation.realGame&&(node.status.variationFirstNode||node.belongingVariation!==variation)){
				break;
			}
			node=node.previousNode;
			if(!node){
				break;
			}
		}
		this.board.showMoveNumbers(moveNumbers);
	},

	hideMoveNumbers: function(){
		this.board.hideMoveNumbers();
	},

	handleMoveNumbers: function(lastNode){
		var board=this.board;
		var curNode=this.curNode;
		if(curNode.status.mark){
			this.hideMoveNumberTemporarily=true;
			this.hideMoveNumbers();
			if(this.markCurrentMove){
				board.markCurrentMove(curNode.move.point);
			}
			return;
		}
		if(this.hideMoveNumberTemporarily){
			this.hideMoveNumberTemporarily=false;
			this.resetMoveNumbers();
			return;
		}

		var moveNumberSet=false;
		if(this.showMoveNumberCount!==0&&!this.showMoveNumberCount){
			if(curNode.label)
			if(lastNode.nextNode==curNode){
				var variation=curNode.belongingVariation;
				if(variation.realGame||variation==lastNode.belongingVariation){
					var point=curNode.move.point;
					if(point){
						var moveNumber=curNode.numbers.displayMoveNumber;
						var mn={x:point.x,y:point.y,color:curNode.move.color,moveNumber:moveNumber,current:true};
						board.showMoveNumber(mn);
					}else{
						board.unmarkCurrentMoveNumber();
					}
					moveNumberSet=true;
				}
			}
			if(lastNode.previousNode==curNode){
				var variation=lastNode.belongingVariation;
				if(variation.realGame||variation==curNode.belongingVariation){
					var point=curNode.move.point;
					if(point){
						var moveNumber=curNode.numbers.displayMoveNumber;
						var mn={x:point.x,y:point.y,color:curNode.move.color,moveNumber:moveNumber,current:true};
						board.showMoveNumber(mn);
					}
					moveNumberSet=true;
				}
			}
		}
		if(!moveNumberSet){
			this.resetMoveNumbers();
		}
	},

	evaluatePointRange: function(coorFrom,coorTo){
		var rangePoints=[];
		var fromX=coorFrom.x,toX=coorTo.x;
		var fromY=coorFrom.y,toY=coorTo.y;
		for(var x=fromX;x<=toX;x++){
			for(var y=fromY;y<=toY;y++){
				rangePoints.push({x:x,y:y});
			}
		}
		return rangePoints;
	},

	diffPosition: function(fromPosition,toPosition){

		var stonesToRemove=[];
		var stonesToAddW=[];
		var stonesToAddB=[];
		for(var x=0;x<this.boardSize;x++){
			var fx=fromPosition[x];
			var tx=toPosition[x];
			if(fx===tx){
				continue;
			}
			for(var y=0;y<this.boardSize;y++){
				var fromStatus=fx[y];
				var toStatus=tx[y];
				if(fromStatus===toStatus||(!fromStatus&&!toStatus)){
					continue;
				}
				var toRemove=false,toAdd=false;
				if(!toStatus){
					toRemove=true;
				}else if(!fromStatus){
					toAdd=true;
				}else if(fromStatus.color!=toStatus.color){
					toRemove=true;
					toAdd=true;
				}
				var point={x:x,y:y};
				if(toRemove){
					stonesToRemove.push(point);
				}
				if(toAdd){
					if(toStatus.color=='B'){
						stonesToAddB.push(point);
					}else{
						stonesToAddW.push(point);
					}
				}
			}
		}
		return {stonesToRemove:stonesToRemove,stonesToAddB:stonesToAddB,stonesToAddW:stonesToAddW};
	},

	playNode: function(node){
		if(!node){
			return false;
		}
		var board=this.board;
		var lastNode=this.curNode;
		var curNode=this.curNode=node;
		var success=true;

		if(curNode.status.positionBuilt){
			if(curNode==lastNode){
				return false;
			}
			if(lastNode.nextNode==curNode&&!curNode.status.capture&&!curNode.status.setup){
				var movePoint=curNode.move.point;
				if(movePoint){
					board.placeStone(movePoint,curNode.move.color);
				}
			}else if(lastNode.previousNode==curNode&&!lastNode.status.capture&&!lastNode.status.setup){
				var movePoint=lastNode.move.point;
				if(movePoint){
					board.removeStone(movePoint);
				}
			}else{
				var lastPosition=lastNode.position;
				var position=curNode.position;
				var diffStones=this.diffPosition(lastPosition,position);
				board.removeStones(diffStones.stonesToRemove);
				board.addStones(diffStones.stonesToAddB,'B');
				board.addStones(diffStones.stonesToAddW,'W');
			}
		} else{
			var positionBuilder=new PositionBuilder(this,curNode);
			success=positionBuilder.buildPosition();
		}
		this.setCurrentNodeMarkers();
		this.handleMoveNumbers(lastNode);
		if(typeof(this.onPlayNode)==='function'){
			this.onPlayNode.call(this);
		}
		return success;
	},

	gotoNextX: function(predicate){
		var node=this.curNode;
		while(true){
			if(node.nextNode){
				node=node.nextNode;
			}else if(node.variations){
				node=node.variations[0].nodes[0];
			}else{
				return false;
			}
			if(!node){
				return false;
			}
			if(predicate.call(node,node)){
				return this.playNode(node);
			}
		}
	},

	gotoLastX: function(predicate){
		var node=this.curNode;
		while(true){
			node=node.previousNode;
			if(!node){
				return false;
			}
			if(predicate.call(node,node)){
				return this.playNode(node);
			}
		}
	},

	gotoNode: function(obj){
		var node;
		if(typeof(obj)==='string'){
			node=this.nodeMap[obj];
		}else if(typeof(obj)==='number'){
			node=this.nodesByMoveNumber[obj];
		}else if(obj instanceof Node){
			node=obj;
		}
		if(node){
			return this.playNode(node);
		}
		return false;
	},

	gotoBeginning: function(){
		var firstNode=this.gameModel.nodes[0];
		return this.playNode(firstNode);
	},

	gotoGameEnd: function(){
		return this.playNode(this.gameEndingNode);
	},

	fastFoward: function(n){
		n=n||10;
		var node=this.curNode;
		for(;n>0;n--){
			if(node.nextNode){
				node=node.nextNode;
			}else if(node.variations){
				node=node.variations[0].nodes[0];
			}else{
				break;
			}
		}
		return this.playNode(node);
	},

	fastBackward: function(n){
		n=n||10;
		var node=this.curNode;
		for(;n>0;n--){
			if(node.previousNode){
				node=node.previousNode;
			}else{
				break;
			}
		}
		return this.playNode(node);
	},

	goinBranch: function(branch){
		var variations=this.curNode.variations;
		if(variations){
			var variation;
			if(typeof(branch)==='number'){
				variation=variations[branch];
			}else if(typeof(branch)==='string' && branch.length==1){
				var vi=branch.charCodeAt(0)-65;
				variation=variations[vi];
			}
			if(variation){
				var node=variation.nodes[0];
				return this.playNode(node);
			}
		}
		return false;
	},

	gotoVariationBegin: function(){
		if(this.inRealGame()){
			return false;
		}
		if(this.curNode.status.variationFirstNode){
			return false;
		}
		return this.gotoLastX(function(node){return node.status.variationFirstNode;});
	},

	gotoVariationEnd: function(){
		if(this.inRealGame()){
			return false;
		}
		if(this.curNode.status.variationLastNode){
			return false;
		}
		return this.gotoNextX(function(node){return node.status.variationLastNode;});
	},

	backFromVariation: function(){
		if(this.inRealGame()){
			return false;
		}
		return this.playNode(this.curNode.belongingVariation.baseNode);
	},

	inRealGame: function(){
		return this.curNode.belongingVariation.realGame;
	}

	// find node by commentary/nodename

};
function GameModel(){
	this.realGame=true;
	this.nodes=[];
}

GameModel.prototype={
	
	traverseNodes: function(variationCallback,nodeCallback,context){

		var nodes=this.nodes;
		for(var ni=0;ni<nodes.length;ni++){
			var node=nodes[ni];
			if(nodeCallback){
				var ncr=nodeCallback.call(node,node,context);
				if(ncr===false){
					return context;
				}
			}
			var variations=node.variations;
			if(!variations){
				continue;
			}
			for(var vi=0;vi<variations.length;vi++){
				var variation=variations[vi];
				if(variationCallback){
					var vcr=variationCallback.call(variation,variation,context);
					if(vcr===false){
						return context;
					}
				}
				variation.traverseNodes(variationCallback,nodeCallback,context);
			}
		}

		return context;
	},

	selectNodes: function(predicate){
		return traverseNodes(null,
			function(node,context){
				if(predicate.call(node,node)){
					context.push(node);
				}
			},[]);
	}
};

function Variation(baseNode,parentVariation){
	this.baseNode=baseNode;
	this.parentVariation=parentVariation;
	this.realGame=false;
	this.nodes=[];
}

Variation.prototype=GameModel.prototype;

function Node(previousNode,belongingVariation){
	this.previousNode=previousNode;
	this.belongingVariation=belongingVariation;
	this.props={};
	this.status={};
}

Node.prototype={
	
};

if (!String.prototype.trim) {
	String.prototype.trim = function () {
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
		var aArgs	 = Array.prototype.slice.call(arguments, 1),
				fToBind = this,
				fNOP    = function() {},
				fBound  = function() {
					return fToBind.apply(this instanceof fNOP && oThis
								 ? this
								 : oThis,
								 aArgs.concat(Array.prototype.slice.call(arguments)));
				};
		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();
		return fBound;
	};
}
function PositionBuilder(game,curNode){
	this.game=game;
	this.board=game.board;
	this.gameModel=game.gameModel;
	this.boardSize=game.gameModel.boardSize;
	this.curNode=curNode;

	this.basePosition=null;
	this.position=[];
}

PositionBuilder.prototype={

	getPointColor: function(x,y){
		var status=(this.position[x]||this.basePosition[x])[y];
		if(status){
			return status.color;
		}
		return null;
	},

	setPointColor: function(x,y,color){
		var status=null;
		if(color){
			status={color:color,node:this.curNode};
		}
		if(this.position[x]){
			this.position[x][y]=status;
			return;
		}
		this.position[x]=[];
		for(var yi=0;yi<this.basePosition[x].length;yi++){
			this.position[x][yi]=this.basePosition[x][yi];
		}
		this.position[x][y]=status;
	},

	getFinalPosition: function(){
		for(var x=0;x<this.boardSize;x++){
			if(!this.position[x]){
				this.position[x]=this.basePosition[x];
			}
		}
		return this.position;
	},


	setPointsStatus: function(points,color){
		for(var i=0;i<points.length;i++){
			var point=points[i];
			this.setPointColor(point.x,point.y,color);
		}
	},

	getAdjacentPointsStatus: function(point){
		var adjacentPoints=[
			{x:point.x-1,y:point.y},
			{x:point.x,y:point.y-1},
			{x:point.x+1,y:point.y},
			{x:point.x,y:point.y+1}
		];
		var boardSize=this.boardSize;
		for(var direction=0;direction<4;direction++){
			var adjacentPoint=adjacentPoints[direction];
			var x=adjacentPoint.x,y=adjacentPoint.y;
			if(x>=0&&y>=0&&x<boardSize&&y<boardSize){
				adjacentPoint.color=this.getPointColor(x,y);
			}else{
				adjacentPoints[direction]=null;
			}
		}
		return adjacentPoints;
	},

	traverseGroup: function(startPoint,color,callback){

		var checkedPoints={};

		var game=this;
		function doTraverseGroup(point,comingDirection){
			var key='x'+point.x+'y'+point.y;
			if(checkedPoints[key]){
				return;
			}
			var pointsStatus=game.getAdjacentPointsStatus(point);

			var result=callback(point,pointsStatus);
			if(result===false){
				return false;
			}

			checkedPoints[key]=true;

			for(var direction=0;direction<4;direction++){
				var pointStatus=pointsStatus[direction];
				if(pointStatus==null){
					continue;
				}
				if(pointStatus.color==color&&comingDirection!==direction){
					var oppositeDirection=(comingDirection+2)%4;
					var result=doTraverseGroup(pointStatus,oppositeDirection);
					if(result===false){
						return false;
					}
				}
			}
		}

		return doTraverseGroup(startPoint);
	},

	checkGroupLiberties: function(startPoint,color){

		var groupPoints=[];
		var callback=function(point,adjacentPointsStatus){
			groupPoints.push(point);
			for(var direction=0;direction<4;direction++){
				var pointStatus=adjacentPointsStatus[direction];
				if(pointStatus==null){
					continue;
				}
				if(pointStatus.color==null){
					return false;
				}
			}
		}

		var result=this.traverseGroup(startPoint,color,callback);
		if(result===false){
			return {hasLiberty:true};
		}else{
			return {hasLiberty:false,groupPoints:groupPoints};
		}
	},

	removeStones: function(points,processRange){
		if(processRange){
			for(var i=0;i<points.length;i++){
				var point=points[i];
				if(point.coorFrom){
					var rangePoints=this.game.evaluatePointRange(point.coorFrom,point.coorTo);
					this.removeStones(rangePoints,false);
				}else{
					this.setPointColor(x,y,null);
					this.board.removeStone(point);
				}
			}
		}else{
			this.setPointsStatus(points,null);
			this.board.removeStones(points);
		}
	},

	addStones: function(points,color,processRange){
		if(processRange){
			for(var i=0;i<points.length;i++){
				var point=points[i];
				if(point.coorFrom){
					var rangePoints=this.game.evaluatePointRange(point.coorFrom,point.coorTo);
					this.addStones(rangePoints,color,false);
				}else{
					this.setPointColor(point.x,point.y,color);
					this.board.placeStone(point,color);
				}
			}
		}else{
			this.setPointsStatus(points,color);
			this.board.addStones(points,color);
		}
	},

	checkOpponentLiberties: function(point,opponentColor){
		var capturedStones=[];
		var adjacentPointsStatus=this.getAdjacentPointsStatus(point);
		for(var direction=0;direction<4;direction++){
			var pointStatus=adjacentPointsStatus[direction];
			if(!pointStatus){
				continue;
			}
			if(pointStatus.color==opponentColor){
				var libertyStatus=this.checkGroupLiberties(pointStatus,pointStatus.color);
				if(!libertyStatus.hasLiberty){
					var groupPoints=libertyStatus.groupPoints;
					this.removeStones(groupPoints,false);
					capturedStones=capturedStones.concat(groupPoints);
				}
			}
		}

		return capturedStones;
	},

	evaluateMove: function(){
		var curNode=this.curNode;
		var color=curNode.move.color;
		var point=curNode.move.point;

		var pointColor=this.getPointColor(point.x,point.y);
		if(pointColor){
			yogo.logWarn('point occupied: ('+point.x+','+point.y+','+color+')','play move');
			return false;
		}

		this.board.placeStone(point,color);
		this.setPointColor(point.x,point.y,color);

		var opponentColor=(color=='B')? 'W':'B';
		var capturedStones=this.checkOpponentLiberties(point,opponentColor);

		if(capturedStones.length>0){
			if(capturedStones.length==1){
				var capturedStone=capturedStones[0];
				var previousNode=curNode.previousNode;
				if(previousNode&&previousNode.status.capture&&previousNode.move.capturedStones.length==1){
					var pcs=previousNode.move.capturedStones[0];
					var pmove=previousNode.move[opponentColor];
					if(pmove&&capturedStone.x==pmove.x&&capturedStone.y==pmove.y
						&&point.x==pcs.x&&point.y==pcs.y){
						yogo.logWarn('ko, cann\'t recapture immediately: ('+point.x+','+point.y+','+color+')','play move');
						if(!previousNode.status.ko){
							previousNode.status.startKo=true;
						}
						return false;
					}
				}
				if(previousNode&&previousNode.previousNode&&previousNode.previousNode.previousNode){
					var ppp=previousNode.previousNode.previousNode;
					if(ppp.status.capture&&ppp.move.capturedStones.length==1){
						var pppcs=ppp.move.capturedStones[0];
						var pppmove=ppp.move[opponentColor];
						if(pppmove&&capturedStone.x==pppmove.x&&capturedStone.y==pppmove.y
							&&point.x==pppcs.x&&point.y==pppcs.y){
							curNode.status.ko=true;
							if(!ppp.status.ko){
								ppp.status.startKo=true;
							}
							yogo.logInfo('ko: ('+point.x+','+point.y+','+color+')','play move');
						}
					}
				}
			}
			//if(capturedStones.length>0){
			//	yogo.logInfo('('+point.x+','+point.y+') capture '+opponentColor+' '+capturedStones.length+' stone(s)','play move');
			//}

			curNode.status.capture=true;
			curNode.move.capturedStones=capturedStones;
			var ac=curNode.move.accumulatedCaptures;
			ac={B:ac.B,W:ac.W};
			ac[color]=ac[color]+capturedStones.length;
			curNode.move.accumulatedCaptures=ac;
		}else{
			var libertyStatus=this.checkGroupLiberties(point,color);
			if(!libertyStatus.hasLiberty){
				yogo.logWarn('is self capture? ('+point.x+','+point.y+','+color+')','play move');
				this.setPointColor(point.x,point.y,null);
				this.board.removeStone(point);
				return false;
			}
		}

		return true;
	},

	buildPosition: function(){
		var success=true;
		var curNode=this.curNode;
		if(curNode.status.positionEvaluated){
			return success;
		}
		var previousNode=curNode.previousNode;
		if(previousNode){
			if(!previousNode.status.positionBuilt){
				var positionBuilder=new PositionBuilder(this.game,previousNode);
				positionBuilder.buildPosition();
			}
			this.basePosition=previousNode.position;
			curNode.move.accumulatedCaptures=previousNode.move.accumulatedCaptures;
		}else {
			this.basePosition=[];
			for(var x=0;x<this.boardSize;x++){
				this.basePosition[x]=[];
			}
			curNode.move.accumulatedCaptures={B:0,W:0};
		}
		if(curNode.status.move){
			success=this.evaluateMove();
		}
		if(curNode.status.setup){
			if(curNode.setup['AB']){
				this.addStones(curNode.setup['AB'],'B',true);
			}
			if(curNode.setup['AW']){
				this.addStones(curNode.setup['AW'],'W',true);
			}
			if(curNode.setup['AE']){
				var aeRemovedStones=curNode.setup.aeRemovedStones=[];
				var points=curNode.setup['AE'];
				function doAERemove(point){
					var color=this.getPointColor(point.x,point.y);
					if(color){
						aeRemovedStones.push({x:point.x,y:point.y,color:color});
						this.setPointColor(point.x,point.y,null);
						this.board.removeStone(point);
					}
				}
				for(var pi=0;pi<points.length;pi++){
					var point=points[pi];
					if(point.coorFrom){
						var rangePoints=this.game.evaluatePointRange(point.coorFrom,point.coorTo);
						for(var ri=0;ri<rangePoints.length;ri++){
							doAERemove(rangePoints[ri]);
						}
					}else{
						doAERemove(point);
					}
				}
			}
		}
		curNode.position=this.getFinalPosition();
		curNode.status.positionBuilt=true;
		return success;
	}
};

function SgfParser(){

	var gameInfoGroupToNames={
		root:'GM FF AP SZ CA ST',
		basic:'GN EV RO DT PC RE GC',
		rule:'HA KM RU TM OT',
		blackPlayer:'PB BR BS BT',
		whitePlayer:'PW WR WS WT',
		recorder:'US SO AP',
		misc:'CP ON AN'
	};

	var nodeGroupToPropNames={
		basic:'N C',
		setup:'AB AW AE',
		move:'B W BL WL PL MN OB OW KO FG V',
		remark:'GB GW UC DM TE BM DO IT HO',
		marks:'LB TR CR SQ MA SL TW TB AR LN',
		inheritProps:'PM DD DW'
	};

	var typeToPropNames={
		integer: 'MN OB OW PM SZ HA ST',
		'float': 'V KM',
		bool: 'DO IT KO',
		triple: 'GB GW UC DM TE BM HO',
		point: 'B W',
		lableList: 'LB',
		pointList: 'AB AW AE TR CR SQ MA SL AR LN TW TB DD VM',
		stringArray: ''
	};

	function reverseMap(map){
		var reversed={};
		for(groupName in map){
			var names=map[groupName].split(' ');
			for(var i=0;i<names.length;i++){
				reversed[names[i]]=groupName;
			}
		}
		return reversed;
	}

	this.gameInfoPropNameToGroup=reverseMap(gameInfoGroupToNames);
	this.nodePropNameToGroup=reverseMap(nodeGroupToPropNames);
	this.propNameToType=reverseMap(typeToPropNames);
}

SgfParser.prototype={

	parseSgf: function(sgfText){
		// P=()[];\
		// /[P]|[^P]*/g
		var tokenPatt=/[()\[\];\\]|[^()\[\];\\]*/g;

		var gameCollection=[];
		var tokenState=null;//inProp,inPropValue

		var curGameModel;
		var curVariation;
		var curNode;
		var curPropName;
		var curPropValues;
		var curVariationDepth=0;

		var tokens=sgfText.match(tokenPatt);
		var tokenBuffer='';

		function finishPropertyIfAny(){
			if(curPropName){
				curNode.props[curPropName]=curPropValues;
				curPropName=null;
				curPropValues=null;
			}
		}

		for(var tokenIndex=0;tokenIndex<tokens.length;tokenIndex++){
			var token=tokens[tokenIndex];

			if(token=='\\'){
				if(tokenState=='inPropValue'){
					token=tokens[++tokenIndex];
					if(token.startsWith('\n')){
						token=token.substr(1);
					}
					tokenBuffer+=token;
				}else{
					yogo.logError('unexpected token: \\','parse sgf');
				}
				continue;
			}

			if(tokenState=='inPropValue'){
				if(token!=']'){
					tokenBuffer+=token;
					continue;
				}
			}

			if(token=='('){
				if(curVariationDepth==0){
					curGameModel=new GameModel();
					gameCollection.push(curGameModel);
					curVariation=curGameModel;
				}else{
					finishPropertyIfAny();
					var parentVariation=curVariation;
					curVariation=new Variation(curNode,parentVariation);
					var realGame=parentVariation.realGame && !curNode.variations;
					if(realGame){
						curVariation.realGame=true;
						curNode.variations=[];
					}else{
						curVariation.realGame=false;
						if(!curNode.variations){
							curNode.variations=[];
						}
					}
					curNode.variations.push(curVariation);
				}
				tokenBuffer='';
				tokenState=null;
				curVariation.variationDepth=curVariationDepth;
				curVariationDepth++;
			}else if(token==')'){
				finishPropertyIfAny();
				tokenBuffer='';
				curVariationDepth--;
				if(curVariationDepth<0){
					yogo.logError('dismatch parenthesis: )','parse sgf')
					continue;
				}
				curNode=curVariation.baseNode;
				if(curVariation.nodes.length==0){
					yogo.logWarn('empty variation!','parse sgf')
					curNode.variations.pop();
				}
				curVariation=curVariation.parentVariation;
				tokenState=null;
			}else if(token==';'){
				finishPropertyIfAny();
				tokenBuffer='';
				var previousNode=curNode;
				curNode=new Node(previousNode,curVariation);
				if(previousNode && previousNode.belongingVariation===curVariation){
					previousNode.nextNode=curNode;
				}
				if(!previousNode || previousNode.belongingVariation!==curVariation){
					curNode.status.variationFirstNode=true;
				}
				curVariation.nodes.push(curNode);
				tokenState='inProp';
			}else if(token=='['){
				tokenState='inPropValue';
			}else if(token==']'){
				if(curPropName!='C'){
					tokenBuffer=tokenBuffer.trim();
				}
				if(!curPropValues){
					curPropValues=tokenBuffer
				}else if(curPropValues instanceof Array){
					curPropValues.push(tokenBuffer);
				}else{
					curPropValues=[curPropValues,tokenBuffer];
				}
				tokenBuffer='';
				tokenState='inProp';
			}else{
				if(tokenState=='inProp'){
					tokenBuffer+=token;
					tokenBuffer=tokenBuffer.trim();
					if(tokenBuffer==''){
						continue;
					}
					if(/[a-zA-Z0-9]+/.test(tokenBuffer)){
						finishPropertyIfAny();
						curPropName=tokenBuffer;
						tokenBuffer='';
					}else{
						yogo.logError('unexpected property name: '+tokenBuffer,'parse sgf')
					}
				}else{
					tokenBuffer+=token;
				}
			}
		}

		return gameCollection;
	},

	buildGoGameModel: function(gameCollection){


		for(var gtIndex=0;gtIndex<gameCollection.length;gtIndex++){
			var gameModel=gameCollection[gtIndex];
			this.processGameInfo(gameModel);

			var parser=this;

			var nodeCallback=function(node,context){

				if(!node.basic)node.basic={};
				if(!node.move)node.move={};

				var props=node.props;
				for(name in props){
					var group=parser.nodePropNameToGroup[name];
					if(!group){
						if(parser.gameInfoPropNameToGroup[name]){
							if(node.previousNode){
								yogo.logWarn('game info not at the first node: '+name,'node');
							}
						}else{
							yogo.logWarn('unknown property name: '+name,'node');
						}
						continue;
					}
					var propValue=props[name];
					var type=parser.propNameToType[name];
					propValue=parser.propertyTypeConvert(propValue,type,gameModel.boardSize);

					if(!node[group])node[group]={};
					node[group][name]=propValue;
				}

				node.status.move=!!(node.move['W']||node.move['B']);
				node.status.pass=node.move['W']===null||node.move===null;
				node.status.setup=!!node.setup;
				node.status.comment=!!(node.basic&&node.basic['C']);
				node.status.remark=!!node.remark;
				node.status.mark=!!node.marks;

				if(!node.nextNode&&!node.variations){
					node.status.variationLastNode=true;
				}

				if(node.move['W']&&node.move['B']){
					yogo.logWarn('both Black and White move in one node: B['+node.props['B']+'],W['+node.props['W']+']','node');
				}

				if(node.status.move){
					node.move.color=(node.move['B'])? 'B':'W';
					node.move.point=(node.move['W']||node.move['B']);
				}

				delete node.props;
			};

			gameModel.traverseNodes(null,nodeCallback,{});


			var nodeCallback2=function(node,context){

				var lastMoveNode=node.previousNode;
				var mns;
				if(lastMoveNode){
					var lastNumbers=lastMoveNode.numbers;
					if(node.status.move||node.status.pass){
						mns=[lastNumbers.globalMoveNumber+1,lastNumbers.displayMoveNumber+1,lastNumbers.variationMoveNumber+1];
					}else{
						mns=[lastNumbers.globalMoveNumber,lastNumbers.displayMoveNumber,lastNumbers.variationMoveNumber];
					}
				}else{
					if(node.status.move||node.status.pass){
						mns=[1,1,1];
					}else{
						mns=[0,0,0];
					}
				}
				node.numbers={globalMoveNumber:mns[0],displayMoveNumber:mns[1],variationMoveNumber:mns[2]};
				if(node.move['MN']){
					node.numbers.displayMoveNumber=node.move['MN'];
				}
				if(node.status.variationFirstNode){
					if(node.status.move||node.status.pass){
						node.numbers.variationMoveNumber=1;
					}else{
						node.numbers.variationMoveNumber=0;
					}
				}

				if(node.variations){
					var variations=node.variations;
					var branchPoints=[];
					for(var vIndex=0;vIndex<variations.length;vIndex++){
						var variation=variations[vIndex];
						var node0=variation.nodes[0];
						if(node0.status.move){
							var coordinate=node0.move['B']||node0.move['W'];
							branchPoints.push(coordinate);
						}
					}
					node.branchPoints=branchPoints;
				}
			};

			gameModel.traverseNodes(null,nodeCallback2,{});
		}
	},

	processGameInfo: function(gameModel){

		var gameInfo={};
		gameModel.gameInfo=gameInfo;

		var gameInfoNode=gameModel.nodes[0];
		var props=gameInfoNode.props;
		if(props['GM']&&props['GM']!=='1'){
			yogo.logError('unsupported game type: GM='+props['GM'],'game info');
		}
		if(!props['SZ']){
			yogo.logError('missing board size(SZ)','game info');
		}

		for(name in props){
			var group=this.gameInfoPropNameToGroup[name];
			if(!group){
				if(!(this.nodePropNameToGroup&&this.nodePropNameToGroup[name])){
					yogo.logWarn('unknown property name: '+name,'game info');
				}
				continue;
			}
			if(!gameInfo[group])gameInfo[group]={};
			var value=props[name];
			if(this.propNameToType[name]){
				value=this.propertyTypeConvert(value,this.propNameToType[name],gameModel.boardSize);
			}
			gameInfo[group][name]=value;
		}

		function changePropName(obj,names){
			for(var i=0;i<names.length;i++){
				var name=names[i];
				var oriName=name[0],newName=name[1];
				obj[newName]=obj[oriName];
				delete obj[oriName];
			}
		}

		if(gameInfo.blackPlayer){
			changePropName(gameInfo.blackPlayer,[['PB','name'],['BR','rank'],['BS','species'],['BT','term']]);
		}
		if(gameInfo.whitePlayer){
			changePropName(gameInfo.whitePlayer,[['PW','name'],['WR','rank'],['WS','species'],['WT','term']]);
		}

		var boardSize=gameInfo.root['SZ'];
		if(isNaN(boardSize)||boardSize<5||boardSize>51){
			yogo.logError('wrong board size(SZ)','game info');
		}

		gameModel.boardSize=boardSize;
	},

	parseCoordinate: function(sgfPoint,boardSize){
		if(!sgfPoint.match(/^[a-z][a-z]$/i)){
			yogo.logWarn('wrong coordinate: '+sgfPoint,'node');
			return null;
		}
		var x=sgfPoint.charCodeAt(0);
		var y=sgfPoint.charCodeAt(1);
		if(x<97){
			x=26+x-65;
		}else{
			x-=97;
		}
		if(y<97){
			y=26+y-65;
		}else{
			y-=97;
		}
		if(x>=boardSize||y>=boardSize){
			return null;
		}

		return {x:x,y:y};
	},

	propertyTypeConvert: function(propValue,type,boardSize){

		var oriValue=propValue;
		if(type){
			if(['lableList','pointList','stringArray'].indexOf(type)>=0){
				if(!(propValue instanceof Array)){
					propValue=[propValue];
				}
			}else{
				if(propValue instanceof Array){
					propValue=propValue[0]||'';
				}
			}

			if(type=='point'){
				if(propValue==''){
					propValue=null;
				}else{
					propValue=this.parseCoordinate(propValue,boardSize);
				}
			}else if(type=='lableList'){
				var coordinates=[];
				for(var pi=0;pi<propValue.length;pi++){
					var coorStrAndLabel=propValue[pi].split(':');
					var coorStr=coorStrAndLabel[0];
					var label=coorStrAndLabel[1];
					if(!label)continue;
					var coor=this.parseCoordinate(coorStr,boardSize);
					if(coor!=null){
						coor.label=label;
						coordinates.push(coor);
					}
				}
				propValue=coordinates.length>0? coordinates:null;
			}else if(type=='pointList'){
				var coordinates=[];
				for(var pi=0;pi<propValue.length;pi++){
					var coorStr=propValue[pi];
					if(coorStr.indexOf(':')>0){
						var coorStrPair=coorStr.split(':');
						var coorFrom=this.parseCoordinate(coorStrPair[0],boardSize);
						var coorTo=this.parseCoordinate(coorStrPair[1],boardSize);
						if(coorFrom&&coorTo){
							var coorRange={coorFrom:coorFrom,coorTo:coorTo};
							coordinates.push(coorRange);
						}
					}else{
						var coor=this.parseCoordinate(coorStr,boardSize);
						if(coor!=null){
							coordinates.push(coor);
						}
					}
				}
				propValue=coordinates.length>0? coordinates:null;
			}else if(type=='triple'){
				propValue= (propValue=='2')? 2:1;
			}else if(type=='bool'){
				propValue=true;
			}else if(type=='integer'){
				propValue=parseInt(propValue);
				if(isNaN(propValue)){
					yogo.logWarn("can't parse to Integer: "+name+','+oriValue,'node');
				}
			}else if(type=='float'){
				propValue=parseFloat(propValue);
				if(isNaN(propValue)){
					yogo.logWarn("can't parse to Float: "+name+','+oriValue,'node');
				}
			}else{
				yogo.logWarn('to do: '+name,'node');
			}
		}

		return propValue;
	}

};

SgfParser.parse=function(sgfText){
	var sgfParser=new SgfParser();
	var gameCollection=sgfParser.parseSgf(sgfText);
	sgfParser.buildGoGameModel(gameCollection);
	return gameCollection;
}

yogo={};

yogo.log=function(msg,category,level){
	if(!window.console)return;
	var func=window.console[level];
	if(!func)func=window.console['log'];
	if(func instanceof Function){
		if(!category)category='yogo';
		try{func.call(window.console,category+':',msg);}catch(e){}
	}
}

yogo.logInfo=function(msg,category){
	yogo.log(msg,category,'info');
}

yogo.logWarn=function(msg,category){
	yogo.log(msg,category,'warn');
}

yogo.logError=function(msg,category){
	yogo.log(msg,category,'error');
}
