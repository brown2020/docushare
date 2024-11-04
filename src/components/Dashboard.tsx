"use client";

import CollaborativeEditor from "./CollaborativeEditor";
import DocumentsList from "./DocumentsList";
import { useActiveDoc } from "./ActiveDocContext";
import { useState } from "react";

const Dashboard = () => {
  const { activeDocId, setActiveDocId } = useActiveDoc();
  const {setDocumentName} = useActiveDoc();
  const handleActiveDocument = (docId: string) => {
    setActiveDocId(docId);
  };

  return (
    <div className="flex h-full w-full">
      <DocumentsList setSelectedDocumentName={setDocumentName} openSidebar={false} handleActiveDocument={handleActiveDocument} activeDocId={activeDocId} setActiveDocId={setActiveDocId} />
      <div className="grow overflow-hidden">
        <div className="h-full w-full">
          {activeDocId ? (
            <div key={activeDocId} className="flex flex-col h-full gap-2">
              <CollaborativeEditor docId={activeDocId} />
            </div>
          ) : (
            <div className="text-center text-black pt-[60px] text-lg">
              Select or create a document to start editing.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
