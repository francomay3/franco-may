import { Title } from '@mantine/core';
import React from 'react';

const PageTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <Title order={1} ta="center" mb="lg" mt="sm">
      {children}
    </Title>
  );
};

export default PageTitle;
