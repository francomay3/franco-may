import { topPercent } from './rating';

describe('topPercent', () => {
  const scores = Array.from({ length: 200 }, (_, i) => i);

  it('puts the best video at the top 1%, not 0%', () => {
    expect(topPercent(scores, 199)).toBe(1);
  });

  it('counts the videos rated higher', () => {
    // 20 of 200 are rated higher: this one is 21st, within the top 11%.
    expect(topPercent(scores, 179)).toBe(11);
    expect(topPercent(scores, 0)).toBe(100);
  });

  it('gives tied videos the best place they could take', () => {
    expect(topPercent([5, 5, 5, 1], 5)).toBe(25);
    expect(topPercent([5, 5, 5, 1], 1)).toBe(100);
  });

  it('copes with no videos', () => {
    expect(topPercent([], 3)).toBe(100);
  });
});
