const Position = require('../position');

describe('Position', () => {
  it('can be added to another position', () => {
    const pos1 = new Position(1, 3);
    const pos2 = new Position(5, 7);

    const posAdded = pos1.add(pos2);

    expect(posAdded.x).toBeCloseTo(6);
    expect(posAdded.y).toBeCloseTo(10);
  });

  it('can be scaled by a factor', () => {
    const pos = new Position(4, 4.5);

    const posScaled = pos.scale(-2);

    expect(posScaled.x).toBeCloseTo(-8);
    expect(posScaled.y).toBeCloseTo(-9);
  });

  it('can be constructed from an angle', () => {
    const posZero = Position.fromAngle(0);
    const posHalfPi = Position.fromAngle(Math.PI / 2);

    expect(posZero.x).toBeCloseTo(1);
    expect(posZero.y).toBeCloseTo(0);

    expect(posHalfPi.x).toBeCloseTo(0);
    expect(posHalfPi.y).toBeCloseTo(1);
  });

  it('can calculate its distance to another position', () => {
    const origin = Position.origin();
    const pos11 = new Position(1, 1);

    const distance = origin.distanceTo(pos11);

    expect(distance).toBeCloseTo(Math.SQRT2);
  });
});
