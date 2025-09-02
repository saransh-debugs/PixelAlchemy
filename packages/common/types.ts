import { z } from "zod";

export const TrainModel = z.object({
    name: z.string().min(1),
    type: z.enum(["Man", "Woman", "Other"]),
    age: z.number().min(1).max(100),
    ethinicity: z.enum(["White", 
        "Black", 
        "Asian_American", 
        "East_Asian",
        "South_East_Asian", 
        "South_Asian", 
        "Middle_Eastern", 
        "Pacific", 
        "Hispanic"
    ]),
    eyeColor: z.enum(["Brown", "Blue", "Hazel", "Gray"]),
    bald: z.boolean(),
    zipUrl: z.string()
});

export const GenerateImage = z.object({
    prompt: z.string().min(1),
    modelId: z.string().min(1),
    num: z.number()
});

export const GenerateImagesFromPack = z.object({
    modelId: z.string(),
    packId: z.string(),
});
