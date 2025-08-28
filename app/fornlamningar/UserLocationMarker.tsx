import { IconCircle } from '@tabler/icons-react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import React from 'react';

const UserLocationMarker = ({
  lat,
  lng,
  accuracy,
}: {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
}) => {
  if (!lat || !lng) {
    return null;
  }
  // TODO: accuracy circle should have a size that is proportional to the accuracy and the zoom level, to match the actual radius meters of accuracy
  return (
    <AdvancedMarker position={{ lat, lng }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr',
          alignItems: 'center',
          justifyItems: 'center',
        }}
      >
        <IconCircle
          size={16 + (accuracy ?? 0) * 0.5}
          color="var(--mantine-color-yellow-1)"
          stroke={1}
          fill="var(--mantine-color-yellow-8)"
          fillOpacity={0.3}
          strokeOpacity={0.5}
          style={{
            gridArea: '1/1',
          }}
        />
        <IconCircle
          size={16}
          color="var(--mantine-color-yellow-1)"
          fill="var(--mantine-color-yellow-8)"
          style={{
            gridArea: '1/1',
          }}
        />
      </div>
    </AdvancedMarker>
  );
};

export default UserLocationMarker;
