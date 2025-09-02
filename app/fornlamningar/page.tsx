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
import { Box, LoadingOverlay } from '@mantine/core';
import metadata from '../../public/tiles/metadata.json';
import { isPointFeature, isTileMetadata, PointFeature } from './models';
import PointPopup from './PointPopup';
import { FORNLAMNINGAR_LAYER } from './constants';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';

export default function Fornlamningar() {
  const [selectedFeature, setSelectedFeature] = useState<PointFeature | null>(
    null
  );
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

  // Wait for localStorage to be ready, then calculate initial view state
  const [isReady, setIsReady] = useState(false);
  React.useEffect(() => {
    setIsReady(true);
  }, []);

  const initialViewState = useMemo(() => {
    if (savedViewState) {
      return {
        longitude: savedViewState.longitude,
        latitude: savedViewState.latitude,
        zoom: savedViewState.zoom,
      };
    }

    if (isTileMetadata(metadata) && metadata.bounds) {
      const [west, south, east, north] = metadata.bounds.split(',').map(Number);
      return {
        bounds: [west, south, east, north] as [number, number, number, number],
      };
    }

    return { longitude: 13.623047, latitude: 58.216995, zoom: 6 };
  }, [isReady, savedViewState]);

  const mapStyle = useMemo(
    () => ({
      version: 8 as const,
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
          type: 'circle' as const,
          source: 'fornlamningar',
          'source-layer': 'archaeological_sites',
          minzoom: 0,
          maxzoom: 24,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              5,
              2,
              sourceMaxZoom,
              4,
              24,
              10,
            ] as any,
            'circle-color': [
              'case',
              ['>=', ['get', 'relevance'], 10],
              '#2563eb', // blue for relevance 8+
              '#32a80e', // green for relevance < 8
            ] as any,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.8,
          },
        },
      ],
    }),
    [sourceMinZoom, sourceMaxZoom]
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

  const onMove = (evt: { viewState: ViewState }) => {
    throttledSaveViewState(evt.viewState);
  };

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
    <Box w="100%" h="500px" data-testid="map">
      <Map
        mapStyle={mapStyle}
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
      </Map>
    </Box>
  );
}
