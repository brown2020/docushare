import { TriangleAlert, X } from "lucide-react";
import PopupModel from "./PopupModel";

interface DeleteFolderProps {
    setDeleteDoc: React.Dispatch<React.SetStateAction<string | null>>;
    deleteDocumentHandle: () => void;
}

export default function DeleteDocument({ setDeleteDoc, deleteDocumentHandle }: DeleteFolderProps) {
    return (
        <div>
            <PopupModel isOpen={true} onClose={() => setDeleteDoc(null)}>
                <div className="flex gap-2 border-b justify-between pt-2 px-2">
                    <div className="flex gap-2 px-2">
                        <TriangleAlert color="#9CA3AF" size={22} />
                        <h2>Delete folder ?</h2>
                    </div>
                    <X onClick={() => setDeleteDoc(null)} color="#9CA3AF" size={22} />
                </div>
                <div className="pb-2 px-2">
                    <p className="w-[80%] mx-auto text-center my-4 text-black text-opacity-60">are you sure you want to delete this folder ? </p>
                    <div className="flex gap-10 w-full">
                        <button onClick={() => setDeleteDoc(null)} className="w-full border rounded-lg py-1">Cancel</button>
                        <button onClick={deleteDocumentHandle} className="w-full border rounded-lg py-1 bg-red-300 border-red-300 hover:bg-red-400 hover:border-red-400">Delete</button>
                    </div>
                </div>
            </PopupModel>
        </div>
    )
} 