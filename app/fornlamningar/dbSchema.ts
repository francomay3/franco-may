import z from 'zod';

export const fornlamningSchema = z.object({
  name: z.string().optional().default('Unknown Site'),
  latitude: z.number(),
  longitude: z.number(),
  generatedDescription: z.string().nullable().optional().default(null),
  url: z.string().url(),
  class: z.string(),
  uuid: z.string().uuid(),
});

export type Fornlamning = z.infer<typeof fornlamningSchema>;
