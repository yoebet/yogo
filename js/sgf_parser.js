function SgfParser() {

	var gameInfoGroupToNames = {
		root : 'GM FF AP SZ CA ST',
		basic : 'GN EV RO DT PC RE GC',
		rule : 'HA KM RU TM OT',
		blackPlayer : 'PB BR BS BT',
		whitePlayer : 'PW WR WS WT',
		recorder : 'US SO AP',
		misc : 'CP ON AN'
	};

	var nodeGroupToPropNames = {
		basic : 'N C',
		setup : 'AB AW AE',
		move : 'B W BL WL PL MN OB OW KO FG V',
		remark : 'GB GW UC DM TE BM DO IT HO',
		marks : 'LB TR CR SQ MA SL TW TB AR LN',
		inheritProps : 'PM DD DW'
	};

	var typeToPropNames = {
		integer : 'MN OB OW PM SZ HA ST',
		'float' : 'V KM',
		bool : 'DO IT KO',
		triple : 'GB GW UC DM TE BM HO',
		point : 'B W',
		lableList : 'LB',
		pointList : 'AB AW AE TR CR SQ MA SL AR LN TW TB DD VM',
		stringArray : ''
	};

	function reverseMap(map) {
		var reversed = {};
		for (groupName in map) {
			var names = map[groupName].split(' ');
			for (var i = 0; i < names.length; i++) {
				reversed[names[i]] = groupName;
			}
		}
		return reversed;
	}

	this.gameInfoPropNameToGroup = reverseMap(gameInfoGroupToNames);
	this.nodePropNameToGroup = reverseMap(nodeGroupToPropNames);
	this.propNameToType = reverseMap(typeToPropNames);
}

