import { Mail, TriangleAlert, X } from "lucide-react";
import PopupModel from "./PopupModel";

interface ShereDocumentProps {
    setShereDocument: React.Dispatch<React.SetStateAction<string | null>>;
    handleShereDocument: () => void;
    documentName: string;
}

export default function ShereDocument({ setShereDocument, handleShereDocument, documentName }: ShereDocumentProps) {
    return (
        <div>
            <PopupModel isOpen={true} onClose={() => setShereDocument(null)}>
                <div className="flex gap-2 border-b justify-between pt-2 px-2">
                    <h2>{documentName}</h2>
                    <X onClick={() => setShereDocument(null)} color="#9CA3AF" size={22} />
                </div>

                <div className="px-2 pb-2 w-full">
                    <div>
                        <div className="flex gap-2 my-2">
                            <Mail color="#9CA3AF" size={22} />
                            <input type="email" placeholder="Email" className="outline-none border-b" />
                        </div>
                        <div className="flex gap-2 my-2">
                            <input type="checkbox" className="border" />
                            <p className="text-neutral-600">Editable</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full mt-2">
                        <button onClick={() => setShereDocument(null)} className="w-full border rounded-lg py-1">Cancel</button>
                        <button onClick={handleShereDocument} className="w-full border rounded-lg py-1 bg-red-300 border-red-300 hover:bg-red-400 hover:border-red-400">Shere</button>
                    </div>
                </div>
            </PopupModel>
        </div>
    )
} 