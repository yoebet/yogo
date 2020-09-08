
var SgfParser=require("../src/game_model/sgf_parser");
var yogo=require("../src/util");


var statTime=new Date().getTime();
var sgfTextarea=document.getElementById('sgf-text');
var sgfText=sgfTextarea.value;
var gameCollection=SgfParser.parse(sgfText);

window.gameModel = gameCollection[0];

var endTime=new Date().getTime();
yogo.logInfo('cost '+(endTime-statTime)+' ms.','build gameModel');
