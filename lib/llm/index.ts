import { LLMProvider } from "./types";
import { OpenAIProvider } from "./openaiProvider";
import { MockProvider } from "./mockProvider";
import { logInfo } from "@/lib/logger";

export function getProvider(): LLMProvider {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.LLM_MODEL || "llama-3.1-8b-instant";
  
  if (apiKey) {
    logInfo("Initializing Groq provider", { model });
    return new OpenAIProvider(apiKey, "https://api.groq.com/openai/v1", model);
  }
  
  logInfo("No API key found, using mock provider");
  return new MockProvider();
}
