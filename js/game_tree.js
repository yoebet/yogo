function GameTree($container, game) {
	this.$container = $container;
	this.game = game;
	this.gameModel = game.gameModel;

	this.elementTemplates = null;
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
		var gameTree=this;
		var game = this.game;

		$('.game-tree', this.$container).remove();

		this.render();

		$('li.node-group-head, li.variation-head',this.$container).click(function() {
			var $treeNodes=$(this).next()
			$treeNodes.toggle(200);
		});

		$('li.tree-node', this.$container).click(function() {
			game.gotoNode(this.id);
		});

		$('button.collapse-nodes', this.$container).click(function() {
			$('ul.tree-nodes:visible', gameTree.$container).hide(200);
		});

		$('button.scroll-into-view', this.$container).click(function() {
			gameTree.showNode(game.curNode.id, true);
		});
	},

	render : function() {

		var ets = this.elementTemplates;
		$nodeGroupTmpl = ets.nodeGroup;
		$nodeGroupHeadTmpl = ets.nodeGroupHead;
		$treeNodesTmpl = ets.treeNodes;
		$treeNodeTmpl = ets.treeNode;

		var $gameTree = ets.gameTree.clone();
		$gameTree.attr('id', 't' + yogo.nextuid());

		this.$container.append($gameTree);

		var $realGameNodeContainer;
		var $variationNodeContainer;

		var $currentNodeGroup;
		var groupMoveNumberFrom;
		var treeModel = this;

		var variationNodeContainerMap = {};

		var nodeCallback = function(node, context) {

			var belongingVariation = node.belongingVariation;

			if (belongingVariation.realGame) {
				var moveNumber = node.numbers.globalMoveNumber;
				var pn = node.previousNode;
				var pmn = pn && pn.numbers.globalMoveNumber;
				if (!$realGameNodeContainer
						|| (moveNumber > 1 && moveNumber !== pmn && moveNumber
								% treeModel.groupMoveCount == 1)) {
					var $nodeGroup = $nodeGroupTmpl.clone();
					$nodeGroup.append($nodeGroupHeadTmpl.clone());
					var $treeNodes = $treeNodesTmpl.clone();
					$nodeGroup.append($treeNodes);
					$gameTree.append($nodeGroup);
					$realGameNodeContainer = $treeNodes;

					if ($currentNodeGroup) {
						var groupName = groupMoveNumberFrom + '-' + pmn;
						$currentNodeGroup.find('> .node-group-head').text(
								groupName);
					}
					groupMoveNumberFrom = moveNumber || 1;
					$currentNodeGroup = $nodeGroup;
				}
			}

			var $nodeContainer;
			if (belongingVariation.realGame) {
				$nodeContainer = $realGameNodeContainer;
			} else {
				$nodeContainer = variationNodeContainerMap[belongingVariation.id];
			}

			var $treeNode = $treeNodeTmpl.clone();
			treeModel.setNodeInfo(node, $treeNode);
			$nodeContainer.append($treeNode);

			if (node.variations) {
				var indexFrom = belongingVariation.realGame ? 1 : 0;
				for (var vi = indexFrom; vi < node.variations.length; vi++) {
					var subVariation = node.variations[vi];
					var nv = treeModel.createVariation(subVariation);
					var $subVariation = nv.$variation;
					var $subNodeContainer = nv.$treeNodes;
					$nodeContainer.append($subVariation);
					variationNodeContainerMap[subVariation.id] = $subNodeContainer;
				}
			}
		};

		this.gameModel.traverseNodes(null, nodeCallback, {});

		if ($currentNodeGroup) {
			var lastMoveNumber = this.gameModel.gameEndingNode.numbers.globalMoveNumber;
			var groupName = groupMoveNumberFrom + '-' + lastMoveNumber;
			$currentNodeGroup.find('> .node-group-head').text(groupName);
		}
	},

	setNodeInfo : function(node, $treeNode) {

		$treeNode.attr('id', node.id);

		var displayMoveNumber = node.numbers.displayMoveNumber;
		var move = '';
		if (node.status.move) {
			// move=node.props['B']||node.props['W'];
			$treeNode.addClass((node.move.color == 'B') ? 'black' : 'white');
		} else if (node.status.pass) {
			move = 'pass';
		} else if (node.status.setup) {
			move = 'add stones';
		}
		var nodeName = (displayMoveNumber === 0) ? 'game info'
				: displayMoveNumber;
		if (move != '') {
			nodeName += ' [' + move + ']';
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
		if (node.status.comment) {
			nodeInfo += ' comment';
		}
		$treeNode.find('.node-info').html(nodeInfo);
	},

	createVariation : function(variation) {

		var ets = this.elementTemplates;
		$variationTmpl = ets.variation;
		$variationHeadTmpl = ets.variationHead;
		$treeNodesTmpl = ets.treeNodes;

		$v = $variationTmpl.clone().attr('id', variation.id);
		$variationHead = $variationHeadTmpl.clone();
		var label = String.fromCharCode(65 + variation.index);
		$variationHead.html(label);
		$v.append($variationHead);
		var $treeNodes = $treeNodesTmpl.clone();
		$v.append($treeNodes);

		return {
			$variation : $v,
			$treeNodes : $treeNodes
		};
	},

	showNode : function(id, scrollIntoView) {
		$node = $('#' + id, this.$container);
		if($node.length==0){
			return;
		}

		$('li.tree-node.current', this.$container).removeClass('current');
		$node.addClass('current');

		var collapsed = $node.parents('ul.tree-nodes:hidden');

		$node.parents('ul.tree-nodes').show();

		if (scrollIntoView && $node.length>0) {
			var node=$node.get(0);
			if(node.scrollIntoViewIfNeeded){
				node.scrollIntoViewIfNeeded();
			}else{
				node.scrollIntoView();
			}
		}
	}

};
