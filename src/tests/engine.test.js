const engine = require('../engine');

describe('Wall', () => {
  it('can be constructed', () => {
    const wall = engine.makeWall(1, 2);

    expect(wall.pos().x).toBe(1);
    expect(wall.pos().y).toBe(2);
  });
});

describe('Tops & flops', () => {
  it('can be constructed', () => {
    const top = engine.makeTopFlop(1, 2, 'top');

    expect(top.topFlop()).toBe('top');
  });

  test('move randomly', () => {
    const x = 6; const y = 4;
    const top = engine.makeTopFlop(x, y, 'top');
    const flop = engine.makeTopFlop(x, y, 'flop');

    const delta = 1;
    top.randomize(); top.move(delta);
    flop.randomize(); flop.move(delta);

    // top & flop have moved from their starting position, and are not in the same position since movement is random
    expect(top.pos().x).not.toBe(x);
    expect(top.pos().x).not.toBe(flop.pos().x);
    expect(top.pos().y).not.toBe(y);
    expect(top.pos().y).not.toBe(flop.pos().y);
  });
});

describe('Player', () => {
  const x = 6;
  const y = 4;
  const name = 'John Doe';

  /**
   * @return {object} Player fixture for tests
   */
  function makePlayer() {
    return engine.makePlayer(x, y, name);
  }

  it('can be constructed', () => {
    const player = makePlayer();

    expect(player.name()).toBe(name);
    expect(player.points()).toBe(0);
  });

  it('can be moved forward and turned with WASD keys', () => {
    const player = makePlayer();

    player.input(true, true, false, false);
    // move twice so that turn speed has an effect
    const delta = 0.01;
    player.move(delta);
    player.move(delta);

    expect(player.pos().x).toBeGreaterThan(x);
    expect(player.pos().y).toBeLessThan(y);
  });

  it('collects tops for points', () => {
    const player = makePlayer();
    const topsFlops = [
      engine.makeTopFlop(x, y, 'top'),
      engine.makeTopFlop(x + 0.5, y, 'top'),
      engine.makeTopFlop(x + 1, y + 1, 'flop'), // too far away to collect
    ];

    player.collect(topsFlops);

    expect(player.points()).toBe(2);
  });
});
