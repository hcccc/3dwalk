/**
 * Copyright (c) 2009, Benjamin Joffe
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE AUTHOR AND CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Source code Partially borrowed from Ben Joffe's 3DWalk project
 * This project is GREE-internal use only 
 * for the demonstration of dodge framework 
 */


var pi=Math.PI;
Number.prototype.range=function(){
	return (this+2*pi)%(2*pi);
}
Number.prototype.roundC=function(){
	return Math.round(this*100)/100;
}
Number.prototype.isWhole=function(){
	var i = Math.floor(this);
	return (this-i == 0);
}

var total_tick=0;
var canvas;
var overlay;
var arena;

var player1; //this is always the player
var player2;
var player_list=[];
var key=[0,0,0,0,0]; // left, right, up, down
var key2=[0,0,0,0,0];

var entranceX = 1.5 - 0.5;
var entranceY = 0.5 - 0.5;
var exitX = 0;
var exitY = 0;

var arenaSize=21;
var map_scale=16;
var map_size=640;
var ball_size= map_scale*3/8;
var path_width=200;
var face=[];
var bit=[];

var pic=[];
for (var i = 0; i < 4; i++) {
	pic[i] = new Image();
	pic[i].src = './img/wall'+i+'.gif';
}
var pixelWidth = 2;


function initArena(arenaWidth,arenaLength) {
    var arena=[];
    for (var i=0; i<arenaWidth; i++) {
        arena[i] = [];
        for (var j=0; j<arenaLength; j++) {
            arena[i][j] = 1;
            if (i==0 || i==(arenaWidth-1)) {arena[i][j]=2;} // east-west borders
            if (j==0 || j==(arenaLength-1)) {arena[i][j]=2;} // north-south borders
        }
    }


    //do the Depth First Search (DFS) maze generation algorithm
    var cellStack = [];
    var totalCells = (arenaLength-1)/2 * (arenaWidth-1)/2;
    var currCell = [3,3]; // must be odd number indices, goes with playerPos


    var currX = currCell[0];
    var currY = currCell[1];

    arena[currX][currY] = 0; //clear the starting cell
    var cellsBeen = 1;
    while (cellsBeen < totalCells) {
        var potentialNextCells = [1,1,1,1]; // all 4 directions (WSEN) are potential to start

        // remove some potential directions
        var currCellVal = getVal(arena,currCell);
        if (currCellVal[0] != 1) { // west border(2) or already been west(0)
            potentialNextCells[0] = 0;
        }
        if (currCellVal[1] != 1) { // south border(2) or already been south(0)
            potentialNextCells[1] = 0;
        }
        if (currCellVal[2] != 1) { // east border(2) or already been east(0)
            potentialNextCells[2] = 0;
        }
        if (currCellVal[3] != 1) { // north border(2) or already been north(0)
            potentialNextCells[3] = 0;
        }

        // pick which way to go from remaining potentials or back up if all potentials were removed
        var potentialSum = potentialNextCells[0]+potentialNextCells[1]+potentialNextCells[2]+potentialNextCells[3];
        if (potentialSum > 0) { // at least one potential
            var pickList = [];
            if (potentialNextCells[0]) { pickList.push("W"); }
            if (potentialNextCells[1]) { pickList.push("S"); }
            if (potentialNextCells[2]) { pickList.push("E"); }
            if (potentialNextCells[3]) { pickList.push("N"); }
            var picked = pickList[Math.floor( Math.random()*pickList.length )];
            switch(picked) {
                case "W" : //go west, knock down walls
                    cellStack.push(currCell);
                    arena[currX-1][currY] = 0; //clear the intermediate point
                    currX = currX - 2;
                    currCell = [currX,currY];
                    arena[currX][currY] = 0; //clear the new cell
                    break;
                case "S" : //go south, knock down walls
                    cellStack.push(currCell);
                    arena[currX][currY+1] = 0; //clear the intermediate point
                    currY = currY + 2;
                    currCell = [currX,currY];
                    arena[currX][currY] = 0; //clear the new cell
                    break;
                case "E" : //go east, knock down walls
                    cellStack.push(currCell);
                    arena[currX+1][currY] = 0; //clear the intermediate point
                    currX = currX + 2;
                    currCell = [currX,currY];
                    arena[currX][currY] = 0; //clear the new cell
                    break;
                case "N" : //go north, knock down walls
                    cellStack.push(currCell);
                    arena[currX][currY-1] = 0; //clear the intermediate point
                    currY = currY - 2;
                    currCell = [currX,currY];
                    arena[currX][currY] = 0; //clear the new cell
                    break;
                default : //now what?
            }
            cellsBeen = cellsBeen + 1;
        } else { // no potentials, then back up
            currCell = cellStack.pop();
            currX = currCell[0];
            currY = currCell[1];
        }
    }

    //entrance and exit
    arena[1][0] = 0;
    arena[arenaWidth-2][arenaLength-1] = 0;

    exitX = arenaWidth - 1.5;
    exitY = arenaLength;

    return arena;
}

