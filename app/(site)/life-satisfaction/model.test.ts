import {
  interpretation,
  LIFE_ITEMS,
  readingBand,
  scoreLifeSatisfaction,
} from './model';

describe('scoreLifeSatisfaction', () => {
  it('sits at 50 when every answer is the midpoint', () => {
    const score = scoreLifeSatisfaction(LIFE_ITEMS.map(() => 3));
    expect(score.index).toBe(50);
  });

  it('reaches 100 when answers line up with the correlations', () => {
    const ratings = LIFE_ITEMS.map(item => (item.r > 0 ? 5 : 1));
    expect(scoreLifeSatisfaction(ratings).index).toBe(100);
  });

  it('reaches 0 when answers run against the correlations', () => {
    const ratings = LIFE_ITEMS.map(item => (item.r > 0 ? 1 : 5));
    expect(scoreLifeSatisfaction(ratings).index).toBe(0);
  });

  it('keeps 69 in the fairly-satisfied band', () => {
    expect(interpretation(69).label).toBe('Fairly satisfied');
  });

  it('gives a small reading band, not a second score', () => {
    const band = readingBand(LIFE_ITEMS.map(() => 5));
    expect(band).toBeGreaterThanOrEqual(2);
    expect(band).toBeLessThan(15);
  });

  it('lets a stronger correlation move the index more than a weaker one', () => {
    const strong = scoreLifeSatisfaction(
      [5, 3],
      [
        { id: 'a', text: 'A', r: 0.6 },
        { id: 'b', text: 'B', r: 0.2 },
      ]
    );
    const weak = scoreLifeSatisfaction(
      [3, 5],
      [
        { id: 'a', text: 'A', r: 0.6 },
        { id: 'b', text: 'B', r: 0.2 },
      ]
    );
    expect(strong.index).toBeGreaterThan(weak.index);
  });
});
