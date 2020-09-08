
let yogo=require('../src/util')
let Board=require('../src/board/board')

var statTime=new Date().getTime();

var boardContainer=document.getElementById("boardContainer");

var boardSize=9;

var board=new Board(boardContainer,boardSize);

board.drawBoard();

var endTime=new Date().getTime();
yogo.logInfo('cost '+(endTime-statTime)+' ms.','draw board');

board.placeStone({x:3,y:3},'W');
board.placeStone({x:3,y:2},'B');
board.placeStone({x:1,y:2},'B');
board.placeStone({x:1,y:3},'W');
board.placeStone({x:0,y:1},'B');
board.placeStone({x:0,y:2},'W');
board.placeStone({x:3,y:1},'W');
board.placeStone({x:1,y:4},'B');
board.placeStone({x:2,y:4},'W');
board.placeStone({x:1,y:0},'W');
board.placeStone({x:2,y:0},'B');
// board.placeStone({x:3,y:4},'W');
// board.placeStone({x:4,y:3},'B');
// board.placeStone({x:4,y:2},'B');
// board.placeStone({x:2,y:3},'W');
// board.placeStone({x:2,y:2},'W');
// board.placeStone({x:15,y:16},'B');
// board.placeStone({x:3,y:16},'W');

// board.addStones([{x:12,y:12},{x:13,y:16}],'B');
// board.removeStones([{x:2,y:2},{x:3,y:16}]);

//board.hideCoordinate();
//board.showCoordinate();

board.setMarker({x:0,y:0},'TR');
board.setMarker({x:3,y:3},'TR');
board.setMarker({x:3,y:2},'TR');
board.setMarker({x:2,y:2},'TR');
board.setMarker({x:2,y:1},'SQ');
board.setMarker({x:1,y:2},'SQ');
board.setMarker({x:1,y:3},'SQ');
board.setMarker({x:0,y:1},'CR');
board.setMarker({x:0,y:2},'CR');
board.setMarker({x:0,y:3},'CR');
board.setMarker({x:3,y:1},'MA');
board.setMarker({x:4,y:1},'MA');
board.setMarker({x:3,y:0},'MA');
board.setMarker({x:1,y:0},'TB');
board.setMarker({x:4,y:0},'TB');
board.setMarker({x:2,y:0},'TW');
board.setMarker({x:0,y:4},'TW');

board.setLabel({x:1,y:4},'W');
board.setLabel({x:2,y:4},'J');
board.setLabel({x:3,y:4},'Y');
board.setLabel({x:6,y:2},'V');

// board.paper.forEach(function(e){
//     e.rotate(90,202.5,202.5)
// });

board.setLabel({x:5,y:4},'W');
board.setLabel({x:6,y:4},'J');
board.setLabel({x:7,y:4},'Y');

//board.removeAllMarkers();
//board.removeAllLabels();

//board.placeStone({x:2,y:4},'B');

// board.setLabel({x:1,y:4},'Q');
//    board.setLabel({x:2,y:4},'A');
//    board.setLabel({x:3,y:4},'Z');
//    board.setLabel({x:3,y:0},'Z');
//    board.setLabel({x:3,y:0},'R');

// board.setMarker({x:0,y:0},'TR');
// board.removeAllMarkers();

// board.setMarker({x:0,y:0},'TR');
// board.removeAllMarkers();

// board.setMarker({x:0,y:0},'TR');

// board.setMarker({x:3,y:3},'TR');
// board.setMarker({x:3,y:2},'TR');
// board.setMarker({x:2,y:2},'TR');
// board.setMarker({x:2,y:1},'SQ');
// board.setMarker({x:1,y:2},'SQ');
// board.setMarker({x:1,y:3},'SQ');
// board.setMarker({x:0,y:1},'CR');
// board.setMarker({x:0,y:2},'CR');
// board.setMarker({x:0,y:3},'CR');
// board.setMarker({x:3,y:1},'MA');
// board.setMarker({x:4,y:1},'MA');
// board.setMarker({x:3,y:0},'MA');

//board.clearBoard();

window.board=board;
