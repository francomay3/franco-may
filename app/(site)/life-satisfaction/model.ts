export type LifeItem = {
  id: string;
  text: string;
  /** Signed correlation with life satisfaction, read off the chart. */
  r: number;
};

/**
 * Rank order matches the chart (strongest link at the top of each panel).
 * The coefficients are approximate readings of that figure, not a published table.
 */
export const LIFE_ITEMS: LifeItem[] = [
  { id: 'fun', text: 'Have a lot of fun', r: 0.64 },
  { id: 'energy', text: 'Am usually active and full of energy', r: 0.61 },
  { id: 'cravings', text: 'Am able to control my cravings', r: 0.58 },
  { id: 'complain', text: 'Rarely complain', r: 0.56 },
  { id: 'calm', text: 'Remain calm under pressure', r: 0.54 },
  { id: 'good-at', text: 'Am good at many things', r: 0.52 },
  { id: 'embarrassed', text: 'Am not embarrassed easily', r: 0.5 },
  { id: 'trust', text: 'Trust others', r: 0.48 },
  { id: 'wise', text: 'Am considered to be a wise person', r: 0.47 },
  { id: 'cooperate', text: 'Enjoy cooperating with others', r: 0.45 },
  {
    id: 'work-hard-belief',
    text: 'Believe that by working hard a person can achieve anything',
    r: 0.44,
  },
  { id: 'like-people', text: 'Like most people', r: 0.42 },
  { id: 'relaxed', text: 'Am relaxed most of the time', r: 0.41 },
  {
    id: 'influence',
    text: 'Have a natural talent for influencing people',
    r: 0.4,
  },
  { id: 'leader', text: 'Act as a leader', r: 0.39 },
  { id: 'start-tasks', text: 'Start tasks right away', r: 0.38 },
  { id: 'friends', text: 'Make friends easily', r: 0.37 },
  { id: 'complex', text: 'Like to solve complex problems', r: 0.36 },
  { id: 'logical', text: 'Do things in a logical order', r: 0.35 },
  { id: 'learn-quickly', text: 'Learn quickly', r: 0.34 },
  { id: 'teasing', text: "Don't mind others making fun of me", r: 0.33 },
  { id: 'learn-love', text: 'Love to learn new things', r: 0.32 },
  { id: 'accept', text: 'Accept people as they are', r: 0.31 },
  { id: 'work-hard', text: 'Work hard', r: 0.3 },
  { id: 'gatherings', text: 'Enjoy social gatherings', r: 0.29 },
  { id: 'prepared', text: 'Am always prepared', r: 0.28 },
  { id: 'risks', text: 'Take risks', r: 0.28 },
  { id: 'energized', text: 'Talking with others energizes me', r: 0.27 },
  { id: 'push', text: 'Push myself very hard to succeed', r: 0.26 },
  { id: 'apologize', text: 'Easily apologize when I have been wrong', r: 0.25 },
  { id: 'tidy', text: 'Keep things tidy', r: 0.25 },
  { id: 'temptations', text: 'Easily resist temptations', r: 0.24 },
  {
    id: 'new-ways',
    text: 'Love to think up new ways of doing things',
    r: 0.24,
  },
  {
    id: 'family-duty',
    text: "Believe one has special duties to one's family",
    r: 0.23,
  },
  { id: 'new-places', text: 'Like to visit new places', r: 0.23 },
  { id: 'loyal', text: 'Am an extremely loyal person', r: 0.22 },
  { id: 'comfort', text: 'Know how to comfort others', r: 0.22 },
  { id: 'authority', text: 'Respect authority', r: 0.21 },
  { id: 'improve', text: 'Work on improving myself', r: 0.21 },
  {
    id: 'misunderstood',
    text: 'Often feel that others misunderstand me',
    r: -0.65,
  },
  { id: 'nothing-excites', text: 'Find that nothing excites me', r: -0.61 },
  { id: 'left-alone', text: 'Am afraid of being left alone', r: -0.57 },
  { id: 'tired', text: 'Often feel tired', r: -0.54 },
  { id: 'afraid', text: 'Am afraid of many things', r: -0.51 },
  { id: 'postpone', text: 'Postpone decisions', r: -0.49 },
  {
    id: 'envy',
    text: 'Hate to hear about the successes of others',
    r: -0.47,
  },
  { id: 'need-help', text: 'Often need help', r: -0.45 },
  { id: 'avoid-responsibility', text: 'Avoid responsibilities', r: -0.43 },
  { id: 'bored', text: 'Am often bored', r: -0.41 },
  { id: 'hurt', text: 'My feelings are easily hurt', r: -0.4 },
  {
    id: 'stop-working',
    text: 'Often stop working if it becomes too hard',
    r: -0.38,
  },
  {
    id: 'suspicious',
    text: 'Get suspicious when someone treats me nicely',
    r: -0.37,
  },
  { id: 'advantage', text: 'Let others take advantage of me', r: -0.36 },
  { id: 'reassurance', text: 'Need reassurance', r: -0.35 },
  { id: 'forgive', text: 'Find it hard to forgive others', r: -0.34 },
  { id: 'affection', text: 'Have difficulty showing affection', r: -0.33 },
  { id: 'blame', text: 'Blame others when something goes wrong', r: -0.32 },
  { id: 'alone', text: 'Prefer to be alone', r: -0.31 },
  { id: 'distracted', text: 'Am easily distracted', r: -0.3 },
  { id: 'public-speaking', text: 'Try to avoid speaking in public', r: -0.29 },
  { id: 'hurting', text: 'Enjoy hurting others', r: -0.28 },
  { id: 'late', text: 'Hardly ever finish things on time', r: -0.27 },
  { id: 'promises', text: 'Break my promises', r: -0.26 },
  { id: 'enemies', text: 'Make enemies', r: -0.25 },
  { id: 'lies', text: 'Often tell lies', r: -0.25 },
  { id: 'interests', text: 'My interests change quickly', r: -0.24 },
  { id: 'talk-self', text: 'Dislike talking about myself', r: -0.23 },
  { id: 'forget', text: 'Often forget things', r: -0.23 },
  { id: 'cry', text: 'Cry easily', r: -0.22 },
  { id: 'impulsive', text: 'Act without thinking', r: -0.21 },
];

