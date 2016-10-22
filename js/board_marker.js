Board.Marker=function(board){
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
};