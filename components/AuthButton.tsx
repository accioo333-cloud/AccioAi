"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (error) throw error;
        
        // Show confirmation message if email confirmation is enabled
        if (data.user && !data.session) {
          setShowConfirmation(true);
          return;
        }
        
        window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="px-8 py-3 bg-gray-200 text-gray-400 rounded-lg">
        Loading...
      </div>
    );
  }

  // Show Sign Out if authenticated
  if (user) {
    return (
      <button
        onClick={handleSignOut}
        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
      >
        Sign Out
      </button>
    );
  }

  // Show Email/Password form if not authenticated
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      {showConfirmation ? (
        <div className="text-center space-y-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-4xl">📧</div>
          <h3 className="font-semibold text-gray-900">Check your email</h3>
          <p className="text-sm text-gray-600">
            We sent a confirmation link to <strong>{email}</strong>
          </p>
          <p className="text-xs text-gray-500">
            Click the link in the email to complete your signup.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowConfirmation(false);
              setEmail("");
              setPassword("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md hover:shadow-lg disabled:bg-gray-400"
            >
              {submitting ? "..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setShowConfirmation(false);
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
