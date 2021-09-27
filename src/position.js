/**
 * Two-dimensional position in game.
 */
export default class Position {
  /**
   * @param {Number} x
   * @param {Number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Position (0, 0)
   * @return {Position}
   */
  static origin() {
    return new Position(0, 0);
  }

  /**
   * Return a new position from adding `other` to this one.
   * @param {Position} other
   * @return {Position}
   */
  add(other) {
    return new Position(
        this.x + other.x,
        this.y + other.y,
    );
  }

  /**
   * Return a new position from scaling this one by `scalar`.
   * @param {Number} factor
   * @return {Position}
   */
  scale(factor) {
    return new Position(
        this.x * factor,
        this.y * factor,
    );
  }

  /**
   * Construct a position of unit length using `angle`.
   * @param {Number} angle
   * @return {Position}
   */
  static fromAngle(angle) {
    return new Position(
        Math.cos(angle),
        Math.sin(angle),
    );
  }

  /**
   * Calculate distance from this to other position.
   * @param {Position} other
   * @return {Number}
   */
  distanceTo(other) {
    const x = other.x - this.x;
    const y = other.y - this.y;
    return Math.sqrt(x * x + y * y);
  }
}
