function GameModel() {
	this.realGame = true;
	this.boardSize = null;
	this.nodes = [];
	this.gameInfo = {};
	this.variationMap = {};
	this.nodeMap = {};
	this.nodesByMoveNumber = [];
	this.pointMovesMatrix = [];
	this.gameEndingNode = null;
}

GameModel.newModel=function(boardSize){

	var gameModel=new GameModel();
	gameModel.boardSize=boardSize||19;
	for (var x = 0; x < gameModel.boardSize; x++) {
		gameModel.pointMovesMatrix[x] = [];
	}

	var firstNode=new Node(null,gameModel);
	gameModel.indexNode(firstNode);
	gameModel.nodes[0]=firstNode;
	gameModel.gameEndingNode=firstNode;
	return gameModel;
}

GameModel.prototype = {

	indexNode : function(node){
		this.nodeMap[node.id] = node;
		if (node.status.move) {
			var realGame = node.belongingVariation.realGame;
			if (realGame) {
				var point=node.move.point;
				var pointMovesX=this.pointMovesMatrix[point.x];
				var pointMoves = pointMovesX[point.y];
				if (pointMoves) {
					pointMoves.push(node);
				} else {
					pointMoves = [ node ];
					pointMovesX[point.y] = pointMoves;
				}

				var mn = node.numbers.variationMoveNumber;
				this.nodesByMoveNumber[mn] = node;
			}
		}
	},

	traverseNodes : function(variationCallback, nodeCallback, context) {

		var nodes = this.nodes;
		for (var ni = 0; ni < nodes.length; ni++) {
			var node = nodes[ni];
			if (nodeCallback) {
				var ncr = nodeCallback.call(node, node, context);
				if (ncr === false) {
					return context;
				}
			}
			var variations = node.variations;
			if (!variations) {
				continue;
			}
			for (var vi = 0; vi < variations.length; vi++) {
				var variation = variations[vi];
				if (variationCallback) {
					var vcr = variationCallback.call(variation, variation,
							context);
					if (vcr === false) {
						return context;
					}
				}
				variation.traverseNodes(variationCallback, nodeCallback,
						context);
			}
		}

		return context;
	},

	selectNodes : function(predicate) {
		return this.traverseNodes(null, function(node, context) {
			if (predicate.call(node, node)) {
				context.push(node);
			}
		}, []);
	},

	findNode : function(predicate) {
		var result = this.traverseNodes(null, function(node, context) {
			var result = predicate.call(node, node);
			if (result === null) {
				return false;
			}
			if (result === true) {
				context.push(node);
				return false;
			}
		}, []);

		return result[0] || null;
	}
};

function Variation(baseNode, parentVariation) {
	this.baseNode = baseNode;
	this.parentVariation = parentVariation;
	this.realGame = false;
	this.nodes = [];
	this.index = 0;
	this.id = 'v' + yogo.nextuid();
}

Variation.prototype = {
	nextVariation : function() {
		var variations = this.baseNode.variations;
		var nextVindex = (this.index + 1) % variations.length;
		if (nextVindex == 0) {
			nextVindex = 1;
		}
		return variations[nextVindex];
	},
	
	previousVariation : function() {
		var variations = this.baseNode.variations;
		var nextVindex = (this.index - 1 + variations.length)
				% variations.length;
		if (nextVindex == 0) {
			nextVindex = variations.length - 1;
		}
		return variations[nextVindex];
	},
	
	realGameBaseNode : function() {
		var variation = this;
		while (variation && !variation.realGame) {
			if (variation.parentVariation.realGame) {
				return variation.baseNode;
			}
			variation = variation.parentVariation;
		}
	}

};

Variation.prototype.traverseNodes = GameModel.prototype.traverseNodes;
Variation.prototype.selectNodes = GameModel.prototype.selectNodes;
Variation.prototype.findNode = GameModel.prototype.findNode;

function Node(previousNode, belongingVariation) {
	this.previousNode = previousNode;
	this.belongingVariation = belongingVariation;
	this.nextNode = null;
	this.props = {};
	this.basic = {};
	this.move = {};
	this.status = {variationLastNode:true};
	this.id = 'n' + yogo.nextuid();
	this.position = null;

	if(!previousNode){
		this.status.variationFirstNode=true;
		this.setMoveNumber();
	}
}

