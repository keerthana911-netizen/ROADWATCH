import { z } from "zod";
export const roadNetworkSchema = z.object({
  source: z.literal("OpenStreetMap contributors"),
  sourceUrl: z.string().url(),
  endpoint: z.string().url(),
  license: z.literal("ODbL 1.0"),
  retrievedAt: z.string().datetime(),
  sourceTimestamp: z.string(),
  region: z.string(),
  wardAssignment: z.string(),
  bounds: z.array(z.number()).length(4),
  ways: z
    .array(
      z.object({
        osmId: z.number().int().positive(),
        name: z.string().min(1),
        roadType: z.string(),
        coordinates: z
          .array(
            z.tuple([
              z.number().min(-90).max(90),
              z.number().min(-180).max(180),
            ]),
          )
          .min(2),
      }),
    )
    .min(1),
});
export type MappedRoad = z.infer<typeof roadNetworkSchema>["ways"][number];
