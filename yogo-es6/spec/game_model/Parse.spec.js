describe("Parser", function() {

	const fs = require('fs');
	const SgfParser=require("../../src/game_model/sgf_parser");
	const SgfExport=require("../../src/game_model/sgf_export");


	it("should parse game info", function() {

		let sgfText=`(;GM[1]FF[4]SZ[19]AP[SmartGo:0.7.1]CA[UTF-8]
			GN[20160309-Lee-Sedol-vs-AlphaGo-Commentary-An-Younggil]
			PW[AlphaGo]
			PB[Lee Sedol]BR[9d]
			EV[Google DeepMind Challenge Match]RO[Game 1]
			DT[2016-03-09]
			PC[Seoul, Korea]
			KM[7.5]
			RE[W+Resign]
			RU[Chinese]ST[2]WT[Computer]BT[Human]
			TM[7200.0]OT[3x60 byo-yomi]
			SO[https://gogameguru.com/]
			AN[An Younggil 8p]`;

		let gameModel=SgfParser.parseGameModel0(sgfText);
		console.log('PARSE 1');

		expect(gameModel).not.toBeNull();

	});


	it("should parse a sgf", function(done) {

		fs.readFile('spec/sgf/20160309-Lee-Alphago.sgf', 'utf8', (err, sgfText) => {
			console.log('PARSE');
			expect(err).toBeNull();

			let gameModel=SgfParser.parseGameModel0(sgfText);

			expect(gameModel).not.toBeNull();

			done();
		});

	});


	it("should export sgf from a game model", function(done) {

		fs.readFile('spec/sgf/20160309-Lee-Alphago.sgf', 'utf8', (err, sgfText) => {
			console.log('EXPORT');
			expect(err).toBeNull();

			let gameModel=SgfParser.parseGameModel0(sgfText);

			let exportedSgf = SgfExport.exportSgf(gameModel);
			//console.log(`${sgfText.length} -> ${exportedSgf.length}`);

			expect(exportedSgf).not.toBeNull();

			done();
		});

	});

});
