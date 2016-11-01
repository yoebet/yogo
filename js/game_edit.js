Game.EditManager=function (game) {

	this.game=game;
	this.gameModel = game.gameModel;

	// play
	// setup: add-w,add-b,remove-added
	// label: add,remove
	// mark: add,remove
	this.editMode = 'play';
};

Game.EditManager.prototype={

	boardClickHandler : function(coor,elementType) {

		yogo.logInfo('edit mode: '+this.editMode);
	}
};
