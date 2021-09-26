const {WebSocket} = require('ws');

const gameTickInterval = 50;

/**
 * Repman client. Handles receiving & sending messages via websockets, and translating them to game actions.
 */
class Client {
  #ws;
  #game;
  #doneCallback;
  #player;

  /**
   * @param {WebSocket} ws Websocket already in connected state
   * @param {Game} game Repman game instance
   * @param {Function} doneCallback Called when the player has left or disconnected
   */
  constructor(ws, game, doneCallback) {
    this.#ws = ws;
    this.#game = game;
    this.#doneCallback = doneCallback;
    this.#player = null; // This is set to the player instance when this client joins the game
  }

  /**
   * Start listening to incoming websocket messages.
   */
  start() {
    const receiveMessage = this.receiveMessages();
    receiveMessage.next(); // Advance generator to the first expected message

    this.#ws.on('message', (messageStr) => {
      const {done} = receiveMessage.next(messageStr);
      done && this.stop();
    });

    this.#ws.on('close', () => {
      if (this.#player !== null) {
        receiveMessage.next('{"msg": "leave"}');
      }
      this.stop();
    });
  }

  /**
   * Stop listening to incoming messages and invoke `doneCallback`.
   */
  stop() {
    this.#ws.removeAllListeners('message');
    this.#ws.removeAllListeners('close');
    this.#doneCallback();
  }

  /**
   * Send a message back to the client.
   * @param {Object} message
   */
  sendMessage(message) {
    if (this.#ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      this.#ws.send(messageStr);
    }
  }

  /**
   * Send an error message back to the client.
   * @param {String} description
   */
  sendError(description) {
    console.warn(description);
    this.sendMessage({
      msg: 'error',
      description,
    });
  }

  /**
   * Handle a message received from the client.
   * @param {String} messageStr Raw message received over the websocket
   * @param {Object} callbacks Valid callbacks, keyed by the `msg` property
   */
  #handle(messageStr, callbacks) {
    let message;
    try {
      message = JSON.parse(messageStr);
    } catch (err) {
      if (err instanceof SyntaxError) {
        this.sendError('Could not parse JSON');
        return;
      }
      throw err;
    }

    const callback = callbacks[message.msg];
    if (callback === undefined) {
      const validMsgs = Object.getOwnPropertyNames(callbacks);
      this.sendError(`'msg' must be one of ${validMsgs.join(', ')}`);
    } else {
      callbacks[message.msg](message);
    }
  }

  /**
   * React to incoming messages from the client. Implemented as a bidirectional generator, because this is not
   * production code :)
   */
  * receiveMessages() {
    this.#handle(yield, {
      join: (message) => {
        this.#player = this.#game.addPlayer(message.name);
        this.sendMessage({msg: 'joined'});
        console.log('%s joined the game', this.#player.name());
      },
    });

    let inGame = true;
    while (inGame) {
      this.#handle(yield, {
        input: (message) => {
          this.#player.input(message.w, message.a, message.s, message.d);
        },
        leave: () => {
          if (this.#player !== null) {
            console.log('Player %s is leaving', this.#player.name());
            this.#game.removePlayer(this.#player);
            this.#player = null;
          }
          inGame = false;
        },
      });
    }
  }
}

/**
 * Repman game server.
 */
class Server {
  #wss;
  #game;
  #clients;
  #intervalId;

  /**
   * @param {WebSocketServer} wss A websocket server which is already listening for incoming connections.
   * @param {Game} game Repman game for players to join.
   */
  constructor(wss, game) {
    this.#wss = wss;
    this.#game = game;
  }

  /**
   * Start reacting to incoming websocket connections, and advancing the game state.
   */
  start() {
    this.#clients = new Set();
    this.#wss.on('connection', (ws) => {
      console.info('New client connecting …');

      const client = new Client(ws, this.#game, () => {
        this.#clients.delete(client);
      });
      this.#clients.add(client);

      client.start();
    });
    this.#intervalId = setInterval(() => this.tick(), gameTickInterval);
  }

  /**
   * Stop reacting to incoming connections, close all open websockets, and stop advancing the game state.
   */
  stop() {
    this.#wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.#wss.removeAllListeners('connection');
    clearInterval(this.#intervalId);
    this.#intervalId = null;
  }

  /**
   * Advance the game state, and broadcast to all clients.
   */
  tick() {
    this.#game.tick();

    const message = {
      msg: 'state',
      ...this.#game.getState(),
    };

    for (const client of this.#clients) {
      client.sendMessage(message);
    }
  }
}

exports.Server = Server;
