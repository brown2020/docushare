"use client";

import { useState, useEffect, useRef, Fragment } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseClient";
import CollaborativeEditor from "./CollaborativeEditor";
import { CircleX, LoaderCircle, Pencil, Save, Share2, Trash2 } from 'lucide-react';
import DeleteDocument from "./Models/DeleteDocument";
import ShereDocument from "@/components/Models/ShereDocument";
import { useAuth } from "@clerk/nextjs";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import toast from "react-hot-toast";

interface DocumentSchema {
  id: string;
  name?: string;
  isShared?: boolean;
}

const Dashboard = () => {
  const { isLoaded } = useAuth();
  const [user] = useAuthState(auth);
  const [documents, setDocuments] = useState<DocumentSchema[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeRename, setActiveRename] = useState<string | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<string | null>(null);
  const [shereDocument, setShereDocument] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchDocuments = async () => {
    if (!isLoaded) return;
    setFetching(true);
    try {
      const response = await fetch('/api/docs');
      const data = await response.json();
      setFetching(false);
      setDocuments(data);
    } catch (error) {
      console.log("Error fetching documents:", error);
      setFetching(false);
      toast.error("Something went wrong.");
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
  }, [user]);

  useEffect(() => {
    if (activeRename && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeRename]);

  const handleCreateNewDocument = async () => {
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
  };

  const handleActiveDocument = (docId: string) => {
    setActiveDocId(docId);
  }

  const inputRef = useRef<HTMLInputElement>(null);
  const handleActiveRename = (docId: string) => {
    setActiveRename(docId);
    const doc = documents.find(doc => doc.id === docId);
    setDocName(doc?.name || "Untitled");
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocName(e.target.value);
  };

  const handleSave = async (docId: string) => {
    const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
    const name = docName;
    setDoc(docRef, { name }, { merge: true });

    const _documents = [...documents];
    const index = _documents.findIndex(doc => doc.id === docId);
    _documents[index].name = name;
    setDocuments(_documents);
    setActiveRename(null);
  }

  const deleteDocumentHandle = () => {
    deleteDoc(doc(collection(db, DOCUMENT_COLLECTION), deleteDocument ? deleteDocument : ""));
    fetchDocuments();
    setDeleteDocument(null);
  }

  const handleShereDocument = async (email: string) => {
    if (!email) {
      toast.error('Email address is required.')
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          documentId: shereDocument
        })
      });
      setProcessing(false);
      const data = await response.json();

      if (data.status) {
        setShereDocument(null);
        toast.success("Document shared successfully");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("Error sharing document:", error);
      toast.error("Something went wrong.");
      setProcessing(false);
    }
  }

  const documentObject = (doc: DocumentSchema) => {
    return <li key={doc.id} className={`flex gap-2 p-2 w-full justify-between rounded items-center ${doc.id === activeDocId ? "bg-blue-100" : ""}`}>
      {activeRename == doc.id ?
        <input type="text" onChange={(e) => { handleInputChange(e) }} value={docName} ref={inputRef}
          className="w-full h-full bg-transparent outline-none border-b border-neutral-400" /> :
        <button onDoubleClick={() => handleActiveRename(doc.id)} onClick={() => handleActiveDocument(doc.id)} className={`text-left flex-1 ${doc.id === activeDocId ? "bg-blue-100" : ""}`} >
          {doc.name || "Untitled"}
        </button>
      }
      {activeRename != doc.id &&
        <div className="flex gap-2">
          <Pencil className="cursor-pointer" onClick={() => handleActiveRename(doc.id)} color="#9CA3AF" size={22} />
          <Share2 className="cursor-pointer" onClick={() => { setShereDocument(doc.id); setDocName(doc.name || "Untitled") }} color="#9CA3AF" size={22} />
          <Trash2 className="cursor-pointer" onClick={() => setDeleteDocument(doc.id)} color="#9CA3AF" size={22} />
        </div>
      }
      {
        activeRename == doc.id &&
        <div className="flex gap-2">
          <CircleX onClick={() => setActiveRename(null)} color="#9CA3AF" size={22} />
          <Save onClick={() => handleSave(doc.id)} color="#9CA3AF" size={22} />
        </div>
      }
    </li>;
  }

  const sharedDocs = () => documents.filter(doc => doc.isShared)

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-100 p-4 border-r">
        <h2 className="text-lg font-semibold mb-4 flex justify-between">Documents <LoaderCircle className={`animate-spin ${fetching ? "opacity-100" : 'opacity-0'}`} /> </h2>
        <button
          onClick={handleCreateNewDocument}
          className="w-full px-4 py-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Document
        </button>
        <ul className="z-9">
          {documents.filter(doc => !doc.isShared).map((doc) => documentObject(doc))}
          {
            sharedDocs().length > 0 && <Fragment>
              <div className="text-sm text-gray-500 mt-2">Shared with you</div>
              {documents.filter(doc => doc.isShared).map((doc) => documentObject(doc))}
            </Fragment>
          }
        </ul>
      </div>

      <div className="flex-1 p-4">
        {activeDocId ? (
          <CollaborativeEditor key={activeDocId} docId={activeDocId} />
        ) : (
          <div className="text-center text-gray-500">
            Select or create a document to start editing.
          </div>
        )}
        {/* delete pop up */}
        {deleteDocument && <DeleteDocument setDeleteDoc={setDeleteDocument} deleteDocumentHandle={deleteDocumentHandle} />}
        {shereDocument && <ShereDocument documentId={shereDocument} processing={processing} documentName={docName} setShereDocument={setShereDocument} handleShereDocument={handleShereDocument} />}
      </div>
    </div>
  );
};

export default Dashboard;
