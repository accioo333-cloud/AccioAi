import { redirect } from "next/navigation";
import { createReadOnlyClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createReadOnlyClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated - redirect to login
  if (!user) {
    redirect("/");
  }

  // Check if already onboarded
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/feed");
  }

  // Auto-complete onboarding for OAuth users (Google) who have a name
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  
  if (fullName && !profile) {
    // Create profile automatically for OAuth users
    await supabase.from("user_profiles").upsert({
      id: user.id,
      full_name: fullName,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    });
    
    redirect("/feed");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <OnboardingForm />
      </div>
    </div>
  );
}
