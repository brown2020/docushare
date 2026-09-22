"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Loader2 } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import {
  mapFirebaseAuthError,
  formatFirebaseAuthErrorForLog,
} from "@/lib/firebaseAuthErrors";
import logo from "@/assets/svg/logo.svg";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      console.warn("[auth]", formatFirebaseAuthErrorForLog(err));
      setError(mapFirebaseAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-8 bg-white dark:bg-neutral-950">
        <div className="mb-8 text-center lg:text-left lg:pl-8">
          <Link href="/">
            <Image
              src={logo}
              alt="DocuShare"
              className="h-10 w-auto mx-auto lg:mx-0"
              priority
            />
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-8 border border-neutral-200 dark:border-neutral-800">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-medium text-neutral-900 dark:text-white" role="status">
                  If an account exists for <strong>{email.trim() || "that address"}</strong>,
                  we sent a password reset link. Check your inbox and spam folder.
                </p>
                <Link
                  href="/signin"
                  className="inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
                    Reset your password
                  </h1>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    We&apos;ll email you a link to choose a new password.
                  </p>
                </div>

                {error && (
                  <div
                    className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    role="alert"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        id="reset-email"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="username"
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
                        Sending...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
                  Remembered it?{" "}
                  <Link
                    href="/signin"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Back to sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Secure account recovery</h2>
          <p className="text-blue-100 text-lg">
            Use the link in your email to set a new password and get back to collaborating.
          </p>
        </div>
      </div>
    </main>
  );
}
