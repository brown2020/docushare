"use client";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import Image from "next/image";
import Link from "next/link";
import Footer from "./Footer";
import logo from "@/assets/svg/logo.svg";
import { useState } from "react";
import { LoaderCircle, FileText, Users, Sparkles, Shield } from "lucide-react";

export default function Home() {
  const { user, isSignedIn, loading: authLoading } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {isSignedIn && user ? (
        // Signed in view
        <div className="flex items-center justify-center h-full px-6 py-12">
          <div className="flex flex-col gap-8 bg-white dark:bg-neutral-900 shadow-lg rounded-2xl p-8 max-w-md w-full border border-neutral-200 dark:border-neutral-800">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
                Welcome back!
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Ready to continue working on your documents?
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  width={80}
                  height={80}
                  alt={user.displayName || "User"}
                  className="rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {user.displayName?.charAt(0) ||
                    user.email?.charAt(0).toUpperCase() ||
                    "?"}
                </div>
              )}
              <div className="text-center">
                <div className="text-lg font-medium text-neutral-900 dark:text-white">
                  {user.displayName || "User"}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {user.email}
                </div>
              </div>
            </div>

            <Link href="/dashboard" onClick={handleClick} className="w-full">
              <button
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <LoaderCircle className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Go to Dashboard
                  </>
                )}
              </button>
            </Link>
          </div>
        </div>
      ) : (
        // Signed out view - Landing page
        <div className="flex-1 flex flex-col">
          {/* Hero Section */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-950">
            <div className="max-w-4xl mx-auto text-center">
              <Image
                src={logo}
                alt="DocuShare"
                priority
                className="h-16 w-auto mx-auto mb-8"
              />
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
                Collaborative Document Editing with{" "}
                <span className="text-blue-600">AI Power</span>
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
                Create, edit, and share documents in real-time. Powered by
                AI-assisted writing tools to help you write faster and better.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center px-8 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-16 px-6 bg-white dark:bg-neutral-950">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-neutral-900 dark:text-white mb-12">
                Everything you need for better documents
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FeatureCard
                  icon={<FileText className="w-6 h-6" />}
                  title="Rich Text Editor"
                  description="Powerful editing with formatting, images, tables, and more."
                />
                <FeatureCard
                  icon={<Users className="w-6 h-6" />}
                  title="Real-time Collaboration"
                  description="Work together with your team in real-time with live cursors."
                />
                <FeatureCard
                  icon={<Sparkles className="w-6 h-6" />}
                  title="AI Writing Assistant"
                  description="Get help writing, improving, and summarizing your content."
                />
                <FeatureCard
                  icon={<Shield className="w-6 h-6" />}
                  title="Secure Sharing"
                  description="Share documents securely with fine-grained permissions."
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400 text-sm">
        {description}
      </p>
    </div>
  );
}
