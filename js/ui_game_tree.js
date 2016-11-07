function GameTree($container, game) {
	this.$container = $container;
	this.game = game;
	this.gameModel = game.gameModel;

	this.elementTemplates = {
		gameTree : $('<div class="game-tree"></div>'),
		nodeGroup : $('<ul class="node-group"></ul>'),
		nodeGroupHead : $('<li class="node-group-head"></li>'),
		treeNodes : $('<ul class="tree-nodes"></ul>'),
		treeNode : $('<li class="tree-node"><span class="node-name"></span><span class="node-info"></span></li>'),
		variation : $('<ul class="variation"></ul>'),
		variationHead : $('<li class="variation-head"></li>')
	};

	this.groupMoveCount = 20;
}

GameTree.prototype = {

	setup : function() {
		var gameTree = this;

		$('.game-tree', this.$container).remove();

		this.render();
	},

	render : function() {

		var ets = this.elementTemplates;
		$treeNodesTmpl = ets.treeNodes;
		$treeNodeTmpl = ets.treeNode;

		var $tree = ets.gameTree.clone();
		// $tree.attr('id', 't' + yogo.nextuid());

		this.$container.append($tree);

		var $realGameNodeContainer;
		var $variationNodeContainer;

		var $currentNodeGroup;
		var groupMoveNumberFrom;
		var gameTree = this;

		var variationNodeContainerMap = {};

		var nodeCallback = function(node, context) {

			var belongingVariation = node.belongingVariation;

			if (belongingVariation.realGame) {
				var moveNumber = node.move.variationMoveNumber;
				var pn = node.previousNode;
				var pmn = pn && pn.move.variationMoveNumber;
				if (!$realGameNodeContainer
						|| (moveNumber > 1 && moveNumber !== pmn && moveNumber
								% gameTree.groupMoveCount == 1)) {
					if ($currentNodeGroup) {
						gameTree.setNodeGroupHead($currentNodeGroup,
								groupMoveNumberFrom, pmn);
					}

					groupMoveNumberFrom = moveNumber || 1;
					var ng = gameTree.createNodeGroup(groupMoveNumberFrom);
					$tree.append(ng.$nodeGroup);
					$realGameNodeContainer = ng.$treeNodes;
					$currentNodeGroup = ng.$nodeGroup;
				}
			}

			var $nodeContainer;
			if (belongingVariation.realGame) {
				$nodeContainer = $realGameNodeContainer;
			} else {
				var cv = belongingVariation;
				while (cv.index === 0) {
					cv = cv.parentVariation;
				}
				$nodeContainer = variationNodeContainerMap[cv.id];
			}

			var $treeNode = gameTree.createNode(node);
			$nodeContainer.append($treeNode);

			if (node.variations) {
				for (var vi = 1; vi < node.variations.length; vi++) {
					var subVariation = node.variations[vi];
					var nv = gameTree.createVariation(subVariation);
					var $subVariation = nv.$variation;
					var $subNodeContainer = nv.$treeNodes;
					$nodeContainer.append($subVariation);
					variationNodeContainerMap[subVariation.id] = $subNodeContainer;
				}
			}
		};

		this.gameModel.traverseNodes(null, nodeCallback, null);

		if ($currentNodeGroup) {
			var lastMoveNumber = this.gameModel.gameEndingNode.move.variationMoveNumber;
			this.setNodeGroupHead($currentNodeGroup, groupMoveNumberFrom,
					lastMoveNumber);
		}
	},

	setNodeInfo : function(node, $treeNode) {

		var realGame = node.belongingVariation.realGame;
		var moveNumber = node.move.variationMoveNumber;
		var nodeName;
		if (!node.status.move && node.isSetup()) {
			nodeName = '';
		} else {
			nodeName = '' + moveNumber;
			if (moveNumber === 0) {
				if (realGame) {
					nodeName = 'game info';
				} else {
					nodeName = '';
				}
			}
		}
		if (node.move.color) {
			$treeNode.addClass((node.move.color == 'B') ? 'black' : 'white');
		}
		var move = '';
		if (node.status.move) {
			var point = node.move.point;
			// move=' ('+node.id+') ['+(point.x+1)+','+(point.y+1)+']';
		} else if (node.status.pass) {
			move = 'pass';
		} else if (node.isSetup()) {
			move = 'setup';
		}
		if (move != '') {
			if (nodeName != '') {
				nodeName += ' ';
			}
			nodeName += move;
		}
		if (node.basic['N']) {
			nodeName += ' ' + node.basic['N'];
		}
		$treeNode.find('.node-name').text(nodeName);
		var nodeInfo = '';
		if (node.status.mark) {
			nodeInfo += ' mark';
		}
		if (node.status.ko) {
			nodeInfo += ' ko';
		} else if (node.status.capture) {
			nodeInfo += ' capture';
		}
		if (node.hasComment()) {
			nodeInfo += ' comment';
		}
		if (nodeName.charAt(0) == ' ') {
			nodeName = nodeName.substr(1);
		}
		$treeNode.find('.node-info').html(nodeInfo);

		var moveNumber = node.move.variationMoveNumber;
		$treeNode.data('mn', moveNumber);
	},

	createNode : function(node) {
		var ets = this.elementTemplates;
		var $treeNodeTmpl = ets.treeNode;
		var $treeNode = $treeNodeTmpl.clone();
		$treeNode.attr('id', node.id);
		var moveNumber = node.move.variationMoveNumber;
		$treeNode.data('mn', moveNumber);
		this.setNodeInfo(node, $treeNode);
		return $treeNode;
	},

	createVariation : function(variation) {
		var ets = this.elementTemplates;
		$variationTmpl = ets.variation;
		$variationHeadTmpl = ets.variationHead;
		$treeNodesTmpl = ets.treeNodes;

		$v = $variationTmpl.clone().attr('id', variation.id);
		$variationHead = $variationHeadTmpl.clone();
		$v.append($variationHead);
		this.setVariationHead(variation, $variationHead);
		var $treeNodes = $treeNodesTmpl.clone();
		$v.append($treeNodes);

		return {
			$variation : $v,
			$treeNodes : $treeNodes
		};
	},

	setVariationHead : function(variation, $variationHead) {
		if (!$variationHead) {
			var $variation = $('#' + variation.id, this.$container);
			$variationHead = $variation.find('> .variation-head');
		}
		var label = String.fromCharCode(65 + variation.index);
		$variationHead.html(label);
	},

	createNodeGroup : function(moveNumberFrom) {
		var ets = this.elementTemplates;
		$nodeGroupTmpl = ets.nodeGroup;
		$nodeGroupHeadTmpl = ets.nodeGroupHead;
		$treeNodesTmpl = ets.treeNodes;

		$nodeGroup = $nodeGroupTmpl.clone();
		$nodeGroup.append($nodeGroupHeadTmpl.clone());
		var $treeNodes = $treeNodesTmpl.clone();
		$nodeGroup.append($treeNodes);
		$nodeGroup.attr('id', 'node-group-' + moveNumberFrom);

		return {
			$nodeGroup : $nodeGroup,
			$treeNodes : $treeNodes
		};
	},

	setNodeGroupHead : function($nodeGroup, moveNumberFrom, moveNumberTo) {
		moveNumberTo = moveNumberTo || 1;
		var groupName = moveNumberFrom + '-' + moveNumberTo;
		$nodeGroup.find('> .node-group-head').text(groupName);
	},

	showNode : function(id, scrollIntoView) {
		$node = $('#' + id, this.$container);
		if ($node.length == 0) {
			return;
		}

		$('li.tree-node.current', this.$container).removeClass('current');
		$node.addClass('current');

		var collapsed = $node.parents('ul.tree-nodes:hidden');

		$node.parents('ul.tree-nodes').show();

		if (scrollIntoView && $node.length > 0) {
			var node = $node.get(0);
			if (node.scrollIntoViewIfNeeded) {
				node.scrollIntoViewIfNeeded();
			} else {
				node.scrollIntoView();
			}
		}
	},

	_appendRealGameNode : function($treeNode) {
		var moveNumber = $treeNode.data('mn');
		if (moveNumber === 0) {
			moveNumber = 1;
		}
		var $treeNodes;
		var groupStart = moveNumber - (moveNumber - 1) % this.groupMoveCount;
		var $nodeGroup = $('#node-group-' + groupStart, this.$container);
		if ($nodeGroup.length == 0) {
			var $tree = $('.game-tree', this.$container);
			var ng = this.createNodeGroup(groupStart);
			$tree.append(ng.$nodeGroup);
			$treeNodes = ng.$treeNodes;
			$nodeGroup = ng.$nodeGroup;
		} else {
			$treeNodes = $('> .tree-nodes', $nodeGroup);
		}
		$treeNodes.append($treeNode);
		this.setNodeGroupHead($nodeGroup, groupStart, moveNumber);
	},

	addNode : function(newNode) {
		var $treeNode = this.createNode(newNode);

		var variation = newNode.belongingVariation;
		if (variation.realGame) {
			this._appendRealGameNode($treeNode);
			this.showNode(newNode.id);
			return;
		}

		var cv = variation;
		while (cv.index === 0) {
			cv = cv.parentVariation;
		}
		var $variation = $('#' + cv.id, this.$container);
		if ($variation.length > 0) {
			var $treeNodes = $('> .tree-nodes', $variation);
			$treeNodes.append($treeNode);
			this.showNode(newNode.id);
			return;
		}

		var nv = this.createVariation(cv);
		$variation = nv.$variation;
		var $treeNodes = nv.$treeNodes;
		$treeNodes.append($treeNode);

		var $baseNode = $('#' + variation.baseNode.id, this.$container);
		var variations = variation.baseNode.variations;
		if (variations.length == 2) {
			$baseNode.after($variation);
		} else {
			var lastVariation = variations[variations.length - 2];
			var $lastVariation = $('#' + lastVariation.id, this.$container);
			$lastVariation.after($variation)
		}

		this.showNode(newNode.id);
	},

	removeLastNode : function(node, newVariation0) {
		if (!node.isVariationLastNode()) {
			return false;
		}

		if (!node.isVariationFirstNode()) {
			var $node = $('#' + node.id, this.$container);
			$node.remove();
			if (node.status.move || node.status.pass) {
				var moveNumber = node.move.variationMoveNumber;
				var groupStart = moveNumber - (moveNumber - 1)
						% this.groupMoveCount;
				var $nodeGroup = $('#node-group-' + groupStart, this.$container);
				var $nodes = $nodeGroup.find(' > ul.tree-nodes > li.tree-node');
				if ($nodes.length == 0) {
					$nodeGroup.remove();
				}else{
					var pn = node.previousNode;
					var pmn = pn && pn.move.variationMoveNumber;
					if(pmn){
						this.setNodeGroupHead($nodeGroup, groupStart, pmn);
					}
				}
			}
			return;
		}

		var baseNode = node.previousNode;
		var variation = node.belongingVariation;
		if (variation.index == 0) {
			var $node = $('#' + node.id, this.$container);
			$node.remove();
		} else {
			var $variation = $('#' + variation.id, this.$container);
			$variation.remove();
		}

		if (baseNode.variations) {
			for (var i = 0; i < baseNode.variations.length; i++) {
				var v = baseNode.variations[i];
				this.setVariationHead(v);
			}
		}

		if (!newVariation0) {
			return;
		}

		var $newVariation0 = $('#' + newVariation0.id, this.$container);
		var $remainVariationNodes = $newVariation0.find('> .tree-nodes > li');
		$newVariation0.detach();

		var gameTree = this;
		var gameModel = this.gameModel;
		var node0 = newVariation0.nodes[0];
		if (node0.belongingVariation.realGame) {
			var gt = this;
			var $lastNode;
			$remainVariationNodes.each(function() {
				var $li = $(this);
				if ($li.is('.tree-node')) {
					var node = gameModel.nodeMap[this.id];
					gameTree.setNodeInfo(node, $li);
					gt._appendRealGameNode($li);
					$lastNode = $li;
				} else {// .variation
					$lastNode.after($li);
				}
			});
		} else {
			var cv = baseNode.belongingVariation;
			while (cv.index === 0) {
				cv = cv.parentVariation;
			}
			var $container = $('#' + cv.id + '> .tree-nodes', this.$container);
			$remainVariationNodes.each(function() {
				var $li = $(this);
				if ($li.is('.tree-node')) {
					var node = gameModel.nodeMap[this.id];
					gameTree.setNodeInfo(node, $li);
				}
			});
			$container.append($remainVariationNodes);
		}
	},

	changeNodeInfo : function(node) {
		var $node = $('#' + node.id, this.$container);
		if ($node.length == 0) {
			return;
		}

		this.setNodeInfo(node, $node);
	}

};
