import { generateResponse } from "@/lib/llm";
import { logError } from "@/lib/logger";

interface ProcessedContent {
  summary: string;
  insights: string[];
  action_takeaway: string;
}

export async function processContentWithLLM(
  title: string,
  content: string
): Promise<ProcessedContent> {
  const prompt = `Analyze this article and provide:
1. A concise summary (2-3 sentences)
2. Three key insights (bullet points)
3. One actionable takeaway

Article Title: ${title}

Article Content:
${content.slice(0, 3000)}

Respond in JSON format:
{
  "summary": "...",
  "insights": ["...", "...", "..."],
  "action_takeaway": "..."
}`;

  try {
    const response = await generateResponse(prompt);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in LLM response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      summary: parsed.summary || "",
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [],
      action_takeaway: parsed.action_takeaway || "",
    };
  } catch (error) {
    logError("LLM processing failed", { error: String(error) });
    
    // Fallback to basic processing
    return {
      summary: content.slice(0, 200) + "...",
      insights: ["Key point from article", "Important information", "Notable detail"],
      action_takeaway: "Review the full article for more details",
    };
  }
}

export function estimateReadingTime(content: string): number {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200); // Average reading speed
  return Math.max(1, Math.min(minutes, 30)); // Between 1-30 minutes
}

export function extractCategory(sourceCategory: string): string {
  const categoryMap: Record<string, string> = {
    tech: "technology",
    business: "business",
    science: "science",
    health: "health",
    news: "general",
  };
  
  return categoryMap[sourceCategory.toLowerCase()] || "general";
}

export function determineDifficulty(content: string): string {
  const wordCount = content.split(/\s+/).length;
  
  if (wordCount < 300) return "beginner";
  if (wordCount < 800) return "intermediate";
  return "advanced";
}
