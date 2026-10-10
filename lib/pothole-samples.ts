import manifest from "@/data/pothole-samples.json";

export const potholeDataset = manifest;
export type PotholeSample = (typeof manifest.samples)[number];
