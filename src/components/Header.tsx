"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import logo from "@/assets/svg/logo.svg";
import Image from "next/image";
import { AlignJustify } from "lucide-react";
import DocumentsList from "./DocumentsList";
import { useActiveDoc } from "./ActiveDocContext";
import { UserMenu } from "./auth/UserMenu";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

export default function Header() {
  const { user, isSignedIn, loading } = useFirebaseAuth();
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const clearAuthDetails = useAuthStore((state) => state.clearAuthDetails);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { activeDocId, setActiveDocId, documentName, setDocumentName } =
    useActiveDoc();
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pathname = usePathname();

  useInitializeStores();

  const handleActiveDocument = (docId: string) => {
    setActiveDocId(docId);
  };

  const refreshDocuments = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleCreateNewDocument = useCallback(async () => {
    if (isCreatingDocument) return;

    setIsCreatingDocument(true);
    try {
      const response = await fetch("/api/docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Untitled Document" }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.id) {
        throw new Error("Invalid response data");
      }

      setActiveDocId(data.id);
      setDocumentName(data.name || "Untitled Document");
      toast.success("Document created successfully");
      refreshDocuments();
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create document. Please try again.");
    } finally {
      setIsCreatingDocument(false);
    }
  }, [setActiveDocId, setDocumentName, isCreatingDocument, refreshDocuments]);

  // Sync Firebase auth state to Zustand store
  useEffect(() => {
    if (isSignedIn && user) {
      setAuthDetails({
        uid: user.uid,
        authEmail: user.email || "",
        authDisplayName: user.displayName || "",
        authPhotoUrl: user.photoURL || "",
        authEmailVerified: user.emailVerified,
        authReady: true,
        lastSignIn: Timestamp.now(),
      });
    } else if (!loading) {
      clearAuthDetails();
    }
  }, [isSignedIn, user, loading, setAuthDetails, clearAuthDetails]);

  // Don't render header on auth pages
  if (pathname === "/signin" || pathname === "/signup") {
    return null;
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-between px-10 py-4 max-sm:px-[15px] shadow-md">
        <Image
          src={logo}
          alt="logo"
          priority
          className="w-[115.13px] h-[60px] max-sm:w-[80.28px] max-sm:h-[50px]"
        />
        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      </div>
    );
  }

  // Signed out view
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-between px-10 py-4 max-sm:px-[15px] border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/">
          <Image
            src={logo}
            alt="logo"
            priority
            className="w-[115.13px] h-[60px] max-sm:w-[80.28px] max-sm:h-[50px]"
          />
        </Link>
        <Link
          href="/signin"
          className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Signed in view
  return (
    <>
      <div className="flex items-center justify-between px-10 py-4 max-sm:px-[15px] shadow-sm border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <Link href="/dashboard">
          <Image
            src={logo}
            alt="logo"
            priority
            className="w-[115.13px] h-[60px] max-sm:w-[80.28px] max-sm:h-[50px]"
          />
        </Link>
        <div className="flex gap-3 items-center">
          <nav className="max-sm:hidden flex gap-1">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/profile"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
              }`}
            >
              Profile
            </Link>
          </nav>
          <div className="sm:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle menu"
            >
              <AlignJustify className="w-5 h-5" />
            </button>
          </div>
          <UserMenu />
        </div>
      </div>
      <div className="sm:hidden">
        <DocumentsList
          setSelectedDocumentName={setDocumentName}
          documentName={documentName}
          openSidebar={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          handleActiveDocument={handleActiveDocument}
          activeDocId={activeDocId}
          setActiveDocId={setActiveDocId}
          onCreateDocument={handleCreateNewDocument}
          isCreatingDocument={isCreatingDocument}
          searchQuery=""
          key={`header-documents-list-${refreshTrigger}`}
        />
      </div>
    </>
  );
}
