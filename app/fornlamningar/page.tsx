'use client';

import PageTitle from '@/components/PageTitle';
import { Text, LoadingOverlay, useComputedColorScheme } from '@mantine/core';
import {
  APIProvider,
  Map,
  MapCameraChangedEvent,
} from '@vis.gl/react-google-maps';
import React, { useEffect, useState } from 'react';
import getFornlamningar from '@/app/actions/getFornlamningar';
import { MarkerWithInfoWindow } from './MarkerWithInfoWindow';
import { useDebouncedCallback, useDisclosure } from '@mantine/hooks';
import { Fornlamning } from './dbSchema';
import { useQuery } from '@tanstack/react-query';
import { Bounds } from '../models';
import { useLocation } from '@/hooks/useLocation';
import UserLocationMarker from './UserLocationMarker';

const Fornlamningar = () => {
  const [selectedSite, setSelectedSite] = useState<Fornlamning | null>(null);
  const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null);
  const [infoWindowOpen, { open: openInfoWindow, close: closeInfoWindow }] =
    useDisclosure(false);
  const {
    latitude,
    longitude,
    accuracy,
    // error,
    // loading,
    // startWatching,
    // stopWatching,
  } = useLocation();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
  }

  const {
    data: fornlamningar,
    isLoading,
    isError,
    refetch,
  } = useQuery<Fornlamning[], Error>({
    queryKey: ['fornlamningar'],
    queryFn: () => getFornlamningar(currentBounds),
  });

  const computedColorScheme = useComputedColorScheme();

  useEffect(() => {
    refetch();
  }, [currentBounds, refetch]);

  const handleCameraChanged = useDebouncedCallback(
    (event: MapCameraChangedEvent) => {
      const { map } = event;

      const bounds = map.getBounds();

      if (bounds) {
        const boundsData = {
          northeast: {
            lat: bounds.getNorthEast().lat(),
            lng: bounds.getNorthEast().lng(),
          },
          southwest: {
            lat: bounds.getSouthWest().lat(),
            lng: bounds.getSouthWest().lng(),
          },
        };

        setCurrentBounds(boundsData);
      }
    },
    100
  );

  if (isLoading) {
    return <LoadingOverlay visible={isLoading} />;
  }

  if (isError) {
    return <Text>Error fetching fornlamningar</Text>;
  }

  if (!fornlamningar) {
    return <Text>No fornlamningar found</Text>;
  }

  const center = {
    lat:
      fornlamningar.reduce((sum, site) => {
        return sum + site.latitude;
      }, 0) / fornlamningar.length,
    lng:
      fornlamningar.reduce((sum, site) => {
        return sum + site.longitude;
      }, 0) / fornlamningar.length,
  };

  const handleMapClick = () => {
    if (infoWindowOpen) {
      closeInfoWindow();
    } else {
      setSelectedSite(null);
    }
  };

  return (
    <>
      <PageTitle>Förnlamningar</PageTitle>
      <Text mb="md">selection: {selectedSite?.name || 'none'}</Text>

      <div style={{ position: 'relative', width: '100%', height: '600px' }}>
        <APIProvider apiKey={apiKey}>
          <Map
            colorScheme={computedColorScheme === 'dark' ? 'DARK' : 'LIGHT'}
            mapId="fornlamningar-map"
            style={{ width: '100%', height: '100%' }}
            defaultCenter={center}
            defaultZoom={8}
            gestureHandling="greedy"
            onClick={handleMapClick}
            onCameraChanged={handleCameraChanged}
          >
            <UserLocationMarker
              lat={latitude}
              lng={longitude}
              accuracy={accuracy}
            />
            {fornlamningar.map(site => (
              <MarkerWithInfoWindow
                key={site.uuid}
                position={{ lat: site.latitude, lng: site.longitude }}
                site={site}
                onOpen={() => {
                  setSelectedSite(site);
                  openInfoWindow();
                }}
                onClose={closeInfoWindow}
                opened={infoWindowOpen && selectedSite?.uuid === site.uuid}
                selected={selectedSite?.uuid === site.uuid}
              />
            ))}
          </Map>
        </APIProvider>
      </div>

      {fornlamningar.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <Text size="sm" color="dimmed">
            Showing {fornlamningar.length} archaeological sites
          </Text>
        </div>
      )}
    </>
  );
};

export default Fornlamningar;
