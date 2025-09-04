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
import {
  Box,
  Button,
  Card,
  Checkbox,
  CloseButton,
  LoadingOverlay,
  Overlay,
  Stack,
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

const availableFilters = [
  'Lägenhetsbebyggelse',
  'Husgrund, historisk tid',
  'Hög',
  'Stensättning',
  'Röse',
  'Blästplats',
  'Källa med tradition',
  'Bytomt/gårdstomt',
  'Hällristning',
  'Grav markerad av sten/block',
  'Område med skogsbrukslämningar',
  'Naturföremål/-bildning med bruk, tradition eller namn',
  'Gränsmärke',
  'Stenkammargrav',
  'Fartygs-/båtlämning',
  'Fångstgropssystem',
  'Gravfält',
  'Fångstgrop',
  'Runristning',
  'Other',
];

const buildFilter = (selected: string[]) => {
  const wantOther = selected.includes('Other');
  const selectedKnown = selected.filter(c => c !== 'Other');

  const any: any[] = ['any'];

  if (selectedKnown.length) {
    any.push(['in', ['get', 'class'], ['literal', selectedKnown]]);
  }

  if (wantOther) {
    any.push([
      '!',
      ['in', ['coalesce', ['get', 'class'], ''], ['literal', availableFilters]],
    ]);
  }

  return any.length > 1 ? any : ['in', ['get', 'class'], ['literal', []]];
};

export default function Fornlamningar() {
  const [selectedFeature, setSelectedFeature] = useState<PointFeature | null>(
    null
  );
  const [filters, setFilters] = useLocalStorage<string[]>({
    key: 'fornlamningar-filters',
    defaultValue: availableFilters,
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
          tiles: [`${process.env.NEXT_PUBLIC_DOMAIN}/tiles/{z}/{x}/{y}.pbf`],
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
            'symbol-sort-key': ['-', ['coalesce', ['get', 'relevance'], 0]],
            'icon-allow-overlap': false,
            'icon-ignore-placement': false,
            'icon-padding': 2,
            'icon-image': [
              'match',
              ['get', 'class'],
              'Lägenhetsbebyggelse', 'building',
              'Husgrund, historisk tid', 'hut',
              'Hög', 'maya',
              'Stensättning', 'bones',
              'Röse', 'stonehenge',
              'Blästplats', 'anvil',
              'Källa med tradition', 'greek-temple',
              'Bytomt/gårdstomt', 'hut',
              'Hällristning', 'cave-painting',
              'Grav markerad av sten/block', 'bones',
              'Område med skogsbrukslämningar', 'hut',
              'Naturföremål/-bildning med bruk, tradition eller namn', 'greek-temple',
              'Gränsmärke', 'shield',
              'Stenkammargrav', 'stonehenge',
              'Fartygs-/båtlämning', 'drakkar',
              'Fångstgropssystem', 'weapon',
              'Gravfält', 'bones',
              'Fångstgrop', 'weapon',
              'Runristning', 'moai',
              'question-mark',
            ],
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 0.05,
              12, 0.15,
              18, 0.3,
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
                    {availableFilters.map(filter => (
                      <Checkbox
                        key={filter}
                        label={filter}
                        checked={filters.includes(filter)}
                        onChange={() =>
                          setFilters(
                            filters.includes(filter)
                              ? filters.filter(f => f !== filter)
                              : [...filters, filter]
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
