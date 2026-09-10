'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  Map,
  type MapLayerMouseEvent,
  type ViewState,
  ScaleControl,
  FullscreenControl,
  NavigationControl,
  GeolocateControl,
  GeolocateControlOptions,
} from '@vis.gl/react-maplibre';
import { throttle } from 'lodash';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ICON_FOR_CLASS, FALLBACK_ICON } from './iconForClass';
import {
  Box,
  Button,
  Card,
  Checkbox,
  CloseButton,
  Group,
  LoadingOverlay,
  Overlay,
  Stack,
  Text,
} from '@mantine/core';
import metadata from '../../public/tiles/metadata.json';
import { isPointFeature, isTileMetadata, PointFeature } from './models';
import PointPopup from './PointPopup';
import { FORNLAMNINGAR_LAYER } from './constants';
import {
  useClickOutside,
  useDisclosure,
  useLocalStorage,
} from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { FILTER_FAMILIES, ALL_FAMILY_IDS } from './filterFamilies';
import { familyLabel } from './familyLabels';

// Filter on `family`, not on `class`. The exporter thins per family, so a
// family-level selection is a union of independently well-distributed sets and
// MapLibre's collision engine refills the space freed by whatever is hidden.
// Filtering on individual classes would cut inside a thinning bucket and leave
// the gaps back.
const buildFilter = (selected: string[]) => [
  'in',
  ['coalesce', ['get', 'family'], 'misc'],
  ['literal', selected],
];

