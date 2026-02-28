export interface LLMProvider {
  generateResponse(prompt: string): Promise<string>;
  generateStreamingResponse?(prompt: string, signal?: AbortSignal): AsyncGenerator<string>;
}
