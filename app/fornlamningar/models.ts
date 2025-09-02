import z from 'zod';

export const zodPointFeature = z.object({
  geometry: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.object({
    description: z.string(),
    label: z.string(),
    relevance: z.number(),
    uuid: z.string(),
  }),
});

export type PointFeature = z.infer<typeof zodPointFeature>;

export const isPointFeature = (feature: unknown): feature is PointFeature => {
  const result = zodPointFeature.safeParse(feature);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.warn('PointFeature validation failed:', {
      feature,
      errors: result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
        received: 'received' in issue ? issue.received : undefined,
      })),
    });
    return false;
  }
  return true;
};

export const zodTileMetadata = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  minzoom: z.string(),
  maxzoom: z.string(),
  center: z.string(),
  bounds: z.string(),
  antimeridian_adjusted_bounds: z.string(),
  type: z.string(),
  strategies: z.string(),
  format: z.string(),
  generator: z.string(),
  generator_options: z.string(),
  json: z.string(),
});

export type TileMetadata = z.infer<typeof zodTileMetadata>;

export const isTileMetadata = (metadata: unknown): metadata is TileMetadata => {
  const result = zodTileMetadata.safeParse(metadata);
  if (!result.success) {
    // eslint-disable-next-line no-console
    console.warn('TileMetadata validation failed:', {
      metadata,
      errors: result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
        received: 'received' in issue ? issue.received : undefined,
      })),
    });
    return false;
  }
  return true;
};
