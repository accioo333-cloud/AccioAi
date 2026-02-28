import { LLMProvider } from "./types";

export class MockProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return `Mock response to: "${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}"`;
  }

  async *generateStreamingResponse(prompt: string, signal?: AbortSignal): AsyncGenerator<string> {
    const message = `Mock response to: "${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}"`;
    const words = message.split(" ");

    for (const word of words) {
      if (signal?.aborted) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
      yield word + " ";
    }
  }
}
