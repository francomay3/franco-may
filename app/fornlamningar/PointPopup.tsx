import React, { useEffect, useState } from 'react';
import { PointFeature } from './models';
import {
  formatSize,
  loadDescription,
  PlaceDescription,
} from './descriptions';
import { LngLatLike, Popup, PopupEvent } from '@vis.gl/react-maplibre';
import { Title, Text, Flex, Stack } from '@mantine/core';
import Link from '@/components/Link';

type SourceText = {
  source_id: number;
  added_id: number | null;
  kind: string;
  lang: string | null;
  title: string | null;
  body: string;
  author: string | null;
  publisher: string | null;
  licence: string | null;
  url: string | null;
  used: boolean;
};

const KIND_LABEL: Record<string, string> = {
  register: 'Register',
  register_parts: 'Register, parts',
  register_vegetation: 'Register, vegetation',
  tradition: 'Tradition',
  wikipedia: 'Wikipedia',
  user_comment: 'Visitor comment',
  county_attr: 'County, attribute',
  county_page: 'County web page',
  county_programme: 'County programme',
  county_plan: 'County plan',
  county_pdf: 'County PDF',
  web: 'Web page',
  web_page: 'Web page',
};

function photoUrl(image: NonNullable<PlaceDescription['images']>[number]): string | null {
  if (image.src) return image.src;
  if (!image.f) return null;
  let name = image.f;
  try {
    name = decodeURIComponent(image.f);
  } catch {
    name = image.f;
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=480`;
}

const PointPopup = ({
  feature,
  onClose,
}: {
  feature: PointFeature;
  onClose: () => void;
}) => {
  const { uuid } = feature.properties;
  const [description, setDescription] = useState<PlaceDescription | null>(null);
  const [sources, setSources] = useState<SourceText[] | null>(null);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const subtitle = formatSize(description?.size);

  useEffect(() => {
    let live = true;
    setDescription(null);
    setSources(null);
    setSourcesError(null);
    loadDescription(uuid).then(text => {
      if (live) setDescription(text);
    });
    fetch(`/api/fornlamningar/debug?id=${encodeURIComponent(uuid)}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then(data => {
        if (live) setSources((data.texts ?? []) as SourceText[]);
      })
      .catch(e => {
        if (live) setSourcesError(e instanceof Error ? e.message : 'failed');
      });
    return () => {
      live = false;
    };
  }, [uuid]);

  const latitude = feature.geometry.coordinates[1];
  const longitude = feature.geometry.coordinates[0];
  const adminUrl = `/fornlamningar/admin/${uuid}`;
  const images = description?.images ?? [];

  const handlePopupOpen = (e: PopupEvent) => {
    setTimeout(() => {
      const { _map: map, _container: popupElement } = e.target;

      if (popupElement && popupElement.getBoundingClientRect && map) {
        const rect = popupElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mapContainer = map.getContainer();
        if (mapContainer) {
          const mapRect = mapContainer.getBoundingClientRect();
          const relativeX = centerX - mapRect.left;
          const relativeY = centerY - mapRect.top;
          const centerLngLat = map.unproject([relativeX, relativeY]);
          const targetCenter: LngLatLike = [longitude, centerLngLat.lat];
          map.flyTo({
            center: targetCenter,
            duration: 1000,
            essential: true,
          });
        }
      }
    }, 50);
  };

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      offset={10}
      onClose={onClose}
      onOpen={handlePopupOpen}
      maxWidth="440px"
      focusAfterOpen
    >
      <Stack gap={8} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
        <Title order={3}>
          {description?.title || feature.properties.label}
        </Title>
        <Text size="xs" c="dimmed" mt={-6}>
          {feature.properties.class ?? feature.properties.label}
          {feature.properties.score != null ? ` · ${feature.properties.score}` : ''}
          {` · ${uuid}`}
        </Text>
        <Text lang={description?.raw ? 'sv' : 'en'} size="sm">
          {description?.content ?? ''}
        </Text>
        {(description?.period || subtitle) && (
          <Text size="xs" c="dimmed" mt={-4}>
            {description?.period && (
              <span
                title={
                  description.period.basis === 'typology'
                    ? 'Estimated from the type of site, not recorded for this one'
                    : 'Stated in the heritage register'
                }
                style={{
                  borderBottom:
                    description.period.basis === 'typology'
                      ? '1px dotted currentColor'
                      : undefined,
                }}
              >
                {description.period.text}
              </span>
            )}
            {description?.period && subtitle ? ' · ' : ''}
            {subtitle}
          </Text>
        )}

        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Photographs
        </Text>
        {images.length === 0 ? (
          <Text size="xs" c="dimmed">
            No credited photograph.
          </Text>
        ) : (
          <Flex gap={8} wrap="wrap">
            {images.map((image, i) => {
              const src = photoUrl(image);
              const credit = [image.by, image.lic].filter(Boolean).join(' · ');
              const card = (
                <Stack gap={2} style={{ width: 140 }}>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: 140,
                        height: 96,
                        objectFit: 'cover',
                        borderRadius: 6,
                        display: 'block',
                      }}
                    />
                  ) : null}
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {credit || 'No credit'}
                  </Text>
                </Stack>
              );
              return image.page ? (
                <a key={`${image.f ?? image.src}-${i}`} href={image.page} target="_blank" rel="noreferrer">
                  {card}
                </a>
              ) : (
                <div key={`${image.f ?? image.src}-${i}`}>{card}</div>
              );
            })}
          </Flex>
        )}

        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          Sources
        </Text>
        {sourcesError ? (
          <Text size="xs" c="red">
            Sources failed to load ({sourcesError}).
          </Text>
        ) : sources === null ? (
          <Text size="xs" c="dimmed">
            Loading sources…
          </Text>
        ) : sources.length === 0 ? (
          <Text size="xs" c="dimmed">
            No source text for this place.
          </Text>
        ) : (
          <Stack gap={6}>
            {sources.map(s => (
              <SourceRow key={s.source_id} source={s} />
            ))}
          </Stack>
        )}

        <Flex wrap="wrap" gap="10">
          <Link href={adminUrl} display="flex" style={{ alignItems: 'center' }}>
            Open in admin
          </Link>
        </Flex>
      </Stack>
    </Popup>
  );
};

