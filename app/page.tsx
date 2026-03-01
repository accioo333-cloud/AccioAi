import { redirect } from "next/navigation";
import { createReadOnlyClient } from "@/lib/supabase/server";
import AuthButton from "@/components/AuthButton";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createReadOnlyClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // If there's an auth error, show landing
  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <script dangerouslySetInnerHTML={{
          __html: `
            // Handle OAuth redirect with hash fragment
            if (window.location.hash && window.location.hash.includes('access_token')) {
              window.location.href = '/auth/callback' + window.location.hash;
            }
          `
        }} />
        <div className="w-full max-w-lg space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-gray-900 tracking-tight">
              AccioAI
            </h1>
            <p className="text-2xl text-gray-700 font-medium">
              Your daily AI-curated intelligence feed.
            </p>
            <p className="text-sm text-gray-500">
              Summaries. Insights. Actionable takeaways.
            </p>
          </div>

          {/* Auth Button */}
          <div className="flex justify-center">
            <AuthButton />
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 border border-gray-100">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex-1">
                The Future of AI-Powered Development
              </h3>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Tech
              </span>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              Recent advances in large language models are transforming how developers build software. 
              New tools enable faster prototyping and more intelligent code assistance.
            </p>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-2">Key Insight:</p>
              <p className="text-sm text-gray-600">
                • AI coding assistants now handle 40% of routine development tasks
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="capitalize">Intermediate</span>
              <span>•</span>
              <span>5 min read</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check onboarding status
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  redirect("/feed");
}
