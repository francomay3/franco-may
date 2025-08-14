import NextImage from 'next/image';
import {
  Box,
  BoxProps,
  Image as MantineImage,
  ImageProps as MantineImageProps,
} from '@mantine/core';

interface ImageProps
  extends BoxProps,
    Omit<MantineImageProps, 'component' | 'src' | 'alt'> {
  src: string;
  alt: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

function Image({ src, alt, fit = 'cover', ...props }: ImageProps) {
  return (
    <Box
      {...props}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...(props.style || {}),
      }}
      bdrs="var(--mantine-radius-default)"
    >
      <MantineImage
        component={NextImage}
        src={src}
        alt={alt}
        fill
        style={{
          objectFit: fit,
        }}
      />
    </Box>
  );
}

export default Image;
