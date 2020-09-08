let util=require("../util");
let Board=require("../board/board");
let {GameModel,Variation,Node}=require("../game_model/model");
let PositionBuilder=require("./position_builder");
let NodeNavigator=require("./node_navigator");
let GameMarker=require("./game_marker");
let GamePlayer=require("./game_player");

class Game {

	constructor(board, gameModel) {

		this.board = board;
		this.gameModel = gameModel;
		this.boardSize = gameModel.boardSize;

		this._initialNode = new Node(null, gameModel);
		var initialPosition = [];
		for (let x = 0; x < this.boardSize; x++) {
			initialPosition[x] = [];
		}
		this._initialNode.position = initialPosition;
		this._initialNode.nextNode = this.gameModel.nodes[0];

		this.curNode = this._initialNode;

		this._nodeHistory=[];
		this._nodeHistoryIndex=-1;
		this._nodeHistoryMaxIndex=-1;

		// view/find-move/edit
		this.mode = 'view';
		this.autoPlayIntervalSeconds = 1;

		this.board.pointClickHandler = this.onBoardClick.bind(this);
		this.board.pointMouseupHandler = this.onBoardMouseup.bind(this);
		this.onPlayNode = null;
		this.onNodeCreated = null;
		this.onNodeChanged = null;
		this.onNodeRemoved = null;

		this.nodeNavigator = new NodeNavigator(this);
		util.exportFunctions.call(this, this.nodeNavigator, [ 'gotoNextX',
				'gotoLastX', 'gotoNode', 'gotoBeginning', 'gotoGameEnd',
				'fastFoward', 'fastBackward', 'goinBranch', 'gotoVariationBegin',
				'gotoVariationEnd', 'backFromVariation' ]);

		this.markersManager = new GameMarker(this);
		util.exportFunctions.call(this, this.markersManager, [
				'setCurrentNodeMarkers', 'setMarkers', 'setMarkCurrentMove',
				'setMarkBranchPoints', 'markBranchPointsIfAny', 'resetMoveNumber',
				'setShowMoveNumber', 'hideMoveNumbers', 'handleMoveNumbers' ]);

		this.gamePlayer = new GamePlayer(this);
		util.exportFunctions.call(this, this.gamePlayer, [ 'setEditMode' ]);
	}

