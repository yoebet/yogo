function Game(board,gameModel){

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
