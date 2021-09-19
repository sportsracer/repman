const engine = require('./engine');
const Position = require('./position');
const Rectangle = require('./rectangle');

/**
 * Main game object.
 */
class Game {
  static topFlopRespawnTime = 2000;

  /**
   * @param {Rectangle} bounds
   * @param {Object[]} walls
   * @param {Number} numTopsFlops
   */
  constructor(bounds, walls, numTopsFlops) {
    this.bounds = bounds;
    this.walls = walls;

    this.topsFlops = [];
    [...Array(numTopsFlops)].forEach((_, i) => {
      const topFlop = i % 2 == 0 ? 'top' : 'flop';
      this.spawnTopFlop(topFlop);
    });

    this.players = [];
    this.lastTick = null;
    this.timer = 0;
  }

  /**
   * @return {Number}
   */
  get width() {
    return this.bounds.bottomRight.x - this.bounds.topLeft.x;
  }

  /**
   * @return {Number}
   */
  get height() {
    return this.bounds.bottomRight.y - this.bounds.topLeft.y;
  }

  /**
   * Add a player to the game.
   * @param {String} name
   * @return {Object} Player object
   */
  addPlayer(name) {
    const pos = this.getRandomFreePosition();
    const player = engine.makePlayer(pos.x, pos.y, this.players.length, name);
    this.players.push(player);
    return player;
  }

  /**
   * Remove a player from the game. Pass the object you were returned from `addPlayer`.
   * @param {Object} player
   */
  removePlayer(player) {
    const index = this.players.indexOf(player);
    this.players.splice(index, 1);
  }

  /**
   * Create a top/flop object in a free position.
   * @param {String} type Either 'top' or 'flop'
   */
  spawnTopFlop(type) {
    const pos = this.getRandomFreePosition();
    const topFlop = engine.makeTopFlop(pos.x, pos.y, type);
    this.topsFlops.push(topFlop);
  }

  /**
   * Return a random position not blocked by a wall.
   * @return {Position}
   */
  getRandomFreePosition() {
    while (true) {
      const pos = new Position(
          Math.round(Math.random() * (this.width - 1)),
          Math.round(Math.random() * (this.height - 1)),
      );

      const occupied = this.walls.reduce((occupied, wall) => occupied || wall.collidesWith(pos), false);

      if (!occupied) {
        return pos;
      }
    }
  }

  /**
   * Advance the game state. Measures the time that has passed since the last time this was called.
   */
  tick() {
    const now = Date.now();
    const delta = this.lastTick != null ? (now - this.lastTick) / 1000.0 : 0;

    for (const player of this.players) {
      player.move(delta, this.bounds, this.walls);

      const collectedTopsFlops = player.collect(this.topsFlops);
      collectedTopsFlops.forEach((topFlop) => {
        // remove the collected top/flop
        const index = this.topsFlops.indexOf(topFlop);
        this.topsFlops.splice(index, 1);

        // spawn a new one of the same type after some time
        const type = topFlop.topFlop();
        setTimeout(() => this.spawnTopFlop(type), Game.topFlopRespawnTime);
      });
    }

    for (const topFlop of this.topsFlops) {
      topFlop.move(delta, this.bounds, this.walls);
      topFlop.randomize();
    }

    this.lastTick = now;
    this.timer += delta;
  }

  /**
   * Return a representation of the game which can be sent to clients.
   * @return {Object}
   */
  getState() {
    const getState = (el) => el.getState();
    return {
      players: this.players.map(getState),
      walls: this.walls.map(getState),
      topsFlops: this.topsFlops.map(getState),
      timer: this.timer,
    };
  }
}

/**
 * Make a game with three walls crossing the playing field.
 * @return {Game}
 */
function makeGame() {
  const bounds = Rectangle.fromOrigin(32, 18);

  const walls = [];
  for (let i = 0; i < 8; i++) {
    walls.push(
        engine.makeWall(7, i + 10),
        engine.makeWall(15, i),
        engine.makeWall(23, i + 10),
    );
  }

  const game = new Game(bounds, walls, numTopsFlops=16);
  return game;
}

exports.Game = Game;
exports.makeGame = makeGame;
