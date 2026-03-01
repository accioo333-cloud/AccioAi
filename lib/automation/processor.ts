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
  const prompt = `Summarize this article in a clear, engaging way.

Title: ${title}

Content: ${content.slice(0, 2000)}

Provide:
1. SUMMARY: 2-3 sentences (max 60 words)
2. INSIGHTS: 3 bullet points with specific details
3. ACTION: One thing the reader can do

Format your response EXACTLY like this:

SUMMARY:
[Your 2-3 sentence summary here]

INSIGHTS:
- [First specific insight]
- [Second specific insight]
- [Third specific insight]

ACTION:
[One actionable takeaway]`;

  try {
    const response = await generateResponse(prompt);
    
    // Parse response
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]*?)(?=INSIGHTS:|$)/i);
    const insightsMatch = response.match(/INSIGHTS:\s*([\s\S]*?)(?=ACTION:|$)/i);
    const actionMatch = response.match(/ACTION:\s*([\s\S]*?)$/i);
    
    let summary = summaryMatch?.[1]?.trim() || "";
    summary = summary.replace(/\[.*?\]/g, '').trim();
    
    const insightsText = insightsMatch?.[1] || "";
    const insights = insightsText
      .split(/[\n\-•]/)
      .map(i => i.trim())
      .filter(i => i.length > 15 && !i.toLowerCase().includes('['))
      .slice(0, 3);
    
    let action_takeaway = actionMatch?.[1]?.trim() || "";
    action_takeaway = action_takeaway.replace(/\[.*?\]/g, '').trim();
    
    // Validate we got real content
    if (!summary || summary.length < 20 || insights.length === 0) {
      throw new Error("LLM returned incomplete response");
    }
    
    return {
      summary,
      insights,
      action_takeaway: action_takeaway || "Read the full article for more details",
    };
  } catch (error) {
    logError("LLM processing failed", { error: String(error), title });
    
    // Better fallback - use actual content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 2).join('. ').slice(0, 200) + '.';
    
    return {
      summary: summary || title,
      insights: [
        "This article discusses " + title.toLowerCase(),
        "Key information is available in the full article",
        "Read more for detailed insights"
      ],
      action_takeaway: "Click 'Read Full Article' for complete details",
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
