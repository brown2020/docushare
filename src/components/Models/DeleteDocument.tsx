import { TriangleAlert, X } from "lucide-react";
import PopupModel from "./PopupModel";

interface DeleteFolderProps {
  setDeleteDoc: React.Dispatch<React.SetStateAction<string | null>>;
  deleteDocumentHandle: () => void;
}

export default function DeleteDocument({
  setDeleteDoc,
  deleteDocumentHandle,
}: DeleteFolderProps) {
  return (
    <div>
      <PopupModel
        extraCss="sm:w-[400px]"
        isOpen={true}
        onClose={() => setDeleteDoc(null)}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <TriangleAlert className="text-amber-500" size={20} />
            <h2 className="text-xl font-semibold text-gray-800">
              Delete Document
            </h2>
          </div>
          <button
            onClick={() => setDeleteDoc(null)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-center text-gray-700 mb-6">
            Are you sure you want to delete this document? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setDeleteDoc(null)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={deleteDocumentHandle}
              className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </PopupModel>
    </div>
  );
}
