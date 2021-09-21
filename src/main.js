const makeGame = require('./game').makeGame;
const Server = require('./server').Server;

const host = '0.0.0.0';
const port = 8888;
const game = makeGame();

const server = Server.fromHostPort(host, port, game);
server.start();

console.info('Listening on port %d', port);
