
var makeGame = require("./game").makeGame
, WebSocketServer = require("ws").Server

, server = new WebSocketServer({port: 8888})
, clients = []

, game = makeGame();

function sendError(ws, description) {
	var error = {
		msg: "error",
		description: description
		};
	ws.send(JSON.stringify(error));
}

server.on("connection",
	  function(ws) {

		  ws.game = null;
		  ws.player = null;
		  clients.push(ws);

		  ws.on("message",
			function(message) {
				message = JSON.parse(message);
				switch (message.msg) {

				case "join":
					if (ws.game != null) {
						sendError(ws, "Already in game");
						return;
					}
					var player = game.addPlayer(message.name);
					console.log("Player " + player.name() + " (" + player.index() + ") joined");
					ws.player = player;
					ws.game = game;
					break;
					
				case "input":
					if (ws.game == null) {
						sendError(ws, "Not in game");
						return;
					}
					ws.game.setInput(ws.player.index(), message);
					break;
					
				default:
					sendError(ws, "Invalid msg");
				}
			}
		       );

		  ws.on("close",
			function() {
				if (ws.player && ws.game) {
					console.log("Player " + ws.player.name() + " is leaving");
					ws.game.removePlayer(ws.player.index());
				}
				clients.splice(clients.indexOf(ws), 1);
			}
		       );
	  }
	 );

function tick() {
	// advance game
	game.tick();

	// broadcast state
	clients.forEach(
		function(ws) {
			if (ws.game) {
				var state = ws.game.getState();
				state.msg = "state";
				var stateJson = JSON.stringify(state);
				ws.send(stateJson);
			}
		}
	);
}

setInterval(tick, 50);

console.log("Listening!");