import React from 'react';
import { PointFeature } from './models';
import { Popup } from '@vis.gl/react-maplibre';
import { Title, Text, Anchor } from '@mantine/core';

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

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      offset={5}
      onClose={onClose}
    >
      <Title order={3}>{feature.properties.label}</Title>
      <Text>{feature.properties.description}</Text>
      <Anchor href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
        Open in Google Maps
      </Anchor>
    </Popup>
  );
};

export default PointPopup;
