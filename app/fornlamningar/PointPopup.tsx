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
import { IconExternalLink, IconBrandGoogleMaps } from '@tabler/icons-react';

const PointPopup = ({
  feature,
  onClose,
}: {
  feature: PointFeature;
  onClose: () => void;
}) => {
  const { uuid } = feature.properties;
  const [description, setDescription] =
    useState<PlaceDescription | null>(null);

  const subtitle = formatSize(description?.size);

  useEffect(() => {
    let live = true;
    setDescription(null);
    loadDescription(uuid).then(text => {
      if (live) {setDescription(text);}
    });
    return () => {
      live = false;
    };
  }, [uuid]);

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
      offset={10}
      onClose={onClose}
      onOpen={handlePopupOpen}
      maxWidth="400px"
      focusAfterOpen
    >
      <Stack>
        {/* A generated title beats the fallback label, which for an
            unnamed place is just its class name. */}
        <Title order={3}>
          {description?.title || feature.properties.label}
        </Title>
        <Text lang={description?.raw ? 'sv' : 'en'}>
          {description?.content ?? ''}
        </Text>
        {(description?.period || subtitle) && (
          <Text size="xs" c="dimmed" mt={-8}>
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
