import { Overlay } from '@mantine/core';
import React from 'react';

const Glass = ({ children }: { children: React.ReactNode }) => {
  return (
    <Overlay
      style={{
        backgroundColor:
          'color-mix(in srgb, var(--mantine-color-body) 80%, transparent)',
      }}
      blur={5}
    >
      {children}
    </Overlay>
  );
};

export default Glass;
