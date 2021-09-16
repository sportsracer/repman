const engine = require('../engine');

describe('Wall', () => {
  it('can be constructed', () => {
    const wall = engine.makeWall({x: 1, y: 2});

    expect(wall.x()).toBe(1);
    expect(wall.y()).toBe(2);
  });

  it('can be moved', () => {
    const wall = engine.makeWall({x: 1, y: 2});
    wall.x(3);

    expect(wall.x()).toBe(3);
  });
});

describe('Tops & flops', () => {
  it('can be constructed', () => {
    const top = engine.makeTopFlop({x: 1, y: 2, topFlop: 'top'});

    expect(top.topFlop()).toBe('top');
  });

  test('move randomly', () => {
    const x = 6; const y = 4;
    const top = engine.makeTopFlop({x, y, topFlop: 'top'});
    const flop = engine.makeTopFlop({x, y, topFlop: 'flop'});

    const delta = 1;
    top.randomize(); top.move(delta, []);
    flop.randomize(); flop.move(delta, []);

    // top & flop have moved from their starting position, and are not in the same position since movement is random
    expect(top.x()).not.toBe(x);
    expect(top.x()).not.toBe(flop.x());
    expect(top.y()).not.toBe(y);
    expect(top.y()).not.toBe(flop.y());
  });
});

describe('Player', () => {
  const x = 6;
  const y = 4;
  const index = 0;
  const name = 'John Doe';

  /**
   * @return {object} Player fixture for tests
   */
  function makePlayer() {
    return engine.makePlayer({x, y, index, name});
  }

  it('can be constructed', () => {
    const player = makePlayer();

    expect(player.index()).toBe(index);
    expect(player.name()).toBe(name);
    expect(player.points()).toBe(0);
  });

  it('can be moved forward and turned with WASD keys', () => {
    const player = makePlayer();

    player.input(true, true, false, false);
    // move twice so that turn speed has an effect
    const delta = 0.01;
    player.move(delta, []);
    player.move(delta, []);

    expect(player.x()).toBeGreaterThan(x);
    expect(player.y()).toBeLessThan(y);
  });

  it('collects tops for points', () => {
    const player = makePlayer();
    const topsFlops = [
      engine.makeTopFlop({x, y, topFlop: 'top'}),
      engine.makeTopFlop({x: x + 0.5, y, topFlop: 'top'}),
      engine.makeTopFlop({x: x + 1, y: y + 1, topFlop: 'flop'}), // too far away to collect
    ];

    player.collect(topsFlops);

    expect(player.points()).toBe(2);
  });
});
