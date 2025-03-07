"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  SetStateAction,
  Dispatch,
} from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseClient";
import { LoaderCircle, Share2, Trash2, Plus, Edit2 } from "lucide-react";
import DeleteDocument from "./Models/DeleteDocument";
import ShareDocument from "@/components/Models/ShareDocument";
import { useAuth } from "@clerk/nextjs";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import toast from "react-hot-toast";

interface DocumentSchema {
  id: string;
  name?: string;
  isShared?: boolean;
}

interface DocumentsListProps {
  handleActiveDocument: (docId: string) => void;
  activeDocId: string | null;
  setActiveDocId: (docId: string | null) => void;
  openSidebar: boolean;
  showOnlyDocumentList?: boolean;
  setIsSidebarOpen?: Dispatch<SetStateAction<boolean>>;
  setSelectedDocumentName: (value: string) => void;
  documentName?: string | null;
  searchQuery?: string;
  onCreateDocument: () => Promise<void>;
  isCreatingDocument: boolean;
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  handleActiveDocument,
  setSelectedDocumentName,
  activeDocId,
  searchQuery = "",
  onCreateDocument,
  isCreatingDocument,
}) => {
  const { isLoaded } = useAuth();
  const [user] = useAuthState(auth);
  const [documents, setDocuments] = useState<DocumentSchema[]>([]);
  const [activeRename, setActiveRename] = useState<string | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<string | null>(null);
  const [shareDocument, setShareDocument] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [refreshCode, setRefreshCode] = useState(1);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const handleSelectDocumentName = (docName: string) => {
    setSelectedDocumentName(docName);
  };

  const fetchDocuments = useCallback(async () => {
    if (!isLoaded) return;
    setFetching(true);
    try {
      const response = await fetch("/api/docs");
      const data = await response.json();
      setFetching(false);
      setDocuments(data);
    } catch (error) {
      console.log("Error fetching documents:", error);
      setFetching(false);
      toast.error("Something went wrong.");
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
  }, [user, fetchDocuments]);

  const handleActiveRename = (docId: string) => {
    setActiveRename(docId);
    const doc = documents.find((doc) => doc.id === docId);
    setDocName(doc?.name || "Untitled");

    // Focus the input after a short delay to ensure the DOM has updated
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocName(e.target.value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (activeRename) {
        handleSave(activeRename, false);
      }
    }, 1000);
  };

  const handleSave = useCallback(
    async (docId: string, close = false) => {
      if (docName.trim() === "") {
        setDocName("Untitled");
      }

      setProcessing(true);
      try {
        const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
        await setDoc(
          docRef,
          { name: docName || "Untitled", updatedAt: new Date() },
          { merge: true }
        );
        if (close) {
          setActiveRename(null);
        }
        fetchDocuments();

        // Update the selected document name if this is the active document
        if (docId === activeDocId) {
          setSelectedDocumentName(docName || "Untitled");
        }
      } catch (error) {
        console.log("Error updating document name:", error);
        toast.error("Failed to update document name.");
      } finally {
        setProcessing(false);
      }
    },
    [
      docName,
      activeDocId,
      fetchDocuments,
      setSelectedDocumentName,
      setActiveRename,
      setProcessing,
      setDocName,
    ]
  );

  // Handle clicks outside the edit container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeRename &&
        editContainerRef.current &&
        !editContainerRef.current.contains(event.target as Node)
      ) {
        handleSave(activeRename, true);
      }
    };

    // Add event listener when in edit mode
    if (activeRename) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeRename, handleSave]);

  const deleteDocumentHandle = () => {
    if (!deleteDocument) return;
    setProcessing(true);
    try {
      const docRef = doc(collection(db, DOCUMENT_COLLECTION), deleteDocument);
      deleteDoc(docRef);
      setDeleteDocument(null);
      fetchDocuments();
    } catch (error) {
      console.log("Error deleting document:", error);
      toast.error("Something went wrong.");
    } finally {
      setProcessing(false);
    }
  };

  const handleShareDocument = async (email: string) => {
    if (!shareDocument) return;
    setProcessing(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: shareDocument,
          email,
        }),
      });
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Document shared successfully!");
        setShareDocument(null);
        setRefreshCode((prev) => prev + 1);
      }
    } catch (error) {
      console.log("Error sharing document:", error);
      toast.error("Something went wrong.");
    } finally {
      setProcessing(false);
    }
  };

  const documentObject = (doc: DocumentSchema) => {
    const isRenaming = activeRename === doc.id;

    return (
      <div
        key={doc.id}
        className={`p-2 rounded-md flex items-center justify-between ${
          activeDocId === doc.id ? "bg-blue-50" : "hover:bg-gray-50"
        }`}
      >
        <div
          className="flex-1 cursor-pointer truncate group"
          onClick={() => {
            // Only select the document if we're not in rename mode
            if (!isRenaming) {
              handleActiveDocument(doc.id);
              handleSelectDocumentName(doc.name || "Untitled");
            }
          }}
        >
          {isRenaming ? (
            <div ref={editContainerRef} className="w-full">
              <input
                ref={inputRef}
                type="text"
                value={docName}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave(doc.id, true);
                  } else if (e.key === "Escape") {
                    setActiveRename(null);
                    setDocName(doc.name || "Untitled");
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : (
            <div
              className="flex items-center"
              onDoubleClick={() => {
                handleActiveRename(doc.id);
              }}
            >
              <span className="text-gray-700 flex-1 truncate">
                {doc.name || "Untitled"}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleActiveRename(doc.id);
                }}
                className="p-1 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Rename document"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShareDocument(doc.id);
              setDocName(doc.name || "Untitled");
            }}
            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
            title="Share document"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDocument(doc.id);
            }}
            className="p-1 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded"
            title="Delete document"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    return doc.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">My Documents</h2>
        <button
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
            {filteredDocuments.map((doc) => documentObject(doc))}
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

      {/* Delete Document Modal */}
      {deleteDocument && (
        <DeleteDocument
          setDeleteDoc={setDeleteDocument}
          deleteDocumentHandle={deleteDocumentHandle}
        />
      )}

      {/* Share Document Modal */}
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
};

export default DocumentsList;
