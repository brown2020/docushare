"use client";

import { useState } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";

type SignInMode = "password" | "magicLink";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<SignInMode>("password");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    signInWithEmail,
    signInWithGoogle,
    sendMagicLink,
    error,
    clearError,
  } = useFirebaseAuth();
  const router = useRouter();

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);

    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
    } catch {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch {
      // Error is handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-8 border border-neutral-200 dark:border-neutral-800">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Check your email
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setEmail("");
              }}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-8 border border-neutral-200 dark:border-neutral-800">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            Welcome back
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Sign in to continue to DocuShare
          </p>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-neutral-900 text-neutral-500">
              or
            </span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              mode === "password"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("magicLink")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              mode === "magicLink"
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Magic Link
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {mode === "password" ? (
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="magic-email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="magic-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send magic link"
              )}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
