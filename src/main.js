const makeGame = require('./game').makeGame;
const WebSocketServer = require('ws').WebSocketServer;

const server = new WebSocketServer(
    {
      host: '0.0.0.0',
      port: 8888,
    },
);
const clients = [];

const game = makeGame();

/**
 * Send an error message to the player
 * @param {WebSocket} ws
 * @param {String} description
 */
function sendError(ws, description) {
  const error = {
    msg: 'error',
    description: description,
  };
  ws.send(JSON.stringify(error));
}

server.on('connection',
    function(ws) {
      ws.game = null;
      ws.player = null;
      clients.push(ws);

      ws.on('message',
          function(message) {
            message = JSON.parse(message);
            switch (message.msg) {
              case 'join':
                if (ws.game != null) {
                  sendError(ws, 'Already in game');
                  return;
                }
                const player = game.addPlayer(message.name);
                console.log('Player ' + player.name() + ' (' + player.index() + ') joined');
                ws.player = player;
                ws.game = game;

                ws.send(
                    JSON.stringify(
                        {
                          msg: 'joined',
                          playerIndex: player.index(),
                        },
                    ),
                );
                break;

              case 'input':
                if (ws.game == null) {
                  sendError(ws, 'Not in game');
                  return;
                }
                ws.player.input(message.w, message.a, message.s, message.d);
                break;

              default:
                sendError(ws, 'Invalid msg');
            }
          },
      );

      ws.on('close',
          function() {
            if (ws.player && ws.game) {
              console.log('Player ' + ws.player.name() + ' is leaving');
              ws.game.removePlayer(ws.player.index());
            }
            clients.splice(clients.indexOf(ws), 1);
          },
      );
    },
);

/**
 * Advance the game state by one tick.
 */
function tick() {
  // advance game
  game.tick();

  // broadcast state
  clients.forEach(
      function(ws) {
        if (ws.game) {
          const state = ws.game.getState();
          state.msg = 'state';
          const stateJson = JSON.stringify(state);
          ws.send(stateJson);
        }
      },
  );
}

setInterval(tick, 50);

console.log('Listening!');
