'use client';

import { useLocation } from '@/hooks/useLocation';
import { useEffect, useRef, useState } from 'react';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box } from '@mantine/core';

const FORN_LAYER_ID = 'fornlamningar-layer';

export default function Fornlamningar() {
  const { latitude, longitude, accuracy, permission } = useLocation();
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude || !mapLoaded) {
      return;
    }

    console.log(latitude, longitude, accuracy, permission);
  }, [latitude, longitude, mapLoaded, permission]);

  useEffect(() => {
    mapRef.current = new Map({
      container: 'map',
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
            minzoom: 0,
            maxzoom: 13,
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 22,
          },
          {
            id: FORN_LAYER_ID,
            type: 'circle',
            source: 'fornlamningar',
            'source-layer': 'archaeological_sites',
            paint: {
              'circle-radius': [
                'case',
                ['<=', ['get', 'relevance'], 1],
                4,
                ['<=', ['get', 'relevance'], 3],
                6,
                ['>=', ['get', 'relevance'], 4],
                10,
                12,
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
      // sweden bounds
      // maxBounds: [
      //   8.867567633656762, 54.3415942138422, 26.25054001383762, 69.703179281806,
      // ],
    });

    mapRef.current.on('style.load', () => {
      setMapLoaded(true);

      mapRef.current?.setProjection({
        type: 'globe',
      });
    });

    mapRef.current.on('mouseenter', FORN_LAYER_ID, () => {
      mapRef.current?.getCanvas().style.setProperty('cursor', 'pointer');
    });
    mapRef.current.on('mouseleave', FORN_LAYER_ID, () => {
      mapRef.current?.getCanvas().style.setProperty('cursor', 'default');
    });

    mapRef.current.on('click', FORN_LAYER_ID, e => {
      console.log(e.features?.[0]?.properties);
    });
  }, []);

  return <Box id="map" w="100%" h="500px" />;
}
