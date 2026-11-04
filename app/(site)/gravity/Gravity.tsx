'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Group, Slider, Stack, Text } from '@mantine/core';
import { GALAXY_RADIUS, Simulation } from './simulation';

const STEPS_PER_FRAME = 3;
const DT = 0.01;

export function Gravity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sim = useRef<Simulation | null>(null);
  const view = useRef({ x: 0, y: 0, scale: 1 });
  const paused = useRef(false);

  const [count, setCount] = useState(600);
  const [speed, setSpeed] = useState(1.1);
  const [temperature, setTemperature] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [remaining, setRemaining] = useState(count);

  const restart = useCallback(() => {
    sim.current = new Simulation({ count, speed, temperature });
    setRemaining(count);
  }, [count, speed, temperature]);

  useEffect(() => {
    restart();
  }, [restart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      view.current.scale = Math.min(width, height) / (GALAXY_RADIUS * 3);
    };
    resize();
    window.addEventListener('resize', resize);

    let frame = 0;
    let last = 0;
    const draw = (time: number) => {
      const s = sim.current;
      const ratio = window.devicePixelRatio || 1;
      if (s && !paused.current) {
        for (let k = 0; k < STEPS_PER_FRAME; k++) {
          s.step(DT);
        }
      }
      if (s && time - last > 250) {
        last = time;
        setRemaining(s.n);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0d1024';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (s) {
        const { x, y, scale } = view.current;
        const k = scale * ratio;
        ctx.setTransform(
          k,
          0,
          0,
          k,
          canvas.width / 2 + x * ratio,
          canvas.height / 2 + y * ratio
        );
        for (let i = 0; i < s.n; i++) {
          const [r, g, b] = s.color[i];
          ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
          ctx.beginPath();
          // Keep tiny planets visible when zoomed out.
          ctx.arc(
            s.x[i],
            s.y[i],
            Math.max(s.radius(i) * 1.5, 1.5 / scale),
            0,
            6.2832
          );
          ctx.fill();
        }
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = view.current;
      const rect = canvas.getBoundingClientRect();
      // Zoom around the cursor.
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      const factor = Math.exp(-e.deltaY * 0.0015);
      v.x = px - (px - v.x) * factor;
      v.y = py - (py - v.y) * factor;
      v.scale *= factor;
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const drag = useRef<{ x: number; y: number } | null>(null);

  return (
    <Stack gap="md">
      <Box
        style={{
          borderRadius: 'var(--mantine-radius-md)',
          overflow: 'hidden',
          background: '#0d1024',
        }}
      >
        <canvas
          ref={canvasRef}
          aria-label="Galaxy simulation. Drag to pan, scroll to zoom."
          style={{
            width: '100%',
            height: 'min(70vh, 560px)',
            display: 'block',
            touchAction: 'none',
            cursor: 'grab',
          }}
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={e => {
            if (!drag.current) {
              return;
            }
            view.current.x += e.clientX - drag.current.x;
            view.current.y += e.clientY - drag.current.y;
            drag.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        />
      </Box>

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {remaining} bodies left. Drag to pan, scroll to zoom. Planets that
          touch merge into one.
        </Text>
        <Group>
          <Button
            variant="light"
            onClick={() => {
              paused.current = !paused.current;
              setIsPaused(paused.current);
            }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </Button>
          <Button onClick={restart}>Restart</Button>
        </Group>
      </Group>

      <Box>
        <Text size="sm">Bodies: {count}</Text>
        <Slider
          min={50}
          max={1200}
          step={50}
          value={count}
          onChange={setCount}
        />
      </Box>
      <Box>
        <Text size="sm">
          Spin: {speed.toFixed(2)} (1 holds together, higher flies apart, lower
          collapses)
        </Text>
        <Slider
          min={0}
          max={1.6}
          step={0.05}
          value={speed}
          onChange={setSpeed}
        />
      </Box>
      <Box>
        <Text size="sm">Temperature: {temperature.toFixed(1)}</Text>
        <Slider
          min={0}
          max={10}
          step={0.5}
          value={temperature}
          onChange={setTemperature}
        />
      </Box>
    </Stack>
  );
}
