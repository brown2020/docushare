"use client";

import { RefObject } from "react";
import { Share2, Trash2, Edit2 } from "lucide-react";

export type DocumentListItemModel = {
  id: string;
  name?: string;
  isShared?: boolean;
};

type Props = {
  doc: DocumentListItemModel;
  activeDocId: string | null;
  isRenaming: boolean;
  docName: string;
  inputRef: RefObject<HTMLInputElement | null>;
  editContainerRef: RefObject<HTMLDivElement | null>;
  onSelect: (id: string, name: string) => void;
  onRenameStart: (id: string) => void;
  onRenameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRenameSave: (id: string, close: boolean) => void;
  onRenameCancel: (originalName: string) => void;
  onShare: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export function DocumentListItem({
  doc,
  activeDocId,
  isRenaming,
  docName,
  inputRef,
  editContainerRef,
  onSelect,
  onRenameStart,
  onRenameChange,
  onRenameSave,
  onRenameCancel,
  onShare,
  onDelete,
}: Props) {
  return (
    <div
      className={`p-2 rounded-md flex items-center justify-between ${
        activeDocId === doc.id ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex-1 truncate group min-w-0">
        {isRenaming ? (
          <div ref={editContainerRef} className="w-full">
            <input
              ref={inputRef}
              type="text"
              aria-label="Document name"
              value={docName}
              onChange={onRenameChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameSave(doc.id, true);
                else if (e.key === "Escape")
                  onRenameCancel(doc.name || "Untitled");
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex-1 text-left text-gray-700 truncate"
              onClick={() => onSelect(doc.id, doc.name || "Untitled")}
              onDoubleClick={() => onRenameStart(doc.id)}
            >
              {doc.name || "Untitled"}
            </button>
            <button
              type="button"
              aria-label="Rename document"
              onClick={() => onRenameStart(doc.id)}
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
          type="button"
          aria-label="Share document"
          onClick={() => onShare(doc.id, doc.name || "Untitled")}
          className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
          title="Share document"
        >
          <Share2 size={16} />
        </button>
        <button
          type="button"
          aria-label="Delete document"
          onClick={() => onDelete(doc.id)}
          className="p-1 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded"
          title="Delete document"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
