Board.Marker=function(board){
	this.board=board;
	this.boardSetting=board.boardSetting;
	this.paper=board.paper;
	this.pointStatusMatrix=board.pointStatusMatrix;
	this.coordinateManager=board.coordinateManager;

	this.templateMarkerPoint={x:-this.boardSetting.gridWidth,y:-this.boardSetting.gridWidth};
	this.currentMoveMarker=null;
	this.markerPoints=[];
	this.markerTemplates=this.setupMarkerTemplates();

	var theBoard=this.board;
	this.markerClickHandler=function(e){
		theBoard.pointClickHandler(this.data('coor'),'marker');
	};
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
			return maMarker.attr({color:'white'});
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
			this.currentMoveMarker=this.paper.circle(vbCoor.x, vbCoor.y, gridWidth*0.15).attr({'stroke-width':0,fill:'red'});
			this.currentMoveMarker.data({type: 'marker', boardElement: true, marker: 'currentMoveMarker',
					coor: {x:coor.x,y:coor.y}, onCoordinateChange: this.coordinateManager.onCircleCoordinateChange});
			this.currentMoveMarker.click(this.markerClickHandler);
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
		markerElement.click(this.markerClickHandler);
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
			markerElement.translate(vbCoor.x-this.templateMarkerPoint.x,vbCoor.y-this.templateMarkerPoint.y);
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
};