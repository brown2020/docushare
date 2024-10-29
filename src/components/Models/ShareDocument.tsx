import { LoaderCircle, Mail, X } from "lucide-react";
import PopupModel from "./PopupModel";
import { Fragment, useEffect, useState } from "react";
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

  useEffect(() => {
    fetchSearched();
  });

  const fetchSearched = async () => {
    setFetching(true);
    try {
      const response = await fetch(`/api/share?documentId=${documentId}`);
      const data = await response.json();
      setFetching(false);
      setEmailList(data.emails);
      console.log("emailList", emailList);
    } catch (error) {
      console.log("Error fetching documents:", error);
      setFetching(false);
      toast.error("Something went wrong.");
    }
  };

  return (
    <div>
      <PopupModel
        isOpen={true}
        onClose={() => {
          if (!processing) setShareDocument(null);
        }}
        extraCss="w-[400px] !m-0"
      >
        <div className="flex gap-2 border-b justify-between p-5">
          <h2 className="text-base">
            Share Document {documentName}
          </h2>
          <X onClick={() => setShareDocument(null)}  className="text-[#9CA3AF] hover:text-red-500 cursor-pointer" size={22} />
        </div>

        <div className="p-5 w-full">
          <div>
            <div className="flex gap-2 border p-3 rounded-lg"> 
              <Mail color="#9CA3AF" size={22} />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                className="outline-none border-none w-full"
              />
            </div>
            <div className="py-2 pt-4">
              <div className="text-sm text-gray-500 flex justify-between">
                Shared With{" "}
                <LoaderCircle
                  className={`animate-spin ${
                    fetching ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
              <ol>
                {Array.isArray(emailList) ? (
                  emailList.map((value, index) => <li key={index}>{value}</li>)
                ) : (
                  <Fragment></Fragment>
                )}
              </ol>
            </div>
          </div>
          <div className="flex gap-[10px] w-full mt-2">
            <button
              disabled={processing}
              onClick={() => setShareDocument(null)}
              className="border rounded-lg py-3 justify-center items-center w-full hover:bg-slate-300 hover:border-slate-300 "
            >
                Cancel
              {/* <X size={16} /> */}
            </button>
            <button
              disabled={processing}
              onClick={() => handleShareDocument(email)}
              className=" py-3 w-full border text-base rounded-lg text-white bg-blue-500 border-blue-500 hover:bg-blue-700 hover:border-blue-700"
            >
              {processing ? "Wait..." : "Share"}
            </button>
          </div>
        </div>
      </PopupModel>
    </div>
  );
}
