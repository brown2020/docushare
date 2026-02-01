"use client";

import { SignInForm } from "@/components/auth/SignInForm";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { isSignInWithEmailLink } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import Image from "next/image";
import logo from "@/assets/svg/logo.svg";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function SignInContent() {
  const { isSignedIn, completeMagicLinkSignIn } = useFirebaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessingLink, setIsProcessingLink] = useState(false);

  // Handle magic link sign-in
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (
      mode === "emailLink" &&
      typeof window !== "undefined" &&
      isSignInWithEmailLink(auth, window.location.href)
    ) {
      setIsProcessingLink(true);
      const storedEmail = window.localStorage.getItem("emailForSignIn");
      if (storedEmail) {
        completeMagicLinkSignIn(storedEmail)
          .then(() => router.push("/dashboard"))
          .catch(() => setIsProcessingLink(false));
      } else {
        setIsProcessingLink(false);
      }
    }
  }, [searchParams, completeMagicLinkSignIn, router]);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

  if (isProcessingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Completing sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Form */}
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
        <SignInForm />
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Collaborate on documents with AI assistance
          </h2>
          <p className="text-blue-100 text-lg">
            Create, edit, and share documents with real-time collaboration and
            AI-powered writing tools.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
