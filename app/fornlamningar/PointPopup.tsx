import React from 'react';
import { PointFeature } from './models';
import { LngLatLike, Popup, PopupEvent } from '@vis.gl/react-maplibre';
import { Title, Text, Flex, Stack } from '@mantine/core';
import Link from '@/components/Link';
import { IconExternalLink, IconBrandGoogleMaps } from '@tabler/icons-react';

const PointPopup = ({
  feature,
  onClose,
}: {
  feature: PointFeature;
  onClose: () => void;
}) => {
  const latitude = feature.geometry.coordinates[1];
  const longitude = feature.geometry.coordinates[0];
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  const raaeUrl = `https://app.raa.se/open/fornsok/lamning/${feature.properties.uuid}`;

  const handlePopupOpen = (e: PopupEvent) => {
    setTimeout(() => {
      const { _map: map, _container: popupElement } = e.target;

      if (popupElement && popupElement.getBoundingClientRect && map) {
        // Get the popup element's center position
        const rect = popupElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Get the map container to get its bounds
        const mapContainer = map.getContainer();
        if (mapContainer) {
          const mapRect = mapContainer.getBoundingClientRect();

          // Convert screen coordinates to relative coordinates within the map
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
      offset={5}
      onClose={onClose}
      onOpen={handlePopupOpen}
      maxWidth="400px"
      focusAfterOpen
    >
      <Stack>
        <Title order={3}>{feature.properties.label}</Title>
        <Text>{feature.properties.description}</Text>
        <Flex wrap="wrap" gap="10" justify="space-evenly">
          <Link
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            display="flex"
            style={{ alignItems: 'center', gap: '4px' }}
          >
            Open in Google Maps <IconBrandGoogleMaps size={16} />
          </Link>
          <Link
            href={raaeUrl}
            target="_blank"
            rel="noopener noreferrer"
            display="flex"
            style={{ alignItems: 'center', gap: '4px' }}
          >
            more data (RAÄ) <IconExternalLink size={16} />
          </Link>
        </Flex>
      </Stack>
    </Popup>
  );
};

export default PointPopup;
