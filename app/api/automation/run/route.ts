import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/middleware/auth";
import { logInfo, logError } from "@/lib/logger";
import { fetchRSSFeed } from "@/lib/automation/rss-fetcher";
import {
  processContentWithLLM,
  estimateReadingTime,
  extractCategory,
  determineDifficulty,
} from "@/lib/automation/processor";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  logInfo("Automation run started", { requestId });

  // Check for CRON secret bypass
  const cronSecret = request.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  let supabase;

  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    logInfo("CRON secret authenticated", { requestId });
    supabase = await createClient();
  } else {
    // Require normal authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    supabase = authResult.supabase;
  }

  let runId: string | null = null;

  try {
    // Create automation run entry
    const { data: runData, error: runError } = await supabase
      .from("automation_runs")
      .insert({
        status: "running",
        started_at: new Date().toISOString(),
        items_fetched: 0,
        items_processed: 0,
      })
      .select()
      .single();

    if (runError || !runData) {
      throw new Error(`Failed to create automation run: ${runError?.message}`);
    }

    runId = runData.id;
    logInfo("Automation run created", { requestId, runId });

    // Fetch active content sources
    const { data: sources, error: sourcesError } = await supabase
      .from("content_sources")
      .select("*")
      .eq("is_active", true)
      .eq("source_type", "rss");

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      logInfo("No active RSS sources found", { requestId, runId });
      
      await supabase
        .from("automation_runs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);

      return NextResponse.json({
        success: true,
        data: { runId, message: "No active sources to process" },
      });
    }

    logInfo("Fetching from sources", { requestId, runId, count: sources.length });

    let totalFetched = 0;

    // Fetch content from each source
    for (const source of sources) {
      const articles = await fetchRSSFeed(source.source_url, source.id);

      for (const article of articles) {
        // Insert raw content with ON CONFLICT handling
        const { error: insertError } = await supabase
          .from("raw_content")
          .insert({
            source_id: source.id,
            title: article.title,
            content: article.content,
            url: article.url,
            image_url: article.image_url,
            published_at: article.published_at,
            processed: false,
          });

        // Count successful inserts (ignore duplicates)
        if (!insertError) {
          totalFetched++;
        } else if (!insertError.message?.includes('duplicate') && !insertError.message?.includes('unique')) {
          // Log non-duplicate errors
          logError("Failed to insert article", { error: insertError, url: article.url });
        }
      }

      // Update last_fetched_at
      await supabase
        .from("content_sources")
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", source.id);
    }

    logInfo("Content fetched", { requestId, runId, totalFetched });

    // Update automation run with fetched count
    await supabase
      .from("automation_runs")
      .update({ items_fetched: totalFetched })
      .eq("id", runId);

    // Get all active categories
    const categories = ['technology', 'business', 'science', 'ai_ml', 'design', 'startups', 'finance', 'health'];
    
    // Process evenly across categories (5 items per category, max 40 total)
    const itemsPerCategory = 5;
    const itemsToProcess: any[] = [];
    
    // Get source IDs for each category
    for (const category of categories) {
      // First get source IDs for this category
      const { data: sources } = await supabase
        .from("content_sources")
        .select("id")
        .eq("category", category)
        .eq("is_active", true);
      
      if (!sources || sources.length === 0) continue;
      
      const sourceIds = sources.map(s => s.id);
      
      // Then get unprocessed content from these sources
      const { data: categoryItems } = await supabase
        .from("raw_content")
        .select("*, content_sources(category)")
        .eq("processed", false)
        .in("source_id", sourceIds)
        .limit(itemsPerCategory);
      
      if (categoryItems && categoryItems.length > 0) {
        itemsToProcess.push(...categoryItems);
      }
    }
    
    logInfo("Items selected for processing", { requestId, runId, count: itemsToProcess.length });
    
    // If we got less than 20, fill with any unprocessed
    if (itemsToProcess.length < 20) {
      const processedIds = itemsToProcess.map(i => i.id);
      const { data: fillItems } = await supabase
        .from("raw_content")
        .select("*, content_sources(category)")
        .eq("processed", false)
        .not("id", "in", `(${processedIds.join(",") || "'none'"})`)
        .limit(20 - itemsToProcess.length);
      
      if (fillItems) {
        itemsToProcess.push(...fillItems);
      }
    }

    let totalProcessed = 0;

    if (itemsToProcess.length > 0) {
      logInfo("Processing content", { requestId, runId, count: itemsToProcess.length });

      for (const item of itemsToProcess) {
        try {
          // Process with LLM
          const processed = await processContentWithLLM(item.title, item.content);

          // Extract metadata
          const category = extractCategory(item.content_sources?.category || "general");
          const difficulty = determineDifficulty(item.content);
          const readingTime = estimateReadingTime(item.content);

          // Create content card
          const cardContent = `${processed.summary}\n\n**Key Insights:**\n${processed.insights.map((i) => `• ${i}`).join("\n")}\n\n**Action Takeaway:**\n${processed.action_takeaway}`;

          const { error: cardError } = await supabase
            .from("content_cards")
            .insert({
              title: item.title,
              content: cardContent,
              category,
              difficulty_level: difficulty,
              estimated_time_minutes: readingTime,
              tags: [category, difficulty],
              image_url: item.image_url,
              source_url: item.url,
            });

          if (cardError) {
            logError("Failed to create content card", {
              requestId,
              runId,
              itemId: item.id,
              error: cardError.message,
            });
            continue;
          }

          // Mark as processed
          await supabase
            .from("raw_content")
            .update({ processed: true })
            .eq("id", item.id);

          totalProcessed++;
        } catch (error) {
          logError("Failed to process item", {
            requestId,
            runId,
            itemId: item.id,
            error: String(error),
          });
        }
      }
    }

    logInfo("Processing complete", { requestId, runId, totalProcessed });

    // Clean up old unprocessed content (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { error: cleanupError } = await supabase
      .from("raw_content")
      .delete()
      .eq("processed", false)
      .lt("created_at", sevenDaysAgo.toISOString());
    
    if (cleanupError) {
      logError("Cleanup failed", { requestId, runId, error: cleanupError.message });
    } else {
      logInfo("Cleanup complete", { requestId, runId });
    }

    // Mark automation run as completed
    await supabase
      .from("automation_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        items_processed: totalProcessed,
      })
      .eq("id", runId);

    return NextResponse.json({
      success: true,
      data: {
        runId,
        itemsFetched: totalFetched,
        itemsProcessed: totalProcessed,
      },
    });
  } catch (error) {
    const errorMessage = String(error);
    logError("Automation run failed", { requestId, runId, error: errorMessage });

    // Mark run as failed
    if (runId) {
      await supabase
        .from("automation_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("id", runId);
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "AUTOMATION_ERROR",
          message: "Automation run failed",
        },
      },
      { status: 500 }
    );
  }
}
