import type { Metadata } from 'next';
import { LifeSatisfactionQuiz } from './LifeSatisfactionQuiz';

export const metadata: Metadata = {
  title: 'Life satisfaction',
  description:
    'A life satisfaction index from how much you recognize yourself in each phrase on the chart.',
};

export default function LifeSatisfactionPage() {
  return <LifeSatisfactionQuiz />;
}
