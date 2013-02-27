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

var total_tick=0;
var map;
var canvas;
var overlay;
var arena;

var player1; //this is always the player
var player2;
var player_list=[];
var key=[0,0,0,0,0]; // left, right, up, down
var key2=[0,0,0,0,0];

var arenaSize=21;
var map_scale=8;
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



var Player = function (x, y, z, dir) {
	this.posX = x;
	this.posY = y;
	this.posZ = z;
	this.playerDir = dir;
	this.playerVelY = 0; //Y velocity
	this.theta = 0;

	this.xOff = 0;
	this.yOff = 0;

	this.jumpCycle=0;
	this.audio = window.Audio && new Audio("/shoot.wav");
};


Player.prototype.drawMapBall = function() {
  	map.fillStyle="#3366CC";
  	map.arc(this.posX*map_scale, this.posY*map_scale, ball_size, 0, 2*pi, true);
  	map.fill();
};


Player.prototype.update = function () {
	var change=false;

  if (key[0]) {
		if (!key[1]) {
			this.playerDir-=0.07; //left
			change=true;
		}
	}
	else if (key[1]) {
		this.playerDir+=0.07; //right
		change=true;
	}

	if (change) {
		this.playerDir+=2*pi;
		this.playerDir%=2*pi;
		document.getElementById("sky").style.backgroundPosition=Math.floor(1-this.playerDir/(2*pi)*2400)+"px 0";
	}

	if (key[2] && !key[3]) {
		if (this.playerVelY<0.1) this.playerVelY += 0.02;
	}
	else if (key[3] && !key[2]) {
		if (this.playerVelY>-0.1) this.playerVelY -= 0.02;
	}
	else {
		if (this.playerVelY<-0.02) this.playerVelY += 0.015;
		else if (this.playerVelY>0.02) this.playerVelY -= 0.015;
		else this.playerVelY=0;
	}


	if (this.playerVelY!=0) {

		var oldX=this.posX;;
		var oldY=this.posY;
		var newX=oldX+Math.cos(this.playerDir)*this.playerVelY;
		var newY=oldY+Math.sin(this.playerDir)*this.playerVelY;

		if (!this.nearWall(newX, oldY)) {
			this.posX=newX;
			oldX=newX;
			change=true;
		}
		if (!this.nearWall(oldX, newY)) {
			this.posY=newY;
			change=true;
		}

	}


	console.log(this.playerDir);

	//if (playerVelY) wobbleGun();
	if (change) this.drawCanvas();
};


Player.prototype.update_simple = function () {
	var change=false;

	if (key[0]) {
		this.playerDir = 3.0;
		change = true;
	}
	else if (key[1]) {
		this.playerDir = 0.0;
		change = true;
	}
	else if (key[2]) {
		this.playerDir = 4.5;
		change = true;
	}
	else if (key[3]) {
		this.playerDir = 1.5;
		change = true;
	}

	if (key[0] || key[1] || key[2] || key[3]) {
		this.playerVelY = 0.2;
	}
	else {
		this.playerVelY = 0;
	}

	if (this.playerVelY!=0) {

		var oldX=this.posX;;
		var oldY=this.posY;
		var newX=oldX+Math.cos(this.playerDir)*this.playerVelY;
		var newY=oldY+Math.sin(this.playerDir)*this.playerVelY;

		if (!this.nearWall(newX, oldY)) {
			this.posX=newX;
			oldX=newX;
			change=true;
		}
		if (!this.nearWall(oldX, newY)) {
			this.posY=newY;
			change=true;
		}

	}

	console.log(this.playerDir);

	//if (playerVelY) wobbleGun();
	if (change) this.drawCanvas();
};




Player.prototype.run = function(){
	var that = this;
  	setInterval(function() { that.update_simple(); }, 35);
};


