"use client";

import {
  useState,
  useEffect,
  useRef,
  Fragment,
  useCallback,
  SetStateAction,
  Dispatch,
} from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseClient";
import { LoaderCircle, Share2, Trash2, X } from "lucide-react";
import DeleteDocument from "./Models/DeleteDocument";
import ShareDocument from "@/components/Models/ShareDocument";
import { useAuth } from "@clerk/nextjs";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import toast from "react-hot-toast";
import Image from "next/image";
import logo from "@/assets/svg/logo.svg";

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
}

const DocumentsList: React.FC<DocumentsListProps> = ({
  handleActiveDocument,
  setSelectedDocumentName,
  activeDocId,
  setActiveDocId,
  openSidebar,
  setIsSidebarOpen,
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

  useEffect(() => {
    if (activeRename && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeRename]);

  const inputRef = useRef<HTMLInputElement>(null);
  const handleActiveRename = (docId: string) => {
    setActiveRename(docId);
    const doc = documents.find((doc) => doc.id === docId);
    setDocName(doc?.name || "Untitled");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocName(e.target.value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(
      async (document_id) => {
        if (!document_id) return;
        handleSave(document_id);
      },
      400,
      activeRename
    );
  };

  const handleSave = async (docId: string, close = false) => {
    const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
    const name = docName;
    setDoc(docRef, { name }, { merge: true });

    const _documents = [...documents];
    const index = _documents.findIndex((doc) => doc.id === docId);
    _documents[index].name = name;
    setDocuments(_documents);
    if (close) setActiveRename(null);
  };

  const deleteDocumentHandle = () => {
    deleteDoc(
      doc(
        collection(db, DOCUMENT_COLLECTION),
        deleteDocument ? deleteDocument : ""
      )
    );
    fetchDocuments();
    setDeleteDocument(null);
  };

  const handleShareDocument = async (email: string) => {
    if (!email) {
      toast.error("Email address is required.");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          documentId: shareDocument,
        }),
      });
      setProcessing(false);
      const data = await response.json();

      if (data.status) {
        setRefreshCode((prevCount) => prevCount + 1);
        toast.success("Document shared successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("Error sharing document:", error);
      toast.error("Something went wrong.");
      setProcessing(false);
    }
  };

  const handleCreateNewDocument = async () => {
    setFetching(true);
    const docRef = await addDoc(collection(db, DOCUMENT_COLLECTION), {
      name: "Untitled Document",
      content: "",
      owner: user?.uid,
    });

    setDocuments((prevDocs) => [
      ...prevDocs,
      { id: docRef.id, name: "Untitled Document" },
    ]);
    setActiveDocId(docRef.id);
    setFetching(false);
  };

  const documentObject = (doc: DocumentSchema) => {
    return (
      <li
        key={doc.id}
        className={`flex gap-2 p-2 w-full justify-between rounded items-center ${
          doc.id === activeDocId ? "bg-blue-100" : ""
        }`}
      >
        {activeRename == doc.id ? (
          <input
            type="text"
            onBlur={() => handleSave(doc.id, true)}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter") {
                handleSave(doc.id, true);
              }
            }}
            onChange={(e) => {
              handleInputChange(e);
            }}
            value={docName}
            ref={inputRef}
            className="w-full h-full bg-transparent max-sm:text-sm outline-none border-b border-neutral-400"
          />
        ) : (
          <button
            onDoubleClick={() => handleActiveRename(doc.id)}
            onClick={() => {
              handleActiveDocument(doc.id);
              handleSelectDocumentName(doc.name || "Untitled");
            }}
            className={`text-left flex-1 font-medium text-base max-sm:text-sm  ${
              doc.id === activeDocId ? "bg-blue-100" : ""
            }`}
          >
            {doc.name || "Untitled"}
          </button>
        )}
        {activeRename != doc.id && (
          <div className="flex gap-2">
            {/* <Pencil
              className="cursor-pointer"
              onClick={() => handleActiveRename(doc.id)}
              color="#9CA3AF"
              size={22}
            /> */}
            <Share2
              className="cursor-pointer"
              onClick={() => {
                setShareDocument(doc.id);
                setDocName(doc.name || "Untitled");
                setActiveDocId(doc.id);
              }}
              color="#9CA3AF"
              size={22}
            />
            <Trash2
              className="cursor-pointer"
              onClick={() => {
                setDeleteDocument(doc.id);
                setActiveDocId(doc.id);
              }}
              color="#9CA3AF"
              size={22}
            />
          </div>
        )}
        {activeRename == doc.id && (
          <div className="flex gap-2">
            {/* <CircleX
              onClick={() => setActiveRename(null)}
              color="#9CA3AF"
              size={22}
            /> */}
            {/* <Save
              onClick={() => handleSave(doc.id)}
              color="#9CA3AF"
              size={22}
            /> */}
          </div>
        )}
      </li>
    );
  };

  const sharedDocs = () => documents.filter((doc) => doc.isShared);

  return (
    <>
      {/* Side bar Web view */}
      <div className="max-sm:hidden min-w-[310px] shadow-md p-5 flex flex-col">
        <div>
          <h2 className="text-[22px] font-medium mb-5 mt-5 flex justify-between">
            Documents{" "}
            <LoaderCircle
              className={`animate-spin transition ${
                fetching ? "opacity-100" : "opacity-0"
              }`}
            />{" "}
          </h2>
          
          <button
            onClick={handleCreateNewDocument}
            className="w-full px-[62px] py-3 mb-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            New Document
          </button>
        </div>
        <ul className="z-9 grow overflow-y-auto scroll-bar-design pr-2 flex flex-col gap-2">
          {documents
            .filter((doc) => !doc.isShared)
            .map((doc) => documentObject(doc))}
          {sharedDocs().length > 0 && (
            <Fragment>
              <div className="text-sm text-gray-500 mt-2">Shared with you</div>
              {documents
                .filter((doc) => doc.isShared)
                .map((doc) => documentObject(doc))}
            </Fragment>
          )}
        </ul>
      </div>
      {/* Side bar Mobile view */}
      <div
        onClick={() => setIsSidebarOpen?.(false)}
        className={`sm:hidden absolute top-0 z-[10000] h-full border  overflow-x-hidden ${
          openSidebar === true ? "w-full" : "w-0"
        }`}
      >
        <div className="bg-mediumGray bg-opacity-30 w-full h-full">
          <div
            onClick={(e) => e.stopPropagation()}
            className={`bg-white h-full flex flex-col overflow-x-hidden transition-width duration-300 ${
              openSidebar === true ? "w-[70%]" : "w-0"
            }`}
          >
            <div className="px-[15px] py-[10px] border-b-2 z-[99] flex justify-between items-center">
              <Image src={logo} alt="logo" className="w-[115.13px] h-[60px]" />
              <div>
                <X
                  onClick={() => setIsSidebarOpen?.(!openSidebar)}
                  className="w-[22px] h-[22px] text-slateGray cursor-pointer hover:text-red-500"
                />
              </div>
            </div>
            <div className="grow flex flex-col overflow-x-hidden w-full h-full p-5">
              <div className="w-full">
                <h2 className="text-[20px] font-medium flex justify-between">
                  Documents{" "}
                  <LoaderCircle
                    className={`animate-spin transition ${
                      fetching ? "opacity-100" : "opacity-0"
                    }`}
                  />{" "}
                </h2>
                <button
                  onClick={handleCreateNewDocument}
                  className="w-full mt-[22px] my-4 py-3 text-base bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  New Document
                </button>
              </div>
              <ul className="z-9 grow overflow-y-auto scroll-bar-design pr-2 flex flex-col gap-2">
                {documents
                  .filter((doc) => !doc.isShared)
                  .map((doc) => documentObject(doc))}
                {sharedDocs().length > 0 && (
                  <Fragment>
                    <div className="text-sm text-gray-500 mt-2">
                      Shared with you
                    </div>
                    {documents
                      .filter((doc) => doc.isShared)
                      .map((doc) => documentObject(doc))}
                  </Fragment>
                )}
              </ul>
            </div>
          </div>
        </div>
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
    </>
  );
};

export default DocumentsList;
