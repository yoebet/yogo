Game.EditManager=function (game) {

	this.game=game;
	this.gameModel = game.gameModel;
	this.board = game.board;

	// play
	// setup: W/B
	// label: a/A
	// mark: CR/SQ/MA/TR
	// set-move-number: num
	// set-play-first: W/B
	this.editMode = 'play';

	this.modeParam = null;
};

Game.EditManager.prototype={

	setEditMode : function(mode,param) {
		this.editMode = mode;
		this.modeParam = param;
	},

	onBoardClick : function(coor) {

		yogo.logInfo('edit mode: '+this.editMode);
		if(this.editMode==='play'){
			this.playMove(coor);
			return;
		}
		if(this.editMode==='setup'){
			this.setup(coor);
			return;
		}
		if(this.editMode==='label'){
			this.addLabel(coor);
			return;
		}
		if(this.editMode==='mark'){
			this.addMarker(coor);
			return;
		}
	},

	playMove : function(coor) {
		var curNode=this.game.curNode;

		var enn = curNode.nextNodeAt(coor);
		if(enn){
			this.game.playNode(enn);
			return;
		}

		var pointStatus=curNode.position[coor.x][coor.y];
		if(pointStatus){
			return;
		}

		var color=curNode.newMoveColor();
		var variation=curNode.belongingVariation;
		var nextNode=curNode.nextNode;

		var newNode=new Node(curNode,variation);
		newNode.move.color=color;
		newNode.move[color]={x:coor.x,y:coor.y};
		newNode.move.point=newNode.move[color];
		newNode.status.move=true;

		var positionBuilder = new Game.PositionBuilder(this.game,
				newNode,true);
		var valid=positionBuilder.buildPosition();
		if(!valid){
			return;
		}

		if(!nextNode && !curNode.variations){
			curNode.nextNode=newNode;
			curNode.status.variationLastNode=false;
			if (variation.realGame) {
				this.gameModel.gameEndingNode = newNode;
			}
		}else if(curNode.variations){
			var newVariation=new Variation(curNode,variation);
			newVariation.index=curNode.variations.length;
			curNode.variations.push(newVariation);

			newNode.belongingVariation=newVariation;
			newVariation.nodes.push(newNode);

			curNode.setBranchPoints();
		}else if(nextNode){
			curNode.nextNode=null;
			curNode.variations=[];

			var newVariation1=new Variation(curNode,variation);
			newVariation1.index=0;
			newVariation1.realGame=variation.realGame;
			curNode.variations.push(newVariation1);
			nextNode.belongingVariation=newVariation1;
			if (!variation.realGame) {
				nextNode.status.variationFirstNode=true;
			}
			newVariation1.nodes.push(nextNode);

			var newVariation2=new Variation(curNode,variation);
			newVariation2.index=1;
			curNode.variations.push(newVariation2);
			newNode.belongingVariation=newVariation2;
			newNode.status.variationFirstNode=true;
			newVariation2.nodes.push(newNode);

			curNode.setBranchPoints();
		}

		newNode.status.variationLastNode=true;

		newNode.setMoveNumber();
		this.gameModel.indexNode(newNode);

		newNode.status.alter=true;
		newNode.alter={type:'new-node'};

		this.game.playNode(newNode);

		if(this.game.onNodeCreated){
			this.game.onNodeCreated(newNode);
		}
	},

	setup : function(coor) {

	},

	addLabel : function(coor) {

	},

	addMarker : function(coor) {

	}
};
