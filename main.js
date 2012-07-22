
var engine = require("./engine")
, WebSocketServer = require("ws").Server

, server = new WebSocketServer({port: 8888})
, clients = []

, game = engine.makeGame();

server.on("connection",
	  function(ws) {
		  ws.playerIndex = game.addPlayer();
		  clients.push(ws);
		  ws.on("message",
			function(message) {
				var input = JSON.parse(message);
				game.setInput(ws.playerIndex, input);
			});
	  }
	 );

function tick() {
	// advance game
	game.tick();

	// broadcast state
	var state = JSON.stringify(game.getState());
	for (var i = 0; i < clients.length; ++i) {
		var ws = clients[i];
		ws.send(state);
	}
}

setInterval(tick, 50);

console.log("Listening!");