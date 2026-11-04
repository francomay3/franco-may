/** Same physics as gravity-grid-pixijs, on flat arrays instead of objects. */

export const G = 0.01;
const DENSITY = 10000;
const MIN_MASS = 50000;
const MAX_MASS = 100000;
export const GALAXY_RADIUS = 300;

const PALETTE: [number, number, number][] = [
  [0x36, 0xff, 0x33],
  [0xff, 0x33, 0xf9],
  [0xff, 0x37, 0x37],
  [0xe3, 0xff, 0x45],
  [0xff, 0xb9, 0x55],
  [0x55, 0xf7, 0xff],
];

export type Galaxy = {
  count: number;
  /** 1 holds the galaxy together, above 1 it flies apart, below 1 it collapses. */
  speed: number;
  /** Random extra velocity. */
  temperature: number;
};

const between = (min: number, max: number) => min + Math.random() * (max - min);

const radiusOf = (mass: number) =>
  Math.cbrt((3 * mass) / (4 * Math.PI * DENSITY));

export class Simulation {
  n = 0;
  x: number[] = [];
  y: number[] = [];
  vx: number[] = [];
  vy: number[] = [];
  mass: number[] = [];
  /** Colors as r, g, b. */
  color: [number, number, number][] = [];

  constructor(galaxy: Galaxy) {
    const galaxyMass = (MIN_MASS + MAX_MASS / 2) * galaxy.count;
    for (let i = 0; i < galaxy.count; i++) {
      // A random point in a rotated square, as the original does.
      const angle = between(0, 2 * Math.PI);
      const ux = between(-GALAXY_RADIUS, GALAXY_RADIUS);
      const uy = between(-GALAXY_RADIUS, GALAXY_RADIUS);
      const px = ux * Math.cos(angle) - uy * Math.sin(angle);
      const py = ux * Math.sin(angle) + uy * Math.cos(angle);
      const r = Math.hypot(px, py) || 1;

      // The mass inside radius r grows with r^3, which gives the orbital speed.
      const inside = galaxyMass * (r / GALAXY_RADIUS) ** 3;
      const orbital = Math.sqrt((G * inside) / r) * galaxy.speed;
      const heat = between(0, 2 * Math.PI);
      const t = between(-galaxy.temperature, galaxy.temperature);
      const t2 = between(-galaxy.temperature, galaxy.temperature);

      this.x.push(px);
      this.y.push(py);
      this.vx.push(
        (orbital * -py) / r + t * Math.cos(heat) - t2 * Math.sin(heat)
      );
      this.vy.push(
        (orbital * px) / r + t * Math.sin(heat) + t2 * Math.cos(heat)
      );
      this.mass.push(between(MIN_MASS, MAX_MASS));
      this.color.push(
        PALETTE[
          Math.min(
            Math.floor((r / GALAXY_RADIUS) * PALETTE.length),
            PALETTE.length - 1
          )
        ]
      );
    }
    this.n = galaxy.count;
  }

  radius(i: number) {
    return radiusOf(this.mass[i]);
  }

  step(dt: number) {
    const { n, x, y, vx, vy, mass } = this;
    const ax = new Float64Array(n);
    const ay = new Float64Array(n);
    const dead = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      if (dead[i]) {
        continue;
      }
      for (let j = i + 1; j < n; j++) {
        if (dead[j]) {
          continue;
        }
        const dx = x[j] - x[i];
        const dy = y[j] - y[i];
        const dist = Math.hypot(dx, dy);

        if (dist < radiusOf(mass[i]) + radiusOf(mass[j])) {
          // Merge i into j, keeping momentum and the center of mass.
          const total = mass[i] + mass[j];
          vx[j] = (vx[i] * mass[i] + vx[j] * mass[j]) / total;
          vy[j] = (vy[i] * mass[i] + vy[j] * mass[j]) / total;
          x[j] = (x[i] * mass[i] + x[j] * mass[j]) / total;
          y[j] = (y[i] * mass[i] + y[j] * mass[j]) / total;
          const wi = mass[i] / total;
          const ci = this.color[i];
          const cj = this.color[j];
          this.color[j] = [
            ci[0] * wi + cj[0] * (1 - wi),
            ci[1] * wi + cj[1] * (1 - wi),
            ci[2] * wi + cj[2] * (1 - wi),
          ];
          mass[j] = total;
          dead[i] = 1;
          break;
        }

        const f = (G * mass[i] * mass[j]) / (dist * dist);
        const fx = (f * dx) / dist;
        const fy = (f * dy) / dist;
        ax[i] += fx / mass[i];
        ay[i] += fy / mass[i];
        ax[j] -= fx / mass[j];
        ay[j] -= fy / mass[j];
      }
    }

    let alive = 0;
    for (let i = 0; i < n; i++) {
      if (dead[i]) {
        continue;
      }
      vx[i] += ax[i] * dt;
      vy[i] += ay[i] * dt;
      x[alive] = x[i] + vx[i] * dt;
      y[alive] = y[i] + vy[i] * dt;
      vx[alive] = vx[i];
      vy[alive] = vy[i];
      mass[alive] = mass[i];
      this.color[alive] = this.color[i];
      alive++;
    }
    this.n = alive;
    for (const list of [x, y, vx, vy, mass]) {
      list.length = alive;
    }
    this.color.length = alive;
  }
}
