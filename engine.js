/* eslint no-invalid-this: ["off"] */

const Trait = require('traits.js');

const moveSpeedFactor = 4;
const turnSpeedFactor = Math.PI;
const worldWidth = 32;
const worldHeight = 18;

// state

/**
 * Construct a stateful trait, with getters and setters for individual properties.
 * @param {Object} state Initial state
 * @return {Trait}
 */
function makeState(state) {
  return Trait(
      {
        get: function(property) {
          return state[property];
        },
        set: function(property, value) {
          state[property] = value;
        },
        getState: function() {
          return state;
        },
      },
  );
}

/**
 * Helper method for adding a combined getter & setter method to a stateful trait.
 * @param {String} property Name of the property
 * @param {Object} defaultValue Default value which will be returned until a different value is set
 * @return {function} Combined getter & setter method which takes either no (getter) or one (setter) argument
 */
function getterSetter(property, defaultValue) {
  return function(value) {
    if (typeof(value) == 'undefined') {
      value = this.get(property);
      return typeof(value) != 'undefined' ?
        value :
        defaultValue;
    }
    return this.set(property, value);
  };
}

// traits

const TPosition = Trait(
    {
      get: Trait.required,
      set: Trait.required,
      x: getterSetter('x', 0),
      y: getterSetter('y', 0),
      angle: getterSetter('angle', 0),
    },
);

const TPhysics = Trait(
    {
      get: Trait.required,
      set: Trait.required,
      angle: Trait.required,
      colliding: getterSetter('colliding', false),
      moveSpeed: getterSetter('moveSpeed', 0),
      turnSpeed: getterSetter('turnSpeed', 0),
      move: function(delta, walls) {
        const newX = this.x() + this.moveSpeed() * Math.cos(this.angle()) * delta;
        const newY = this.y() + this.moveSpeed() * Math.sin(this.angle()) * delta;

        // check for collisions

        const outOfGame = newX < 0 || newY < 0 || newX > (worldWidth - 1) || newY > (worldHeight - 1);

        this.colliding(
            walls.reduce(
                function(colliding, wall) {
                  return colliding || (Math.round(newX) === Math.round(wall.x()) &&
                     Math.round(newY) === Math.round(wall.y())
                  );
                },
                outOfGame,
            ),
        );

        // only move object if it wouldn't be colliding in the new position
        if (!this.colliding()) {
          this.x(newX); this.y(newY);
        }

        this.angle(this.angle() + this.turnSpeed() * delta);
      },
    },
);

const TWasd = Trait(
    {
      moveSpeed: Trait.required,
      turnSpeed: Trait.required,
      input: function(w, a, s, d) {
        const move = Number(w);
        const turn = Number(d) - Number(a);
        this.moveSpeed(move * moveSpeedFactor);
        this.turnSpeed(turn * turnSpeedFactor);
      },
    },
);

const TTopFlop = Trait(
    {
      get: Trait.required,
      set: Trait.required,
      angle: Trait.required,
      moveSpeed: Trait.required,
      turnSpeed: Trait.required,
      topFlop: getterSetter('topFlop'),
      randomize: function() {
        if (this.colliding()) {
          this.angle(this.angle() + Math.PI * 3 / 4 + 0.5 * Math.random() * Math.PI);
        }
        let seed = Date.now() % 1000000;
        seed = seed * seed;
        this.moveSpeed(0.5);
        this.turnSpeed(Math.sin(seed / 1000));
      },
    },
);

/**
 * Calculate distance between points (x1, y1) and (x2, y2)
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @return {number}
 */
function getDistance(x1, y1, x2, y2) {
  const x = x2 - x1;
  const y = y2 - y1;
  return Math.sqrt(x * x + y * y);
}

const TPlayer = Trait(
    {
      get: Trait.required,
      set: Trait.required,
      x: Trait.required,
      y: Trait.required,
      index: getterSetter('index'),
      name: getterSetter('name'),
      points: getterSetter('points', 0),
      collect: function(topsFlops) {
        return topsFlops.filter(
            function(topFlop) {
              return getDistance(this.x(), this.y(), topFlop.x(), topFlop.y()) <= 1;
            },
            this,
        ).map(
            function(topFlop) {
              const inc = topFlop.topFlop() === 'top' ? 1 : -1;
              this.points(this.points() + inc);
              console.log('Player', this.index(), 'now has', this.points(), 'points');
              return topFlop;
            },
            this,
        );
      },
    },
);

// engine object constructors

/**
 * Make a player object.
 * @param {Object} state Player state including x, y, points, index & name properties
 * @return {Object}
 */
function makePlayer(state) {
  return Trait.create(
      Object.prototype,
      Trait.compose(makeState(state), TPosition, TPhysics, TWasd, TPlayer),
  );
}

/**
 * Make a wall.
 * @param {Object} state Wall state including x & y properties
 * @return {Object}
 */
function makeWall(state) {
  return Trait.create(
      Object.prototype,
      Trait.compose(makeState(state), TPosition),
  );
}

/**
 * Create top/flop object.
 * @param {Object} state Top/flop state including x, y and topFlop property
 * @return {Object}
 */
function makeTopFlop(state) {
  state.angle = Math.random() * Math.PI * 2;
  return Trait.create(
      Object.prototype,
      Trait.compose(makeState(state), TPosition, TPhysics, TTopFlop),
  );
}

exports.makePlayer = makePlayer;
exports.makeWall = makeWall;
exports.makeTopFlop = makeTopFlop;
exports.worldWidth = worldWidth;
exports.worldHeight = worldHeight;
