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

var map_scale=16;
var map_size=640;
var ball_size= map_scale*3/8;
var path_width=200;
var face=[];


var Player = function (x, y, z, dir, color, mapid) {

	if(!mapid){
		alert('No canvas ID is given');
		return;
	}

	this.posX = x;
	this.posY = y;
	this.oldX = x;
	this.oldY = y;

	console.log(color)

	if (color) {		
		this.ballcolor = color;
	} else {
		this.ballcolor = "#000000";
	}
	
	this.posZ = z;
	this.playerDir = dir;
	this.playerVelY = 0; //Y velocity
	this.theta = 0;

	this.xOff = 0;
	this.yOff = 0;

	this.jumpCycle=0;
	this.audio = window.Audio && new Audio("/shoot.wav");

	this.key = [0,0,0,0,0];

	this.ele = document.getElementById(mapid);
	if (!this.ele.getContext)
	{
	  	alert('An error occured creating a Canvas 2D context. This may be because you are using an old browser, if not please contact me and I\'ll see if I can fix the error.');
	  	return;
	}

	this.map=this.ele.getContext("2d");
};


Player.prototype.drawMapBall = function() {
  	this.map.fillStyle=this.ballcolor;
  	this.map.arc(this.posX*map_scale, this.posY*map_scale, ball_size, 0, 2*pi, true);
  	this.map.fill();
};


Player.prototype.update = function (key) {
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


	//console.log(this.playerDir);

	//if (playerVelY) wobbleGun();
	if (change) this.drawCanvas();
};


Player.prototype.update_simple = function (key) {
	var change=false;
	var stepX = 0.5;
	var stepY = 0.5;
	var newX = this.posX;
	var newY = this.posY;

	if (this.key[0]) {
		newX -= stepX;
		change = true;
	}
	else if (this.key[1]) {
		newX += stepX;
		change = true;
	}
	else if (this.key[2]) {
		newY -= stepY;
		change = true;
	}
	else if (this.key[3]) {
		newY += stepY;
		change = true;
	}


	if (change) {

		if(!this.nearWall_simple(newX, newY)){
			this.posX = newX;
			this.posY = newY;

	//		console.log(this.posX, this.posY);
			mazeCheck(this.posX, this.posY);
			this.drawMap();
		}
	}
};


Player.prototype.nearWall_simple = function(x,y){

	//if something wrong with given value
	if (isNaN(x)) x=this.posX;
	if (isNaN(y)) y=this.posY;

	var xcord = 0;
	var ycord = 0;
	var xcord2 = 0;
	var ycord2 = 0;
	var offsetX = 0.5;
	var offsetY = 0.5;


	console.log("x, y: ", x, y);

	if(x.isWhole()) {
		xcord = Math.floor(x+offsetX);
		xcord2 = Math.floor(x-offsetX);
	}
	else {
		xcord = Math.floor(x);
		xcord2 = xcord;
	}

	if (y.isWhole()) {
		ycord = Math.floor(y+offsetY);
		ycord2 = Math.floor(y-offsetY);
	}
	else {
		ycord = Math.floor(y);
		ycord2 = ycord;
	}

	console.log("xcord, xcord2, ycord, ycord2: ", xcord, xcord2, ycord, ycord2);

	if (arena[xcord][ycord] || arena[xcord2][ycord2] || arena[xcord][ycord2] || arena[xcord2][ycord]) {// || arena[xcord][ycord2]){
		return true;
	}


	return false;
};



Player.prototype.run = function(key){
	var that = this;
  	setInterval(function() { that.update_simple(key); }, 35);
};


Player.prototype.drawMap = function(){
    this.map.beginPath();
	this.map.clearRect(0,0,map_size,map_size);
	this.drawMapBall();
	this.map.beginPath();
	this.map.moveTo(map_scale*this.posX, map_scale*this.posY);	
};


Player.prototype.drawCanvas = function(){

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
	var min_threshold = -0.4;
	var threshold = 0.4;
	var increment = 0.5;

	if (isNaN(x)) x=this.posX;
	if (isNaN(y)) y=this.posY;
	for (var i=min_threshold; i<=threshold; i+=increment) {
		xx=Math.floor(x+i)
		for (var j=min_threshold; j<=threshold; j+=increment) {
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


Player.prototype.changeKey = function(which, to){

	switch (which){
		case 65: this.key[0] = to; break; // left
        case 87: this.key[2] = to; break; // up
        case 68: this.key[1] = to; break; // right
        case 83: this.key[3] = to; break;// down
        case 37: this.key[0] = to; break;
        case 38: this.key[2] = to; break;
        case 39: this.key[1] = to; break;
        case 40: this.key[3] = to; break;
        case 32: this.key[4] = to; break; // space bar;
        case 17: this.key[5] = to; break; // ctrl
		case 66: if (to) { this.shoot() } break; // b
	}
}