export default function Fornlamningar() {
  const [selectedFeature, setSelectedFeature] = useState<PointFeature | null>(
    null
  );
  const [filters, setFilters] = useLocalStorage<string[]>({
    // Deliberately a new key. The old one stores RAA class names, which match
    // no family, so reusing it would show an empty map once on upgrade.
    key: 'fornlamningar-families',
    defaultValue: ALL_FAMILY_IDS,
  });
  const [
    isFiltersModalOpen,
    { close: closeFiltersModal, toggle: toggleFiltersModal },
  ] = useDisclosure(false);
  const filterModalRef = useClickOutside(() => closeFiltersModal());

  const [isPopupOpen, { open: openPopup, close: closePopup }] =
    useDisclosure(false);

  const [savedViewState, setSavedViewState] = useLocalStorage<{
    longitude: number;
    latitude: number;
    zoom: number;
  } | null>({
    key: 'fornlamningar-map-view',
    defaultValue: null,
  });

  const sourceMinZoom = isTileMetadata(metadata) ? Number(metadata.minzoom) : 0;
  const sourceMaxZoom = isTileMetadata(metadata)
    ? Number(metadata.maxzoom)
    : 11;

  const [isReady, setIsReady] = useState(false);
  React.useEffect(() => setIsReady(true), []);

  const initialViewState = useMemo(() => {
    if (savedViewState) {
      return {
        longitude: savedViewState.longitude,
        latitude: savedViewState.latitude,
        zoom: savedViewState.zoom,
      };
    }
    if (isTileMetadata(metadata) && metadata.bounds) {
      const [w, s, e, n] = metadata.bounds.split(',').map(Number);
      return { bounds: [w, s, e, n] as [number, number, number, number] };
    }
    return { longitude: 13.623047, latitude: 58.216995, zoom: 6 };
  }, [isReady, savedViewState]);

  // prettier-ignore
  const mapStyle = useMemo(
    () => ({
      version: 8 as const,

      sprite: `${process.env.NEXT_PUBLIC_DOMAIN}/fornlamningar-icons/icons`,

      sources: {
        osm: {
          type: 'raster' as const,
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
        fornlamningar: {
          type: 'vector' as const,
          tiles: [`${process.env.NEXT_PUBLIC_DOMAIN}/tiles/{z}/{x}/{y}.pbf?v=13`],
          minzoom: sourceMinZoom,
          maxzoom: sourceMaxZoom,
          attribution: '© Franco May / RAÄ data',
        },
      },
      layers: [
        { id: 'osm-tiles', type: 'raster' as const, source: 'osm' },
        {
          id: FORNLAMNINGAR_LAYER,
          type: 'symbol' as const,
          source: 'fornlamningar',
          'source-layer': 'archaeological_sites',
          minzoom: 0,
          maxzoom: 24,
          filter: buildFilter(filters),
          layout: {
            'symbol-sort-key': ['-', ['coalesce', ['get', 'score'], 0]],
            'icon-allow-overlap': false,
            'icon-ignore-placement': false,
            'icon-padding': 2,
            // Built from the generated ICON_FOR_CLASS table so it cannot
            // drift from the sprite. All 153 classes the pipeline emits are
            // covered; FALLBACK_ICON is only reachable if the tiles get a
            // class the icon set has not seen yet.
            'icon-image': [
              'match',
              ['get', 'class'],
              ...Object.entries(ICON_FOR_CLASS).flat(),
              FALLBACK_ICON,
            ],
            // A 64 px sprite, so size = drawn px / 64. The previous ramp
            // (0.05 at z3, 0.15 at z12) drew them at 3-10 px, which is why the
            // icons were never really visible; it went unnoticed while the low
            // zooms had almost no points left in them at all.
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.22,
              8, 0.28,
              12, 0.34,
              16, 0.42,
            ],
            'icon-anchor': 'center',
          },
        },
      ],
    }),
    [sourceMinZoom, sourceMaxZoom, filters]
  );

  const onMouseEnter = () => (document.body.style.cursor = 'pointer');
  const onMouseLeave = () => (document.body.style.cursor = 'default');

  const throttledSaveViewState = useCallback(
    throttle((viewState: ViewState) => {
      setSavedViewState({
        longitude: viewState.longitude,
        latitude: viewState.latitude,
        zoom: viewState.zoom,
      });
    }, 500),
    [setSavedViewState]
  );

  const onMove = (evt: { viewState: ViewState }) =>
    throttledSaveViewState(evt.viewState);

  const onClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') {
      return;
    }
    if (!isPointFeature(feature)) {
      return;
    }

    setSelectedFeature(feature);
    openPopup();
  };

  const geolocateControlOptions: GeolocateControlOptions = {
    positionOptions: { enableHighAccuracy: true },
    showAccuracyCircle: true,
    showUserLocation: true,
    trackUserLocation: true,
  };

  if (!isReady) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <Box
        pos="absolute"
        left="0"
        top="0"
        bottom="0"
        right="0"
        data-testid="map"
      >
        <Map
          mapStyle={mapStyle as any}
          initialViewState={initialViewState}
          minZoom={3}
          maxZoom={19}
          style={{ width: '100%', height: '100%' }}
          interactiveLayerIds={[FORNLAMNINGAR_LAYER]}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
          onMove={onMove}
        >
          {isPopupOpen && selectedFeature && (
            <PointPopup feature={selectedFeature} onClose={closePopup} />
          )}
          <ScaleControl />
          <FullscreenControl />
          <NavigationControl />
          <GeolocateControl {...geolocateControlOptions} />
          <Button
            size="xs"
            variant="default"
            onClick={toggleFiltersModal}
            style={{ top: '8px', left: '8px' }}
            leftSection={<IconFilter size={16} />}
          >
            Filters
          </Button>
          {isFiltersModalOpen && (
            <Overlay pt="lg" blur={2}>
              <Box pos="relative" w="fit-content" mx="auto" my="auto">
                <Card
                  maw={400}
                  mah={500}
                  title="Filters"
                  style={{ overflow: 'auto' }}
                  ref={filterModalRef}
                >
                  <Stack>
                    {FILTER_FAMILIES.map(family => (
                      <Checkbox
                        key={family.id}
                        label={
                          <Group gap="xs" wrap="nowrap">
                            {/* The sprite is only reachable from the map
                                canvas, so the filter list uses the same
                                glyphs as standalone SVGs. */}
                            <img
                              src={`${process.env.NEXT_PUBLIC_DOMAIN}/fornlamningar-icons/svg/${family.icon}.svg`}
                              alt=""
                              width={24}
                              height={24}
                              style={{ display: 'block', flexShrink: 0 }}
                            />
                            <Text size="sm">
                              {familyLabel(family.id)}{' '}
                              <Text span c="dimmed" size="sm">
                                ({family.counts[0].toLocaleString('sv-SE')})
                              </Text>
                            </Text>
                          </Group>
                        }
                        checked={filters.includes(family.id)}
                        onChange={() =>
                          setFilters(
                            filters.includes(family.id)
                              ? filters.filter(f => f !== family.id)
                              : [...filters, family.id]
                          )
                        }
                      />
                    ))}
                  </Stack>
                </Card>
                <CloseButton
                  onClick={closeFiltersModal}
                  pos="absolute"
                  top="8px"
                  right="12px"
                />
              </Box>
            </Overlay>
          )}
        </Map>
      </Box>
    </>
  );
}
