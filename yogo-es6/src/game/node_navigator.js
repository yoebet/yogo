
class NodeNavigator {

	constructor(game) {
		this.game = game;
		this.gameModel = game.gameModel;

		var trueFunc = function() {
			return true
		};
		var hasVariation = function(node) {
			return !!node.variations;
		};
		var hasCommentOrVariation = function(node) {
			return node.hasComment() || !!node.variations;
		};
		var isKo = function(node) {
			var s = node.status;
			return s.positionBuilt && (s.startKo || s.ko);
		};
		var isCapture = function(node) {
			return node.status.positionBuilt && node.status.capture;
		};
		var notEvaluated = function(node) {
			return !node.status.positionBuilt;
		};

		var navigationFuncs = [ {
			name : 'Node',
			predicate : trueFunc
		}, {
			name : 'Branch',
			predicate : hasVariation
		}, {
			name : 'Comment',
			predicate : Node.prototype.hasComment
		}, {
			name : 'CommentOrBranch',
			predicate : hasCommentOrVariation
		}, {
			name : 'Remark',
			predicate : Node.prototype.hasRemark
		}, {
			name : 'Marks',
			predicate : Node.prototype.hasMarks
		}, {
			name : 'Ko',
			predicate : isKo
		}, {
			name : 'Capture',
			predicate : isCapture
		}, {
			name : 'NotEvaluated',
			predicate : notEvaluated
		} ];

		var newNavigation = function(navi, predicate) {
			return function() {
				return navi.call(this, predicate);
			}.bind(this);
		}.bind(this);

		for (let ni = 0; ni < navigationFuncs.length; ni++) {
			var nf = navigationFuncs[ni];
			var navi = nf.navi, predicate = nf.predicate;
			var nextFn = 'next' + nf.name, previousFn = 'previous' + nf.name;
			this.game[nextFn] = this[nextFn] = newNavigation(this.gotoNextX,
					predicate);
			this.game[previousFn] = this[previousFn] = newNavigation(
					this.gotoLastX, predicate);
		}
	}

	gotoNextX(predicate) {
		var node = this.game.curNode;
		var found = node.findNodeInMainline(predicate);
		if (found) {
			return this.game.playNode(found);
		}
		return false;
	}

	gotoLastX(predicate) {
		var node = this.game.curNode;
		var found = node.findNodeInAncestors(predicate);
		if (found) {
			return this.game.playNode(found);
		}
		return false;
	}

	gotoNode(obj) {
		var node;
		if(/^\d+$/.test(obj)){
			obj = parseInt(obj);
		}
		if (typeof (obj) === 'string') {
			node = this.gameModel.nodeMap[obj];
		} else if (typeof (obj) === 'number') {
			node = this.gameModel.nodesByMoveNumber[obj];
		} else if (obj instanceof Node) {
			node = obj;
		}
		if (node) {
			return this.game.playNode(node);
		}
		return false;
	}

	gotoBeginning() {
		var firstNode = this.gameModel.nodes[0];
		return this.game.playNode(firstNode);
	}

	gotoGameEnd() {
		return this.game.playNode(this.gameModel.gameEndingNode);
	}

	fastFoward(n) {
		n = n || 10;
		var node = this.game.curNode;
		for (; n > 0; n--) {
			if (node.nextNode) {
				node = node.nextNode;
			} else if (node.variations) {
				node = node.variations[0].nodes[0];
			} else {
				break;
			}
		}
		return this.game.playNode(node);
	}

	fastBackward(n) {
		n = n || 10;
		var node = this.game.curNode;
		for (; n > 0; n--) {
			if (node.previousNode) {
				node = node.previousNode;
			} else {
				break;
			}
		}
		return this.game.playNode(node);
	}

	goinBranch(branch) {
		var variations = this.game.curNode.variations;
		if (variations) {
			var variation;
			if (typeof (branch) === 'number') {
				variation = variations[branch];
			} else if (typeof (branch) === 'string' && branch.length == 1) {
				var vi = branch.charCodeAt(0) - 65;
				variation = variations[vi];
			}
			if (variation) {
				var node = variation.nodes[0];
				return this.game.playNode(node);
			}
		}
		return false;
	}

	gotoVariationBegin() {
		if (this.game.inRealGame()) {
			return false;
		}
		if (this.game.curNode.isVariationFirstNode()) {
			return false;
		}
		return this.gotoLastX(function(node) {
			return node.isVariationFirstNode();
		});
	}

	gotoVariationEnd() {
		if (this.game.inRealGame()) {
			return false;
		}
		if (this.game.curNode.isVariationLastNode()) {
			return false;
		}
		return this.gotoNextX(function(node) {
			return node.isVariationLastNode();
		});
	}

	backFromVariation() {
		if (this.game.inRealGame()) {
			return false;
		}
		return this.game
				.playNode(this.game.curNode.belongingVariation.baseNode);
	}
}


module.exports=NodeNavigator;
