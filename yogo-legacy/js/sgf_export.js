function SgfExport(gameModel) {
	this.gameModel = gameModel;

	this.app = 'yogo:0.5';
}

SgfExport.prototype = {

	_escape : function(value) {
		if (typeof (value) !== 'string') {
			return value;
		}
		return value.replace(/\\/g, '\\\\').replace(/]/g, '\\]');
	},

	_genProps : function(props, names) {
		var sgf = '';
		if (!props) {
			return sgf;
		}
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			var value = props[name];
			if (value) {
				if (name === 'C' || name === 'GC') {
					sgf += '\n';
				}
				value = this._escape(value);
				sgf += name + '[' + value + ']';
				sgf += '\n';
			}
		}
		return sgf;
	},

	genGameInfoSgf : function() {
		var gameInfo = this.gameModel.gameInfo;
		var root = gameInfo.root;

		var sgf = 'GM[1]FF[4]';
		sgf += 'SZ[' + this.gameModel.boardSize + ']';
		sgf += 'CA[UTF-8]';
		sgf += 'AP[' + this.app + ']\n';
		if (root && root['ST']) {
			sgf += 'ST[' + root['ST'] + ']\n';
		}

		var bl = gameInfo.blackPlayer;
		if (bl) {
			if (bl.name) {
				sgf += 'PB[' + this._escape(bl.name) + ']\n';
			}
			if (bl.rank) {
				sgf += 'BR[' + this._escape(bl.rank) + ']\n';
			}
			if (bl.species) {
				sgf += 'BS[' + this._escape(bl.species) + ']\n';
			}
			if (bl.term) {
				sgf += 'BT[' + this._escape(bl.term) + ']\n';
			}
		}
		var wl = gameInfo.whitePlayer;
		if (wl) {
			if (wl.name) {
				sgf += 'PW[' + this._escape(wl.name) + ']\n';
			}
			if (wl.rank) {
				sgf += 'WR[' + this._escape(wl.rank) + ']\n';
			}
			if (wl.species) {
				sgf += 'WS[' + this._escape(wl.species) + ']\n';
			}
			if (wl.term) {
				sgf += 'WT[' + this._escape(wl.term) + ']\n';
			}
		}

		sgf += this._genProps(gameInfo.basic, [ 'GN', 'EV', 'RO', 'DT', 'PC',
				'RE', 'GC' ]);
		sgf += this._genProps(gameInfo.rule, [ 'HA', 'KM', 'RU', 'TM', 'OT' ]);
		sgf += this._genProps(gameInfo.recorder, [ 'US', 'SO', 'AP' ]);
		sgf += this._genProps(gameInfo.misc, [ 'CP', 'ON', 'AN' ]);

		return sgf;
	},

	toSgfCoordinate : function(point) {
		var x = point.x, y = point.y;
		var xc, yc;
		if (x < 26) {
			xc = 97 + x;
		} else {
			xc = 65 + (x - 26);
		}
		if (y < 26) {
			yc = 97 + y;
		} else {
			yc = 65 + (y - 26);
		}

		return String.fromCharCode(xc) + String.fromCharCode(yc);
	},

	_genPointsSgf : function(name, points) {
		if (!points || points.length == 0) {
			return '';
		}
		var sgf = name;
		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			if (point.coorFrom) {
				var cf = this.toSgfCoordinate(point.coorFrom);
				var ct = this.toSgfCoordinate(point.coorTo);
				sgf += '[' + cf + ':' + ct + ']';
			} else {
				var c = this.toSgfCoordinate(point);
				sgf += '[' + c + ']';
			}
		}
		return sgf;
	},

	geneNodeSgf : function(node) {
		var sgf = '';

		sgf += this._genProps(node.basic, [ 'N' ]);

		var move = node.move;
		var color = move.color;
		if (move.point) {
			var cs = this.toSgfCoordinate(move.point);
			sgf += color + '[' + cs + ']';
		} else if (color) {
			sgf += color + '[]';
		}

		sgf += this._genProps(move,
				[ 'PL', 'MN', 'BL', 'WL', 'OB', 'OW', 'FG' ]);

		var setup = node.setup;
		if (setup) {
			for (var i = 0; i < 3; i++) {
				var sn = [ 'AB', 'AW', 'AE' ][i];
				if (setup[sn]) {
					sgf += this._genPointsSgf(sn, setup[sn]);
				}
			}
		}

		var marks = node.marks;
		if (marks) {
			var types = [ 'TR', 'CR', 'SQ', 'MA', 'TW', 'TB' ];
			var ms = '';
			for (var i = 0; i < types.length; i++) {
				var markerType = types[i];
				var points = marks[markerType];
				if (points) {
					ms += this._genPointsSgf(markerType, points);
				}
			}
			sgf += ms;
			var labels = marks['LB'];
			if (labels && labels.length > 0) {
				var ls = 'LB';
				for (var i = 0; i < labels.length; i++) {
					var pointAndLabel = labels[i];
					var cs = this.toSgfCoordinate(pointAndLabel);
					ls += '[' + cs + ':' + pointAndLabel.label + ']';
				}
				sgf += ls;
			}
		}

		var remark = node.remark;
		if (remark) {
			var types = [ 'GB', 'GW', 'UC', 'DM', 'TE', 'BM', 'DO', 'IT', 'HO' ];
			// SL AR LN
			for (var i = 0; i < types.length; i++) {
				var type = types[i];
				var value = remark[type];
				if (!value) {
					continue;
				}
				if (value === true) {
					value = 1;
				}
				sgf += type + '[' + value + ']';
			}
		}

		// inheritProps: PM DD VW

		sgf += this._genProps(node.basic, [ 'C' ]);

		return sgf;
	},

	generateSgf : function() {
		var gameInfoSgf = this.genGameInfoSgf();
		var firstNode = this.gameModel.nodes[0];

		var exp = this;

		var sgf = '(';

		var nodeCallback = function(node) {
			var nodeSgf = exp.geneNodeSgf(node);
			if (firstNode === node) {
				nodeSgf = gameInfoSgf + nodeSgf;
			}
			sgf += ';' + nodeSgf;
		};

		var variationBeginCallback = function(variation) {
			sgf += '(';
		};

		var variationCompleteCallback = function(variation) {
			sgf += ')';
		};

		this.gameModel.traverseNodes(nodeCallback, variationBeginCallback,
				variationCompleteCallback);

		sgf += ')';

		sgf = sgf.replace(/\)\(/g, ')\n(').replace(/\]\(/g, ']\n(');

		return sgf;
	}
};
