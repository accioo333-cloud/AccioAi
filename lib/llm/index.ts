import { LLMProvider } from "./types";
import { OpenAIProvider } from "./openaiProvider";

export function getProvider(): LLMProvider {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required");
  }
  
  const model = process.env.LLM_MODEL || "llama-3.1-8b-instant";
  return new OpenAIProvider(apiKey, "https://api.groq.com/openai/v1", model);
}
