"use client";

import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useState } from "react";

interface ActiveDocContextType {
  activeDocId: string | null;
  setActiveDocId: Dispatch<SetStateAction<string | null>>;
  documentName: string | null;
  setDocumentName: Dispatch<SetStateAction<string | null>>;
}

const ActiveDocContext = createContext<ActiveDocContextType | undefined>(undefined);

export const ActiveDocProvider = ({ children }: { children: ReactNode }) => {
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);

  return (
    <ActiveDocContext.Provider value={{ activeDocId, setActiveDocId, documentName, setDocumentName }}>
      {children}
    </ActiveDocContext.Provider>
  );
};

export const useActiveDoc = () => {
  const context = useContext(ActiveDocContext);
  if (!context) {
    throw new Error("useActiveDoc must be used within an ActiveDocProvider");
  }
  return context;
};
