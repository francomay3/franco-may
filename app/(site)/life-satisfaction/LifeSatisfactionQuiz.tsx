'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Group,
  Progress,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { SITE_CONFIG } from '@/utils/constants';
import {
  indexLabel,
  interpretation,
  LIFE_ITEMS,
  movers,
  readingBand,
  scoreLifeSatisfaction,
  USUAL_LIFE_SATISFACTION,
  type LifeScore,
} from './model';
import { shareCardFile } from './shareCard';

const STORAGE_KEY = 'life-satisfaction-answers';
const SCALE = [
  { value: 1, label: 'Not me' },
  { value: 2, label: 'A little' },
  { value: 3, label: 'Somewhat' },
  { value: 4, label: 'Mostly' },
  { value: 5, label: 'Very much' },
];

type Phase = 'intro' | 'quiz' | 'result';

function loadAnswers(): (number | null)[] {
  if (typeof window === 'undefined') {
    return LIFE_ITEMS.map(() => null);
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (
      Array.isArray(parsed) &&
      parsed.length === LIFE_ITEMS.length &&
      parsed.every(value => value === null || (value >= 1 && value <= 5))
    ) {
      return parsed;
    }
  } catch {
    // Ignore a broken draft and start clean.
  }
  return LIFE_ITEMS.map(() => null);
}

function shareText(score: LifeScore) {
  const { up, down } = movers(score, 2);
  const upLine = up.map(item => item.text).join('; ');
  const downLine = down.map(item => item.text).join('; ');
  return [
    `My life satisfaction index: ${score.index.toFixed(0)}/100 (${indexLabel(score.index)}).`,
    upLine ? `Pulled up by: ${upLine}.` : '',
    downLine ? `Pulled down by: ${downLine}.` : '',
    `${SITE_CONFIG.url}/life-satisfaction`,
  ]
    .filter(Boolean)
    .join(' ');
}

