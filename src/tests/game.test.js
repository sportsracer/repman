const makeWall = require('../engine').makeWall;
const {Game, makeGame} = require('../game');

describe('Game', () => {
  it('can find a position not blocked by a wall', () => {
    const walls = [makeWall(0, 0)];
    const game = new Game(2, 1, walls, 0);

    const pos = game.getRandomFreePosition();

    expect(pos.x).toBeGreaterThanOrEqual(1);
    expect(pos.x).toBeLessThanOrEqual(2);
    expect(pos.y).toBeGreaterThanOrEqual(0);
    expect(pos.y).toBeLessThanOrEqual(1);
  });

  it('can add a player', () => {
    const game = makeGame();
    const name = 'John Doe';
    const player = game.addPlayer(name);

    expect(player.name()).toBe(name);
  });

  it('can be serialized', () => {
    const game = makeGame();

    const state = game.getState();

    expect(state.players).toHaveLength(0);
    expect(state.walls.length).toBeGreaterThan(0);
    expect(state.topsFlops.length).toBeGreaterThan(0);
    expect(typeof state.timer).toBe('number');
  });
});
