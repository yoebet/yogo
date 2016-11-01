function GameModel() {
	this.realGame = true;
	this.nodes = [];
	this.gameInfo = {};
	this.variationMap = {};
	this.nodeMap = {};
	this.nodesByMoveNumber = [];
	this.pointMovesMatrix=[];
	this.gameEndingNode = null;
}

GameModel.prototype = {

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
		var result=this.traverseNodes(null, function(node, context) {
			var result=predicate.call(node, node);
			if (result===null) {
				return false;
			}
			if (result===true) {
				context.push(node);
				return false;
			}
		}, []);

		return result[0]||null;
	}
};

function Variation(baseNode, parentVariation) {
	this.baseNode = baseNode;
	this.parentVariation = parentVariation;
	this.realGame = false;
	this.nodes = [];
	this.index = 0;
	this.id = null;
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
		var variation=this;
		while(variation&&!variation.realGame){
			if(variation.parentVariation.realGame){
				return variation.baseNode;
			}
			variation=variation.parentVariation;
		}
	}

};

Variation.prototype.traverseNodes = GameModel.prototype.traverseNodes;
Variation.prototype.selectNodes = GameModel.prototype.selectNodes;
Variation.prototype.findNode = GameModel.prototype.findNode;

function Node(previousNode, belongingVariation) {
	this.previousNode = previousNode;
	this.belongingVariation = belongingVariation;
	this.props = {};
	this.status = {};
	this.id = null;
}

Node.prototype = {

	findNodeInAncestors : function(predicate) {
		var node = this;
		while (true) {
			node = node.previousNode;
			if (!node) {
				return null;
			}
			var result=predicate.call(node, node);
			if (result===null) {
				return null;
			}
			if (result===true) {
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
			var result=predicate.call(node, node);
			if (result===null) {
				return null;
			}
			if (result===true) {
				return node;
			}
		}
	},

	findNodeInSuccessors : function(predicate) {
		var node=this;
		while (true) {
			if (node.nextNode) {
				node = node.nextNode;
			} else if (node.variations) {
				for(var vi=0;vi<node.variations.length;vi++){
					var variation=node.variations[vi];
					var foundNode=variation.findNode(predicate);
					if(foundNode){
						return foundNode;
					}
				}
			} else {
				return null;
			}
			var result=predicate.call(node, node);
			if (result===null) {
				return null;
			}
			if (result===true) {
				return node;
			}
		}
	}
};
