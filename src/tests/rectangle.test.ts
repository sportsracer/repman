import Position from '../position';
import Rectangle from '../rectangle';

describe('Rectangle', () => {
  const rect = new Rectangle(new Position(1, 1), new Position(4, 2));

  test.each`
  x      | y      | contained
  ${1}   | ${1}   | ${true}
  ${2.5} | ${1.5} | ${true}
  ${4}   | ${2}   | ${true}
  ${0}   | ${1.5} | ${false}
  ${-1}  | ${-1}  | ${false}
  `(
      'contains ($x, $y)? => $contained',
      ({x, y, contained}) => {
        expect(rect.contains(new Position(x, y))).toBe(contained);
      },
  );
});
