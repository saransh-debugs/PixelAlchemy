import express, { raw } from "express";
import { TrainModel, GenerateImage, GenerateImagesFromPack } from "common/types";
import { prismaClient } from "db";
import { S3Client } from "bun";
import { FalAiModel } from "./models/FalAiModel";
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8080;

const FALAIMODEL = new FalAiModel();

app.get("/pre-signed-url", async (req, res) => {
  const key = `models/${Date.now()}_${Math.random()}.zip`;
  const url = S3Client.presign(key, {
    method: "PUT",
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.ENDPOINT,
    bucket: process.env.BUCKET_NAME,
    expiresIn: 60 * 5,
    type: "application/zip",
  });

  res.json({
    url,
    key,
  });
});

app.post("/ai/training", async (req, res) => {
  try {
    const parsedBody = TrainModel.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(411).json({
        message: "Input incorrect",
        error: parsedBody.error,
      });
      return;
    }

    const { request_id, response_url } = await FALAIMODEL.trainModel(
      parsedBody.data.zipUrl,
      parsedBody.data.name
    );

    const data = await prismaClient.model.create({
      data: {
        name: parsedBody.data.name,
        type: parsedBody.data.type,
        age: parsedBody.data.age,
        ethinicity: parsedBody.data.ethinicity,
        eyeColor: parsedBody.data.eyeColor,
        bald: parsedBody.data.bald,
        userId: "QWERTY",
        zipUrl: parsedBody.data.zipUrl,
        falAiRequestId: request_id,
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
});

app.post("/ai/generate", async(req, res) => {
  const parsedBody = GenerateImage.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(411).json({ message: "Input incorrect" });
  }
  try {
    const model = await prismaClient.model.findUnique({
      where: {
        id: parsedBody.data.modelId,
      },
    });
    if (!model || !model.tensorPath) {
      return res.status(411).json({ message: "Model not found" });
    }
    const { request_id, response_url } = await FALAIMODEL.generateImages(
      parsedBody.data.prompt,
      model.tensorPath
    );
  
    const data = await prismaClient.outputImages.create({
      data: {
        prompt: parsedBody.data.prompt,
        userId: "QWERTY",
        modelId: parsedBody.data.modelId,
        imageUrl: "",
        falAiRequestId: request_id,
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

app.post("/ai/generate", async (req, res) => {
  const parsedBody = GenerateImage.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(411).json({});
    return;
  }

  const model = await prismaClient.model.findUnique({
    where: {
      id: parsedBody.data.modelId,
    },
  });

  if (!model || !model.tensorPath) {
    res.status(411).json({
      message: "Model not found",
    });
    return;
  }
  // check if the user has enough credits
  const credits = await prismaClient.userCredit.findUnique({
    where: {
      userId: "QWERTY",
    },
  });
  const { request_id, response_url } = await FALAIMODEL.generateImages(
    parsedBody.data.prompt,
    model.tensorPath
  );

  const data = await prismaClient.outputImages.create({
    data: {
      prompt: parsedBody.data.prompt,
      userId: "QWERTY",
      modelId: parsedBody.data.modelId,
      imageUrl: "",
      falAiRequestId: request_id,
    },
  });

  await prismaClient.userCredit.update({
    where: {
      userId: "QWERTY",
    },
    data: {
      amount: { decrement: 1 },
    },
  });

  res.json({
    imageId: data.id,
  });
});

app.post("/pack/generate", async (req, res) => {
  const parsedBody = GenerateImagesFromPack.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(411).json({
      message: "Input incorrect",
    });
    return;
  }

  const prompts = await prismaClient.packPrompts.findMany({
    where: {
      packId: parsedBody.data.packId,
    },
  });

  const model = await prismaClient.model.findFirst({
    where: {
      id: parsedBody.data.modelId,
    },
  });

  if (!model) {
    res.status(411).json({
      message: "Model not found",
    });
    return;
  }

  let requestIds: { request_id: string }[] = await Promise.all(
    prompts.map((prompt) =>
      FALAIMODEL.generateImages(prompt.prompt, model.tensorPath!)
    )
  );

  const images = await prismaClient.outputImages.createManyAndReturn({
    data: prompts.map((prompt, index) => ({
      prompt: prompt.prompt,
      userId: "QWERTY",
      modelId: parsedBody.data.modelId,
      imageUrl: "",
      falAiRequestId: requestIds[index]?.request_id,
    })),
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