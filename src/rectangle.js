const Position = require('./position');

/**
 * Axis-aligned rectangle defined by its top-left and bottom-right corners.
 */
class Rectangle {
  /**
   * @param {Position} topLeft
   * @param {Position} bottomRight
   */
  constructor(topLeft, bottomRight) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
  }

  /**
   * Check whether a point is contained within this rectangle.
   * @param {Position} pos
   * @return {Boolean}
   */
  contains(pos) {
    return pos.x >= this.topLeft.x && pos.y >= this.topLeft.y &&
      pos.x <= this.bottomRight.x && pos.y <= this.bottomRight.y;
  }

  /**
   * Construct a rectangle extending from (0, 0) to (bottomRightX, bottomRightY)
   * @param {Number} bottomRightX
   * @param {Number} bottomRightY
   * @return {Rectangle}
   */
  static fromOrigin(bottomRightX, bottomRightY) {
    return new Rectangle(Position.origin(), new Position(bottomRightX, bottomRightY));
  }
}

module.exports = Rectangle;
