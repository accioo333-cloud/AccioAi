import { LLMProvider } from "./types";
import { OpenAIProvider } from "./openaiProvider";
import { MockProvider } from "./mockProvider";

export function getProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (apiKey) {
    return new OpenAIProvider(apiKey);
  }
  
  return new MockProvider();
}