	playNode(node, context) {
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
					&& !curNode.isSetup()) {
				var movePoint = curNode.move.point;
				if (movePoint) {
					board.placeStone(movePoint, curNode.move.color);
				}
			} else if (lastNode.previousNode == curNode
					&& !lastNode.status.capture && !lastNode.isSetup()) {
				var movePoint = lastNode.move.point;
				if (movePoint) {
					board.removeStone(movePoint);
				}
			} else {
				var diffStones = curNode.diffPosition(lastNode);
				board.removeStones(diffStones.stonesToRemove);
				board.addStones(diffStones.stonesToAddB, 'B');
				board.addStones(diffStones.stonesToAddW, 'W');
			}
		} else {
			var positionBuilder = new PositionBuilder(this.board,
					this.gameModel, curNode);
			success = positionBuilder.buildPosition();
		}
		this.setCurrentNodeMarkers();
		if (typeof (this.onPlayNode) === 'function') {
			this.onPlayNode();
		}

		if(!context || context.nodeHistory !== false){
			if(lastNode == this._initialNode ||
				(lastNode.nextNode !== curNode &&
				 lastNode.previousNode !== curNode)){
				var ni = this._nodeHistoryIndex;
				ni++;
				this._nodeHistory[ni] = curNode;
				this._nodeHistoryIndex = ni;
				this._nodeHistoryMaxIndex = ni;
			}
		}

		return success;
	}

	_historyVisit(ni) {
		if(ni < 0 || ni > this._nodeHistoryMaxIndex){
			return false;
		}
		var node = this._nodeHistory[ni];
		if(this.gameModel.nodeMap[node.id]){
			this._nodeHistoryIndex = ni;
			return this.playNode(node, {nodeHistory: false});
		}else {
			this._nodeHistory.splice(ni, 1);
			ni--;
			this._nodeHistoryIndex = ni;
			this._nodeHistoryMaxIndex--;
			return this._historyVisit(ni);
		}
	}

	historyGoback() {
		var ni = this._nodeHistoryIndex;
		this._historyVisit(ni-1);
	}

	historyGoforward() {
		var ni = this._nodeHistoryIndex;
		this._historyVisit(ni+1);
	}

	buildAllPositions() {
		var board = this.board;
		var gameModel = this.gameModel;
		var invalidMoves = [];
		var nodeCallback = function(node) {
			var positionBuilder = new PositionBuilder(board, gameModel, node,
					true);
			var success = positionBuilder.buildPosition();
			if (success === false) {
				invalidMoves.push(node);
				util.logWarn('invalid, node ' + node.id, 'buildPosition');
			}
		};
		this.gameModel.traverseNodes(nodeCallback);

		for (let i = 0; i < invalidMoves.length; i++) {
			var node = invalidMoves[i];
			util.logWarn('bad move: ' + node.id, 'game');
		}
		return invalidMoves;
	}

	inRealGame() {
		return this.curNode.belongingVariation.realGame;
	}

	nextMoveColor() {
		return this.curNode.nextMoveColor();
	}

	_boardClickView(coor) {
		var nextNode = this.curNode.nextNodeAt(coor);
		if (nextNode) {
			this.playNode(nextNode);
		}
	}

	_boardClickFindAMove(coor) {
		var nodeInRealGame;
		var pointMoves = this.gameModel.pointMovesMatrix[coor.x][coor.y];
		if (pointMoves) {
			nodeInRealGame = pointMoves[0];
			for (let i = 1; i < pointMoves.length; i++) {
				var node = pointMoves[i];
				if (node.move.globalMoveNumber <= this.curNode.move.globalMoveNumber) {
					nodeInRealGame = node;
				} else {
					break;
				}
			}
		}
		if (this.inRealGame()) {
			if (nodeInRealGame) {
				this.playNode(nodeInRealGame);
			}
			return;
		}

		var foundNode = this.curNode.findNodeInAncestors(function(node) {
			if (node.belongingVariation.realGame) {
				return false;
			}
			var status = node.position[coor.x][coor.y];
			if (status) {
				return status.node === node;
			}
			return false;
		});
		if (foundNode) {
			this.playNode(foundNode);
			return;
		}
		if (nodeInRealGame) {
			var rgbn = this.curNode.belongingVariation.realGameBaseNode();
			if (nodeInRealGame.move.globalMoveNumber <= rgbn.move.globalMoveNumber) {
				this.playNode(nodeInRealGame);
				return;
			}
		}

		foundNode = this.curNode.findNodeInSuccessors(function(node) {
			var status = node.position[coor.x][coor.y];
			if (status) {
				return status.node === node;
			}
			return false;
		});
		if (foundNode) {
			this.playNode(foundNode);
		}
	}

	onBoardClick(coor, elementType) {
		// util.logInfo('(' + coor.x + ',' + coor.y + ') clicked', 'board');
		if (this.mode === 'view') {
			this._boardClickView(coor);
			return;
		}
		if (this.mode === 'find-move') {
			this._boardClickFindAMove(coor);
			return;
		}
		if (this.mode === 'auto-play') {
			this.startAutoPlay();
			return;
		}
		if (this.mode === 'edit') {
			this.gamePlayer.onBoardClick(coor);
			return;
		}
	}

	onBoardMouseup(coor, mousekey) {
		// util.logInfo('(' + coor.x + ',' + coor.y + ') mouseup, mousekey: '
		// 		+ mousekey, 'board');
		if (this.mode === 'edit') {
			this.gamePlayer.onBoardMouseup(coor, mousekey);
			return;
		}
	}

	setMode(mode) {
		this.mode = mode;
	}

	passMove() {
		if (this.mode !== 'edit') {
			return false;
		}
		this.gamePlayer.passMove();
	}

	removeLastNode() {
		if (this.mode !== 'edit') {
			return false;
		}
		this.gamePlayer.removeLastNode();
	}

	setPlayFirst(color) {
		if (this.mode !== 'edit') {
			return false;
		}
		this.gamePlayer.setPlayFirst(color);
	}

	startAutoPlay() {
		if(this.autoPlayHandler){
			return false;
		}
		var autoPlayFun;
		autoPlayFun=function(){
			var success=this.nextNode();
			if(success){
				this.autoPlayHandler=setTimeout(autoPlayFun, this.autoPlayIntervalSeconds * 1000);
			}else{
				this.stopAutoPlay();
			}
		}.bind(this);
		this.autoPlayHandler=setTimeout(autoPlayFun, this.autoPlayIntervalSeconds * 1000);
	}

	stopAutoPlay() {
		clearTimeout(this.autoPlayHandler);
		this.autoPlayHandler=null;
	}

	setAutoPlayInterval(seconds) {
		if(typeof(seconds)==='string'){
			seconds=parseFloat(seconds);
		}
		if(typeof(seconds)!=='number' || isNaN(seconds)){
			return;
		}
		this.autoPlayIntervalSeconds=seconds;
	}


	static getHandicapPoints(boardSize, handicap) {
		var s = boardSize;
		var sd = 4;
		if (s < 13) {
			sd = 3;
		}

		var stars=[
			[{x:sd - 1,y:sd - 1},{x:(s - 1) / 2,y:sd - 1},{x:s - sd,y:sd - 1}],
			[{x:sd - 1,y:(s - 1) / 2},{x:(s - 1) / 2,y:(s - 1) / 2},{x:s - sd,y:(s - 1) / 2}],
			[{x:sd - 1,y:s - sd},{x:(s - 1) / 2,y:s - sd},{x:s - sd,y:s - sd}]
		];
		var r = [ stars[2][0], stars[0][2] ];
		if (handicap == 2) {
			return r;
		}
		r.push(stars[0][0]);
		if (handicap == 3) {
			return r;
		}
		r.push(stars[2][2]);
		if (handicap == 4) {
			return r;
		}
		if (handicap == 5) {
			r.push(stars[1][1]);
			return r;
		}
		r.push(stars[1][0]);
		r.push(stars[1][2]);
		if (handicap == 6) {
			return r;
		}
		if (handicap == 7) {
			r.push(stars[1][1]);
			return r;
		}
		r.push(stars[0][1]);
		r.push(stars[2][1]);
		if (handicap == 8) {
			return r;
		}
		r.push(stars[1][1]);
		return r;
	}
}


module.exports=Game;
