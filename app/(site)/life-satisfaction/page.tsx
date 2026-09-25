import type { Metadata } from 'next';
import { LifeSatisfactionQuiz } from './LifeSatisfactionQuiz';

export const metadata: Metadata = {
  title: 'Satisfacción de vida',
  description:
    'Un índice de satisfacción de vida a partir de cuánto te identificás con cada frase del gráfico.',
};

export default function LifeSatisfactionPage() {
  return <LifeSatisfactionQuiz />;
}
