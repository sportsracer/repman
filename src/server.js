const {WebSocket, WebSocketServer} = require('ws');

const gameTickInterval = 50;

/**
 * Thrown when a player sends an invalid message given its current state.
 */
class InvalidMessage extends Error { }

/**
 * Base class for client state.
 */
class ClientState {
  /**
   * @param {WebSocket} ws
   * @param {Game} game
   * @param {Object} player
   */
  constructor(ws, game, player = null) {
    this.ws = ws;
    this.game = game;
    this.player = player;
  }

  /**
   * Handle a received message and return the next client state.
   * @param {Object} message
   */
  receiveMessage(message) {
    throw new InvalidMessage();
  }

  /**
   * Send a message back to the client.
   * @param {Object} message
   */
  sendMessage(message) {
    const messageStr = JSON.stringify(message);
    this.ws.send(messageStr);
  }
}

/**
 * A client has connected, but not joined the game yet.
 */
class ConnectedState extends ClientState {
  /**
   * In this state, a client needs to send a join message with their name.
   * @param {Object} message
   * @return {ClientState}
   */
  receiveMessage(message) {
    switch (message.msg) {
      case 'join':
        const name = message.name;
        const player = this.game.addPlayer(name);

        const response = {msg: 'joined'};
        this.sendMessage(response);

        console.log('%s joined the game', name);

        return new InGameState(this.ws, this.game, player);
    }
    return super.receiveMessage(message);
  }
}

/**
 * Client who is in game.
 */
class InGameState extends ClientState {
  /**
   * In this state, a client continuously sends their input, and may decide to leave the game.
   * @param {Object} message
   * @return {ClientState}
   */
  receiveMessage(message) {
    switch (message.msg) {
      case 'input':
        this.player.input(message.w, message.a, message.s, message.d);
        return this;

      case 'leave':
        this.game.removePlayer(this.player);
        console.log('Player %s is leaving', this.player.name());
        return new LeftState(this.ws, this.game, this.player);

      default:
        return super.receiveMessage(message);
    }
  }
}

/**
 * Client has left the game, either by sending a leave message, or because the connection was closed.
 */
class LeftState extends ClientState {
  /**
   * No longer react to incoming messages.
   * @return {ClientState}
   */
  receiveMessage() {
    return this;
  }

  /**
   * No longer send messages back to the client.
   */
  sendMessage() {}
}

/**
 * Repman game server.
 */
class Server {
  clientCounter = 0;

  /**
   * @param {WebSocketServer} wss A websocket server which is already listening for incoming connections.
   * @param {Game} game Repman game for players to join.
   */
  constructor(wss, game) {
    this.wss = wss;
    this.game = game;
  }

  /**
   * Start reacting to incoming websocket connections, and advancing the game state.
   */
  start() {
    this.clients = new Map();
    this.wss.on('connection', (ws) => this.connect(ws));
    this.intervalId = setInterval(() => this.tick(), gameTickInterval);
  }

  /**
   * Stop reacting to incoming connections, close all open websockets, and stop advancing the game state.
   */
  stop() {
    this.wss.clients.forEach((client) => {
      if (client.readyState == WebSocket.OPEN) {
        client.close();
      }
    });
    this.wss.removeAllListeners('connection');
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * React to a client who just connected through a websocket.
   * @param {WebSocket} ws
   */
  connect(ws) {
    const clientId = this.clientCounter++;
    console.info('New client connecting. Assigning ID %d', clientId);

    const initialState = new ConnectedState(ws, this.game);
    this.clients.set(clientId, initialState);

    ws.on('message', (messageRaw) => {
      const clientState = this.clients.get(clientId);
      
      let message;
      try {
        message = JSON.parse(messageRaw);
      } catch (err) {
        if (err instanceof SyntaxError) {
          console.warn('Client %d sent invalid JSON', clientId);
          clientState.sendMessage({msg: 'error', description: 'Could not parse JSON'});
          return;
        }
        throw err;
      }

      try {
        const newState = clientState.receiveMessage(message);
        this.clients.set(clientId, newState);
      } catch (err) {
        if (err instanceof InvalidMessage) {
          console.warn('Client %d sent invalid message', clientId);
          clientState.sendMessage({msg: 'error', description: 'Invalid message'});
          return;
        }
        throw err;
      }
    });

    ws.on('close', () => {
      console.info('Client %d disconnected', clientId);
      const clientState = this.clients.get(clientId);
      const newState = clientState.receiveMessage({msg: 'leave'});
      this.clients.set(clientId, newState);
    });
  }

  /**
   * All clients which are currently in game.
   */
  * clientsInGame() {
    for (const clientState of this.clients.values()) {
      if (clientState instanceof InGameState) {
        yield clientState;
      }
    }
  }

  /**
   * Advance the game state, and broadcast to all clients.
   */
  tick() {
    this.game.tick();

    const message = {
      msg: 'state',
      ...this.game.getState(),
    };

    for (const clientState of this.clientsInGame()) {
      clientState.sendMessage(message);
    }
  }
}

exports.Server = Server;
