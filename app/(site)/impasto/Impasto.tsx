'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  FileButton,
  Group,
  Progress,
  Slider,
  Stack,
  Text,
} from '@mantine/core';
import { type Rgb, toHex } from './color';
import { kmeans } from './kmeans';
import { type Recipe, findRecipe } from './mixer';

const WIDTH = 640;

/** A made-up sunset, so the demo works without uploading anything. */
function drawSample(canvas: HTMLCanvasElement) {
  canvas.width = WIDTH;
  canvas.height = 400;
  const ctx = canvas.getContext('2d')!;
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#1d2b6b');
  sky.addColorStop(0.5, '#c0457a');
  sky.addColorStop(1, '#f6a04d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, 400);
  ctx.fillStyle = '#fde9a0';
  ctx.beginPath();
  ctx.arc(430, 230, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a2f3f';
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.lineTo(0, 290);
  ctx.quadraticCurveTo(180, 220, 340, 300);
  ctx.quadraticCurveTo(480, 260, WIDTH, 310);
  ctx.lineTo(WIDTH, 400);
  ctx.fill();
  ctx.fillStyle = '#1f3a2b';
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.lineTo(0, 350);
  ctx.quadraticCurveTo(250, 310, WIDTH, 360);
  ctx.lineTo(WIDTH, 400);
  ctx.fill();
}

function drawImage(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  canvas.width = WIDTH;
  canvas.height = Math.round((image.height / image.width) * WIDTH);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function pixelsOf(canvas: HTMLCanvasElement): number[][] {
  const { data } = canvas
    .getContext('2d')!
    .getImageData(0, 0, canvas.width, canvas.height);
  const points: number[][] = [];
  // Every 6th pixel is plenty for a palette.
  for (let i = 0; i < data.length; i += 24) {
    points.push([data[i], data[i + 1], data[i + 2]]);
  }
  return points;
}

const Swatch = ({ color, size = 48 }: { color: string; size?: number }) => (
  <Box
    style={{
      width: size,
      height: size,
      flex: `0 0 ${size}px`,
      background: color,
      borderRadius: 'var(--mantine-radius-sm)',
      border: '1px solid var(--mantine-color-default-border)',
    }}
  />
);

const RecipeCard = ({ color, recipe }: { color: Rgb; recipe?: Recipe }) => (
  <Card withBorder p="sm">
    <Group wrap="nowrap" align="flex-start">
      <Stack gap={4} align="center">
        <Swatch color={toHex(color)} />
        <Text size="xs" c="dimmed">
          {toHex(color)}
        </Text>
      </Stack>
      <Stack gap={6} flex={1}>
        {!recipe && (
          <Text size="sm" c="dimmed">
            Mixing…
          </Text>
        )}
        {recipe?.parts.map(part => (
          <Box key={part.name}>
            <Group justify="space-between">
              <Text size="sm">{part.name}</Text>
              <Text size="sm">{part.percent}%</Text>
            </Group>
            <Progress
              value={part.percent}
              size="xs"
              color={toHex(part.rgb)}
              styles={{ section: { background: toHex(part.rgb) } }}
            />
          </Box>
        ))}
      </Stack>
      {recipe && (
        <Stack gap={4} align="center">
          <Swatch color={toHex(recipe.result)} />
          <Text size="xs" c="dimmed">
            ΔE {recipe.delta.toFixed(1)}
          </Text>
        </Stack>
      )}
    </Group>
  </Card>
);

export function Impasto() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorCount, setColorCount] = useState(5);
  const [source, setSource] = useState<'sample' | HTMLImageElement>('sample');
  const [colors, setColors] = useState<Rgb[]>([]);
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({});

  const extract = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const clusters = kmeans(pixelsOf(canvas), colorCount);
    setColors(clusters.map(c => c.center.map(Math.round) as Rgb));
  }, [colorCount]);

  // Draw whenever the image changes, and pick a palette for it.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (source === 'sample') {
      drawSample(canvas);
    } else {
      drawImage(canvas, source);
    }
    extract();
    // Only a new image redraws; the color count has its own effect below.
  }, [source]);

  useEffect(() => {
    extract();
  }, [extract]);

  // Work out recipes one at a time so the page stays responsive.
  useEffect(() => {
    let cancelled = false;
    const pending = colors.filter(c => !recipes[toHex(c)]);
    if (pending.length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      if (cancelled) {
        return;
      }
      const color = pending[0];
      const recipe = findRecipe(color);
      setRecipes(r => ({ ...r, [toHex(color)]: recipe }));
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [colors, recipes]);

  const pick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(
      ((e.clientY - rect.top) / rect.height) * canvas.height
    );
    const [r, g, b] = canvas.getContext('2d')!.getImageData(x, y, 1, 1).data;
    setColors(c => [...c, [r, g, b]]);
  };

  const load = (file: File | null) => {
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      setSource(image);
    };
    image.src = url;
  };

  return (
    <Stack gap="md">
      <Box
        style={{
          borderRadius: 'var(--mantine-radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Reference image. Click to sample a color."
          onPointerDown={pick}
          style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
        />
      </Box>

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Click the image to sample a color. Your photo stays in your browser.
        </Text>
        <Group>
          <FileButton onChange={load} accept="image/png,image/jpeg,image/webp">
            {props => (
              <Button variant="light" {...props}>
                Use my own image
              </Button>
            )}
          </FileButton>
          {source !== 'sample' && (
            <Button variant="subtle" onClick={() => setSource('sample')}>
              Back to sample
            </Button>
          )}
        </Group>
      </Group>

      <Box>
        <Text size="sm">Colors to find: {colorCount}</Text>
        <Slider min={2} max={8} value={colorCount} onChange={setColorCount} />
      </Box>

      <Stack gap="sm">
        {colors.map((color, i) => (
          <RecipeCard
            key={`${toHex(color)}-${i}`}
            color={color}
            recipe={recipes[toHex(color)]}
          />
        ))}
      </Stack>

      <Text size="xs" c="dimmed">
        Left swatch is the color from the image, right is what the recipe mixes
        to. ΔE is the CIEDE2000 distance between them; under about 4 you will
        hardly see the difference. Mixing uses{' '}
        <a href="https://scrtwpns.com/mixbox/">Mixbox</a> by Secret Weapons (CC
        BY-NC 4.0).
      </Text>
    </Stack>
  );
}
