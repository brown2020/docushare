"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseClient";
import CollaborativeEditor from "./CollaborativeEditor";

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [documents, setDocuments] = useState<{ id: string; name?: string }[]>(
    []
  );
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDocuments = async () => {
      const docsRef = collection(db, "docs");
      const docsSnapshot = await getDocs(docsRef);
      const docsData = docsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as { id: string; name?: string }[]; // Allow 'name' to be optional
      setDocuments(docsData);
    };

    fetchDocuments();
  }, [user]);

  const handleCreateNewDocument = async () => {
    const docRef = await addDoc(collection(db, "docs"), {
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
            <li key={doc.id}>
              <button
                onClick={() => setActiveDocId(doc.id)}
                className={`w-full text-left p-2 rounded ${
                  doc.id === activeDocId ? "bg-blue-100" : ""
                }`}
              >
                {doc.name || "Untitled"}
              </button>
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
      </div>
    </div>
  );
};

export default Dashboard;
