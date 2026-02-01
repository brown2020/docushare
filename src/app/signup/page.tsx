"use client";

import { SignUpForm } from "@/components/auth/SignUpForm";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import logo from "@/assets/svg/logo.svg";
import Link from "next/link";

export default function SignUpPage() {
  const { isSignedIn } = useFirebaseAuth();
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, router]);

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
        <SignUpForm />
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="max-w-md text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start creating today</h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of users who are already using DocuShare to
            collaborate and create amazing documents.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">Real-time</div>
              <div className="text-blue-200 text-sm">Collaboration</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">AI-Powered</div>
              <div className="text-blue-200 text-sm">Writing Tools</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">Secure</div>
              <div className="text-blue-200 text-sm">Document Sharing</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold">Rich</div>
              <div className="text-blue-200 text-sm">Text Editing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
