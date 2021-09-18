const engine = require('./engine');
const Position = require('./position');

// game object

const gamePrototype = {

  addPlayer: function(name) {
    const pos = this.getRandomPosition();
    const player = engine.makePlayer(pos.x, pos.y, this.players.length, name);
    this.players.push(player);
    return player;
  },

  removePlayer: function(playerIndex) {
    this.players.splice(playerIndex, 1);
  },

  setInput: function(playerIndex, input) {
    this.players[playerIndex].input(input.w, input.a, input.s, input.d);
  },

  getRandomPosition: function() {
    while (true) {
      const pos = new Position(
          1 + Math.round(Math.random() * (engine.worldWidth - 3)),
          1 + Math.round(Math.random() * (engine.worldHeight - 3)),
      );
      let occupied = false;

      this.walls.forEach(
          function(wall) {
            occupied = occupied || wall.collidesWith(pos);
          }, this,
      );

      if (!occupied) {
        return pos;
      }
    }
  },

  tick: function() {
    const now = Date.now();
    const dt = this.lastTick != null ? (now - this.lastTick) / 1000.0 : 0;


    this.players.forEach(
        function(player) {
          const collectedTopsFlops = player.collect(this.topsFlops);
          collectedTopsFlops.forEach(
              function(topFlop) {
                const topFlopIndex = this.topsFlops.indexOf(topFlop);
                const type = this.topsFlops[topFlopIndex].topFlop();
                const pos = this.getRandomPosition();
                const that = this;
                this.topsFlops.splice(topFlopIndex, 1);
                setTimeout(function() {
                  that.topsFlops.push(engine.makeTopFlop(pos.x, pos.y, type));
                }, 2000);
              },
              this,
          );

          player.move(dt, this.walls);
        },
        this,
    );

    this.topsFlops.forEach(
        function(topFlop) {
          topFlop.randomize();
          topFlop.move(dt, this.walls);
        },
        this,
    );

    this.lastTick = now;

    this.timer += dt;
  },

  getState: function() {
    const getState = function(el) {
      return el.getState();
    };
    return {
      players: this.players.map(getState),
      walls: this.walls.map(getState),
      topsFlops: this.topsFlops.map(getState),
      timer: this.timer,
    };
  },
};

/**
 * Make a game object.
 * @return {Object}
 */
function makeGame() {
  const walls = [];
  const topsFlops = [];

  const gameProperties = {
    players: {
      value: [],
    },
    walls: {
      value: walls,
    },
    topsFlops: {
      value: topsFlops,
    },
    lastTick: {
      value: null,
      writable: true,
    },
    timer: {
      value: 0,
      writable: true,
    },
  };

  const game = Object.create(gamePrototype, gameProperties);

  for (let i = 0; i < 8; i++) {
    walls.push(engine.makeWall(7, i + 10));
    walls.push(engine.makeWall(15, i));
    walls.push(engine.makeWall(23, i + 10));
  }

  for (let i = 0; i < 8; ++i) {
    const pos = game.getRandomPosition();
    topsFlops.push(engine.makeTopFlop(pos.x, pos.y, 'top'));
    topsFlops.push(engine.makeTopFlop(pos.x, pos.y, 'flop'));
  }

  return game;
}

exports.makeGame = makeGame;
