import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthButton from "@/components/AuthButton";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // No session - show login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-gray-900">AccioAI</h1>
          <p className="text-xl text-gray-600">Your daily AI-powered content companion</p>
          <div className="pt-4">
            <AuthButton />
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
