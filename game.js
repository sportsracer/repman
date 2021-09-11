const engine = require('./engine');

// game object

const gamePrototype = {

  addPlayer: function(name) {
    const pos = this.getRandomPosition();
    const player = engine.makePlayer(
        {
          x: pos.x,
          y: pos.y,
          points: 0,
          index: this.players.length,
          name: name,
        },
    );
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
      const x = 1 + Math.round(Math.random() * (engine.worldWidth - 3));
      const y = 1 + Math.round(Math.random() * (engine.worldHeight - 3));
      let occupied = false;

      this.walls.forEach(
          function(wall) {
            occupied = occupied || wall.x() === x && wall.y() === y;
          }, this,
      );

      if (!occupied) {
        return {x: x, y: y};
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
                  that.topsFlops.push(engine.makeTopFlop({x: pos.x, y: pos.y, topFlop: type}));
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
    walls.push(engine.makeWall({x: 7, y: i + 10}));
    walls.push(engine.makeWall({x: 15, y: i}));
    walls.push(engine.makeWall({x: 23, y: i + 10}));
  }

  for (let i = 0; i < 8; ++i) {
    const pos = game.getRandomPosition();
    topsFlops.push(engine.makeTopFlop({x: pos.x, y: pos.y, topFlop: 'top'}));
    topsFlops.push(engine.makeTopFlop({x: pos.x, y: pos.y, topFlop: 'flop'}));
  }

  return game;
}

exports.makeGame = makeGame;