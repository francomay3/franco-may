import {
  indexLabel,
  type LifeScore,
  movers,
  USUAL_LIFE_SATISFACTION,
} from './model';

const WIDTH = 1080;
const HEIGHT = 1350;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function bar(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: number,
  max: number,
  y: number,
  color: string
) {
  const width = Math.max(8, (Math.abs(value) / max) * 420);
  ctx.fillStyle = '#5c564c';
  ctx.font = '28px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, 96, y + 28, 460);
  ctx.fillStyle = color;
  roundRect(ctx, 580, y + 4, width, 28, 8);
  ctx.fill();
}

export function drawShareCard(score: LifeScore) {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not available');
  }

  ctx.fillStyle = '#f6f1e7';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#1c1915';
  ctx.font = '600 34px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Life satisfaction index', 96, 120);

  ctx.font = '700 148px Georgia, serif';
  ctx.fillText(score.index.toFixed(0), 96, 290);
  ctx.font = '40px Georgia, serif';
  ctx.fillStyle = '#6b6458';
  ctx.fillText(indexLabel(score.index), 360, 270);

  drawCurve(ctx, score.index);

  ctx.fillStyle = '#1c1915';
  ctx.font = '32px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('What moved it', 96, 620);

  const { up, down } = movers(score, 3);
  const max = Math.max(
    ...[...up, ...down].map(item => Math.abs(item.contribution)),
    0.01
  );

  up.forEach((item, index) => {
    bar(ctx, item.text, item.contribution, max, 660 + index * 72, '#1f4fd8');
  });
  down.forEach((item, index) => {
    bar(ctx, item.text, item.contribution, max, 960 + index * 72, '#b42318');
  });

  ctx.fillStyle = '#8a8378';
  ctx.font = '26px Georgia, serif';
  ctx.fillText('franco-may.com/life-satisfaction', 96, 1280);

  return canvas;
}

function drawCurve(ctx: CanvasRenderingContext2D, index: number) {
  const left = 96;
  const right = 984;
  const baseline = 500;
  const mean = USUAL_LIFE_SATISFACTION;
  const sd = 14;
  const xOf = (value: number) => left + (value / 100) * (right - left);
  const density = (value: number) =>
    Math.exp(-0.5 * ((value - mean) / sd) ** 2);
  const peak = density(mean);
  const yOf = (value: number) => baseline - (density(value) / peak) * 140;

  ctx.beginPath();
  for (let value = 0; value <= 100; value += 1) {
    const x = xOf(value);
    const y = yOf(value);
    if (value === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.lineTo(xOf(100), baseline);
  ctx.lineTo(xOf(0), baseline);
  ctx.closePath();
  ctx.fillStyle = '#d7e4ff';
  ctx.fill();

  ctx.beginPath();
  for (let value = 0; value <= 100; value += 1) {
    const x = xOf(value);
    const y = yOf(value);
    if (value === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = '#1f4fd8';
  ctx.lineWidth = 4;
  ctx.stroke();

  const youX = xOf(index);
  ctx.beginPath();
  ctx.moveTo(youX, 340);
  ctx.lineTo(youX, baseline);
  ctx.strokeStyle = '#1c1915';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(youX, yOf(index), 8, 0, Math.PI * 2);
  ctx.fillStyle = '#1c1915';
  ctx.fill();

  ctx.fillStyle = '#6b6458';
  ctx.font = '24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('0', left, 540);
  ctx.textAlign = 'center';
  ctx.fillText('50', xOf(50), 540);
  ctx.fillText('usual', xOf(mean), 540);
  ctx.textAlign = 'right';
  ctx.fillText('100', right, 540);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1c1915';
  ctx.fillText('You', youX, 330);
}

export async function shareCardFile(score: LifeScore) {
  const canvas = drawShareCard(score);
  const blob = await new Promise<Blob | null>(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) {
    throw new Error('Could not build the card');
  }
  return new File([blob], 'life-satisfaction.png', { type: 'image/png' });
}