Player.prototype.drawCanvas = function(){
    map.beginPath();
	map.clearRect(0,0,210,210);
	this.drawMapBall();
	map.beginPath();
	map.moveTo(map_scale*this.posX, map_scale*this.posY);


	canvas.clearRect(0,0,400, 300);

    this.theta = this.playerDir-pi/6;
	var wall=wallDistance(this.theta);
   	console.log(wall);

	var linGrad;
	var tl,tr,bl,br;
	var theta1,theta2,fix1,fix2;

	for (var i=0; i<wall.length; i+=4) {

		theta1=this.playerDir-pi/6 + pi*wall[i]/(3*path_width);
		theta2=this.playerDir-pi/6 + pi*wall[i+2]/(3*path_width);

		fix1 = Math.cos(theta1-this.playerDir);
		fix2 = Math.cos(theta2-this.playerDir);

		var h=2-this.posZ;

		var wallH1=100/(wall[i+1]*fix1);
		var wallH2=100/(wall[i+3]*fix2);

		tl=[wall[i]*2, 150-wallH1*h];
		tr=[wall[i+2]*2, 150-wallH2*h]
		br=[wall[i+2]*2, tr[1]+wallH2*2];
		bl=[wall[i]*2, tl[1]+wallH1*2]

		var shade1=Math.floor(wallH1*2+20); if (shade1>255) shade1=255;
		var shade2=Math.floor(wallH2*2+20); if (shade2>255) shade2=255;

		linGrad = canvas.createLinearGradient(tl[0],0,tr[0],0);
		linGrad.addColorStop(0, 'rgba('+(face[i/4]%2==0 ? shade1 : 0)+','+(face[i/4]==1 ? shade1 : 0)+','+(face[i/4]==2 ? 0 : shade1)+',1.0)');
		linGrad.addColorStop(1, 'rgba('+(face[i/4]%2==0 ? shade2 : 0)+','+(face[i/4]==1 ? shade2 : 0)+','+(face[i/4]==2 ? 0 : shade2)+',1.0)');

		canvas.beginPath();
		canvas.moveTo(tl[0], tl[1]);
		canvas.lineTo(tr[0], tr[1]);
		canvas.lineTo(br[0], br[1]);
		canvas.lineTo(bl[0], bl[1]);
		canvas.fillStyle = linGrad;
		canvas.fill();

		map.lineTo(this.posX*map_scale+Math.cos(theta1)*(wall[i+1])*map_scale, this.posY*map_scale+Math.sin(theta1)*(wall[i+1])*map_scale);
		map.lineTo(this.posX*map_scale+Math.cos(theta2)*(wall[i+3])*map_scale, this.posY*map_scale+Math.sin(theta2)*(wall[i+3])*map_scale);
	}
	map.fillStyle="#FF0000"
	map.fill();

};


Player.prototype.nearWall = function(x,y){
	var xx,yy;
	if (isNaN(x)) x=this.posX;
	if (isNaN(y)) y=this.posY;
	for (var i=-0.1; i<=0.1; i+=0.2) {
		xx=Math.floor(x+i)
		for (var j=-0.1; j<=0.1; j+=0.2) {
			yy=Math.floor(y+j);
			if (arena[xx][yy]) return true;
		}
	}
	return false;
};


Player.prototype.wobbleGun = function(){
	var mag=this.playerVelY;
    this.xOff = (10+Math.cos(total/6.23)*mag*90)
    this.yOff = (10+Math.cos(total/5)*mag*90)
	overlay.style.backgroundPosition = xOff + "px " + yOff + "px";
};


Player.prototype.shoot = function(){
	this.audio && this.audio.play();
	canvas.save();
	canvas.strokeStyle = "#FFFF00";
	canvas.beginPath();

	canvas.moveTo(190+this.xOff, 140+this.yOff);
	canvas.lineTo(250+this.xOff, 200+this.yOff);
	canvas.closePath();
	canvas.stroke();
	canvas.restore();

	var that = this;
	setTimeout(function(){that.drawCanvas()},100);
};


function changeKey(which, to){
	switch (which){
		case 65: key[0] = to; break; // left
        case 87: key[2] = to; break; // up
        case 68: key[1] = to; break; // right
        case 83: key[3] = to; break;// down
        case 37: key[0] = to; break;
        case 38: key[2] = to; break;
        case 39: key[1] = to; break;
        case 40: key[3] = to; break;
        case 32: key[4] = to; break; // space bar;
        case 17: key[5] = to; break; // ctrl
		case 66: if (to) { player1.shoot() } break; // b
	}
}
document.onkeydown=function(e){changeKey((e||window.event).keyCode, 1);}
document.onkeyup=function(e){changeKey((e||window.event).keyCode, 0);}


function initUnderMap(){
	var underMap=document.getElementById("underMap").getContext("2d");
	underMap.fillStyle="#FFF";
	underMap.fillRect(0,0, 210, 210);
	underMap.fillStyle="#444";
	for (var i=0; i<arena.length; i++) {
		for (var j=0; j<arena[i].length; j++) {
			if (arena[i][j]) underMap.fillRect(i*map_scale, j*map_scale, map_scale, map_scale);
		}
	}
}


window.onload=function(){

	arena=initArena(arenaSize, arenaSize);
	console.log(arena);

	var ele = document.getElementById("map");
	if (!ele.getContext)
	{
	  alert('An error occured creating a Canvas 2D context. This may be because you are using an old browser, if not please contact me and I\'ll see if I can fix the error.');
	  return;
	}

  	player1 = new Player(3.5, 3.5, 1, 0.4);
  	//player2 = new Player(3.5, 3.5, 1, 0.4);

	map=ele.getContext("2d");
    user=ele.getContext("2d");
	canvas=document.getElementById("canvas").getContext("2d");
	overlay=document.getElementById("overlay");
	document.getElementById("sky").style.backgroundPosition=Math.floor(-player1.playerDir/(2*pi)*2400)+"px 0";

	player1.drawCanvas();
	initUnderMap();
  	player1.run();
  	//setInterval(function() { player2.update2(); }, 35);
}
