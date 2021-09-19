const Trait = require('traits.js');

const Position = require('./position');

const playerMoveSpeed = 4;
const playerTurnSpeed = Math.PI;
const topFlopCollectDistance = 1;

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
    hasProperty('pos'),
);

const TMovable = Trait.compose(
    THasPosition,
    hasProperty('angle', 0),
    hasProperty('colliding', false),
    hasProperty('moveSpeed', 0),
    hasProperty('turnSpeed', 0),
    Trait({
      /**
       * Move and rotate this object, unless it would leave the game area or collide with a wall in the new position.
       * @param {Number} delta
       * @param {Rectangle} gameBounds
       * @param {Object[]} walls
       */
      move(delta, gameBounds=null, walls=[]) {
        const moveDirection = Position.fromAngle(this.angle());
        const moveDistance = this.moveSpeed() * delta;
        const newPos = this.pos().add(moveDirection.scale(moveDistance));

        // check for collisions
        const outOfGame = gameBounds !== null && !gameBounds.contains(newPos);
        this.colliding(
            walls.reduce(
                (colliding, wall) => colliding || wall.collidesWith(newPos),
                outOfGame,
            ),
        );

        // only move object if it wouldn't be colliding in the new position
        if (!this.colliding()) {
          this.pos(newPos);
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
     * @param {Position} pos
     * @return {Boolean}
     */
      collidesWith(pos) {
        return Math.round(pos.x) === Math.round(this.pos().x) && Math.round(pos.y) === Math.round(this.pos().y);
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

const TPlayer = Trait.compose(
    TMovable,
    TControllableWithWasd,
    hasProperty('index'),
    hasProperty('name'),
    hasProperty('points', 0),
    Trait({
      /**
       * Collect tops and/or flops that are close to this player, and adjust points accordingly.
       * @param {Object[]} topsFlops
       * @return {Object[]} The tops & flops which were collected.
       */
      collect(topsFlops) {
        return topsFlops.filter(
            (topFlop) => this.pos().distanceTo(topFlop.pos()) <= topFlopCollectDistance,
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
  const pos = new Position(x, y);
  return Trait.create(Object.prototype, Trait.compose(makeState({pos}), TWall));
}

/**
 * Make a top/flop object.
 * @param {Number} x
 * @param {Number} y
 * @param {String} topFlop Either 'top' or 'flop'
 * @return {Object}
 */
function makeTopFlop(x, y, topFlop) {
  const pos = new Position(x, y);
  const angle = Math.random() * Math.PI * 2;
  return Trait.create(Object.prototype, Trait.compose(makeState({pos, angle, topFlop}), TTopFlop));
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
  const pos = new Position(x, y);
  return Trait.create(Object.prototype, Trait.compose(makeState({pos, index, name}), TPlayer));
}

exports.makePlayer = makePlayer;
exports.makeWall = makeWall;
exports.makeTopFlop = makeTopFlop;
