import { deltaE2000, rgbToLab } from './color';
import { kmeans } from './kmeans';
import { PIGMENTS, findRecipe } from './mixer';

describe('deltaE2000', () => {
  it('matches a reference pair from Sharma et al.', () => {
    const d = deltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485]);
    expect(d).toBeCloseTo(2.0425, 3);
  });

  it('is zero for the same color', () => {
    const lab = rgbToLab([120, 30, 200]);
    expect(deltaE2000(lab, lab)).toBe(0);
  });
});

describe('kmeans', () => {
  it('finds two obvious groups, biggest first', () => {
    const points = [
      ...Array.from({ length: 30 }, () => [250, 0, 0]),
      ...Array.from({ length: 10 }, () => [0, 0, 250]),
    ];
    const clusters = kmeans(points, 2);
    expect(clusters.map(c => c.size)).toEqual([30, 10]);
    expect(clusters[0].center[0]).toBeCloseTo(250);
  });
});

describe('findRecipe', () => {
  it('uses a single pigment when the target is that pigment', () => {
    const recipe = findRecipe(PIGMENTS[2].rgb);
    expect(recipe.parts).toHaveLength(1);
    expect(recipe.parts[0].name).toBe('Cadmium Yellow');
  });

  it('mixes yellow and blue into something green', () => {
    const recipe = findRecipe([60, 140, 60]);
    expect(recipe.parts.length).toBeGreaterThan(1);
    expect(recipe.delta).toBeLessThan(12);
  });
});