export type RatedItem = LifeItem & {
  rating: number;
  contribution: number;
};

export type LifeScore = {
  /** 0–100. 50 is answering the midpoint on every phrase. */
  index: number;
  items: RatedItem[];
};

const NEUTRAL = 3;
const STEP = 2;

export function itemContribution(item: LifeItem, rating: number) {
  return item.r * (rating - NEUTRAL);
}

export function scoreLifeSatisfaction(
  ratings: number[],
  items: LifeItem[] = LIFE_ITEMS
): LifeScore {
  if (ratings.length !== items.length) {
    throw new Error('Each phrase needs a rating');
  }

  const span = items.reduce((sum, item) => sum + Math.abs(item.r) * STEP, 0);
  const rated = items.map((item, index) => ({
    ...item,
    rating: ratings[index],
    contribution: itemContribution(item, ratings[index]),
  }));
  const raw = rated.reduce((sum, item) => sum + item.contribution, 0);
  const index = span === 0 ? 50 : 50 + (50 * raw) / span;

  return {
    index: Math.round(index * 10) / 10,
    items: rated,
  };
}

export function indexLabel(index: number) {
  if (index < 35) {
    return 'Baja';
  }
  if (index < 45) {
    return 'Por debajo del medio';
  }
  if (index < 55) {
    return 'En el medio';
  }
  if (index < 70) {
    return 'Alta';
  }
  return 'Muy alta';
}

export function movers(score: LifeScore, count = 6) {
  const sorted = [...score.items].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );
  return {
    up: sorted.filter(item => item.contribution > 0).slice(0, count),
    down: sorted.filter(item => item.contribution < 0).slice(0, count),
  };
}
