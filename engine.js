const Trait = require('traits.js');

const playerMoveSpeed = 4;
const playerTurnSpeed = Math.PI;
const topFlopCollectDistance = 1;
const worldWidth = 32;
const worldHeight = 18;

// state

const TStateful = Trait({
  get: Trait.required,
  set: Trait.required,
  getState: Trait.required,
});

/**
 * Construct a stateful trait, with getters and setters for individual properties. All game objects must store their
 * state using this trait so that it can be serialized between client and server.
 * @param {Object} state Initial state
 * @return {Trait}
 */
function makeState(state) {
  return Trait({
    get(property) {
      return state[property];
    },
    set(property, value) {
      state[property] = value;
    },
    getState() {
      return state;
    },
  });
}

/**
 * Helper method for adding a combined getter & setter method to a stateful trait.
 * @param {String} property Name of the property
 * @param {Object} defaultValue Default value which will be returned until a different value is set
 * @return {Trait} Trait with combined getter & setter method which takes either no (getter) or one (setter) argument
 */
function hasProperty(property, defaultValue=undefined) {
  return Trait.compose(
      TStateful,
      Trait({
        [property](value) {
          if (typeof(value) == 'undefined') {
            value = this.get(property);
            return typeof(value) != 'undefined' ? value : defaultValue;
          }
          return this.set(property, value);
        },
      }),
  );
}

// traits

const THasPosition = Trait.compose(
    TStateful,
    hasProperty('x'),
    hasProperty('y'),
);

const TMovable = Trait.compose(
    THasPosition,
    hasProperty('angle', 0),
    hasProperty('colliding', false),
    hasProperty('moveSpeed', 0),
    hasProperty('turnSpeed', 0),
    Trait({
      /**
       * Move and rotate this object, unless it would collide with a wall in the new position.
       * @param {Number} delta
       * @param {Array} walls
       */
      move(delta, walls) {
        const newX = this.x() + this.moveSpeed() * Math.cos(this.angle()) * delta;
        const newY = this.y() + this.moveSpeed() * Math.sin(this.angle()) * delta;

        // check for collisions
        const outOfGame = newX < 0 || newY < 0 || newX > (worldWidth - 1) || newY > (worldHeight - 1);

        this.colliding(
            walls.reduce(
                (colliding, wall) => colliding || wall.collidesWith(this),
                outOfGame,
            ),
        );

        // only move object if it wouldn't be colliding in the new position
        if (!this.colliding()) {
          this.x(newX); this.y(newY);
        }

        this.angle(this.angle() + this.turnSpeed() * delta);
      },
    }),
);

const TControllableWithWasd = Trait(
    {
      moveSpeed: Trait.required,
      turnSpeed: Trait.required,
      /**
       * Adjust move and turn speed based on state of arrow keys.
       * @param {Boolean} w
       * @param {Boolean} a
       * @param {Boolean} s
       * @param {Boolean} d
       */
      input(w, a, s, d) {
        const move = Number(w);
        const turn = Number(d) - Number(a);
        this.moveSpeed(move * playerMoveSpeed);
        this.turnSpeed(turn * playerTurnSpeed);
      },
    },
);

// objects

const TWall = Trait.compose(
    THasPosition,
    Trait({
    /**
     * Determine whether a point collides with this wall.
     * @param {Object} other
     * @return {Boolean}
     */
      collidesWith(other) {
        return Math.round(other.x()) === Math.round(this.x()) && Math.round(other.y()) === Math.round(this.y());
      },
    }),
);

const TTopFlop = Trait.compose(
    TMovable,
    hasProperty('topFlop'),
    Trait({
    /**
     * Randomize this object's movement and direction.
     */
      randomize() {
        if (this.colliding()) {
          this.angle(this.angle() + Math.PI * 3 / 4 + 0.5 * Math.random() * Math.PI);
        }
        let seed = Date.now() % 1000000;
        seed = seed * seed;
        this.moveSpeed(0.5);
        this.turnSpeed(Math.sin(seed / 1000));
      },
    }),
);

/**
 * Calculate distance between points (x1, y1) and (x2, y2)
 * @param {Number} x1
 * @param {Number} y1
 * @param {Number} x2
 * @param {Number} y2
 * @return {Number}
 */
function getDistance(x1, y1, x2, y2) {
  const x = x2 - x1;
  const y = y2 - y1;
  return Math.sqrt(x * x + y * y);
}

const TPlayer = Trait.compose(
    TMovable,
    TControllableWithWasd,
    hasProperty('index'),
    hasProperty('name'),
    hasProperty('points', 0),
    Trait({
      /**
       * Collect tops and/or flops that are close to this player, and adjust points accordingly.
       * @param {Array} topsFlops
       * @return {Array} The tops & flops which were collected.
       */
      collect(topsFlops) {
        return topsFlops.filter(
            (topFlop) => getDistance(this.x(), this.y(), topFlop.x(), topFlop.y()) <= topFlopCollectDistance,
            this,
        ).map(
            (topFlop) => {
              const inc = topFlop.topFlop() === 'top' ? 1 : -1;
              this.points(this.points() + inc);
              console.log('Player %d now has %d points', this.index(), this.points());
              return topFlop;
            },
            this,
        );
      },
    }),
);

// engine object constructors

/**
 * Make a wall.
 * @param {Number} x
 * @param {Number} y
 * @return {Object}
 */
function makeWall(x, y) {
  return Trait.create(Object.prototype, Trait.compose(makeState({x, y}), TWall));
}

/**
 * Make a top/flop object.
 * @param {Number} x
 * @param {Number} y
 * @param {String} topFlop Either 'top' or 'flop'
 * @return {Object}
 */
function makeTopFlop(x, y, topFlop) {
  const angle = Math.random() * Math.PI * 2;
  return Trait.create(Object.prototype, Trait.compose(makeState({x, y, angle, topFlop}), TTopFlop));
}

/**
 * Make a player.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} index
 * @param {String} name
 * @return {Object}
 */
function makePlayer(x, y, index, name) {
  return Trait.create(Object.prototype, Trait.compose(makeState({x, y, index, name}), TPlayer));
}

exports.makePlayer = makePlayer;
exports.makeWall = makeWall;
exports.makeTopFlop = makeTopFlop;
exports.worldWidth = worldWidth;
exports.worldHeight = worldHeight;
