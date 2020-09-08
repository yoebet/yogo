
class EventHandler {

	constructor(gameCenter){
		this.gameCenter=gameCenter;
		this._lastWheelTS = null;
	}

	keydownHandler(event) {
		var game = this.gameCenter.game;
		if(!game){
			return false;
		}
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
				if (curNode.isVariationFirstNode()) {
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
				if (curNode.isVariationLastNode()) {
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
	}

	mousewheelHandler(event) {
		event.preventDefault();
		if (!this._lastWheelTS) {
			this._lastWheelTS = new Date().getTime();
		} else {
			var now = new Date().getTime();
			var msDiff = now - this._lastWheelTS;
			if (msDiff < 100) {
				return false;
			}
			this._lastWheelTS = now;
		}
		var game = this.gameCenter.game;
		if(!game){
			return false;
		}
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
		return false;
	}
}


module.exports=EventHandler;
