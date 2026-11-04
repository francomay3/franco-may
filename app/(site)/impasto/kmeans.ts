export type Cluster = { center: number[]; size: number };

const distance = (a: number[], b: number[]) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/** k-means with k-means++ starting points. Biggest cluster first. */
export function kmeans(
  points: number[][],
  wanted: number,
  iterations = 25
): Cluster[] {
  if (points.length === 0) {
    return [];
  }
  const k = Math.min(wanted, points.length);

  const centers: number[][] = [
    points[Math.floor(Math.random() * points.length)],
  ];
  while (centers.length < k) {
    const weights = points.map(p =>
      Math.min(...centers.map(c => distance(p, c)))
    );
    const total = weights.reduce((a, b) => a + b, 0);
    if (total === 0) {
      break;
    }
    let pick = Math.random() * total;
    let index = 0;
    while (pick > weights[index] && index < points.length - 1) {
      pick -= weights[index];
      index++;
    }
    centers.push(points[index]);
  }

  const assignment = new Array<number>(points.length).fill(0);
  for (let iteration = 0; iteration < iterations; iteration++) {
    let moved = false;
    points.forEach((p, i) => {
      let best = 0;
      let bestDistance = Infinity;
      centers.forEach((c, j) => {
        const d = distance(p, c);
        if (d < bestDistance) {
          bestDistance = d;
          best = j;
        }
      });
      if (assignment[i] !== best) {
        assignment[i] = best;
        moved = true;
      }
    });
    if (!moved && iteration > 0) {
      break;
    }

    const sums = centers.map(() => [0, 0, 0, 0]);
    points.forEach((p, i) => {
      const s = sums[assignment[i]];
      s[0] += p[0];
      s[1] += p[1];
      s[2] += p[2];
      s[3]++;
    });
    sums.forEach((s, j) => {
      if (s[3] > 0) {
        centers[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
      }
    });
  }

  const sizes = centers.map(() => 0);
  assignment.forEach(j => sizes[j]++);
  return centers
    .map((center, j) => ({ center, size: sizes[j] }))
    .filter(c => c.size > 0)
    .sort((a, b) => b.size - a.size);
}
