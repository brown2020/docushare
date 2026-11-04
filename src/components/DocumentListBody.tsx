"use client";

import { Dispatch, SetStateAction } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import DeleteDocument from "./Models/DeleteDocument";
import ShareDocument from "@/components/Models/ShareDocument";

type ListedDocument = {
  id: string;
  name?: string;
  isShared?: boolean;
};

export function DocumentListBody({
  fetching,
  filteredDocuments,
  searchQuery,
  isCreatingDocument,
  processing,
  onCreateDocument,
  renderDocument,
  deleteDocument,
  setDeleteDocument,
  deleteDocumentHandle,
  shareDocument,
  refreshCode,
  docName,
  setShareDocument,
  handleShareDocument,
}: {
  fetching: boolean;
  filteredDocuments: ListedDocument[];
  searchQuery: string;
  isCreatingDocument: boolean;
  processing: boolean;
  onCreateDocument: () => Promise<void>;
  renderDocument: (doc: ListedDocument) => React.ReactNode;
  deleteDocument: string | null;
  setDeleteDocument: Dispatch<SetStateAction<string | null>>;
  deleteDocumentHandle: () => void;
  shareDocument: string | null;
  refreshCode: number;
  docName: string;
  setShareDocument: Dispatch<SetStateAction<string | null>>;
  handleShareDocument: (email: string) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">My Documents</h2>
        <button
          type="button"
          aria-label="Create New Document"
          onClick={onCreateDocument}
          disabled={isCreatingDocument || processing}
          className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          title="Create New Document"
        >
          {isCreatingDocument ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {fetching ? (
          <div className="flex justify-center items-center h-full">
            <LoaderCircle className="animate-spin text-gray-400" />
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="space-y-1">
            {filteredDocuments.map((doc) => renderDocument(doc))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-8 text-gray-500">
            <p>No documents match your search</p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No documents yet</p>
            <p className="text-sm mt-1">
              Create your first document to get started
            </p>
          </div>
        )}
      </div>

      {deleteDocument && (
        <DeleteDocument
          setDeleteDoc={setDeleteDocument}
          deleteDocumentHandle={deleteDocumentHandle}
        />
      )}

      {shareDocument && (
        <ShareDocument
          key={refreshCode}
          documentId={shareDocument}
          processing={processing}
          documentName={docName}
          setShareDocument={setShareDocument}
          handleShareDocument={handleShareDocument}
        />
      )}
    </div>
  );
}
