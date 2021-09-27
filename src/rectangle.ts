import Position from './position';

/**
 * Axis-aligned rectangle.
 */
export default class Rectangle {
  /**
   * Create a rectangle by defining its top-left and bottom-right corners.
   */
  constructor(public topLeft: Position, public bottomRight: Position) {}

  /**
   * Check whether a point is contained within this rectangle.
   */
  contains(pos: Position): boolean {
    return pos.x >= this.topLeft.x && pos.y >= this.topLeft.y &&
      pos.x <= this.bottomRight.x && pos.y <= this.bottomRight.y;
  }

  /**
   * Construct a rectangle extending from (0, 0) to (bottomRightX, bottomRightY)
   */
  static fromOrigin(bottomRightX: number, bottomRightY: number): Rectangle {
    return new Rectangle(Position.origin(), new Position(bottomRightX, bottomRightY));
  }
}
