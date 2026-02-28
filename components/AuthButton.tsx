"use client";

import { supabase } from "@/lib/supabase/client";

export default function AuthButton() {
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error signing in:", error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleGoogleSignIn}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Sign in with Google
      </button>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        Sign Out
      </button>
    </div>
  );
}
