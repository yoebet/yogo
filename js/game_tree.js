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
		var game = this.game;

		$('.game-tree', this.$container).remove();

		this.render();
	},

	render : function() {

		var ets = this.elementTemplates;
		$treeNodesTmpl = ets.treeNodes;
		$treeNodeTmpl = ets.treeNode;

		var $tree = ets.gameTree.clone();
		//$tree.attr('id', 't' + yogo.nextuid());

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
				var moveNumber = node.numbers.globalMoveNumber;
				var pn = node.previousNode;
				var pmn = pn && pn.numbers.globalMoveNumber;
				if (!$realGameNodeContainer
						|| (moveNumber > 1 && moveNumber !== pmn && moveNumber
								% gameTree.groupMoveCount == 1)) {
					if ($currentNodeGroup) {
						gameTree.setNodeGroupHead($currentNodeGroup,groupMoveNumberFrom,pmn);
					}

					groupMoveNumberFrom = moveNumber || 1;
					var ng=gameTree.createNodeGroup(groupMoveNumberFrom);
					$tree.append(ng.$nodeGroup);
					$realGameNodeContainer = ng.$treeNodes;
					$currentNodeGroup = ng.$nodeGroup;
				}
			}

			var $nodeContainer;
			if (belongingVariation.realGame) {
				$nodeContainer = $realGameNodeContainer;
			} else {
				var cv=belongingVariation;
				while(cv.index===0){
					cv=cv.parentVariation;
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
			var lastMoveNumber = this.gameModel.gameEndingNode.numbers.globalMoveNumber;
			this.setNodeGroupHead($currentNodeGroup,groupMoveNumberFrom,lastMoveNumber);
		}
	},

	setNodeInfo : function(node, $treeNode) {

		$treeNode.attr('id', node.id);

		var realGame=node.belongingVariation.realGame;
		var displayMoveNumber = node.numbers.displayMoveNumber;
		var nodeName = ''+displayMoveNumber;
		if(displayMoveNumber === 0){
			if(realGame){
				nodeName='game info';
			}else{
				nodeName='';
			}
		}
		var move = '';
		if (node.status.move) {
			// move=node.props['B']||node.props['W'];
			$treeNode.addClass((node.move.color == 'B') ? 'black' : 'white');
		} else if (node.status.pass) {
			move = 'pass';
		} else if (node.status.setup) {
			move = 'setup';
		}
		if (move != '') {
			nodeName +=  move;
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
		if(nodeName.charAt(0)==' '){
			nodeName=nodeName.substr(1);
		}
		$treeNode.find('.node-info').html(nodeInfo);
	},

	createNode : function(node){
		var ets = this.elementTemplates;
		var $treeNodeTmpl = ets.treeNode;
		var $treeNode = $treeNodeTmpl.clone();
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

	createNodeGroup : function(moveNumberFrom){
		var ets = this.elementTemplates;
		$nodeGroupTmpl = ets.nodeGroup;
		$nodeGroupHeadTmpl = ets.nodeGroupHead;
		$treeNodesTmpl = ets.treeNodes;

		$nodeGroup = $nodeGroupTmpl.clone();
		$nodeGroup.append($nodeGroupHeadTmpl.clone());
		var $treeNodes = $treeNodesTmpl.clone();
		$nodeGroup.append($treeNodes);
		$nodeGroup.attr('id','node-group-'+moveNumberFrom);

		return {$nodeGroup:$nodeGroup,$treeNodes:$treeNodes};
	},

	setNodeGroupHead : function($nodeGroup,moveNumberFrom,moveNumberTo) {
		var groupName = moveNumberFrom + '-' + moveNumberTo;
		$nodeGroup.find('> .node-group-head').text(
				groupName);
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

	addNode : function(newNode) {
		var $treeNode = this.createNode(newNode);

		var variation=newNode.belongingVariation;
		if(variation.realGame){
			var moveNumber = newNode.numbers.globalMoveNumber;
			if(moveNumber===0){
				moveNumber=1;
			}
			var $treeNodes;
			var groupStart=moveNumber-(moveNumber-1)%this.groupMoveCount;
			var $nodeGroup=$('#'+'node-group-'+groupStart,this.$container);
			if($nodeGroup.length==0){
				var $tree=$('.game-tree',this.$container);
				var ng=this.createNodeGroup(groupStart);
				$tree.append(ng.$nodeGroup);
				$treeNodes = ng.$treeNodes;
			}else{
				$treeNodes=$('> .tree-nodes',$nodeGroup);
			}
			$treeNodes.append($treeNode);
			this.setNodeGroupHead($nodeGroup,groupStart,moveNumber);

			this.showNode(newNode.id);
			return;
		}

		var cv=variation;
		while(cv.index===0){
			cv=cv.parentVariation;
		}
		var $variation=$('#'+cv.id,this.$container);
		if($variation.length>0){
			var $treeNodes=$('> .tree-nodes',$variation);
			$treeNodes.append($treeNode);
			this.showNode(newNode.id);
			return;
		}

		var nv = this.createVariation(cv);
		$variation = nv.$variation;
		var $treeNodes = nv.$treeNodes;
		$treeNodes.append($treeNode);

		var $baseNode=$('#'+variation.baseNode.id,this.$container);
		var variations=variation.baseNode.variations;
		if(variations.length==2){
			$baseNode.after($variation);
		}else{
			var lastVariation=variations[variations.length-2];
			var $lastVariation=$('#'+lastVariation.id,this.$container);
			$lastVariation.after($variation)
		}

		this.showNode(newNode.id);
	}

};
