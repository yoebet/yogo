let util=require("./src/util");
let Board=require("./src/board/board");
let {GameModel,Variation,Node}=require("./src/game_model/model");
let SgfParser=require('./src/game_model/sgf_parser');
let SgfExport=require('./src/game_model/sgf_export');
let Game=require("./src/game/game");

let yogo={util,Board,GameModel,Variation,Node,SgfParser,SgfExport,Game};
if(typeof window !== 'undefined'){
	window.yogo=yogo;
}
if(typeof global !== 'undefined'){
	global.yogo=yogo;
}

module.exports=yogo;
