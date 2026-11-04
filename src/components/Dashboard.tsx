"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CollaborativeEditor from "./CollaborativeEditor";
import DocumentsList from "./DocumentsList";
import { useActiveDoc } from "./ActiveDocContext";
import toast from "react-hot-toast";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { createDocumentClient } from "@/lib/docsClient";
import {
  formatFirebaseErrorForLog,
  formatFirebaseErrorForToast,
} from "@/lib/firebaseErrorCode";
import {
  DashboardToolbar,
  DashboardWelcome,
  DocumentTitleBar,
  KeyboardShortcutsModal,
  SessionPending,
  SessionSetupFailed,
  WorkspaceLoading,
} from "./dashboard/DashboardSections";

const Dashboard = () => {
  const { activeDocId, setActiveDocId, documentName, setDocumentName } = useActiveDoc();
  const { sessionReady, loading, user, sessionError, retrySession } = useFirebaseAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleActiveDocument = (docId: string) => {
    setActiveDocId(docId);
  };

  const refreshDocuments = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleCreateNewDocument = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous requests

    // Wait for session to be ready
    if (!sessionReady) {
      toast.error("Please wait, session is being established...");
      return;
    }

    setIsLoading(true);
    try {
      if (!user?.uid) {
        throw new Error("Not signed in");
      }
      const data = await createDocumentClient(user.uid, "Untitled Document");
      setActiveDocId(data.id);
      setDocumentName(data.name || "Untitled Document");
      toast.success("Document created successfully");
      refreshDocuments();
    } catch (error) {
      console.warn("[docs] create_failed", formatFirebaseErrorForLog(error));
      toast.error(
        formatFirebaseErrorForToast(
          error,
          "Failed to create document. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [setActiveDocId, setDocumentName, isLoading, refreshDocuments, sessionReady, user]);

  const handleCreateNewDocumentRef = useRef(handleCreateNewDocument);
  useEffect(() => {
    handleCreateNewDocumentRef.current = handleCreateNewDocument;
  }, [handleCreateNewDocument]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / to show keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowKeyboardShortcuts((prev) => !prev);
      }

      // Ctrl/Cmd + N to create new document
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        void handleCreateNewDocumentRef.current();
      }

      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }

      // Escape to close keyboard shortcuts modal
      if (e.key === "Escape") {
        setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Full-screen spinner only while Firebase auth is still unknown.
  // Once the user is known, render the workspace and finish the session
  // cookie in the background instead of holding a second spinner.
  if (loading && !user) {
    return <WorkspaceLoading />;
  }

  // Handle session error - show recoverable error (never infinite spinner)
  if (!sessionReady && sessionError) {
    return (
      <SessionSetupFailed
        sessionError={sessionError}
        onRetry={() => void retrySession()}
      />
    );
  }

  // Auth has not produced a user yet. A known user renders below while the
  // session cookie finishes, so sign-in does not sit on this spinner.
  if (!user) {
    return <SessionPending />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <DashboardToolbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
        isLoading={isLoading}
        onCreate={() => void handleCreateNewDocument()}
        onShowShortcuts={() => setShowKeyboardShortcuts(true)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white`}
        >
          <DocumentsList
            setSelectedDocumentName={setDocumentName}
            openSidebar={sidebarOpen}
            handleActiveDocument={handleActiveDocument}
            activeDocId={activeDocId}
            setActiveDocId={setActiveDocId}
            setIsSidebarOpen={setSidebarOpen}
            searchQuery={searchQuery}
            onCreateDocument={handleCreateNewDocument}
            isCreatingDocument={isLoading}
            key={`documents-list-${refreshTrigger}`}
          />
        </div>

        {/* Document Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full w-full flex flex-col">
            {activeDocId ? (
              <div key={activeDocId} className="flex flex-col h-full">
                <DocumentTitleBar documentName={documentName} />

                {/* Editor */}
                <div className="flex-1 overflow-auto">
                  <CollaborativeEditor docId={activeDocId} />
                </div>
              </div>
            ) : (
              <DashboardWelcome
                isLoading={isLoading}
                onCreate={() => void handleCreateNewDocument()}
              />
            )}
          </div>
        </div>
      </div>

      {showKeyboardShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowKeyboardShortcuts(false)} />
      )}
    </div>
  );
};

export default Dashboard;
