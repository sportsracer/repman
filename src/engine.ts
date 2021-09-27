const Trait = require('traits.js');

import Position from './position';
import Rectangle from './rectangle';

const playerMoveSpeed = 4;
const playerTurnSpeed = Math.PI;
const wallDimensions = new Position(1, 1);
const topFlopCollectDistance = 1;

type TTrait = typeof Trait;

// state

const TStateful = Trait({
  get: Trait.required,
  set: Trait.required,
  getState: Trait.required,
});

/**
 * Construct a stateful trait, with getters and setters for individual properties. All game objects must store their
 * state using this trait so that it can be serialized between client and server.
 */
function makeState(state: {[property: string]: any}): TTrait {
  return Trait({
    get(property: string) {
      return state[property];
    },
    set(property: string, value: any) {
      state[property] = value;
    },
    getState() {
      return state;
    },
  });
}

/**
 * Helper method for adding a combined getter & setter method to a stateful trait.
 * @param property Name of the property
 * @param defaultValue Default value which will be returned until a different value is set
 * @return Trait with combined getter & setter method which takes either no (getter) or one (setter) argument
 */
function hasProperty(property: string, defaultValue?: any): TTrait {
  return Trait.compose(
      TStateful,
      Trait({
        [property](value: any): any {
          if (value === undefined) {
            value = this.get(property);
            return value !== undefined ? value : defaultValue;
          }
          return this.set(property, value);
        },
      }),
  );
}

// traits

interface IHasPosition {
  pos(): Position;
}

const THasPosition = Trait.compose(
    TStateful,
    hasProperty('pos'),
);

interface IMovable extends IHasPosition {
  move(delta: number, gameBounds?: Rectangle, walls?: IWall[]): void;
}

const TMovable = Trait.compose(
    THasPosition,
    hasProperty('angle', 0),
    hasProperty('colliding', false),
    hasProperty('moveSpeed', 0),
    hasProperty('turnSpeed', 0),
    Trait({
      /**
       * Move and rotate this object, unless it would leave the game area or collide with a wall in the new position.
       */
      move(delta: number, gameBounds?: Rectangle, walls?: IWall[]) {
        const moveDirection = Position.fromAngle(this.angle());
        const moveDistance = this.moveSpeed() * delta;
        const newPos = this.pos().add(moveDirection.scale(moveDistance));

        // check for collisions
        const outOfGame = gameBounds !== undefined && !gameBounds.contains(newPos);
        walls ||= [];
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

interface IControllableWithWasd extends IMovable {
  input(w: boolean, a: boolean, s: boolean, d: boolean): void;
}

const TControllableWithWasd = Trait(
    {
      moveSpeed: Trait.required,
      turnSpeed: Trait.required,
      /**
       * Adjust move and turn speed based on state of arrow keys.
       */
      input(w: boolean, a: boolean, s: boolean, d: boolean) {
        const move = Number(w);
        const turn = Number(d) - Number(a);
        this.moveSpeed(move * playerMoveSpeed);
        this.turnSpeed(turn * playerTurnSpeed);
      },
    },
);

// objects

export interface IWall extends IHasPosition {
  collidesWith(otherPos: Position): boolean;
};

const TWall = Trait.compose(
    THasPosition,
    Trait({
      /**
       * Determine whether a point collides with this wall.
       */
      collidesWith(otherPos: Position): boolean {
        const pos = this.pos();
        const bounds = new Rectangle(pos, pos.add(wallDimensions));
        return bounds.contains(otherPos);
      },
    }),
);

export enum TopFlopType {
  TOP = 'top',
  FLOP = 'flop',
}

export interface ITopFlop extends IMovable {
  randomize(): void;
  topFlop(): TopFlopType;
};

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

export interface IPlayer extends IControllableWithWasd {
  name(): string;
  points(): number;
  collect(topsFlops: ITopFlop[]): ITopFlop[];
};

const TPlayer = Trait.compose(
    TMovable,
    TControllableWithWasd,
    hasProperty('name'),
    hasProperty('points', 0),
    Trait({
      /**
       * Collect tops and/or flops that are close to this player, and adjust points accordingly.
       */
      collect(topsFlops: ITopFlop[]): ITopFlop[] {
        return topsFlops.filter(
            (topFlop) => this.pos().distanceTo(topFlop.pos()) <= topFlopCollectDistance,
        ).map(
            (topFlop) => {
              const inc = topFlop.topFlop() === TopFlopType.TOP ? 1 : -1;
              this.points(this.points() + inc);
              console.log('%s now has %d points', this.name(), this.points());
              return topFlop;
            },
        );
      },
    }),
);

// engine object constructors

/**
 * Make a wall.
 */
export function makeWall(x: number, y: number): IWall {
  const pos = new Position(x, y);
  return Trait.create(Object.prototype, Trait.compose(makeState({pos}), TWall));
}

/**
 * Make a top/flop object.
 */
export function makeTopFlop(x: number, y: number, topFlop: TopFlopType): ITopFlop {
  const pos = new Position(x, y);
  const angle = Math.random() * Math.PI * 2;
  return Trait.create(Object.prototype, Trait.compose(makeState({pos, angle, topFlop}), TTopFlop));
}

/**
 * Make a player.
 */
export function makePlayer(x: number, y: number, name: string) : IPlayer {
  const pos = new Position(x, y);
  return Trait.create(Object.prototype, Trait.compose(makeState({pos, name}), TPlayer));
}
