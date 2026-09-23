"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  SetStateAction,
  Dispatch,
} from "react";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { LoaderCircle, Plus } from "lucide-react";
import { DocumentListItem } from "./DocumentListItem";
import DeleteDocument from "./Models/DeleteDocument";
import ShareDocument from "@/components/Models/ShareDocument";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import { listDocumentsClient } from "@/lib/docsClient";
import {
  formatFirebaseErrorForLog,
  formatFirebaseErrorForToast,
} from "@/lib/firebaseErrorCode";
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
  const { sessionReady, user } = useFirebaseAuth();
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
    if (!sessionReady || !user?.uid) return;
    setFetching(true);
    try {
      const data = await listDocumentsClient(user.uid);
      setDocuments(data);
    } catch (error) {
      console.warn("[docs] list_failed", formatFirebaseErrorForLog(error));
      toast.error(
        formatFirebaseErrorForToast(error, "Something went wrong.")
      );
    } finally {
      setFetching(false);
    }
  }, [sessionReady, user]);

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
        console.warn("[docs] rename_failed", formatFirebaseErrorForLog(error));
        toast.error(
          formatFirebaseErrorForToast(error, "Failed to update document name.")
        );
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

  const handleSaveRef = useRef(handleSave);
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // Handle clicks outside the edit container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeRename &&
        editContainerRef.current &&
        !editContainerRef.current.contains(event.target as Node)
      ) {
        void handleSaveRef.current(activeRename, true);
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
  }, [activeRename]);

  // FIXED: Made async and await deleteDoc
  const deleteDocumentHandle = async () => {
    if (!deleteDocument) return;
    setProcessing(true);
    try {
      const docRef = doc(collection(db, DOCUMENT_COLLECTION), deleteDocument);
      await deleteDoc(docRef);
      setDeleteDocument(null);
      await fetchDocuments();
      toast.success("Document deleted successfully.");
    } catch (error) {
      console.warn("[docs] delete_failed", formatFirebaseErrorForLog(error));
      toast.error(
        formatFirebaseErrorForToast(error, "Failed to delete document.")
      );
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
      if (!response.ok) {
        toast.error("Failed to share document.");
        return;
      }
      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Document shared successfully!");
        setShareDocument(null);
        setRefreshCode((prev) => prev + 1);
      }
    } catch (error) {
      console.warn("[docs] share_failed", formatFirebaseErrorForLog(error));
      toast.error(
        formatFirebaseErrorForToast(error, "Something went wrong.")
      );
    } finally {
      setProcessing(false);
    }
  };

  const documentObject = (doc: DocumentSchema) => (
    <DocumentListItem
      key={doc.id}
      doc={doc}
      activeDocId={activeDocId}
      isRenaming={activeRename === doc.id}
      docName={docName}
      inputRef={inputRef}
      editContainerRef={editContainerRef}
      onSelect={(id, name) => {
        handleActiveDocument(id);
        handleSelectDocumentName(name);
      }}
      onRenameStart={handleActiveRename}
      onRenameChange={handleInputChange}
      onRenameSave={handleSave}
      onRenameCancel={(original) => {
        setActiveRename(null);
        setDocName(original);
      }}
      onShare={(id, name) => {
        setShareDocument(id);
        setDocName(name);
      }}
      onDelete={setDeleteDocument}
    />
  );

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
