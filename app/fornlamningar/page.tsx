'use client';

import { useLocation } from '@/hooks/useLocation';
import { useEffect, useRef, useState } from 'react';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box } from '@mantine/core';
import metadata from '../api/fornlamningar/(tiles)/metadata.json';

const FORN_LAYER_ID = 'fornlamningar-layer';

export default function Fornlamningar() {
  const { latitude, longitude, accuracy, permission } = useLocation();
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const minzoom = Number(metadata.minzoom);
  const sourceMaxZoom = Number(metadata.maxzoom);

  useEffect(() => {
    // init map
    const map = new Map({
      container: 'map',
      minZoom: 6,
      maxZoom: 22, // view zoom cap (independent of source tiles)
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
          fornlamningar: {
            type: 'vector',
            tiles: [
              `${process.env.NEXT_PUBLIC_DOMAIN}/api/fornlamningar/tiles/{z}/{x}/{y}.pbf`,
            ],
            minzoom, // e.g. 0
            maxzoom: sourceMaxZoom, // e.g. 11 — tells MapLibre when to start overzooming
            attribution: '© You / RAÄ data',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
          },
          {
            id: FORN_LAYER_ID,
            type: 'circle',
            source: 'fornlamningar',
            'source-layer': 'archaeological_sites',
            // allow rendering far past the source maxzoom so we see overzoomed vectors
            minzoom,
            maxzoom: 24,
            paint: {
              // keep growing after the last *tile* zoom so points stay readable
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                5,
                2,
                sourceMaxZoom,
                4, // last real tile zoom
                24,
                10, // keep scaling while overzoomed
              ],
              'circle-color': '#32a80e',
              'circle-stroke-width': 1,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-opacity': 0.8,
            },
          },
        ],
      },
      center: [12.1, 57.5],
      zoom: 8,
    });

    mapRef.current = map;

    map.on('style.load', () => setMapLoaded(true));

    map.on('mouseenter', FORN_LAYER_ID, () => {
      map.getCanvas().style.setProperty('cursor', 'pointer');
    });
    map.on('mouseleave', FORN_LAYER_ID, () => {
      map.getCanvas().style.setProperty('cursor', 'default');
    });
    map.on('click', FORN_LAYER_ID, e => {
      console.log(e.features?.[0].properties);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [minzoom, sourceMaxZoom]);

  useEffect(() => {
    if (
      !mapRef.current ||
      latitude == null ||
      longitude == null ||
      !mapLoaded
    ) {
      return;
    }
    console.log({ latitude, longitude, accuracy, permission });
  }, [latitude, longitude, accuracy, permission, mapLoaded]);

  return <Box id="map" w="100%" h="500px" data-testid="map" />;
}
