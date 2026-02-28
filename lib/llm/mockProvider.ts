import { LLMProvider } from "./types";

export class MockProvider implements LLMProvider {
  async generateResponse(prompt: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return `Mock response to: "${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}"`;
  }
}
