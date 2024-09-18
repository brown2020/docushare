"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, addDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseClient";
import CollaborativeEditor from "./CollaborativeEditor";
import { CircleX, Pencil, Save, Share, Share2, Trash2 } from 'lucide-react';
import DeleteDocument from "@/Models/DeleteDocument";
import ShereDocument from "@/Models/ShereDocument";
const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [documents, setDocuments] = useState<{ id: string; name?: string }[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeRename, setActiveRename] = useState<string | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<string | null>(null);
  const [shereDocument, setShereDocument] = useState<string | null>(null);
  const [docName, setDocName] = useState("");

  const fetchDocuments = async () => {
    const docsRef = collection(db, "docs");
    const docsSnapshot = await getDocs(docsRef);
    const docsData = docsSnapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
        name: typeof doc.data().name == 'string' ? doc.data().name : "Untitled Document"
      }
    }) as { id: string; name?: string }[]; // Allow 'name' to be optional

    setDocuments(docsData);
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
    const docRef = await addDoc(collection(db, "test"), {
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

  const handleSave = (docId: string) => {
    const docRef = doc(collection(db, "docs"), docId);
    const name = docName;
    setDoc(docRef, { name }, { merge: true });
    fetchDocuments();
    setActiveRename(null);
  }

  const deleteDocumentHandle = () => {
    deleteDoc(doc(collection(db, "docs"), deleteDocument?deleteDocument:""));
    fetchDocuments();
    setDeleteDocument(null);
  }

  const handleShereDocument = () => {

  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-100 p-4 border-r">
        <h2 className="text-lg font-semibold mb-4">Documents</h2>
        <button
          onClick={handleCreateNewDocument}
          className="w-full px-4 py-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          New Document
        </button>
        <ul>
          {documents.map((doc) => (
            <li key={doc.id} className={`flex gap-2 p-2 w-full justify-between rounded items-center ${doc.id === activeDocId ? "bg-blue-100" : ""}`}>
              {activeRename == doc.id ?
                <input type="text" onChange={(e) => { handleInputChange(e) }} value={docName} ref={inputRef}
                  className="w-full h-full bg-transparent outline-none border-b border-neutral-400" /> :
                <button onClick={() => handleActiveDocument(doc.id)} className={`text-left flex-1 ${doc.id === activeDocId ? "bg-blue-100" : ""}`} >
                  {doc.name || "Untitled"}
                </button>
              }
              {activeRename != doc.id &&
                <div className="flex gap-2">
                  <Pencil onClick={() => handleActiveRename(doc.id)} color="#9CA3AF" size={22} />
                  <Share onClick={() => {setShereDocument(doc.id); setDocName(doc.name || "Untitled")}} color="#9CA3AF" size={22}/>
                  <Trash2 onClick={() => setDeleteDocument(doc.id)} color="#9CA3AF" size={22} />
                </div>
              }
              {
                activeRename == doc.id &&
                <div className="flex gap-2">
                  <CircleX onClick={() => setActiveRename(null)} color="#9CA3AF" size={22} />
                  <Save onClick={() => handleSave(doc.id)} color="#9CA3AF" size={22} />
                </div>
              }
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 p-4">
        {activeDocId ? (
          <CollaborativeEditor docId={activeDocId} />
        ) : (
          <div className="text-center text-gray-500">
            Select or create a document to start editing.
          </div>
        )}
        {/* delete pop up */}
        {deleteDocument && <DeleteDocument setDeleteDoc={setDeleteDocument} deleteDocumentHandle={deleteDocumentHandle} />}
        {shereDocument && <ShereDocument documentName={docName} setShereDocument={setShereDocument} handleShereDocument={handleShereDocument} />}
      </div>
    </div>
  );
};

export default Dashboard;
