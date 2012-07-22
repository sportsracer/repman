
var ws = new WebSocket("ws://localhost:8888")
, pollFreq = 50;

ws.onopen = function() {
	console.log("Connection established!");
	setInterval(sendInput, pollFreq);
};

ws.onmessage = function(msg) {
	var state = JSON.parse(msg.data);
	console.log(state);
	drawGame(state);
};

// images

function loadImage(src) {
	var image = new Image();
	image.src = src;
	return image;
}

var playerImgs = [0, 1, 2, 3].map(
	function(playerIndex) {
		return loadImage("img/player-" + playerIndex + ".png");
	}
)
, wallImg = loadImage("img/wall.png")
, topImg = loadImage("img/top.png")
, flopImg = loadImage("img/flop.png");

// drawing

var tileWidth = 32;

function drawGame(state) {
	var canvas = document.getElementById("canvas")
	, context = canvas.getContext("2d");
	
	// fill background
	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);

	// draw walls
	state.walls.forEach(
		function(wall) {
			context.drawImage(wallImg, wall.x * tileWidth, wall.y * tileWidth);
		}
	);

	// draw players
	state.players.forEach(
		function(player, playerIndex) {
			var playerImg = playerImgs[playerIndex % playerImgs.length];
			context.save();
			context.translate(player.x * tileWidth + (tileWidth / 2), player.y * tileWidth + (tileWidth / 2));
			context.rotate(player.angle);
			context.drawImage(playerImg, -tileWidth / 2, -tileWidth / 2);
			context.restore();
		}
	);

	// draw tops & flops

	state.topsFlops.forEach(
		function(topFlop) {
			var topFlopImg = topFlop.topFlop == "top" ? topImg : flopImg;
			context.drawImage(topFlopImg, topFlop.x * tileWidth, topFlop.y * tileWidth);
		}
	);
}

// send input

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