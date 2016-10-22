Game.NodeNavigator=function(game){
	this.game=game;
	this.gameModel=game.gameModel;

	var trueFunc=function(){return true};
	var hasVariations=function(node){return !!node.variations;};
	var hasRemark=function(node){return node.status.remark;};
	var hasComments=function(node){return node.status.comment;};
	var hasMarks=function(node){return node.status.mark;};
	var isKo=function(node){var s=node.status;return s.positionBuilt&&(s.startKo||s.ko);};
	var isCapture=function(node){return node.status.positionBuilt&&node.status.capture;};
	var notEvaluated=function(node){return !node.status.positionBuilt;};

	var navigationFuncs=[
		{name:'Node',predicate:trueFunc},
		{name:'Branch',predicate:hasVariations},
		{name:'Remark',predicate:hasRemark},
		{name:'Comment',predicate:hasComments},
		{name:'Marks',predicate:hasMarks},
		{name:'Ko',predicate:isKo},
		{name:'Capture',predicate:isCapture},
		{name:'NotEvaluated',predicate:notEvaluated}
	];

	var newNavigation=function(navi,predicate){
		return function(){
			return navi.call(this,predicate);
		}.bind(this);
	}.bind(this);

	for(var ni=0;ni<navigationFuncs.length;ni++){
		var nf=navigationFuncs[ni];
		var navi=nf.navi,predicate=nf.predicate;
		var nextFn='next'+nf.name,previousFn='previous'+nf.name;
		this.game[nextFn]=this[nextFn]=newNavigation(this.gotoNextX,predicate);
		this.game[previousFn]=this[previousFn]=newNavigation(this.gotoLastX,predicate);
	}
};

Game.NodeNavigator.prototype={

	gotoNextX: function(predicate){
		var node=this.game.curNode;
		while(true){
			if(node.nextNode){
				node=node.nextNode;
			}else if(node.variations){
				node=node.variations[0].nodes[0];
			}else{
				return false;
			}
			if(!node){
				return false;
			}
			if(predicate.call(node,node)){
				return this.game.playNode(node);
			}
		}
	},

	gotoLastX: function(predicate){
		var node=this.game.curNode;
		while(true){
			node=node.previousNode;
			if(!node){
				return false;
			}
			if(predicate.call(node,node)){
				return this.game.playNode(node);
			}
		}
	},

	gotoNode: function(obj){
		var node;
		if(typeof(obj)==='string'){
			node=this.gameModel.nodeMap[obj];
		}else if(typeof(obj)==='number'){
			node=this.gameModel.nodesByMoveNumber[obj];
		}else if(obj instanceof Node){
			node=obj;
		}
		if(node){
			return this.game.playNode(node);
		}
		return false;
	},

	gotoBeginning: function(){
		var firstNode=this.gameModel.nodes[0];
		return this.game.playNode(firstNode);
	},

	gotoGameEnd: function(){
		return this.game.playNode(this.gameModel.gameEndingNode);
	},

	fastFoward: function(n){
		n=n||10;
		var node=this.game.curNode;
		for(;n>0;n--){
			if(node.nextNode){
				node=node.nextNode;
			}else if(node.variations){
				node=node.variations[0].nodes[0];
			}else{
				break;
			}
		}
		return this.game.playNode(node);
	},

	fastBackward: function(n){
		n=n||10;
		var node=this.game.curNode;
		for(;n>0;n--){
			if(node.previousNode){
				node=node.previousNode;
			}else{
				break;
			}
		}
		return this.game.playNode(node);
	},

	goinBranch: function(branch){
		var variations=this.game.curNode.variations;
		if(variations){
			var variation;
			if(typeof(branch)==='number'){
				variation=variations[branch];
			}else if(typeof(branch)==='string' && branch.length==1){
				var vi=branch.charCodeAt(0)-65;
				variation=variations[vi];
			}
			if(variation){
				var node=variation.nodes[0];
				return this.game.playNode(node);
			}
		}
		return false;
	},

	gotoVariationBegin: function(){
		if(this.game.inRealGame()){
			return false;
		}
		if(this.game.curNode.status.variationFirstNode){
			return false;
		}
		return this.gotoLastX(function(node){return node.status.variationFirstNode;});
	},

	gotoVariationEnd: function(){
		if(this.game.inRealGame()){
			return false;
		}
		if(this.game.curNode.status.variationLastNode){
			return false;
		}
		return this.gotoNextX(function(node){return node.status.variationLastNode;});
	},

	backFromVariation: function(){
		if(this.game.inRealGame()){
			return false;
		}
		return this.game.playNode(this.game.curNode.belongingVariation.baseNode);
	}
};
