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
  const prompt = `You are a content curator creating engaging, scannable summaries for busy professionals.

Article: "${title}"

Content: ${content.slice(0, 2500)}

Create a summary following this EXACT format:

**Summary** (2-3 punchy sentences, max 60 words):
[Write clear, engaging summary here]

**Key Insights:**
• [First insight - specific and actionable]
• [Second insight - include data/numbers if available]
• [Third insight - surprising or counterintuitive]

**Action Takeaway:**
[One specific thing the reader can do today - start with a verb]

Rules:
- Be concise and specific
- Use active voice
- Include numbers/data when available
- Make it scannable
- No fluff or generic statements`;

  try {
    const response = await generateResponse(prompt);
    
    // Parse the structured response
    const summaryMatch = response.match(/\*\*Summary\*\*[\s\S]*?(.*?)(?=\*\*Key Insights|\*\*Action|$)/);
    const insightsMatch = response.match(/\*\*Key Insights[\s\S]*?\*\*([\s\S]*?)(?=\*\*Action|$)/);
    const actionMatch = response.match(/\*\*Action Takeaway[\s\S]*?\*\*([\s\S]*?)$/);
    
    const summary = summaryMatch?.[1]?.trim().replace(/\[.*?\]/g, '').trim() || "";
    
    const insightsText = insightsMatch?.[1] || "";
    const insights = insightsText
      .split(/[•\-\n]/)
      .map(i => i.trim())
      .filter(i => i.length > 10)
      .slice(0, 3);
    
    const action_takeaway = actionMatch?.[1]?.trim().replace(/\[.*?\]/g, '').trim() || "";
    
    // Fallback if parsing fails
    if (!summary || insights.length === 0) {
      throw new Error("Failed to parse LLM response");
    }
    
    return {
      summary,
      insights,
      action_takeaway,
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
    technology: "technology",
    tech: "technology",
    business: "business",
    science: "science",
    health: "health",
    design: "design",
    ai_ml: "ai_ml",
    "ai/ml": "ai_ml",
    startups: "startups",
    finance: "finance",
    news: "technology",
    general: "technology",
  };
  
  return categoryMap[sourceCategory.toLowerCase()] || "technology";
}

export function determineDifficulty(content: string): string {
  const wordCount = content.split(/\s+/).length;
  
  if (wordCount < 300) return "beginner";
  if (wordCount < 800) return "intermediate";
  return "advanced";
}
