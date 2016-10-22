function GameModel(){
	this.realGame=true;
	this.nodes=[];
}

GameModel.prototype={
	
	traverseNodes: function(variationCallback,nodeCallback,context){

		var nodes=this.nodes;
		for(var ni=0;ni<nodes.length;ni++){
			var node=nodes[ni];
			if(nodeCallback){
				var ncr=nodeCallback.call(node,node,context);
				if(ncr===false){
					return context;
				}
			}
			var variations=node.variations;
			if(!variations){
				continue;
			}
			for(var vi=0;vi<variations.length;vi++){
				var variation=variations[vi];
				if(variationCallback){
					var vcr=variationCallback.call(variation,variation,context);
					if(vcr===false){
						return context;
					}
				}
				variation.traverseNodes(variationCallback,nodeCallback,context);
			}
		}

		return context;
	},

	selectNodes: function(predicate){
		return traverseNodes(null,
			function(node,context){
				if(predicate.call(node,node)){
					context.push(node);
				}
			},[]);
	}
};

function Variation(baseNode,parentVariation){
	this.baseNode=baseNode;
	this.parentVariation=parentVariation;
	this.realGame=false;
	this.nodes=[];
}

Variation.prototype=GameModel.prototype;

function Node(previousNode,belongingVariation){
	this.previousNode=previousNode;
	this.belongingVariation=belongingVariation;
	this.props={};
	this.status={};
}

Node.prototype={
	
};
