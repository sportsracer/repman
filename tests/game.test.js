const makeGame = require('../game').makeGame;

describe('Game', () => {
    it('can add a player', () => {
      const game = makeGame();
      const name = 'John Doe';
      const player = game.addPlayer(name);

      expect(player.name()).toBe(name);
      expect(player.index()).toBe(0);
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