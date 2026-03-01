import { LLMProvider } from "./types";

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(apiKey: string, baseURL: string, model: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.model = model;
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
      if (status === 401) throw new Error("Authentication failed");
      if (status === 429) throw new Error("Rate limit exceeded");
      if (status >= 500) throw new Error("Provider server error");
      throw new Error("Provider error");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
