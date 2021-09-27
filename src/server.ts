import {WebSocket, WebSocketServer} from 'ws';

import {IPlayer} from './engine';
import {Game} from './game';

const gameTickInterval = 50;

// messages we can receive from the client

interface JoinMessage {
  msg: 'join',
  name: string
};

interface InputMessage {
  msg: 'input',
  w: boolean, a: boolean, s: boolean, d: boolean
};

/**
 * Repman client. Handles receiving & sending messages via websockets, and translating them to game actions.
 */
class Client {
  private player?: IPlayer;

  /**
   * @param ws Websocket already in connected state
   * @param game Repman game instance
   * @param doneCallback Called when the player has left or disconnected
   */
  constructor(private ws: WebSocket, private game: Game, private doneCallback: Function) {}

  /**
   * Start listening to incoming websocket messages.
   */
  start() {
    const receiveMessage = this.receiveMessages();
    receiveMessage.next(); // Advance generator to the first expected message

    this.ws.on('message', (messageStr: string) => {
      const {done} = receiveMessage.next(messageStr);
      done && this.stop();
    });

    this.ws.on('close', () => {
      if (this.player !== null) {
        receiveMessage.next('{"msg": "leave"}');
      }
      this.stop();
    });
  }

  /**
   * Stop listening to incoming messages and invoke `doneCallback`.
   */
  stop() {
    this.ws.removeAllListeners('message');
    this.ws.removeAllListeners('close');
    this.doneCallback();
  }

  /**
   * Send a message back to the client.
   */
  sendMessage(message: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      this.ws.send(messageStr);
    }
  }

  /**
   * Send an error message back to the client.
   */
  sendError(description: string) {
    console.warn(description);
    this.sendMessage({
      msg: 'error',
      description,
    });
  }

  /**
   * Handle a message received from the client.
   * @param messageStr Raw message received over the websocket
   * @param callbacks Valid callbacks, keyed by the `msg` property
   */
  private handle(messageStr: string, callbacks: {[msg: string]: Function}) {
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
    this.handle(yield, {
      join: (message: JoinMessage) => {
        this.player = this.game.addPlayer(message.name);
        this.sendMessage({msg: 'joined'});
        console.log('%s joined the game', this.player.name());
      },
    });

    let inGame = true;
    while (inGame) {
      this.handle(yield, {
        input: (message: InputMessage) => {
          this.player && this.player.input(message.w, message.a, message.s, message.d);
        },
        leave: () => {
          if (this.player !== undefined) {
            console.log('Player %s is leaving', this.player.name());
            this.game.removePlayer(this.player);
            this.player = undefined;
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
export default class Server {
  private clients: Set<Client> = new Set();
  private intervalId?: NodeJS.Timeout;

  /**
   * @param wss A websocket server which is already started
   * @param game Repman game for players to join
   */
  constructor(private wss: WebSocketServer, private game: Game) {}

  /**
   * Start reacting to incoming websocket connections, and advancing the game state.
   */
  start() {
    this.wss.on('connection', (ws) => {
      console.info('New client connecting …');

      const client = new Client(ws, this.game, () => {
        this.clients.delete(client);
      });
      this.clients.add(client);

      client.start();
    });
    this.intervalId = setInterval(() => this.tick(), gameTickInterval);
  }

  /**
   * Stop reacting to incoming connections, close all open websockets, and stop advancing the game state.
   */
  stop() {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.wss.removeAllListeners('connection');
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
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

    for (const client of this.clients) {
      client.sendMessage(message);
    }
  }
}
