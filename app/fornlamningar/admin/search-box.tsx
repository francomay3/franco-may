'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mantine/core';

/**
 * On the sites table this is a live filter: the parent owns the text.
 * Elsewhere, Enter opens the table with that text already filtering it.
 */
export function SearchBox({
  value,
  onChange,
  initial = '',
}: {
  value?: string;
  onChange?: (value: string) => void;
  initial?: string;
}) {
  const router = useRouter();
  const [local, setLocal] = useState(initial);
  const text = value ?? local;

  useEffect(() => {
    if (value === undefined) {
      setLocal(initial);
    }
  }, [initial, value]);

  return (
    <form
      className="fl-search"
      onSubmit={e => {
        e.preventDefault();
        if (onChange) {
          return;
        }
        const q = text.trim();
        router.push(
          q
            ? `/fornlamningar/admin/sites?q=${encodeURIComponent(q)}`
            : '/fornlamningar/admin/sites'
        );
      }}
    >
      <input
        aria-label={onChange ? 'Filter places' : 'Search places'}
        placeholder="Name, type or id"
        value={text}
        onChange={e => {
          const next = e.currentTarget.value;
          if (onChange) {
            onChange(next);
            return;
          }
          setLocal(next);
        }}
      />
      {onChange ? null : (
        <Button type="submit" radius="xl" color="dark" size="sm">
          Search
        </Button>
      )}
    </form>
  );
}
