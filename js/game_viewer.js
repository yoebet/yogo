function GameViewer(selector) {
	this.$viewer = $(selector);
	if (this.$viewer.length == 0) {
		yogo.logWarn('no game viewer by this selector: ' + selector,
				'game viewer');
	} else if (this.$viewer.length > 1) {
		yogo.logWarn('more than one game viewer by this selector: ' + selector,
				'game viewer');
		this.$viewer = $(this.$viewer.get(0));
	}

	this.board = null;
	this.gameModel = null;
	this.game = null;
	this.gameTree = null;
}

GameViewer.prototype = {

	init : function(event) {

		var viewer = this;

		$('button.parse-sgf').click(function() {

			var sgfText = $('textarea.sgf-text').val();
			if (!sgfText.trim()) {
				return;
			}

			viewer.loadGame(sgfText);
		});

		$('button.perspective').click(function() {
			if (!viewer.board) {
				return;
			}
			var perspective = $(this).data('value');
			var fn = viewer.board[perspective];
			if (typeof (fn) !== 'function')
				return;
			fn.call(board);
		});

		$('button.node-finder').click(function() {
			if (!viewer.game) {
				return;
			}
			var navi = $(this).data('navi');
			var fn = viewer.game[navi];
			if (typeof (fn) !== 'function')
				return;
			fn.call(viewer.game);
		});

		$('.goto-node').click(function() {
			if (!viewer.game) {
				return;
			}
			var number = $('.move-number-input').val();
			viewer.game.gotoNode(parseInt(number));
		});

		$('.move-number-input').keydown(function(e) {
			if (!viewer.game) {
				return;
			}
			if (e.keyCode == 13) {
				viewer.game.gotoNode(parseInt(this.value));
				this.blur();
			}
		});

		$('.branch-select').on('click', 'button.branch', function() {
			var branch = $(this).data('branch');
			viewer.game.goinBranch(branch);
		});

		$('button.coordinate').click(function() {
			var board = viewer.board;
			if (!board) {
				return;
			}
			var type = $(this).data('type');
			if (type === 'show' || type === true) {
				board.showCoordinate();
			} else if (type === 'hide' || type === false) {
				board.hideCoordinate();
			} else {
				type = '' + type;
				if (type.indexOf(',') >= 0) {
					var xy = type.split(',');
					if (xy[0]) {
						board.setXCoordinateType(xy[0]);
					}
					if (xy[1]) {
						board.setYCoordinateType(xy[1]);
					}
				} else {
					board.setXCoordinateType(type);
					board.setYCoordinateType(type);
				}
			}
		});

		$('button.move-number').click(function() {
			var game = viewer.game;
			if (!game) {
				return;
			}
			var value = $(this).data('value');
			if (value === true || value === 'true') {
				game.setShowMoveNumber(true);
			} else if (value === false || value === 'false') {
				game.setShowMoveNumber(false);
			} else if (value == 'all') {
				game.setShowMoveNumber(1000);
			} else {
				game.setShowMoveNumber(value);
			}
		});

		$('.mark-current-move').click(function() {
			if (!viewer.game) {
				return;
			}
			var value = $(this).data('value');
			if (value === 'true') {
				value = true;
			} else if (value === 'false') {
				value = false;
			}
			this.game.setMarkCurrentMove(value);
		});

		$('button.zoom').click(function() {
			if (!viewer.board) {
				return;
			}
			var zoom = $(this).data('zoom');
			if (zoom == 'reset') {
				zoom = null;
			}
			viewer.board.zoomBoard(zoom);
		});

	},

	onPlayNode : function(trigger) {
		var $commentBox = $('.comment-box');
		$commentBox.text('');
		var curNode = this.game.curNode;
		if (curNode.basic['C']) {
			$commentBox.text(curNode.basic['C']);
		}
		var captures = curNode.move.accumulatedCaptures;
		$(".black-capture").text(captures['B']);
		$(".white-capture").text(captures['W']);

		if (curNode.variations) {
			var indexFrom = curNode.belongingVariation.realGame ? 1 : 0;
			for (var vi = indexFrom; vi < curNode.variations.length; vi++) {
				var subVariation = curNode.variations[vi];
				var label = String.fromCharCode(65 + subVariation.index);
				var $branchButton = $('.branch-select button.branch' + label);
				if ($branchButton.length > 0) {
					$branchButton.show();
				} else {
					$('.branch-select').append(
							'<button class="branch branch' + label
									+ '" data-branch="' + label + '">' + label
									+ '</button>');
				}
			}
			$('.branch-select').show();
		} else {
			$('.branch-select').hide().find('button.branch').hide();
		}
		if (curNode.belongingVariation.realGame) {
			$('.in-branch').hide();
		} else {
			$('.in-branch').show();
		}

		if (this.gameTree) {
			this.gameTree.showNode(curNode.id, trigger);
		}
	},

	loadGame : function(sgfText) {

		var gameCollection = SgfParser.parse(sgfText);

		this.gameModel = gameCollection[0];
		if (!this.gameModel) {
			return;
		}

		this.setupBoard();

		this.setupGameInfo();

		this.setupGame();

		this.bindKeyAndWheelEvent();

		// var triggerSource;

		this.game.onPlayNode = this.onPlayNode.bind(this);

		this.setupGameTree();

		// trigger source: board click/mousewheel/tree click/button/programming
		// tree collapse/synchronize
	},

	setupBoard : function() {

		if (!this.gameModel) {
			return;
		}

		var existedPaper = this.game && this.game.board.paper;

		this.board = new Board($(".board-container").get(0),
				this.gameModel.boardSize, existedPaper);

		this.board.drawBoard();
	},

	setupGame : function() {

		this.game = new Game(this.board, this.gameModel);
		this.game.buildAllPositions();
	},

	setupGameInfo : function() {

		var gameInfo = this.gameModel.gameInfo;
		var blackPlayer = gameInfo.blackPlayer;
		var whitePlayer = gameInfo.whitePlayer;

		var player = '';
		if (blackPlayer) {
			player = blackPlayer.name;
			if (blackPlayer.rank) {
				player = player + ' ' + blackPlayer.rank;
			}
		}
		$(".black-player-name").text(player);

		player = '';
		if (whitePlayer) {
			player = whitePlayer.name;
			if (whitePlayer.rank) {
				player = player + ' ' + whitePlayer.rank;
			}
		}
		$(".white-player-name").text(player);
	},

	setupGameTree : function() {

		var $treeContainer = $('.game-tree-container');
		this.gameTree = new GameTree($treeContainer, this.game);

		this.gameTree.setup();
	},

	bindKeyAndWheelEvent : function() {

		$('body').bind('keydown', this.keydownHandler.bind(this));

		var mousewheelHandler = this.mousewheelHandler.bind(this);

		$('.board-container').bind('mousewheel DOMMouseScroll',
				mousewheelHandler);

	},

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
