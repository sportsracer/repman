/**
 * Two-dimensional position in game.
 */
export default class Position {
  /**
   * Create a new position from x and y coordinates.
   */
  constructor(public x: number, public y: number) {}

  /**
   * Create position (0, 0).
   */
  static origin(): Position {
    return new Position(0, 0);
  }

  /**
   * Return a new position from adding `other` to this one.
   */
  add(other: Position): Position {
    return new Position(
        this.x + other.x,
        this.y + other.y,
    );
  }

  /**
   * Return a new position from scaling this one by `factor`.
   */
  scale(factor: number): Position {
    return new Position(
        this.x * factor,
        this.y * factor,
    );
  }

  /**
   * Construct a position of unit length using `angle`.
   */
  static fromAngle(angle: number): Position {
    return new Position(
        Math.cos(angle),
        Math.sin(angle),
    );
  }

  /**
   * Calculate distance from this to other position.
   */
  distanceTo(other: Position): number {
    const x = other.x - this.x;
    const y = other.y - this.y;
    return Math.sqrt(x * x + y * y);
  }
}
