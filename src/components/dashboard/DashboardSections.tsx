"use client";

import {
  Clock,
  Keyboard,
  LoaderCircle,
  Menu,
  Plus,
  Search,
  X,
} from "lucide-react";
import DocumentStats from "@/components/DocumentStats";
import { HardSignOutButton } from "@/components/auth/HardSignOutButton";

export function WorkspaceLoading() {
  return (
    <div className="flex flex-col h-full bg-gray-50 items-center justify-center px-4">
      <LoaderCircle className="w-8 h-8 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600">Loading your workspace...</p>
      <div className="mt-6">
        <HardSignOutButton label="Hard sign out" variant="link" />
      </div>
    </div>
  );
}

export function SessionSetupFailed({
  sessionError,
  onRetry,
}: {
  sessionError: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-gray-50 items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Session Setup Failed
        </h2>
        <p className="text-gray-600 mb-6 whitespace-pre-wrap">
          {sessionError}
        </p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={onRetry}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md transition-colors"
          >
            <span>Retry Connection</span>
          </button>
          <HardSignOutButton
            label="Hard sign out"
            variant="danger"
            className="w-full"
          />
          <button
            onClick={() => window.location.reload()}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export function SessionPending() {
  return (
    <div className="flex flex-col h-full bg-gray-50 items-center justify-center px-4">
      <LoaderCircle className="w-8 h-8 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600">Establishing session...</p>
      <p className="text-sm text-gray-400 mt-2">
        If this takes more than a few seconds, session setup will time out with a retry option.
      </p>
      <div className="mt-6">
        <HardSignOutButton label="Hard sign out" variant="link" />
      </div>
    </div>
  );
}

export function DashboardToolbar({
  onToggleSidebar,
  searchQuery,
  onSearchQuery,
  isLoading,
  onCreate,
  onShowShortcuts,
}: {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchQuery: (value: string) => void;
  isLoading: boolean;
  onCreate: () => void;
  onShowShortcuts: () => void;
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          title="Toggle Sidebar (Ctrl+B)"
        >
          <Menu size={20} />
        </button>
        <div className="relative">
          <input
            type="text"
            aria-label="Search documents" placeholder="Search documents..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
          />
          <Search
            className="absolute left-3 top-2.5 text-gray-400"
            size={16}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onCreate}
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
          onClick={onShowShortcuts}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
          title="Keyboard Shortcuts (Ctrl+/)"
        >
          <Keyboard size={18} />
        </button>
      </div>
    </div>
  );
}

export function DocumentTitleBar({
  documentName,
}: {
  documentName: string | null;
}) {
  return (
    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
      <h1 className="text-xl font-medium text-gray-800">
        {documentName || "Untitled Document"}
      </h1>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Clock size={14} />
        <span>Last edited just now</span>
      </div>
    </div>
  );
}

export function DashboardWelcome({
  isLoading,
  onCreate,
}: {
  isLoading: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col p-6 h-full overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            onClick={onCreate}
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

        <div className="lg:col-span-1">
          <DocumentStats className="h-full" />
        </div>
      </div>
    </div>
  );
}

export function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            aria-label="Close keyboard shortcuts"
            onClick={onClose}
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
  );
}