function getVal(maze,cell) {
    var neighbors = [];
    var ix = cell[0];
    var iy = cell[1];
    if (maze[ix-1][iy] == 2) { neighbors[0] = 2;  //W
    } else { neighbors[0] = maze[ix-2][iy]; }
    if (maze[ix][iy+1] == 2) { neighbors[1] = 2;  //S
    } else { neighbors[1] = maze[ix][iy+2]; }
    if (maze[ix+1][iy] == 2) { neighbors[2] = 2;  //E
    } else { neighbors[2] = maze[ix+2][iy]; }
    if (maze[ix][iy-1] == 2) { neighbors[3] = 2;  //N
    } else { neighbors[3] = maze[ix][iy-2]; }
    return neighbors;
}


function wallDistance(theta){

	var dist=[];
	var data=[];
	face = [];

	var x = player1.posX, y = player1.posY;
	var deltaX, deltaY;
	var distX, distY;
	var stepX, stepY;
	var mapX, mapY

	var atX=Math.floor(x), atY=Math.floor(y);

	var thisRow=-1;
	var thisSide=-1;

	var lastHeight=0;

	for (var i=0; i<path_width; i++) {
		theta+=pi/(3*path_width)+2*pi;
		theta%=2*pi;

		mapX = atX, mapY = atY;

		deltaX=1/Math.cos(theta);
		deltaY=1/Math.sin(theta);

		if (deltaX>0) {
			stepX = 1;
			distX = (mapX + 1 - x) * deltaX;
		}
		else {
			stepX = -1;
			distX = (x - mapX) * (deltaX*=-1);

		}
		if (deltaY>0) {
			stepY = 1;
			distY = (mapY + 1 - y) * deltaY;
		}
		else {
			stepY = -1;
			distY = (y - mapY) * (deltaY*=-1);
		}

		/*
		while (true) {
			if (distX < distY) {
				mapX += stepX;
				if (arena[mapX][mapY]) {
					dist[i]=distX;
					face[i]=2+stepX;
					bit[i]=(y+distX/deltaY*stepY)%1 || 0;
					break;
				}
				distX += deltaX;
			}
			else {
				mapY += stepY;
				if (arena[mapX][mapY]) {
					dist[i]=distY;
					face[i]=1+stepY;
					bit[i]=(x+distY/deltaX*stepX)%1 || 0;
					break;
				}
				distY += deltaY;
			}
		}
	}

	return dist; */
		
		for (var j=0; j<20; j++) {
			if (distX < distY) {
				mapX += stepX;
				if (arena[mapX][mapY]) {
					if (thisRow!=mapX || thisSide!=0) {
						if (i>0) {
							data.push(i);
							data.push(lastHeight);
						}
						data.push(i);
						data.push(distX);
						thisSide=0;
						thisRow=mapX;
						face.push(1+stepX);
					}
					lastHeight=distX;
					break;
				}
				distX += deltaX;
			}
			else {
				mapY += stepY;
				if (arena[mapX][mapY]) {
					if (thisRow!=mapY || thisSide!=1) {
						if (i>0) {
							data.push(i);
							data.push(lastHeight);
						}	
						data.push(i);
						data.push(distY);
						thisSide=1;
						thisRow=mapY;
						face.push(2+stepY)
					}
					lastHeight=distY;
					break;
				}
				distY += deltaY;
			}
		}
	}
	data.push(i);
	data.push(lastHeight);
	
	return data;
}

function changeKey(which, to){

	player1.changeKey(which, to);
	player2.changeKey(which, to);

}
document.onkeydown=function(e){changeKey((e||window.event).keyCode, 1);}
document.onkeyup=function(e){changeKey((e||window.event).keyCode, 0);}


function mazeCheck(x, y){
	if (x < entranceX || y < entranceY) {
		console.log(x, y);
		console.log("Position error");
		alert("Not in the valid position");
		location.reload();
	}

	if (x >= exitX && y >= exitY) {
		alert("You cleared game!");
		location.reload();
	}
}



function drawMap(){

	player1.drawMap();
	player2.drawMap();
}


function initUnderMap(){
	var underMap=document.getElementById("underMap").getContext("2d");
	underMap.fillStyle="#FFF";
	underMap.fillRect(0,0, map_size, map_size);
	underMap.fillStyle="#444";
	for (var i=0; i<arena.length; i++) {
		for (var j=0; j<arena[i].length; j++) {
			if (arena[i][j]) underMap.fillRect(i*map_scale, j*map_scale, map_scale, map_scale);
		}
	}
}


window.onload=function(){

	arena=initArena(arenaSize, arenaSize);
	//console.log(arena);
	//alert(JSON.stringify(arena));


	var InitX = 1.5; 
	var InitY = 0.5;

  	player1 = new Player(InitX, InitY, 1, 0.0, "#3366CC", "map");
  	player2 = new Player(3.5, 3.5, 1, 0.0, "#FF0000", "map2");
  	//player2 = new Player(3.5, 3.5, 1, 0.4);

	

	//canvas=document.getElementById("canvas").getContext("2d");
	//overlay=document.getElementById("overlay");
	//document.getElementById("sky").style.backgroundPosition=Math.floor(-player1.playerDir/(2*pi)*2400)+"px 0";

	//player1.drawCanvas();
	drawMap();
	initUnderMap();
  	player1.run(key);
  	player2.run(key2);


  	//setInterval(function() { player2.update2(); }, 35);
}
