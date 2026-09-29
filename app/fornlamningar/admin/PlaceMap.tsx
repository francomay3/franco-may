'use client';

import React, { useEffect, useState } from 'react';
import { Map, Marker, NavigationControl } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Where this place is, on satellite imagery.
 *
 * Esri's World Imagery tiles, which need no key. Google's satellite would,
 * and a key is an account this page should not depend on. The pin is where
 * the app stands this place. Dragging it reports a new position; the page
 * decides whether that position is kept.
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

export function PlaceMap({
  lon,
  lat,
  draggable = false,
  onMove,
}: {
  lon: number;
  lat: number;
  draggable?: boolean;
  onMove?: (lon: number, lat: number) => void;
}) {
  const [pos, setPos] = useState({ lon, lat });

  useEffect(() => {
    setPos({ lon, lat });
  }, [lon, lat]);

  return (
    <div className="fl-map">
      <Map
        initialViewState={{ longitude: lon, latitude: lat, zoom: 16 }}
        mapStyle={STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        <Marker
          longitude={pos.lon}
          latitude={pos.lat}
          color="#8C4E3E"
          draggable={draggable}
          onDrag={e => setPos({ lon: e.lngLat.lng, lat: e.lngLat.lat })}
          onDragEnd={e => {
            const next = { lon: e.lngLat.lng, lat: e.lngLat.lat };
            setPos(next);
            onMove?.(next.lon, next.lat);
          }}
        />
        <NavigationControl position="top-right" showCompass={false} />
      </Map>
    </div>
  );
}
