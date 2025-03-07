"use client";

import { useState, useEffect, useCallback } from "react";
import CollaborativeEditor from "./CollaborativeEditor";
import DocumentsList from "./DocumentsList";
import { useActiveDoc } from "./ActiveDocContext";
import {
  Menu,
  Search,
  Plus,
  Clock,
  Keyboard,
  X,
  LoaderCircle,
} from "lucide-react";
import DocumentStats from "./DocumentStats";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { activeDocId, setActiveDocId } = useActiveDoc();
  const { documentName, setDocumentName } = useActiveDoc();
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

    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [setActiveDocId, setDocumentName, isLoading, refreshDocuments]);

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
        handleCreateNewDocument();
      }

      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }

      // Escape to close keyboard shortcuts modal
      if (e.key === "Escape" && showKeyboardShortcuts) {
        setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showKeyboardShortcuts, handleCreateNewDocument]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Document Actions Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Toggle Sidebar (Ctrl+B)"
          >
            <Menu size={20} />
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={16}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCreateNewDocument}
            disabled={isLoading}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors"
            title="New Document (Ctrl+N)"
          >
            {isLoading ? (
              <LoaderCircle size={16} className="animate-spin mr-1" />
            ) : (
              <Plus size={16} className="mr-1" />
            )}
            <span>{isLoading ? "Creating..." : "New"}</span>
          </button>

          <button
            onClick={() => setShowKeyboardShortcuts(true)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            title="Keyboard Shortcuts (Ctrl+/)"
          >
            <Keyboard size={18} />
          </button>
        </div>
      </div>

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
                {/* Document Header */}
                <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h1 className="text-xl font-medium text-gray-800">
                    {documentName || "Untitled Document"}
                  </h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock size={14} />
                    <span>Last edited just now</span>
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-auto">
                  <CollaborativeEditor docId={activeDocId} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col p-6 h-full overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Welcome Card */}
                  <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                          Welcome to DocuShare
                        </h2>
                        <p className="text-gray-600">
                          Create, edit, and share documents with ease. Get
                          started by creating a new document or selecting an
                          existing one.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleCreateNewDocument}
                      disabled={isLoading}
                      className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md transition-colors w-full"
                    >
                      {isLoading ? (
                        <LoaderCircle size={18} className="animate-spin mr-2" />
                      ) : (
                        <Plus size={18} className="mr-2" />
                      )}
                      <span className="font-medium">
                        {isLoading ? "Creating..." : "Create New Document"}
                      </span>
                    </button>
                  </div>

                  {/* Document Stats */}
                  <div className="lg:col-span-1">
                    <DocumentStats className="h-full" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Create new document</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">
                  Ctrl+N
                </kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Toggle sidebar</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">
                  Ctrl+B
                </kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-700">Show keyboard shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">
                  Ctrl+/
                </kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Close dialogs</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
