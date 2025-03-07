"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Share2, Clock, RefreshCw } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebaseClient";

interface DocumentStatsProps {
  className?: string;
}

interface Stats {
  totalDocuments: number;
  sharedDocuments: number;
  recentlyEdited: {
    id: string;
    name: string;
    lastEdited: string;
  }[];
  isLoading: boolean;
  error: boolean;
}

const DocumentStats: React.FC<DocumentStatsProps> = ({ className = "" }) => {
  const [user] = useAuthState(auth);
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    sharedDocuments: 0,
    recentlyEdited: [],
    isLoading: true,
    error: false,
  });

  const fetchStats = useCallback(async () => {
    if (!user) return;

    setStats((prev) => ({ ...prev, isLoading: true, error: false }));

    try {
      const response = await fetch("/api/docs/stats");

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      setStats({
        totalDocuments: data.totalDocuments || 0,
        sharedDocuments: data.sharedDocuments || 0,
        recentlyEdited: data.recentlyEdited || [],
        isLoading: false,
        error: false,
      });
    } catch (error) {
      console.error("Error fetching document stats:", error);
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: true,
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (stats.isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
        <div className="text-center py-6">
          <div className="text-red-500 mb-3">
            Failed to load document statistics
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <RefreshCw size={16} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Document Statistics
        </h2>
        <button
          onClick={fetchStats}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          title="Refresh statistics"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-md">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Documents</p>
              <p className="text-xl font-semibold text-gray-800">
                {stats.totalDocuments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-md">
              <Share2 className="text-green-600" size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Shared Documents</p>
              <p className="text-xl font-semibold text-gray-800">
                {stats.sharedDocuments}
              </p>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-md font-medium text-gray-700 mb-3">
        Recently Edited
      </h3>

      {stats.recentlyEdited.length > 0 ? (
        <div className="space-y-2">
          {stats.recentlyEdited.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
            >
              <div className="flex items-center">
                <FileText size={16} className="text-gray-400 mr-2" />
                <span className="text-gray-700 font-medium">{doc.name}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock size={12} className="mr-1" />
                <span>{doc.lastEdited}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>No recently edited documents</p>
        </div>
      )}
    </div>
  );
};

export default DocumentStats;
