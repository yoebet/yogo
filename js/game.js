function Game(board, gameModel) {

	this.board = board;
	this.gameModel = gameModel;
	this.boardSize = gameModel.boardSize;

	this.curNode = gameModel.nodes[0];

	// view
	// find-move
	// edit
	this.mode = 'view';

	this.onPlayNode = null;
	this.board.pointClickHandler=this.onBoardClick.bind(this);

	this.nodeNavigator = new Game.NodeNavigator(this);
	yogo.exportFunctions.call(this, this.nodeNavigator, [ 'gotoNextX',
			'gotoLastX', 'gotoNode', 'gotoBeginning', 'gotoGameEnd',
			'fastFoward', 'fastBackward', 'goinBranch', 'gotoVariationBegin',
			'gotoVariationEnd', 'backFromVariation' ]);

	this.markersManager = new Game.Markers(this);
	yogo.exportFunctions.call(this, this.markersManager, [
			'setCurrentNodeMarkers', 'setMarkers', 'setMarkCurrentMove',
			'setMarkBranchPoints', 'markBranchPointsIfAny',
			'setShowMoveNumber', 'hideMoveNumbers', 'handleMoveNumbers' ]);

	this.editManager = new Game.EditManager(this);
}

Game.prototype = {


	playNode : function(node) {
		if (!node) {
			return false;
		}
		var board = this.board;
		var lastNode = this.curNode;
		var curNode = this.curNode = node;
		var success = true;

		if (curNode.status.positionBuilt) {
			if (curNode == lastNode) {
				return false;
			}
			if (lastNode.nextNode == curNode && !curNode.status.capture
					&& !curNode.status.setup) {
				var movePoint = curNode.move.point;
				if (movePoint) {
					board.placeStone(movePoint, curNode.move.color);
				}
			} else if (lastNode.previousNode == curNode
					&& !lastNode.status.capture && !lastNode.status.setup) {
				var movePoint = lastNode.move.point;
				if (movePoint) {
					board.removeStone(movePoint);
				}
			} else {
				var lastPosition = lastNode.position;
				var position = curNode.position;
				var diffStones = yogo.diffPosition(lastPosition, position);
				board.removeStones(diffStones.stonesToRemove);
				board.addStones(diffStones.stonesToAddB, 'B');
				board.addStones(diffStones.stonesToAddW, 'W');
			}
		} else {
			var positionBuilder = new Game.PositionBuilder(this, curNode);
			success = positionBuilder.buildPosition();
		}
		this.setCurrentNodeMarkers();
		this.handleMoveNumbers(lastNode);
		if (typeof (this.onPlayNode) === 'function') {
			this.onPlayNode();
		}
		return success;
	},

	buildAllPositions : function() {
		var game = this;
		var nodeCallback = function(node, context) {
			var positionBuilder = new Game.PositionBuilder(game, node, true);
			var success = positionBuilder.buildPosition();
			if (success === false) {
				context.push(node);
			}
		};
		var invalidMoves = [];
		this.gameModel.traverseNodes(null, nodeCallback, invalidMoves);
		return invalidMoves;
	},

	inRealGame : function() {
		return this.curNode.belongingVariation.realGame;
	},

	_boardClickViewMode : function(coor,elementType) {
		var nextNode=this.curNode.nextNode;
		if(nextNode&&nextNode.move.point){
			var point=nextNode.move.point;
			if(coor.x===point.x&&coor.y===point.y){
				this.playNode(nextNode);
			}
		}else if(this.curNode.branchPoints){
			for(var i=0;i<this.curNode.branchPoints.length;i++){
				var point=this.curNode.branchPoints[i];
				if(coor.x===point.x&&coor.y===point.y){
					var variation=this.curNode.variations[i];
					this.playNode(variation.nodes[0]);
					return;
				}
			}
		}
	},

	_boardClickFindMoveMode : function(coor,elementType) {
		var nodeInRealGame;
		var pointMoves=this.gameModel.pointMovesMatrix[coor.x][coor.y];
		if(pointMoves){
			nodeInRealGame=pointMoves[0];
			for(var i=1;i<pointMoves.length;i++){
				var node=pointMoves[i];
				if(node.numbers.globalMoveNumber<=this.curNode.numbers.globalMoveNumber){
					nodeInRealGame=node;
				}else {
					break;
				}
			}
		}
		if(this.inRealGame()) {
			if(nodeInRealGame){
				this.playNode(nodeInRealGame);
			}
			return;
		}

		var foundNode=this.curNode.findNodeInAncestors(function(node){
			if(node.belongingVariation.realGame){
				return false;
			}
			var status=node.position[coor.x][coor.y];
			if(status){
				return status.node===node;
			}
			return false;
		});
		if(foundNode){
			this.game.playNode(foundNode);
			return;
		}
		if(nodeInRealGame){
			var rgbn=this.curNode.belongingVariation.realGameBaseNode();
			if(nodeInRealGame.numbers.globalMoveNumber<=rgbn.numbers.globalMoveNumber){
				this.playNode(nodeInRealGame);
				return;
			}
		}

		foundNode=this.curNode.findNodeInSuccessors(function(node){
			var status=node.position[coor.x][coor.y];
			if(status){
				return status.node===node;
			}
			return false;
		});
		if(foundNode){
			this.playNode(foundNode);
		}
	},

	onBoardClick : function(coor,elementType) {
		yogo.logInfo(elementType+' ('+coor.x+','+coor.y+') clicked');
		if(this.mode==='view'){
			this._boardClickViewMode(coor,elementType);
			return;
		}
		if(this.mode==='find-move'){
			this._boardClickFindMoveMode(coor,elementType);
			return;
		}
		if(this.mode==='edit'){
			this.editManager.boardClickHandler(coor,elementType);
			return;
		}
	},

	setMode : function(mode) {
		this.mode=mode;
	}

};
