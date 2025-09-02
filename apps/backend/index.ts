import express, { raw } from "express";
import { TrainModel, GenerateImage, GenerateImagesFromPack } from "common/types";
import { prismaClient } from "db";
import { S3Client, s3, write } from "bun";
import { FalAiModel } from "./models/FalAiModel";
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8080;

const FALAIMODELS = new FalAiModel();

app.post("/ai/training", async (req, res) => {
  const parsedBody = TrainModel.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(411).json({ message: "Input incorrect" });
  }
  try {
  const images = req.body.images;
  await FALAIMODELS.trainModel(parsedBody.data.name, images);
  const data = await prismaClient.model.create({
    data: {
      name: parsedBody.data.name,
      type: parsedBody.data.type,
      age: parsedBody.data.age,
      ethinicity: parsedBody.data.ethinicity,
      eyeColor: parsedBody.data.eyeColor,
      bald: parsedBody.data.bald,
      zipUrl: parsedBody.data.zipUrl,
      userId: "QWERTY",
    },
  });
  res.json({
    modelId: data.id,
  });
  } catch (error) {
    console.error("Error in /ai/training:", error);
    res.status(500).json({
      message: "Training failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
})

app.post("/ai/generate", async(req, res) => {
  const parsedBody = GenerateImage.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(411).json({ message: "Input incorrect" });
  }
  try {
    const data = await prismaClient.outputImages.create({
      data: {
        modelId: parsedBody.data.modelId, 
        prompt: parsedBody.data.prompt,
        userId: "QWERTY",
        imageUrl: ""
      },
    });
    res.json({
      imageId: data.id,
    });
  } catch (error) {
    console.error("Error in /ai/generate:", error);
    res.status(500).json({
      message: "Generation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
})

app.post("/pack/generate", async (req, res) => {
  const parsedBody = GenerateImagesFromPack.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(411).json({ message: "Input incorrect" });
  }
  
  const prompt = await prismaClient.packPrompts.findMany({
    where: {
      packId: parsedBody.data.packId,
    }
  });

  // First create all records
  await prismaClient.outputImages.createMany({
    data: prompt.map((prompt: any) => ({
      prompt: prompt.prompt,
      modelId: parsedBody.data.modelId,
      userId: "QWERTY",
      imageUrl: ""
    }))
  });

  // Then fetch their IDs
  const images = await prismaClient.outputImages.findMany({
    where: {
      modelId: parsedBody.data.modelId,
      userId: "QWERTY"
    },
    select: {
      id: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: prompt.length
  });

  res.json({
    images: images.map((image) => image.id),
  });
});
app.get("/pack/bulk", async (req,res) => {
  const packs = await prismaClient.packs.findMany({})

})
app.get("/image/bulk", async (req,res) => {
  const ids = req.query.images as string[];
  const limit = (req.query.limit as string) ?? "10";
  const offset = (req.query.offset as string) ?? "0";

  const imagesData = await prismaClient.outputImages.findMany({
    where: {
      id: { in: ids },
      userId: "QWERTY",
    },
    skip: parseInt(offset),
    take: parseInt(limit),
  });
  res.json({
    images: imagesData
  });
})

app.post("/fal-ai/webhook/train", async (req, res) => {
  console.log(req.body);
  const requestId = req.body.request_id as string;
  await prismaClient.model.updateMany({
    where: {
      falAiRequestId: requestId,
    },
    data: {
      trainingStatus: "Generated",
      tensorPath: req.body.tensor_path,
    }
  });
  res.status(200).json({ message: "Webhook received" });
});

app.post("/fal-ai/webhook/image", async (req, res) => {
  console.log(req.body);
  const requestId = req.body.request_id as string;
  await prismaClient.outputImages.updateMany({
    where: {
      falAiRequestId: requestId,
    },
    data: {
      status: "Generated",
      imageUrl: req.body.image_url,
    }
  })

  res.status(200).json({ message: "Webhook received" });
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});