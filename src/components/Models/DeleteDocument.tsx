import { TriangleAlert, X } from "lucide-react";
import PopupModel from "./PopupModel";

interface DeleteFolderProps {
    setDeleteDoc: React.Dispatch<React.SetStateAction<string | null>>;
    deleteDocumentHandle: () => void;
}

export default function DeleteDocument({ setDeleteDoc, deleteDocumentHandle }: DeleteFolderProps) {
    return (
        <div>
            <PopupModel extraCss="w-[400px] !m-0" isOpen={true} onClose={() => setDeleteDoc(null)}>
                <div className="flex gap-2 border-b justify-between p-5">
                    <div className="flex gap-2 px-2">
                        <TriangleAlert color="#9CA3AF" size={22} />
                        <h2 className="font-medium text-base">Delete document ?</h2>
                    </div>
                    <X onClick={() => setDeleteDoc(null)} size={22} className="text-[#9CA3AF] hover:text-red-500 cursor-pointer" />
                </div>
                <div className="p-5">
                    <p className="w-[65%] mx-auto mb-5 text-center text-[#1E1E1E]">are you sure you want to delete this document ? </p>
                    <div className="flex gap-[10px] w-full">
                        <button onClick={() => setDeleteDoc(null)} className="border rounded-lg py-3 justify-center items-center w-full hover:bg-slate-300 hover:border-slate-300">Cancel</button>
                        <button onClick={deleteDocumentHandle} className="py-3 w-full border text-base rounded-lg text-white bg-red-500 border-red-500 hover:bg-red-700 hover:border-red-700">Delete</button>
                    </div>
                </div>
            </PopupModel>
        </div>
    )
} 