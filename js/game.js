function Game(board,gameModel){

	this.board=board;
	this.gameModel=gameModel;
	this.boardSize=gameModel.boardSize;

	this.curNode=gameModel.nodes[0];

	this.onPlayNode=null;

	this.nodeNavigator=new Game.NodeNavigator(this);
	yogo.exportFunctions.call(this,this.nodeNavigator,['gotoNextX','gotoLastX',
		'gotoNode','gotoBeginning','gotoGameEnd','fastFoward','fastBackward',
		'goinBranch','gotoVariationBegin','gotoVariationEnd','backFromVariation']);

	this.markersManager=new Game.Markers(this);
	yogo.exportFunctions.call(this,this.markersManager,['setCurrentNodeMarkers','setMarkers',
		'setMarkCurrentMove','setMarkBranchPoints','markBranchPointsIfAny',
		'setShowMoveNumber','hideMoveNumbers','handleMoveNumbers']);

	this.board.setBranchPointOnclickHandler(this.goinBranch);
}

Game.prototype={

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
			var positionBuilder=new Game.PositionBuilder(this,curNode);
			success=positionBuilder.buildPosition();
		}
		this.setCurrentNodeMarkers();
		this.handleMoveNumbers(lastNode);
		if(typeof(this.onPlayNode)==='function'){
			this.onPlayNode.call(this);
		}
		return success;
	},

	buildAllPositions: function(){
		var game=this;
		var nodeCallback=function(node,context){
			var positionBuilder=new Game.PositionBuilder(game,node,true);
			var success=positionBuilder.buildPosition();
			if(success===false){
				context.push(node);
			}
		};
		var invalidatedMoves=[];
		this.gameModel.traverseNodes(null,nodeCallback,invalidatedMoves);
		return invalidatedMoves;
	},

	inRealGame: function(){
		return this.curNode.belongingVariation.realGame;
	}

	// find node by commentary/nodename

};
