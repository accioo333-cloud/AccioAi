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

    // Process unprocessed content
    const { data: unprocessed, error: unprocessedError } = await supabase
      .from("raw_content")
      .select("*, content_sources(category)")
      .eq("processed", false)
      .limit(20); // Process max 20 items per run

    if (unprocessedError) {
      throw new Error(`Failed to fetch unprocessed content: ${unprocessedError.message}`);
    }

    let totalProcessed = 0;

    if (unprocessed && unprocessed.length > 0) {
      logInfo("Processing content", { requestId, runId, count: unprocessed.length });

      for (const item of unprocessed) {
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
