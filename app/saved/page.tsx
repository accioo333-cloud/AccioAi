import { redirect } from "next/navigation";
import { createReadOnlyClient } from "@/lib/supabase/server";
import SavedClient from "@/components/SavedClient";

export default async function SavedPage() {
  const supabase = await createReadOnlyClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return <SavedClient />;
}
