import { LoaderCircle, Mail, X, Share2 } from "lucide-react";
import PopupModel from "./PopupModel";
import { Fragment, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface ShareDocumentProps {
  setShareDocument: React.Dispatch<React.SetStateAction<string | null>>;
  handleShareDocument: (email: string) => void;
  documentName: string;
  processing: boolean;
  documentId: string;
}

export default function ShareDocument({
  setShareDocument,
  handleShareDocument,
  documentName,
  processing,
  documentId,
}: ShareDocumentProps) {
  const [email, setEmail] = useState("");
  const [fetching, setFetching] = useState(false);
  const [emailList, setEmailList] = useState([]);

  const fetchSearched = useCallback(async () => {
    setFetching(true);
    try {
      const response = await fetch(`/api/share?documentId=${documentId}`);
      const data = await response.json();
      setFetching(false);
      setEmailList(data.emails);
    } catch (error) {
      console.log("Error fetching documents:", error);
      setFetching(false);
      toast.error("Something went wrong.");
    }
  }, [documentId]);

  useEffect(() => {
    fetchSearched();
  }, [fetchSearched]);

  return (
    <div>
      <PopupModel
        isOpen={true}
        onClose={() => {
          if (!processing) setShareDocument(null);
        }}
        extraCss="sm:w-[450px]"
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Share2 className="text-blue-500" size={20} />
            <h2 className="text-xl font-semibold text-gray-800">
              Share Document: {documentName}
            </h2>
          </div>
          <button
            onClick={() => !processing && setShareDocument(null)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            disabled={processing}
          >
            <X
              size={20}
              className={processing ? "text-gray-400" : "text-gray-600"}
            />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <Mail className="text-gray-400" size={18} />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Enter email address"
                className="flex-1 outline-none border-none"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Shared With</h3>
              {fetching && (
                <LoaderCircle
                  size={16}
                  className="animate-spin text-gray-400"
                />
              )}
            </div>

            <div className="bg-gray-50 rounded-md p-2 min-h-[100px] max-h-[150px] overflow-y-auto">
              {!fetching && Array.isArray(emailList) && emailList.length > 0 ? (
                <ul className="space-y-1">
                  {emailList.map((value, index) => (
                    <li
                      key={index}
                      className="text-gray-700 py-1 px-2 rounded hover:bg-gray-100"
                    >
                      {value}
                    </li>
                  ))}
                </ul>
              ) : !fetching ? (
                <p className="text-gray-500 text-center py-4">
                  Not shared with anyone yet
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              disabled={processing}
              onClick={() => !processing && setShareDocument(null)}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              disabled={processing || !email.trim()}
              onClick={() => handleShareDocument(email)}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {processing ? (
                <>
                  <LoaderCircle size={16} className="animate-spin mr-2" />
                  <span>Sharing...</span>
                </>
              ) : (
                <span>Share</span>
              )}
            </button>
          </div>
        </div>
      </PopupModel>
    </div>
  );
}
