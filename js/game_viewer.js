function GameViewer(game) {
	this.game = game;
}

GameViewer.prototype = {
	keydownHandler : function(event) {
		var game = this.game;
		var ctrlKey = event.ctrlKey || event.metaKey;
		switch (event.keyCode) {
		case 37:// ArrowLeft
			if (ctrlKey) {
				game.previousCommentOrBranch();
			} else {
				game.previousNode();
			}
			break;
		case 39:// ArrowRight
			if (ctrlKey) {
				game.nextCommentOrBranch();
			} else {
				game.nextNode();
			}
			break;
		case 38:// ArrowUp
			var curNode = game.curNode;
			if (game.inRealGame()) {
				if (curNode.variations) {
					var variation = curNode.variations[curNode.variations.length - 1];
					var node = variation.nodes[0];
					game.gotoNode(node);
				}
			} else {
				if (curNode.status.variationFirstNode) {
					var variation = curNode.belongingVariation;
					var previousVariation = variation.previousVariation();
					var pvNode = previousVariation.nodes[0];
					game.gotoNode(pvNode);
				} else {
					game.gotoVariationBegin();
				}
			}
			break;
		case 40:// ArrowDown
			var curNode = game.curNode;
			if (game.inRealGame()) {
				if (curNode.variations) {
					var variation = curNode.variations[1];
					var node = variation.nodes[0];
					game.gotoNode(node);
				}
			} else {
				if (curNode.status.variationLastNode) {
					var variation = curNode.belongingVariation;
					var nextVariation = variation.nextVariation();
					var nvNode = nextVariation.nodes[0];
					game.gotoNode(nvNode);
				} else {
					game.gotoVariationEnd();
				}
			}
			break;
		default:
			;
		}
		return true;
	},

	mousewheelHandler : function(event) {
		var game = this.game;
		if (!event.wheelDelta && event.originalEvent) {
			event = event.originalEvent;
		}
		var scrollUp = false;
		if (typeof (event.wheelDelta) === 'number') {
			scrollUp = event.wheelDelta > 0;
		} else {
			scrollUp = event.detail < 0;
		}
		if (scrollUp) {
			game.previousNode();
		} else {
			game.nextNode();
		}
		event.preventDefault();
		return false;
	}
}