SgfParser.prototype = {

	parseSgf : function(sgfText) {
		// P=()[];\
		// /[P]|[^P]*/g
		var tokenPatt = /[()\[\];\\]|[^()\[\];\\]*/g;

		var gameCollection = [];
		var tokenState = null;// inProp,inPropValue

		var curGameModel;
		var curVariation;
		var curNode;
		var curPropName;
		var curPropValues;
		var curVariationDepth = 0;

		var tokens = sgfText.match(tokenPatt);
		var tokenBuffer = '';

		function finishPropertyIfAny() {
			if (curPropName) {
				curNode.props[curPropName] = curPropValues;
				curPropName = null;
				curPropValues = null;
			}
		}

		for (var tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
			var token = tokens[tokenIndex];

			if (token == '\\') {
				if (tokenState == 'inPropValue') {
					token = tokens[++tokenIndex];
					if (token.startsWith('\n')) {
						token = token.substr(1);
					}
					tokenBuffer += token;
				} else {
					yogo.logError('unexpected token: \\', 'parse sgf');
				}
				continue;
			}

			if (tokenState == 'inPropValue') {
				if (token != ']') {
					tokenBuffer += token;
					continue;
				}
			}

			if (token == '(') {
				if (curVariationDepth == 0) {
					curGameModel = new GameModel();
					gameCollection.push(curGameModel);
					curVariation = curGameModel;
				} else {
					finishPropertyIfAny();
					var parentVariation = curVariation;
					curVariation = new Variation(curNode, parentVariation);
					var realGame = parentVariation.realGame
							&& !curNode.variations;
					if (realGame) {
						curVariation.realGame = true;
						curNode.variations = [];
					} else {
						curVariation.realGame = false;
						if (!curNode.variations) {
							curNode.variations = [];
						}
					}
					curVariation.index = curNode.variations.length;
					curNode.variations.push(curVariation);
				}
				tokenBuffer = '';
				tokenState = null;
				curVariation.variationDepth = curVariationDepth;
				curVariationDepth++;
			} else if (token == ')') {
				finishPropertyIfAny();
				tokenBuffer = '';
				curVariationDepth--;
				if (curVariationDepth < 0) {
					yogo.logError('dismatch parenthesis: )', 'parse sgf')
					continue;
				}
				curNode = curVariation.baseNode;
				if (curVariation.nodes.length == 0) {
					yogo.logWarn('empty variation!', 'parse sgf')
					curNode.variations.pop();
				}
				curVariation = curVariation.parentVariation;
				tokenState = null;
			} else if (token == ';') {
				finishPropertyIfAny();
				tokenBuffer = '';
				var previousNode = curNode;
				curNode = new Node(previousNode, curVariation);
				if (previousNode
						&& previousNode.belongingVariation === curVariation) {
					previousNode.nextNode = curNode;
				}
				if (!previousNode
						|| previousNode.belongingVariation !== curVariation) {
					curNode.status.variationFirstNode = true;
				}
				curVariation.nodes.push(curNode);
				tokenState = 'inProp';
			} else if (token == '[') {
				tokenState = 'inPropValue';
			} else if (token == ']') {
				if (curPropName != 'C') {
					tokenBuffer = tokenBuffer.trim();
				}
				if (!curPropValues) {
					curPropValues = tokenBuffer
				} else if (curPropValues instanceof Array) {
					curPropValues.push(tokenBuffer);
				} else {
					curPropValues = [ curPropValues, tokenBuffer ];
				}
				tokenBuffer = '';
				tokenState = 'inProp';
			} else {
				if (tokenState == 'inProp') {
					tokenBuffer += token;
					tokenBuffer = tokenBuffer.trim();
					if (tokenBuffer == '') {
						continue;
					}
					if (/[a-zA-Z0-9]+/.test(tokenBuffer)) {
						finishPropertyIfAny();
						curPropName = tokenBuffer;
						tokenBuffer = '';
					} else {
						yogo.logError('unexpected property name: '
								+ tokenBuffer, 'parse sgf')
					}
				} else {
					tokenBuffer += token;
				}
			}
		}

		return gameCollection;
	},

	buildGoGameModel : function(gameCollection) {

		for (var gtIndex = 0; gtIndex < gameCollection.length; gtIndex++) {
			var gameModel = gameCollection[gtIndex];
			this.processGameInfo(gameModel);

			for (var x = 0; x < gameModel.boardSize; x++) {
				gameModel.pointMovesMatrix[x] = [];
			}

			var parser = this;

			var nodeCallback = function(node, context) {

				if (!node.basic)
					node.basic = {};
				if (!node.move)
					node.move = {};

				var props = node.props;
				for (name in props) {
					var group = parser.nodePropNameToGroup[name];
					if (!group) {
						if (parser.gameInfoPropNameToGroup[name]) {
							if (node.previousNode) {
								yogo.logWarn(
										'game info not at the first node: '
												+ name, 'node');
							}
						} else {
							yogo.logWarn('unknown property name: ' + name,
									'node');
						}
						continue;
					}
					var propValue = props[name];
					var type = parser.propNameToType[name];
					propValue = parser.propertyTypeConvert(propValue, type,
							gameModel.boardSize);

					if (!node[group])
						node[group] = {};
					node[group][name] = propValue;
				}

				node.status.move = !!(node.move['W'] || node.move['B']);
				node.status.pass = node.move['W'] === null
						|| node.move === null;
				node.status.setup = !!node.setup;
				node.status.comment = !!(node.basic && node.basic['C']);
				node.status.remark = !!node.remark;
				node.status.mark = !!node.marks;

				if (!node.nextNode && !node.variations) {
					node.status.variationLastNode = true;
				}

				if (node.move['W'] && node.move['B']) {
					yogo.logWarn('both Black and White move in one node: B['
							+ node.props['B'] + '],W[' + node.props['W'] + ']',
							'node');
				}

				if (node.status.move) {
					var point = (node.move['W'] || node.move['B']);
					node.move.color = (node.move['B']) ? 'B' : 'W';
					node.move.point = point;

					if (node.belongingVariation.realGame) {
						var pointMoves = gameModel.pointMovesMatrix[point.x][point.y];
						if (pointMoves) {
							pointMoves.push(node);
						} else {
							pointMoves = [ node ];
							gameModel.pointMovesMatrix[point.x][point.y] = pointMoves;
						}
					}
				}

			};

			gameModel.traverseNodes(null, nodeCallback, {});

			var variationCallback = function(variation, context) {
				variation.id = 'v' + yogo.nextuid();
				gameModel.variationMap[variation.id] = variation;
			};

			var nodeCallback2 = function(node, context) {

				var realGame = node.belongingVariation.realGame;
				var lastMoveNode = node.previousNode;
				var mns;
				if (lastMoveNode) {
					var lastNumbers = lastMoveNode.numbers;
					if (node.status.move || node.status.pass) {
						mns = [ lastNumbers.globalMoveNumber + 1,
								lastNumbers.displayMoveNumber + 1,
								lastNumbers.variationMoveNumber + 1 ];
					} else {
						mns = [ lastNumbers.globalMoveNumber,
								lastNumbers.displayMoveNumber,
								lastNumbers.variationMoveNumber ];
					}
				} else {
					if (node.status.move || node.status.pass) {
						mns = [ 1, 1, 1 ];
					} else {
						mns = [ 0, 0, 0 ];
					}
				}
				node.numbers = {
					globalMoveNumber : mns[0],
					displayMoveNumber : mns[1],
					variationMoveNumber : mns[2]
				};
				if (node.status.variationFirstNode) {
					if (node.status.move || node.status.pass) {
						node.numbers.variationMoveNumber = 1;
						if (!realGame) {
							node.numbers.displayMoveNumber = 1;
						}
					} else {
						node.numbers.variationMoveNumber = 0;
						if (!realGame) {
							node.numbers.displayMoveNumber = 0;
						}
					}
				}
				if (node.move['MN']) {
					node.numbers.displayMoveNumber = node.move['MN'];
				}

				if (node.variations) {
					var variations = node.variations;
					var branchPoints = [];
					for (var vIndex = 0; vIndex < variations.length; vIndex++) {
						var variation = variations[vIndex];
						var node0 = variation.nodes[0];
						if (node0.status.move) {
							var coordinate = node0.move['B'] || node0.move['W'];
							branchPoints.push(coordinate);
						}
					}
					node.branchPoints = branchPoints;
				}

				node.id = 'n' + yogo.nextuid();
				gameModel.nodeMap[node.id] = node;
				if (realGame) {
					var mn = node.numbers.globalMoveNumber;
					if (mn && !gameModel.nodesByMoveNumber[mn]) {
						gameModel.nodesByMoveNumber[mn] = node;
					}
					if (!node.nextNode && !node.variations) {
						gameModel.gameEndingNode = node;
					}
				}
			};

			gameModel.traverseNodes(variationCallback, nodeCallback2, {});
		}
	},

	processGameInfo : function(gameModel) {

		if (!gameModel.gameInfo) {
			gameModel.gameInfo = {};
		}
		var gameInfo = gameModel.gameInfo;

		var gameInfoNode = gameModel.nodes[0];
		var props = gameInfoNode.props;
		if (props['GM'] && props['GM'] !== '1') {
			yogo.logError('unsupported game type: GM=' + props['GM'],
					'game info');
		}
		if (!props['SZ']) {
			yogo.logError('missing board size(SZ)', 'game info');
		}

		for (name in props) {
			var group = this.gameInfoPropNameToGroup[name];
			if (!group) {
				if (!(this.nodePropNameToGroup && this.nodePropNameToGroup[name])) {
					yogo.logWarn('unknown property name: ' + name, 'game info');
				}
				continue;
			}
			if (!gameInfo[group])
				gameInfo[group] = {};
			var value = props[name];
			if (this.propNameToType[name]) {
				value = this.propertyTypeConvert(value,
						this.propNameToType[name], gameModel.boardSize);
			}
			gameInfo[group][name] = value;
		}

		function changePropName(obj, names) {
			for (var i = 0; i < names.length; i++) {
				var name = names[i];
				var oriName = name[0], newName = name[1];
				obj[newName] = obj[oriName];
				delete obj[oriName];
			}
		}

		if (gameInfo.blackPlayer) {
			changePropName(gameInfo.blackPlayer, [ [ 'PB', 'name' ],
					[ 'BR', 'rank' ], [ 'BS', 'species' ], [ 'BT', 'term' ] ]);
		}
		if (gameInfo.whitePlayer) {
			changePropName(gameInfo.whitePlayer, [ [ 'PW', 'name' ],
					[ 'WR', 'rank' ], [ 'WS', 'species' ], [ 'WT', 'term' ] ]);
		}

		var boardSize = gameInfo.root['SZ'];
		if (isNaN(boardSize) || boardSize < 5 || boardSize > 51) {
			yogo.logError('wrong board size(SZ)', 'game info');
		}

		gameModel.boardSize = boardSize;
	},

	parseCoordinate : function(sgfPoint, boardSize) {
		if (!sgfPoint.match(/^[a-z][a-z]$/i)) {
			yogo.logWarn('wrong coordinate: ' + sgfPoint, 'node');
			return null;
		}
		var x = sgfPoint.charCodeAt(0);
		var y = sgfPoint.charCodeAt(1);
		if (x < 97) {
			x = 26 + x - 65;
		} else {
			x -= 97;
		}
		if (y < 97) {
			y = 26 + y - 65;
		} else {
			y -= 97;
		}
		if (x >= boardSize || y >= boardSize) {
			return null;
		}

		return {
			x : x,
			y : y
		};
	},

	propertyTypeConvert : function(propValue, type, boardSize) {

		var oriValue = propValue;
		if (type) {
			if ([ 'lableList', 'pointList', 'stringArray' ].indexOf(type) >= 0) {
				if (!(propValue instanceof Array)) {
					propValue = [ propValue ];
				}
			} else {
				if (propValue instanceof Array) {
					propValue = propValue[0] || '';
				}
			}

			if (type == 'point') {
				if (propValue == '') {
					propValue = null;
				} else {
					propValue = this.parseCoordinate(propValue, boardSize);
				}
			} else if (type == 'lableList') {
				var coordinates = [];
				for (var pi = 0; pi < propValue.length; pi++) {
					var coorStrAndLabel = propValue[pi].split(':');
					var coorStr = coorStrAndLabel[0];
					var label = coorStrAndLabel[1];
					if (!label)
						continue;
					var coor = this.parseCoordinate(coorStr, boardSize);
					if (coor != null) {
						coor.label = label;
						coordinates.push(coor);
					}
				}
				propValue = coordinates.length > 0 ? coordinates : null;
			} else if (type == 'pointList') {
				var coordinates = [];
				for (var pi = 0; pi < propValue.length; pi++) {
					var coorStr = propValue[pi];
					if (coorStr.indexOf(':') > 0) {
						var coorStrPair = coorStr.split(':');
						var coorFrom = this.parseCoordinate(coorStrPair[0],
								boardSize);
						var coorTo = this.parseCoordinate(coorStrPair[1],
								boardSize);
						if (coorFrom && coorTo) {
							var coorRange = {
								coorFrom : coorFrom,
								coorTo : coorTo
							};
							coordinates.push(coorRange);
						}
					} else {
						var coor = this.parseCoordinate(coorStr, boardSize);
						if (coor != null) {
							coordinates.push(coor);
						}
					}
				}
				propValue = coordinates.length > 0 ? coordinates : null;
			} else if (type == 'triple') {
				propValue = (propValue == '2') ? 2 : 1;
			} else if (type == 'bool') {
				propValue = true;
			} else if (type == 'integer') {
				propValue = parseInt(propValue);
				if (isNaN(propValue)) {
					yogo.logWarn("can't parse to Integer: " + name + ','
							+ oriValue, 'node');
				}
			} else if (type == 'float') {
				propValue = parseFloat(propValue);
				if (isNaN(propValue)) {
					yogo.logWarn("can't parse to Float: " + name + ','
							+ oriValue, 'node');
				}
			} else {
				yogo.logWarn('to do: ' + name, 'node');
			}
		}

		return propValue;
	}

};

SgfParser.parse = function(sgfText) {
	var sgfParser = new SgfParser();
	var gameCollection = sgfParser.parseSgf(sgfText);
	sgfParser.buildGoGameModel(gameCollection);
	return gameCollection;
}
