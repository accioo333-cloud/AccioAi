// Groq LLM Provider
export async function generateResponse(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required");
  }

  const model = process.env.LLM_MODEL || "llama-3.1-8b-instant";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
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
