var ws = new WebSocket("ws://localhost:8888");

var pollFreq = 50;

ws.onopen = function() {
	console.log("Connection established!");
	setInterval(sendInput, pollFreq);
};

ws.onmessage = function(msg) {
	var player = JSON.parse(msg.data);
	console.log(player);
	drawGame(player);
};

var playerImg = new Image();
playerImg.src = "img/player-1.png";

function drawGame(player) {
	var canvas = document.getElementById("canvas")
	, context = canvas.getContext("2d");
	
	// fill background
	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);

	// draw player
	context.save();
	context.translate(-player.x * 32, -player.y * 32);
	context.rotate(player.angle);
	context.drawImage(playerImg, -16, -16);
	context.restore();
}

function sendInput() {
	var wasd = {
		w: !!pressed[87],
		a: !!pressed[65],
		s: !!pressed[83],
		d: !!pressed[68]
	};
	ws.send(JSON.stringify(wasd));
}

var pressed = {};

window.onkeydown = function(event) {
	pressed[event.keyCode] = true;
};

window.onkeyup = function(e) {
	delete pressed[event.keyCode];
};