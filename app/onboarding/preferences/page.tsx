import { redirect } from "next/navigation";
import { createReadOnlyClient } from "@/lib/supabase/server";
import PreferencesForm from "@/components/PreferencesForm";

export default async function PreferencesPage() {
  const supabase = await createReadOnlyClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Check if preferences already set
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (preferences) {
    redirect("/feed");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-slate-200">
        <PreferencesForm />
      </div>
    </div>
  );
}
