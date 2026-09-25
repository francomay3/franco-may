import { indexLabel, type LifeScore, movers } from './model';

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
  ctx.fillText('Índice de satisfacción de vida', 96, 140);

  ctx.font = '700 168px Georgia, serif';
  ctx.fillText(score.index.toFixed(0), 96, 340);
  ctx.font = '42px Georgia, serif';
  ctx.fillStyle = '#6b6458';
  ctx.fillText(`/ 100  ·  ${indexLabel(score.index)}`, 360, 320);

  ctx.fillStyle = '#1c1915';
  ctx.font = '32px Georgia, serif';
  ctx.fillText('Lo que más mueve el índice', 96, 460);

  const { up, down } = movers(score, 5);
  const max = Math.max(
    ...[...up, ...down].map(item => Math.abs(item.contribution)),
    0.01
  );

  up.forEach((item, index) => {
    bar(ctx, item.text, item.contribution, max, 500 + index * 72, '#1f4fd8');
  });
  down.forEach((item, index) => {
    bar(ctx, item.text, item.contribution, max, 900 + index * 72, '#b42318');
  });

  ctx.fillStyle = '#8a8378';
  ctx.font = '26px Georgia, serif';
  ctx.fillText('franco-may.com/life-satisfaction', 96, 1280);

  return canvas;
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
