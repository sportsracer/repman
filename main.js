
var engine = require("./engine");
var WebSocketServer = require("ws").Server;

var player = engine.makePlayer(
	{
		x: 0,
		y: 0,
		angle: 0,
		speed: 0,
		moveSpeed: 0,
		turnSpeed: 0
	}
);
var server = new WebSocketServer({port: 8888});
var clients = [];

server.on("connection",
	  function(ws) {
		  clients.push(ws);
		  ws.on("message",
			function(message) {
				var input = JSON.parse(message);
				player.input(input.w, input.a, input.s, input.d);
			});
	  }
	 );

var tickMs = 50;

function broadcastState() {
	player.move(tickMs / 1000.0);
	var stateSerialization = JSON.stringify(player.getState());
	for (var i = 0; i < clients.length; ++i) {
		var ws = clients[i];
		ws.send(stateSerialization);
	}
}

setInterval(broadcastState, tickMs);

console.log("Listening!");