import express from 'express';
import http from 'http';
import ws from 'ws';

import {makeGame} from './game';
import Server from './server';

// Create Repman game
const game = makeGame();

// Set up HTTP & websocket servers
const app = express();
const httpServer = http.createServer(app);
const wsServer = new ws.Server({server: httpServer});

// Start Repman server
const server = new Server(wsServer, game);
server.start();

// Set up file serving
app.use(express.static('public'));

// Listen for incoming connections!
const port = process.env.PORT || 8888;
httpServer.listen(port, () => {
  console.info('Server started on %s', port);
  console.info('To join the game locally, visit http://localhost:%d/index.html', port);
});
