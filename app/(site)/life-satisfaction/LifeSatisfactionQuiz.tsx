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
  LIFE_ITEMS,
  movers,
  scoreLifeSatisfaction,
  type LifeScore,
} from './model';
import { shareCardFile } from './shareCard';

const STORAGE_KEY = 'life-satisfaction-answers';
const SCALE = [
  { value: 1, label: 'Nada' },
  { value: 2, label: 'Poco' },
  { value: 3, label: 'Algo' },
  { value: 4, label: 'Bastante' },
  { value: 5, label: 'Totalmente' },
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
    `Mi índice de satisfacción de vida: ${score.index.toFixed(0)}/100 (${indexLabel(score.index)}).`,
    upLine ? `Lo que más lo sube: ${upLine}.` : '',
    downLine ? `Lo que más lo baja: ${downLine}.` : '',
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
          title: 'Índice de satisfacción de vida',
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
      setShareError('No se pudo armar la tarjeta. Probá de nuevo.');
    } finally {
      setSharing(false);
    }
  };

  if (phase === 'intro') {
    return (
      <Stack gap="lg" maw={560} mx="auto">
        <Title order={1} ta="center">
          Satisfacción de vida
        </Title>
        <Text>
          Cada frase del gráfico tiene una correlación con la satisfacción de
          vida. Marcá del 1 al 5 cuánto te identificás. El índice suma esa
          correlación por lo que te alejaste del punto medio.
        </Text>
        <Text c="dimmed" size="sm">
          Un 5 en una frase que va con alta satisfacción sube el índice. Un 5 en
          una que va con baja satisfacción lo baja. El 3 no mueve nada. 50 es el
          punto medio, no un promedio de la población.
        </Text>
        <Button size="lg" onClick={() => setPhase('quiz')}>
          {answeredCount > 0 ? 'Seguir' : 'Empezar'}
        </Button>
        <Text c="dimmed" size="sm" ta="center">
          {LIFE_ITEMS.length} frases · teclas 1–5
        </Text>
      </Stack>
    );
  }

  if (phase === 'result' && score) {
    const spread = movers(score, 6);
    const maxMove = Math.max(
      ...score.items.map(item => Math.abs(item.contribution)),
      0.01
    );
    return (
      <Stack gap="xl" maw={640} mx="auto">
        <Stack gap={4} ta="center">
          <Text size="sm" tt="uppercase" fw={600} c="dimmed">
            Índice
          </Text>
          <Title order={1} fz={72} lh={1}>
            {score.index.toFixed(0)}
          </Title>
          <Text size="lg">{indexLabel(score.index)} de 100</Text>
        </Stack>

        <Box>
          <Text fw={600} mb="xs">
            Spread
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            Cada barra es cuánto movió esa frase el índice: correlación × (tu
            respuesta − 3). Azul sube, rojo baja.
          </Text>
          <SpreadChart items={score.items} maxMove={maxMove} />
        </Box>

        <Group align="flex-start" grow>
          <MoverList title="Sube" items={spread.up} color="blue" />
          <MoverList title="Baja" items={spread.down} color="red" />
        </Group>

        <Stack gap="sm">
          <Button size="lg" loading={sharing} onClick={share}>
            Compartir por WhatsApp
          </Button>
          {shareError ? (
            <Text c="red" size="sm">
              {shareError}
            </Text>
          ) : null}
          <Button variant="subtle" onClick={restart}>
            Hacerlo de nuevo
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
            {step + 1} de {LIFE_ITEMS.length}
          </Text>
          <Text size="sm" c="dimmed">
            {answeredCount} respondidas
          </Text>
        </Group>
        <Progress
          value={((step + 1) / LIFE_ITEMS.length) * 100}
          size="sm"
          radius="xl"
          aria-label="Progreso"
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
          Atrás
        </Button>
        <Button variant="subtle" onClick={() => setPhase('intro')}>
          Pausa
        </Button>
      </Group>
    </Stack>
  );
}

function SpreadChart({
  items,
  maxMove,
}: {
  items: LifeScore['items'];
  maxMove: number;
}) {
  const ordered = [...items].sort((a, b) => b.contribution - a.contribution);
  return (
    <Stack gap={6}>
      {ordered.map(item => {
        const width = `${(Math.abs(item.contribution) / maxMove) * 50}%`;
        const up = item.contribution >= 0;
        return (
          <Box key={item.id}>
            <Text size="xs" lineClamp={1} mb={2}>
              {item.text}
            </Text>
            <Box style={{ position: 'relative', height: 8 }}>
              <Box
                style={{
                  position: 'absolute',
                  top: 0,
                  height: 8,
                  width,
                  borderRadius: 99,
                  background: up
                    ? 'var(--mantine-color-blue-6)'
                    : 'var(--mantine-color-red-6)',
                  [up ? 'left' : 'right']: '50%',
                }}
              />
              <Box
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: -2,
                  width: 1,
                  height: 12,
                  background: 'var(--mantine-color-dimmed)',
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
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
