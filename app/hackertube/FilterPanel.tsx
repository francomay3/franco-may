import React, { useMemo } from 'react';
import {
  Button,
  Checkbox,
  Group,
  NumberInput,
  RangeSlider,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import {
  type Bounds,
  type FilterState,
  type SeenFilter,
  activeCount,
  Taxonomy,
  toggleArea,
  toggleCategory,
} from './filters';
import styles from './hackertube.module.css';
import type { Video } from './types';

type Props = {
  state: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  bounds: Bounds;
  taxonomy: Taxonomy;
  videos: Video[];
  /** Draft text of the query box; applied with a debounce by the parent. */
  queryDraft: string;
  onQueryDraft: (text: string) => void;
  searching: 'idle' | 'loading' | 'error';
};

export function FilterPanel({
  state,
  onChange,
  onReset,
  bounds,
  taxonomy,
  videos,
  queryDraft,
  onQueryDraft,
  searching,
}: Props) {
  // Static for the dataset, so computed once.
  const counts = useMemo(() => {
    const byCategory = new Map<string, number>();
    const byArea = new Map<string, number>();
    for (const v of videos) {
      const areas = new Set<string>();
      for (const c of v.cats) {
        byCategory.set(c, (byCategory.get(c) ?? 0) + 1);
        const a = taxonomy.areaOfCategory(c);
        if (a) {
          areas.add(a);
        }
      }
      for (const a of areas) {
        byArea.set(a, (byArea.get(a) ?? 0) + 1);
      }
    }
    return { byCategory, byArea };
  }, [videos, taxonomy]);

  const set = (patch: Partial<FilterState>) => onChange({ ...state, ...patch });
  const nothingPicked = state.areas.length === 0;
  const active = activeCount(state, bounds);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Text fw={700}>Filters</Text>
        <Button
          size="compact-xs"
          variant="subtle"
          color="gray"
          disabled={active === 0}
          onClick={onReset}
        >
          Reset{active > 0 ? ` (${active})` : ''}
        </Button>
      </Group>

      <div>
        <div className={styles.filterTitle}>Search</div>
        <TextInput
          placeholder="Describe what you want to watch"
          leftSection={<IconSearch size={16} />}
          rightSection={
            queryDraft ? (
              <IconX
                size={16}
                style={{ cursor: 'pointer' }}
                onClick={() => onQueryDraft('')}
              />
            ) : null
          }
          value={queryDraft}
          onChange={e => onQueryDraft(e.currentTarget.value)}
          error={
            searching === 'error' ? 'Search model failed to load' : undefined
          }
        />
        {searching === 'loading' && (
          <Text size="xs" c="dimmed" mt={4}>
            Loading the search model (first time only, ~35 MB)…
          </Text>
        )}
      </div>

      <div>
        <div className={styles.filterTitle}>Seen</div>
        <SegmentedControl
          fullWidth
          size="xs"
          value={state.seen}
          onChange={v => set({ seen: v as SeenFilter })}
          data={[
            { value: 'all', label: 'All' },
            { value: 'unseen', label: 'Not seen' },
            { value: 'seen', label: 'Seen' },
          ]}
        />
      </div>

      <div>
        <div className={styles.filterTitle}>
          Rating · {state.score[0]} – {state.score[1]}
        </div>
        <RangeSlider
          min={bounds.score[0]}
          max={bounds.score[1]}
          step={1}
          minRange={0}
          color="orange"
          value={state.score}
          onChange={v => set({ score: v })}
          label={v => v}
        />
      </div>

      <div>
        <div className={styles.filterTitle}>Date uploaded</div>
        <Group grow gap="xs">
          <TextInput
            type="date"
            size="xs"
            aria-label="Uploaded from"
            value={state.dateFrom}
            max={state.dateTo || undefined}
            onChange={e => set({ dateFrom: e.currentTarget.value })}
          />
          <TextInput
            type="date"
            size="xs"
            aria-label="Uploaded to"
            value={state.dateTo}
            min={state.dateFrom || undefined}
            onChange={e => set({ dateTo: e.currentTarget.value })}
          />
        </Group>
      </div>

      <div>
        <div className={styles.filterTitle}>Length (minutes)</div>
        <Group grow gap="xs">
          <NumberInput
            size="xs"
            min={0}
            placeholder="From"
            aria-label="Minimum length in minutes"
            value={state.minMinutes ?? ''}
            onChange={v => set({ minMinutes: v === '' ? null : Number(v) })}
          />
          <NumberInput
            size="xs"
            min={0}
            placeholder="To"
            aria-label="Maximum length in minutes"
            value={state.maxMinutes ?? ''}
            onChange={v => set({ maxMinutes: v === '' ? null : Number(v) })}
          />
        </Group>
      </div>

      <div>
        <div className={styles.filterTitle}>Category</div>
        {taxonomy.areas.map(area => {
          const open = state.areas.includes(area.id);
          return (
            <div key={area.id} className={styles.areaRow}>
              <Checkbox
                size="xs"
                color="orange"
                checked={nothingPicked || open}
                onChange={() => onChange(toggleArea(state, area.id, taxonomy))}
                label={
                  <>
                    {area.name}
                    <span className={styles.count}>
                      {counts.byArea.get(area.id) ?? 0}
                    </span>
                  </>
                }
              />
              {open && (
                <div className={styles.categories}>
                  {area.categories.map(c => (
                    <Checkbox
                      key={c.id}
                      size="xs"
                      color="orange"
                      mb={4}
                      checked={state.categories.includes(c.id)}
                      onChange={() => onChange(toggleCategory(state, c.id))}
                      label={
                        <>
                          {c.name}
                          <span className={styles.count}>
                            {counts.byCategory.get(c.id) ?? 0}
                          </span>
                        </>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.attribution}>
        Recommendations from Hacker News via{' '}
        <a href="https://hackertube.org" target="_blank" rel="noreferrer">
          HackerTube
        </a>{' '}
        (ODC-By) and the{' '}
        <a
          href="https://huggingface.co/datasets/open-index/hacker-news"
          target="_blank"
          rel="noreferrer"
        >
          open-index/hacker-news
        </a>{' '}
        archive. Video details from YouTube. Not affiliated with YouTube or Y
        Combinator.
      </div>
    </Stack>
  );
}