Node.prototype = {

	findNodeInAncestors : function(predicate) {
		var node = this;
		while (true) {
			node = node.previousNode;
			if (!node) {
				return null;
			}
			var result = predicate.call(node, node);
			if (result === null) {
				return null;
			}
			if (result === true) {
				return node;
			}
		}
	},

	findNodeInMainline : function(predicate) {
		var node = this;
		while (true) {
			if (node.nextNode) {
				node = node.nextNode;
			} else if (node.variations) {
				node = node.variations[0].nodes[0];
			} else {
				return null;
			}
			var result = predicate.call(node, node);
			if (result === null) {
				return null;
			}
			if (result === true) {
				return node;
			}
		}
	},

	findNodeInSuccessors : function(predicate) {
		var node = this;
		while (true) {
			if (node.nextNode) {
				node = node.nextNode;
			} else if (node.variations) {
				for (var vi = 0; vi < node.variations.length; vi++) {
					var variation = node.variations[vi];
					var foundNode = variation.findNode(predicate);
					if (foundNode) {
						return foundNode;
					}
				}
			} else {
				return null;
			}
			var result = predicate.call(node, node);
			if (result === null) {
				return null;
			}
			if (result === true) {
				return node;
			}
		}
	},

	nextNodeAt : function(coor) {
		var nextNode = this.nextNode;
		if (nextNode&&nextNode.move.point) {
			var point = nextNode.move.point;
			if (coor.x === point.x && coor.y === point.y) {
				return nextNode;
			}
			return null;
		}
		if (this.branchPoints) {
			for (var i = 0; i < this.branchPoints.length; i++) {
				var point = this.branchPoints[i];
				if (coor.x === point.x && coor.y === point.y) {
					var variation = this.variations[i];
					return variation.nodes[0];
				}
			}
		}
		return null;
	},

	newMoveColor : function() {
		var color;
		if(this.move['PL']){
			color=this.move['PL'];
		}else if(this.move.color){
			color=this.move.color;
			color=(color==='B')? 'W':'B';
		}else if(this.status.pass){
			var pn=this.previousNode;
			if(pn&&pn.move.color){
				color=this.move.color;
			}
		}
		//TODO: handicap
		if(!color){
			color='B';
		}
		return color;
	},

	setMoveNumber : function() {
		var lastMoveNode = this.previousNode;
		var playOrPass=this.status.move || this.status.pass;
		var mns;
		if (lastMoveNode) {
			var lastNumbers = lastMoveNode.numbers;
			if (playOrPass) {
				mns = [ lastNumbers.displayMoveNumber + 1,
						lastNumbers.variationMoveNumber + 1 ];
			} else {
				mns = [ lastNumbers.displayMoveNumber,
						lastNumbers.variationMoveNumber ];
			}
		} else {
			if (playOrPass) {
				mns = [ 1, 1 ];
			} else {
				mns = [ 0, 0 ];
			}
		}
		var numbers=this.numbers = {
			displayMoveNumber : mns[0],
			variationMoveNumber : mns[1]
		};

		var thisVariation = this.belongingVariation;
		var realGame = thisVariation.realGame;
		if (this.status.variationFirstNode) {
			if (playOrPass) {
				if (!realGame&thisVariation.index>0) {
					numbers.displayMoveNumber = 1;
					numbers.variationMoveNumber = 1;
				}
			} else {
				if (!realGame&thisVariation.index>0) {
					numbers.displayMoveNumber = 0;
					numbers.variationMoveNumber = 0;
				}
			}
		}
		if (this.move['MN']) {
			numbers.displayMoveNumber = node.move['MN'];
		}
	},

	setBranchPoints : function() {
		if (!this.variations) {
			return;
		}
		var variations = this.variations;
		var branchPoints = [];
		for (var i = 0; i < variations.length; i++) {
			var variation = variations[i];
			var node0 = variation.nodes[0];
			if (node0.status.move) {
				var coordinate = node0.move.point;
				branchPoints.push(coordinate);
			}else{
				branchPoints.push({x:52,y:52});
			}
		}
		this.branchPoints = branchPoints;
	},

	diffPosition : function(fromNode) {
		var fromPosition = fromNode.position;
		var toPosition=this.position;
		var stonesToRemove = [];
		var stonesToAddW = [];
		var stonesToAddB = [];
		var boardSize = fromPosition.length;
		for (var x = 0; x < boardSize; x++) {
			var fx = fromPosition[x];
			var tx = toPosition[x];
			if (fx === tx) {
				continue;
			}
			for (var y = 0; y < boardSize; y++) {
				var fromStatus = fx[y];
				var toStatus = tx[y];
				if (fromStatus === toStatus || (!fromStatus && !toStatus)) {
					continue;
				}
				var toRemove = false, toAdd = false;
				if (!toStatus) {
					toRemove = true;
				} else if (!fromStatus) {
					toAdd = true;
				} else if (fromStatus.color != toStatus.color) {
					toRemove = true;
					toAdd = true;
				}
				var point = {
					x : x,
					y : y
				};
				if (toRemove) {
					stonesToRemove.push(point);
				}
				if (toAdd) {
					if (toStatus.color == 'B') {
						stonesToAddB.push(point);
					} else {
						stonesToAddW.push(point);
					}
				}
			}
		}
		return {
			stonesToRemove : stonesToRemove,
			stonesToAddB : stonesToAddB,
			stonesToAddW : stonesToAddW
		};
	}
};
