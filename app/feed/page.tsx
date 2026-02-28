import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedClient from "@/components/FeedClient";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated - redirect to login
  if (!user) {
    redirect("/");
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

  return <FeedClient />;
}
