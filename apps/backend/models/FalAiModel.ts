import { BaseModel } from "./BaseModel";
import { fal } from "@fal-ai/client";

export class FalAiModel extends BaseModel {
    constructor() {
        super();
    }

    public override async generateImages(prompt: string, tensorPath: string) {
        const { request_id, response_url } = await fal.queue.submit("fal-ai/flux-lora", {
            input: {
              prompt:prompt,
              loras: [{path: tensorPath, scale: 1}]
            }
          });
        return { request_id, response_url };
    }

    public override async trainModel(zipUrl: string, triggerWord: string) {
        const { request_id, response_url } = await fal.queue.submit("fal-ai/flux-lora-fast-training", {
            input: {
                images_data_url: zipUrl,
                trigger_word: triggerWord
            },
            webhookUrl: `${process.env.WEBHOOK_BASE_URL}/fal-ai/webhook`
        });
        return { request_id, response_url };
    }
}