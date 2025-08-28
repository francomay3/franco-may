import { Button, CloseButton, Text, Title, Typography } from '@mantine/core';
import {
  InfoWindow,
  AdvancedMarker,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { Fornlamning } from './dbSchema';
import getIcon from './getIcon';
import Link from '@/components/Link';

export const MarkerWithInfoWindow = ({
  position,
  site,
  opened,
  onOpen,
  selected,
  onClose,
}: {
  position: { lat: number; lng: number };
  site: Fornlamning;
  opened: boolean;
  onOpen: () => void;
  onClose: () => void;
  selected: boolean;
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();

  // TODO: if selected, show distance to selected site

  return (
    <div className={`advanced-marker ${selected ? 'selected' : ''}`}>
      <AdvancedMarker ref={markerRef} position={position} onClick={onOpen}>
        {getIcon(site.class, selected)}
      </AdvancedMarker>

      {opened && (
        <InfoWindow anchor={marker}>
          <Typography pt="xs" pb="xs" style={{ position: 'relative' }}>
            <CloseButton
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 12,
                right: 0,
              }}
            />
            <Title order={4}>{site.name}</Title>
            <Text>{site.generatedDescription}</Text>
            <Link href={site.url} target="_blank">
              <Button variant="filled">Read more</Button>
            </Link>
          </Typography>
        </InfoWindow>
      )}
    </div>
  );
};
