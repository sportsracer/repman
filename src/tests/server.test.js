const {OPEN} = require('ws');

const makeGame = require('../game').makeGame;
const Server = require('../server').Server;

class MockEventEmitter {
  constructor() {
    this.callbacks = new Map();
  }

  on(event, callback) {
    this.callbacks.set(event, callback);
  }

  removeAllListeners(event) {
    this.callbacks.delete(event);
  }

  emit(event, ...args) {
    const callback = this.callbacks.get(event);
    callback(...args);
  }
}

class MockWebSocketServer extends MockEventEmitter {
  get clients() {
    return [];
  }
}

class MockWebSocket extends MockEventEmitter {
  get readyState() {
    return OPEN;
  }

  send() {}
}

describe('Server', () => {
  let wss = null;
  let ws = null;
  let game = null;
  let server = null;

  beforeEach(() => {
    wss = new MockWebSocketServer();
    ws = new MockWebSocket();
    jest.spyOn(ws, 'send');
    game = makeGame();
    server = new Server(wss, game);
    server.start();
  });

  afterEach(() => {
    server.stop();
  });

  it('can start and accept players', () => {
    wss.emit('connection', ws);
    ws.emit('message', '{"msg": "join", "name": "John Doe"}');

    expect(game.players).toHaveLength(1);
    expect(game.players[0].name()).toBe('John Doe');
    expect(ws.send).toHaveBeenCalled();
  });

  it('allows players to leave by sending "leave" message', () => {
    wss.emit('connection', ws);
    ws.emit('message', '{"msg": "join", "name": "John Doe"}');
    ws.emit('message', '{"msg": "leave"}');

    expect(game.players).toHaveLength(0);

    server.stop();
  });

  it('allows players to leave by closing the connection', () => {
    wss.emit('connection', ws);
    ws.emit('message', '{"msg": "join", "name": "John Doe"}');
    ws.emit('close');

    expect(game.players).toHaveLength(0);

    server.stop();
  });

  it('sends an error back when receiving invalid JSON', () => {
    wss.emit('connection', ws);
    ws.emit('message', 'garblegarble');

    expect(ws.send.mock.calls).toHaveLength(1);
    const messageStr = ws.send.mock.calls[0][0];
    const message = JSON.parse(messageStr);
    expect(message.msg).toBe('error');
  });
});
