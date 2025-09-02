import { z } from "zod";
import { TrainModel, GenerateImage, GenerateImagesFromPack } from "./types";

export type TrainModel = z.infer<typeof TrainModel>;
export type GenerateImage = z.infer<typeof GenerateImage>;
export type GenerateImagesFromPack = z.infer<typeof GenerateImagesFromPack>;