Game.EditManager = function(game) {

	this.game = game;
	this.board = game.board;
	this.gameModel = game.gameModel;

	// play
	// setup: W/B
	// label: a/A
	// mark: CR/SQ/MA/TR
	// set-move-number: num
	// set-play-first: W/B
	this.editMode = 'play';

	this.modeParam = null;
	this._lastLabel = null;
	this._lastLabelNode = null;
};

Game.EditManager.prototype = {

	setEditMode : function(mode, param) {
		this.editMode = mode;
		this.modeParam = param;
		if (this.editMode === 'label') {
			this._lastLabel = null;
			this._lastLabelNode = null;
		}
	},

	onBoardClick : function(coor) {

		yogo.logInfo('edit mode: ' + this.editMode + ' '
				+ (this.modeParam || ''));
		if (this.editMode === 'play') {
			this.playMove(coor);
			return;
		}
		if (this.editMode === 'setup') {
			this.setup(coor);
			return;
		}
		if (this.editMode === 'label') {
			this.addLabel(coor);
			return;
		}
		if (this.editMode === 'mark') {
			this.addMarker(coor);
			return;
		}
	},

	onBoardMouseup : function(coor, mousekey) {
		yogo.logInfo('edit mode: ' + this.editMode + ' '
				+ (this.modeParam || ''));

		if (this.editMode === 'play' && mousekey === 3) {
			this.removeLastNode(coor);
			return;
		}
		if (this.editMode === 'setup') {
			this.setup(coor, (mousekey === 3));
			return;
		}
		// if(this.editMode==='label'){
		// this.addLabel(coor);
		// return;
		// }
		// if(this.editMode==='mark'){
		// this.addMarker(coor);
		// return;
		// }
	},

	stillNewGame : function() {
		var curNode = this.game.curNode;
		var beginingNode = this.gameModel.nodes[0];
		return (curNode === beginingNode && !curNode.status.move && curNode
				.isVariationLastNode());
	},

	playMove : function(coor) {
		var curNode = this.game.curNode;

		var enn = curNode.nextNodeAt(coor);
		if (enn) {
			this.game.playNode(enn);
			return false;
		}

		var pointStatus = curNode.position[coor.x][coor.y];
		if (pointStatus) {
			return false;
		}

		var color = curNode.newMoveColor();
		var useCurrentNode = this.stillNewGame() && !curNode.isSetup();
		if (!useCurrentNode) {
			createNewNode = true;
			curNode = new Node(curNode);
		}
		curNode.move.color = color;
		curNode.move[color] = {
			x : coor.x,
			y : coor.y
		};
		curNode.move.point = curNode.move[color];
		curNode.status.move = true;

		if (useCurrentNode) {
			PositionBuilder.amendAddStone(this.game, curNode, coor, color);
			curNode.setMoveNumber();
			this.game.setCurrentNodeMarkers();
			this.gameModel.indexNode(curNode);
			if (this.game.onNodeChanged) {
				this.game.onNodeChanged(curNode);
			}
		} else {
			return this._addNewNode(curNode);
		}
	},

	removeLastNode : function(coor) {
		var curNode = this.game.curNode;
		if (!curNode.isVariationLastNode()) {
			return false;
		}

		var baseNode = curNode.previousNode;
		var variation = curNode.belongingVariation;

		if (!curNode.isVariationFirstNode()) {
			baseNode.nextNode = null;
			if (variation.realGame) {
				this.game.gameEndingNode = baseNode;
			}

			this.gameModel.unindexNode(curNode);
			this.game.playNode(baseNode);

			if (this.game.onNodeRemoved) {
				this.game.onNodeRemoved(curNode);
			}
			return;
		}

		// first node of a variation

		var isBeginingNode = (curNode === this.gameModel.nodes[0]);
		if (isBeginingNode && !curNode.variations) {
			if (curNode.status.move) {
				PositionBuilder.amendRemoveStone(this.game, curNode);
				curNode.status.move = false;
				curNode.move.point = null;
				curNode.move.color = null;
				this.board.markCurrentMove(null);

				if (this.game.onNodeChanged) {
					this.game.onNodeChanged(curNode);
				}
			}
			return;
		}

		var newVariation0 = null;
		var variationToRemove = variation;
		var variations = baseNode.variations;
		var pVariation = baseNode.belongingVariation;
		var removeFirst = (variationToRemove.index == 0);
		if (removeFirst) {
			newVariation0 = variations[1];
		}
		var noVariations = false;
		if (variations.length == 2) {
			var remainVariation = variations[removeFirst ? 1 : 0];
			baseNode.nextNode = remainVariation.nodes[0];
			baseNode.variations = null;
			baseNode.branchPoints = null;
			noVariations = true;
		} else {// variations.length>2
			variations.splice(variationToRemove.index, 1);
			baseNode.setBranchPoints();
		}

		this.gameModel.unindexNode(curNode);

		if (removeFirst) {

			if (!noVariations) {
				if (newVariation0.index == 0
						&& newVariation0.parentVariation.realGame) {
					newVariation0.realGame = true;
				}
			}

			var gameModel = this.gameModel;
			var setNodeMN = function(node) {
				node.setMoveNumber();
				if (node.belongingVariation.realGame) {
					var mn = node.move.variationMoveNumber;
					gameModel.nodesByMoveNumber[mn] = node;
					if (node.isVariationLastNode()) {
						gameModel.gameEndingNode = node;
					}
				}
			};
			var node = newVariation0.nodes[0];
			while (node) {
				if (noVariations) {
					node.belongingVariation = pVariation;
				}
				setNodeMN.call(node, node);
				if (node.variations) {
					for (var vi = 0; vi < node.variations.length; vi++) {
						var tv = node.variations[vi];
						tv.parentVariation = node.belongingVariation;

						var variationCallback = null;
						if (vi == 0 && node.belongingVariation.realGame) {
							variationCallback = function(v) {
								if (v.index == 0 && v.parentVariation.realGame) {
									v.realGame = true;
								}
							};
							variationCallback.call(tv, tv);
						}
						tv.traverseNodes(variationCallback, setNodeMN, null);
					}
				}
				node = node.nextNode;
			}
		}

		this.game.playNode(baseNode);

		if (this.game.onNodeRemoved) {
			this.game.onNodeRemoved(curNode, newVariation0);
		}
	},

	setup : function(coor, reverse) {
		var curNode = this.game.curNode;
		var pointStatus = curNode.position[coor.x][coor.y];
		if (pointStatus) {
			if (pointStatus.node === curNode && curNode.isSetup()) {
				var positionBuilder = new PositionBuilder(this.board, this.gameModel, curNode);
				var reverseColor = 'W';
				var removed = yogo.removePoint(curNode.setup['AB'], coor);
				if (!removed) {
					removed = yogo.removePoint(curNode.setup['AW'], coor);
					reverseColor = 'B';
				}
				if (removed) {
					PositionBuilder.amendRemoveStone(this.game, curNode, coor);
				}
				if (reverse) {
					var pn = 'A' + reverseColor;
					if (!curNode.setup[pn]) {
						curNode.setup[pn] = [];
					}
					curNode.setup[pn].push({
						x : coor.x,
						y : coor.y
					});
					PositionBuilder.amendAddStone(this.game, curNode, coor,
							reverseColor);
				}
				return true;
			}
			return false;
		}
		if (this.modeParam !== 'B' && this.modeParam !== 'W') {
			return false;
		}

		var color = this.modeParam;
		if (reverse) {
			color = (color == 'B') ? 'W' : 'B';
		}
		var createNewNode = false;
		if ((curNode.status.alter && curNode.isSetup()) || this.stillNewGame()) {
			PositionBuilder.amendAddStone(this.game, curNode, coor, color);
			if (!isSetup && this.game.onNodeChanged) {
				this.game.onNodeChanged(curNode);
			}
		} else {
			curNode = new Node(curNode);
			createNewNode = true;
		}

		if (!curNode.setup) {
			curNode.setup = {};
		}
		var propName = 'A' + color;
		if (!curNode.setup[propName]) {
			curNode.setup[propName] = [];
		}
		curNode.setup[propName].push({
			x : coor.x,
			y : coor.y
		});

		if (createNewNode) {
			return this._addNewNode(curNode);
		}

		return true;
	},

	addLabel : function(coor) {
		var curNode = this.game.curNode;
		if (this._lastLabelNode !== curNode) {
			this._lastLabel = null;
		}
		var label;
		if (this._lastLabel) {
			label = String.fromCharCode(this._lastLabel.charCodeAt(0) + 1);
		} else {
			label = this.modeParam;
		}

		var labels = curNode.marks && curNode.marks['LB'];
		var removed = false;
		if (labels) {
			removed = yogo.removePoint(labels, coor);
		}
		if (removed) {
			this.board.removeLabel(coor);
		} else {
			if (!curNode.marks) {
				curNode.marks = {};
			}
			if (!curNode.marks['LB']) {
				labels = curNode.marks['LB'] = [];
			}
			labels.push({
				x : coor.x,
				y : coor.y,
				label : label
			});
			this.board.setLabel(coor, label);
			this._lastLabel = label;
			this._lastLabelNode = curNode;
		}
		curNode.status.alter = true;
		if (!curNode.alter) {
			curNode.alter = {
				type : 'prop-changed'
			};
		}
	},

	addMarker : function(coor) {
		var curNode = this.game.curNode;
		var marker = this.modeParam;

		var markers = curNode.marks && curNode.marks[marker];
		var removed = false;
		if (markers) {
			removed = yogo.removePoint(markers, coor);
		}
		if (removed) {
			this.board.removeMarker(coor);
		} else {
			if (!curNode.marks) {
				curNode.marks = {};
			}
			if (!curNode.marks[marker]) {
				markers = curNode.marks[marker] = [];
			}
			markers.push({
				x : coor.x,
				y : coor.y
			});
			this.board.setMarker(coor, marker);
		}
		curNode.status.alter = true;
		if (!curNode.alter) {
			curNode.alter = {
				type : 'prop-changed'
			};
		}
	},

	_addNewNode : function(newNode) {
		var curNode = this.game.curNode;
		var nextNode = curNode.nextNode;
		var variation = curNode.belongingVariation;

		newNode.belongingVariation = variation;
		var positionBuilder = new PositionBuilder(this.board, this.gameModel, newNode, true);
		var valid = positionBuilder.buildPosition();
		if (!valid) {
			return false;
		}

		if (curNode.isVariationLastNode()) {
			curNode.nextNode = newNode;
			if (variation.realGame) {
				this.gameModel.gameEndingNode = newNode;
			}
			variation.nodes.push(newNode);
		} else if (curNode.variations) {
			var newVariation = new Variation(curNode, variation);
			newVariation.index = curNode.variations.length;
			curNode.variations.push(newVariation);

			newNode.belongingVariation = newVariation;
			newVariation.nodes.push(newNode);

			curNode.setBranchPoints();
		} else if (nextNode) {
			curNode.nextNode = null;
			curNode.variations = [];

			var newVariation1 = new Variation(curNode, variation);
			newVariation1.realGame = variation.realGame;
			curNode.variations.push(newVariation1);
			nextNode.belongingVariation = newVariation1;
			newVariation1.nodes.push(nextNode);

			var newVariation2 = new Variation(curNode, variation);
			curNode.variations.push(newVariation2);
			newNode.belongingVariation = newVariation2;
			newVariation2.nodes.push(newNode);

			curNode.setBranchPoints();
		}

		newNode.setMoveNumber();
		this.gameModel.indexNode(newNode);

		newNode.status.alter = true;
		newNode.alter = {
			type : 'new-node'
		};

		this.game.playNode(newNode);

		if (this.game.onNodeCreated) {
			this.game.onNodeCreated(newNode);
		}

		return true;
	}
};