function SourceRow({ source: s }: { source: SourceText }) {
  const [open, setOpen] = useState(false);
  const long = s.body.length > 280;
  const credit = [s.publisher, s.author, s.licence, s.lang].filter(Boolean).join(' · ');
  return (
    <Stack gap={2} style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 6 }}>
      <Text size="xs">
        <Text span fw={700}>
          {KIND_LABEL[s.kind] ?? s.kind}
        </Text>
        {s.used ? ' · used' : ''}
        {s.added_id ? ' · added by hand' : ''}
        {s.title ? ` · ${s.title}` : ''}
      </Text>
      <Text size="xs" lineClamp={open || !long ? undefined : 4} style={{ whiteSpace: 'pre-wrap' }}>
        {s.body}
      </Text>
      <Flex gap={8} wrap="wrap">
        <Text size="xs" c="dimmed">
          {credit}
          {credit ? ' · ' : ''}
          {s.body.length.toLocaleString('sv-SE')} chars
        </Text>
        {long ? (
          <Text
            size="xs"
            component="button"
            type="button"
            c="blue"
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
            onClick={() => setOpen(!open)}
          >
            {open ? 'Less' : 'More'}
          </Text>
        ) : null}
        {s.url ? (
          <Text size="xs" component="a" href={s.url} target="_blank" rel="noreferrer" c="blue">
            Open
          </Text>
        ) : null}
      </Flex>
    </Stack>
  );
}

export default PointPopup;
