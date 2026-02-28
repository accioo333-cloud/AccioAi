import { LLMProvider } from "./types";

const MAX_RESPONSE_SIZE = 10000; // 10KB limit
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(apiKey: string, baseURL: string = GROQ_BASE_URL, model?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.model = model || process.env.LLM_MODEL || DEFAULT_MODEL;
  }

  async generateResponse(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401) throw new Error("PROVIDER_AUTH_ERROR");
      if (status === 429) throw new Error("PROVIDER_RATE_LIMIT");
      if (status >= 500) throw new Error("PROVIDER_SERVER_ERROR");
      throw new Error("PROVIDER_ERROR");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (content.length > MAX_RESPONSE_SIZE) {
      return content.slice(0, MAX_RESPONSE_SIZE);
    }

    return content;
  }

  async *generateStreamingResponse(prompt: string, signal?: AbortSignal): AsyncGenerator<string> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_tokens: 1000,
      }),
      signal,
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401) throw new Error("PROVIDER_AUTH_ERROR");
      if (status === 429) throw new Error("PROVIDER_RATE_LIMIT");
      if (status >= 500) throw new Error("PROVIDER_SERVER_ERROR");
      throw new Error("PROVIDER_ERROR");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("PROVIDER_ERROR");

    const decoder = new TextDecoder();
    let buffer = "";
    let totalSize = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              totalSize += content.length;
              if (totalSize > MAX_RESPONSE_SIZE) break;
              yield content;
            }
          } catch {
            // Skip malformed JSON
          }
        }

        if (totalSize > MAX_RESPONSE_SIZE) break;
      }
    } finally {
      reader.releaseLock();
    }
  }
}
