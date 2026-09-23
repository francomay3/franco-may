'use client';

import React from 'react';
import { Map, Marker, NavigationControl } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Where this place is, on satellite imagery.
 *
 * Esri's World Imagery tiles, which need no key. Google's satellite would,
 * and a key is an account this page should not depend on. The pin is the
 * cluster centroid the public map already uses, so the two agree.
 *
 * The attribution is Esri's required line. It has to stay visible.
 */
const STYLE = {
  version: 8 as const,
  sources: {
    satellite: {
      type: 'raster' as const,
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
  },
  layers: [{ id: 'satellite', type: 'raster' as const, source: 'satellite' }],
};

export function PlaceMap({ lon, lat }: { lon: number; lat: number }) {
  return (
    <div className="fl-map">
      <Map
        initialViewState={{ longitude: lon, latitude: lat, zoom: 16 }}
        mapStyle={STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        <Marker longitude={lon} latitude={lat} color="#8C4E3E" />
        <NavigationControl position="top-right" showCompass={false} />
      </Map>
    </div>
  );
}
