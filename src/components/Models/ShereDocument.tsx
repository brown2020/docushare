import { LoaderCircle, Mail, TriangleAlert, X } from "lucide-react";
import PopupModel from "./PopupModel";
import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ShereDocumentProps {
    setShereDocument: React.Dispatch<React.SetStateAction<string | null>>;
    handleShereDocument: (email: string) => void;
    documentName: string;
    processing: boolean;
    documentId: string;
}

export default function ShereDocument({ setShereDocument, handleShereDocument, documentName, processing, documentId }: ShereDocumentProps) {

    const [email, setEmail] = useState("");
    const [fetching, setFetching] = useState(false);
    const [emailList, setEmailList] = useState([]);

    useEffect(() => {
        fetchSearched();
    }, [])

    const fetchSearched = async () => {
        setFetching(true);
        try {
            const response = await fetch(`/api/share?documentId=${documentId}`);
            const data = await response.json();
            setFetching(false);
            setEmailList(data.emails);
        } catch (error) {
            setFetching(false);
            toast.error("Something went wrong.");
        }
    }

    return (
        <div>
            <PopupModel isOpen={true} onClose={() => {
                if (!processing) setShereDocument(null)
            }}>
                <div className="flex gap-2 border-b justify-between py-3 px-3">
                    <h2>Share Document <strong>{documentName}</strong></h2>
                    <X onClick={() => setShereDocument(null)} color="#9CA3AF" size={22} />
                </div>

                <div className="px-3 pb-3 w-full">
                    <div>
                        <div className="flex gap-2 my-2 py-2">
                            <Mail color="#9CA3AF" size={22} />
                            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="outline-none border-b" />
                        </div>
                        {/* <div className="flex gap-2 my-2">
                            <input type="checkbox" className="border" />
                            <p className="text-neutral-600">Editable</p>
                        </div> */}

                        <hr />
                        <div className="py-2">
                            <div className="text-sm text-gray-500 flex justify-between">Shared With <LoaderCircle className={`animate-spin ${fetching ? "opacity-100" : 'opacity-0'}`} /></div>
                            <ol>
                                { Array.isArray(emailList) ? emailList.map((value, index) => <li key={index}>{value}</li>) : <Fragment></Fragment>}
                            </ol>
                        </div>
                        <hr />
                    </div>
                    <div className="flex gap-2 w-full mt-2">
                        <button disabled={processing} onClick={() => setShereDocument(null)} className="w-full border rounded-lg py-1">Cancel</button>
                        <button disabled={processing} onClick={() => handleShereDocument(email)} className="w-full border rounded-lg py-1 bg-red-300 border-red-300 hover:bg-red-400 hover:border-red-400">
                            {processing ? 'Wait...' : 'Shere'}
                        </button>
                    </div>
                </div>
            </PopupModel>
        </div>
    )
} 