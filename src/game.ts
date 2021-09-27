import {IPlayer, ITopFlop, IWall, makePlayer, makeTopFlop, makeWall, TopFlopType} from './engine';
import Position from './position';
import Rectangle from './rectangle';

/**
 * Main game object.
 */
export class Game {
  static topFlopRespawnTime = 2000;

  private bounds: Rectangle;
  private topsFlops: ITopFlop[] = [];
  private players: IPlayer[] = [];
  private timer: number = 0;
  private lastTick?: number;

  /**
   * @param width Width of the game world
   * @param height Height of the game world
   * @param walls Walls which are to be placed in the game
   * @param numTopsFlops Total number of tops and flops to spawn
   */
  constructor(private width: number, private height: number, private walls: IWall[], numTopsFlops: number) {
    [...Array(numTopsFlops)].forEach((_, i) => {
      const topFlop = i % 2 == 0 ? TopFlopType.TOP : TopFlopType.FLOP;
      this.spawnTopFlop(topFlop);
    });

    this.bounds = Rectangle.fromOrigin(width, height);
  }

  /**
   * Add a player to the game.
   */
  addPlayer(name: string): IPlayer {
    const {x, y} = this.getRandomFreePosition();
    const player = makePlayer(x, y, name);
    this.players.push(player);
    return player;
  }

  /**
   * Remove a player from the game. Pass the object you were returned from `addPlayer`.
   */
  removePlayer(player: IPlayer) {
    const index = this.players.indexOf(player);
    this.players.splice(index, 1);
  }

  /**
   * Create a top/flop object in a free position.
   */
  spawnTopFlop(type: TopFlopType) {
    const pos = this.getRandomFreePosition();
    const topFlop = makeTopFlop(pos.x, pos.y, type);
    this.topsFlops.push(topFlop);
  }

  /**
   * Return a random position not blocked by a wall.
   */
  getRandomFreePosition(): Position {
    while (true) {
      const pos = new Position(
          Math.round(Math.random() * this.width),
          Math.round(Math.random() * this.height),
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
   */
  getState(): {[key: string]: any} {
    const getState = (el: any) => el.getState();
    return {
      width: this.width,
      height: this.height,
      players: this.players.map(getState),
      walls: this.walls.map(getState),
      topsFlops: this.topsFlops.map(getState),
      timer: this.timer,
    };
  }
}

/**
 * Make a game with three walls crossing the playing field.
 */
export function makeGame(): Game {
  const width = 32;
  const height = 18;

  const walls = [];
  for (let i = 0; i < 8; i++) {
    walls.push(
        makeWall(7, i + 10),
        makeWall(15, i),
        makeWall(23, i + 10),
    );
  }

  const game = new Game(width, height, walls, 16);
  return game;
}
