const Position = require('../position');
const Rectangle = require('../rectangle');

describe('Rectangle', () => {
  it('can check whether it contains a point', () => {
    const rect = new Rectangle(1, 1, 4, 2);

    expect(rect.contains(new Position(1, 1)));
    expect(rect.contains(new Position(2, 2)));

    expect(rect.contains(new Position(0, 0))).not;
    expect(rect.contains(new Position(4, 3))).not;
  });
});