export function LifeSatisfactionQuiz() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    LIFE_ITEMS.map(() => null)
  );
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    const draft = loadAnswers();
    setAnswers(draft);
    const firstOpen = draft.findIndex(answer => answer === null);
    if (firstOpen === -1 && draft.some(answer => answer !== null)) {
      setStep(LIFE_ITEMS.length - 1);
    } else if (firstOpen > 0) {
      setStep(firstOpen);
      setPhase('quiz');
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  const score = useMemo(() => {
    if (answers.some(answer => answer === null)) {
      return null;
    }
    return scoreLifeSatisfaction(answers as number[]);
  }, [answers]);

  const current = LIFE_ITEMS[step];
  const answeredCount = answers.filter(answer => answer !== null).length;

  const choose = (value: number) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    if (advanceTimer.current !== null) {
      window.clearTimeout(advanceTimer.current);
    }
    if (step < LIFE_ITEMS.length - 1) {
      advanceTimer.current = window.setTimeout(() => {
        setStep(index => index + 1);
      }, 160);
      return;
    }
    setPhase('result');
  };

  useEffect(() => {
    if (phase !== 'quiz') {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      const value = Number(event.key);
      if (value >= 1 && value <= 5) {
        choose(value);
      } else if (event.key === 'ArrowLeft' && step > 0) {
        setStep(index => index - 1);
      } else if (
        event.key === 'ArrowRight' &&
        answers[step] !== null &&
        step < LIFE_ITEMS.length - 1
      ) {
        setStep(index => index + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const restart = () => {
    setAnswers(LIFE_ITEMS.map(() => null));
    setStep(0);
    setPhase('intro');
    setShareError(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const share = async () => {
    if (!score) {
      return;
    }
    setSharing(true);
    setShareError(null);
    const text = shareText(score);
    try {
      const file = await shareCardFile(score);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text,
          title: 'Life satisfaction index',
        });
        return;
      }
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'life-satisfaction.png';
      link.click();
      URL.revokeObjectURL(url);
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setShareError('Could not build the card. Try again.');
    } finally {
      setSharing(false);
    }
  };

  if (phase === 'intro') {
    return (
      <Stack gap="lg" maw={560} mx="auto">
        <Title order={1} ta="center">
          Life satisfaction
        </Title>
        <Text>
          Each phrase on the chart has a correlation with life satisfaction.
          Mark 1 to 5 for how much it sounds like you. The index adds that
          correlation times how far you sat from “somewhat”.
        </Text>
        <Text c="dimmed" size="sm">
          A 5 on a phrase that goes with high satisfaction raises the index. A 5
          on one that goes with low satisfaction lowers it. A 3 does nothing. 50
          is that neutral line, not a population average.
        </Text>
        <Button size="lg" onClick={() => setPhase('quiz')}>
          {answeredCount > 0 ? 'Continue' : 'Start'}
        </Button>
        <Text c="dimmed" size="sm" ta="center">
          {LIFE_ITEMS.length} phrases · keys 1–5
        </Text>
      </Stack>
    );
  }

  if (phase === 'result' && score) {
    const spread = movers(score, 5);
    const band = readingBand(score.items.map(item => item.rating));
    const reading = interpretation(score.index);
    return (
      <Stack gap="xl" maw={640} mx="auto">
        <Stack gap={4} ta="center">
          <Text size="sm" tt="uppercase" fw={600} c="dimmed">
            Index
          </Text>
          <Title order={1} fz={72} lh={1}>
            {score.index.toFixed(0)}
          </Title>
          <Text size="lg">{reading.label}</Text>
        </Stack>

        <ScoreCurve index={score.index} band={band} />

        <Text>{reading.text}</Text>

        <Group align="flex-start" grow>
          <MoverList title="Pulls up" items={spread.up} color="blue" />
          <MoverList title="Pulls down" items={spread.down} color="red" />
        </Group>

        <Stack gap="sm">
          <Button size="lg" loading={sharing} onClick={share}>
            Share on WhatsApp
          </Button>
          {shareError ? (
            <Text c="red" size="sm">
              {shareError}
            </Text>
          ) : null}
          <Button variant="subtle" onClick={restart}>
            Take it again
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" maw={560} mx="auto">
      <Stack gap={6}>
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {step + 1} of {LIFE_ITEMS.length}
          </Text>
          <Text size="sm" c="dimmed">
            {answeredCount} answered
          </Text>
        </Group>
        <Progress
          value={((step + 1) / LIFE_ITEMS.length) * 100}
          size="sm"
          radius="xl"
          aria-label="Progress"
        />
      </Stack>

      <Title order={2} fz={32} lh={1.25} mih={120}>
        {current.text}
      </Title>

      <Group grow gap="xs" wrap="nowrap">
        {SCALE.map(option => {
          const selected = answers[step] === option.value;
          return (
            <UnstyledButton
              key={option.value}
              onClick={() => choose(option.value)}
              aria-label={`${option.value}, ${option.label}`}
              aria-pressed={selected}
              style={{
                flex: 1,
                textAlign: 'center',
                borderRadius: 12,
                padding: '14px 4px',
                border: '1px solid var(--mantine-color-default-border)',
                background: selected
                  ? 'var(--mantine-color-text)'
                  : 'transparent',
                color: selected
                  ? 'var(--mantine-color-body)'
                  : 'var(--mantine-color-text)',
              }}
            >
              <Text fw={700} size="lg" style={{ color: 'inherit' }}>
                {option.value}
              </Text>
              <Text size="xs" style={{ color: 'inherit' }}>
                {option.label}
              </Text>
            </UnstyledButton>
          );
        })}
      </Group>

      <Group justify="space-between">
        <Button
          variant="subtle"
          disabled={step === 0}
          onClick={() => setStep(index => index - 1)}
        >
          Back
        </Button>
        <Button variant="subtle" onClick={() => setPhase('intro')}>
          Pause
        </Button>
      </Group>
    </Stack>
  );
}

const CURVE_SD = 14;

function ScoreCurve({ index, band }: { index: number; band: number }) {
  const width = 640;
  const height = 200;
  const padX = 16;
  const baseline = 156;
  const xOf = (value: number) => padX + (value / 100) * (width - padX * 2);
  const density = (value: number) =>
    Math.exp(-0.5 * ((value - USUAL_LIFE_SATISFACTION) / CURVE_SD) ** 2);
  const peak = density(USUAL_LIFE_SATISFACTION);
  const yOf = (value: number) => baseline - (density(value) / peak) * 120;
  const curve = Array.from({ length: 101 }, (_, value) => {
    const x = xOf(value);
    const y = yOf(value);
    return `${value === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const youX = xOf(index);
  const low = Math.max(0, index - band);
  const high = Math.min(100, index + band);

  return (
    <Box>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label={`Your index is ${index.toFixed(0)}, usual answers sit near ${USUAL_LIFE_SATISFACTION}`}
      >
        <path
          d={`${curve} L ${xOf(100)} ${baseline} L ${xOf(0)} ${baseline} Z`}
          fill="var(--mantine-color-blue-light)"
        />
        <path
          d={curve}
          fill="none"
          stroke="var(--mantine-color-blue-6)"
          strokeWidth="2.5"
        />
        <rect
          x={xOf(low)}
          y={36}
          width={Math.max(xOf(high) - xOf(low), 2)}
          height={baseline - 36}
          fill="var(--mantine-color-blue-6)"
          opacity="0.18"
        />
        <line
          x1={xOf(USUAL_LIFE_SATISFACTION)}
          x2={xOf(USUAL_LIFE_SATISFACTION)}
          y1={yOf(USUAL_LIFE_SATISFACTION)}
          y2={baseline}
          stroke="var(--mantine-color-dimmed)"
          strokeDasharray="4 4"
        />
        <line
          x1={youX}
          x2={youX}
          y1={28}
          y2={baseline}
          stroke="var(--mantine-color-text)"
          strokeWidth="2"
        />
        <circle
          cx={youX}
          cy={yOf(index)}
          r="6"
          fill="var(--mantine-color-text)"
        />
        <text
          x={youX}
          y={18}
          textAnchor="middle"
          fill="var(--mantine-color-text)"
          fontSize="14"
          fontFamily="Georgia, serif"
        >
          You
        </text>
        <text
          x={xOf(0)}
          y={178}
          fill="var(--mantine-color-dimmed)"
          fontSize="12"
        >
          0
        </text>
        <text
          x={xOf(50)}
          y={178}
          textAnchor="middle"
          fill="var(--mantine-color-dimmed)"
          fontSize="12"
        >
          50
        </text>
        <text
          x={xOf(USUAL_LIFE_SATISFACTION)}
          y={178}
          textAnchor="middle"
          fill="var(--mantine-color-dimmed)"
          fontSize="12"
        >
          usual
        </text>
        <text
          x={xOf(100)}
          y={178}
          textAnchor="end"
          fill="var(--mantine-color-dimmed)"
          fontSize="12"
        >
          100
        </text>
      </svg>
      <Text size="sm" c="dimmed">
        The hill is where people usually place themselves when they rate life
        directly. The shaded stripe is the wiggle from reading the correlations
        off the chart, about ±{band.toFixed(0)} points.
      </Text>
    </Box>
  );
}

function MoverList({
  title,
  items,
  color,
}: {
  title: string;
  items: LifeScore['items'];
  color: 'blue' | 'red';
}) {
  return (
    <Stack gap={6}>
      <Text fw={600} c={color}>
        {title}
      </Text>
      {items.map(item => (
        <Text key={item.id} size="sm">
          {item.text}
        </Text>
      ))}
    </Stack>
  );
}
