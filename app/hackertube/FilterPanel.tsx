import React, { useMemo, useState } from 'react';
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Modal,
  NumberInput,
  RangeSlider,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IconBookmarkPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  type Bounds,
  type FilterState,
  type SavedSearch,
  type SeenFilter,
  activeCount,
  describeFilters,
  sameFilters,
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
  searches: SavedSearch[];
  onSaveSearch: (name: string) => void;
  onApplySearch: (search: SavedSearch) => void;
  onDeleteSearch: (search: SavedSearch) => void;
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
  searches,
  onSaveSearch,
  onApplySearch,
  onDeleteSearch,
}: Props) {
  const [view, setView] = useState<'filters' | 'saved'>('filters');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

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
  const active = activeCount(state, bounds);
  const trimmed = name.trim();
  const replacing = searches.some(
    s => s.name.toLowerCase() === trimmed.toLowerCase()
  );

  const openSave = () => {
    setName(state.query.trim());
    setSaving(true);
  };
  const confirmSave = () => {
    if (!trimmed) {
      return;
    }
    onSaveSearch(trimmed);
    setSaving(false);
  };

  return (
    <Stack gap="lg">
      <SegmentedControl
        fullWidth
        value={view}
        onChange={v => setView(v as 'filters' | 'saved')}
        data={[
          { value: 'filters', label: 'Filters' },
          { value: 'saved', label: `Saved (${searches.length})` },
        ]}
      />

      {view === 'saved' ? (
        <Stack gap="xs">
          {searches.length === 0 && (
            <Text c="dimmed" size="sm">
              Nothing saved yet. Set up some filters, then press Save search.
            </Text>
          )}
          {searches.map(search => (
            <div
              key={search.id}
              role="button"
              tabIndex={0}
              className={`${styles.savedRow} ${
                sameFilters(search.filters, state) ? styles.savedActive : ''
              }`}
              onClick={() => {
                onApplySearch(search);
                setView('filters');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onApplySearch(search);
                  setView('filters');
                }
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className={styles.savedName}>{search.name}</div>
                <div className={styles.savedDesc}>
                  {describeFilters(search.filters, bounds, taxonomy)}
                </div>
              </div>
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={`Delete ${search.name}`}
                onClick={e => {
                  e.stopPropagation();
                  onDeleteSearch(search);
                }}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </div>
          ))}
        </Stack>
      ) : (
        <>
          <Group justify="space-between">
            <Button
              size="compact-xs"
              variant="light"
              color="orange"
              leftSection={<IconBookmarkPlus size={14} />}
              disabled={active === 0}
              onClick={openSave}
            >
              Save search
            </Button>
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
                searching === 'error'
                  ? 'Search model failed to load'
                  : undefined
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
            {/* Nothing ticked means no narrowing: the same as everything ticked,
            and far less noisy to look at. */}
            <div className={styles.filterTitle}>Category</div>
            {taxonomy.areas.map(area => {
              const open = state.areas.includes(area.id);
              return (
                <div key={area.id} className={styles.areaRow}>
                  <Checkbox
                    size="xs"
                    color="orange"
                    checked={open}
                    onChange={() =>
                      onChange(toggleArea(state, area.id, taxonomy))
                    }
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
        </>
      )}

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

      <Modal
        opened={saving}
        onClose={() => setSaving(false)}
        title="Save this search"
        size="sm"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            confirmSave();
          }}
        >
          <Stack gap="sm">
            <TextInput
              data-autofocus
              label="Name"
              placeholder="e.g. Short compiler talks"
              value={name}
              onChange={e => setName(e.currentTarget.value)}
            />
            <Text size="xs" c="dimmed">
              {describeFilters(state, bounds, taxonomy)}
            </Text>
            {replacing && (
              <Text size="xs" c="orange">
                A search with this name exists and will be replaced.
              </Text>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setSaving(false)}>
                Cancel
              </Button>
              <Button type="submit" color="orange" disabled={!trimmed}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
