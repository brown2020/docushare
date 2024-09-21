import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";

import { collection, doc, DocumentSnapshot, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import ExtensionKit from "@/extensions/extension-kit";
import { TextMenu } from "./menus/TextMenu";
import '@/styles/index.css'
import { LinkMenu } from "./menus/LinkMenu";
import { LoaderCircle } from "lucide-react";

interface CollaborativeEditorProps {
  docId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ docId }) => {
  const [isReady, setIsReady] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const userPosition = useRef({ from: 0, to: 0 });
  const isUpdating = useRef(false);
  const [processing, setProcessing] = useState(true);

  const editor = useEditor({
    extensions: [...ExtensionKit({})],
    autofocus: true,
    onSelectionUpdate: ({ editor }) => {
      if (isUpdating.current) return;
      const { from, to } = editor.state.selection;
      userPosition.current = ({ from, to });
    },
    onUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      userPosition.current = ({ from, to });
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(async () => {
        const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
        const content = editor.getJSON();
        setProcessing(true);
        await setDoc(docRef, { content }, { merge: true });
        setProcessing(false);
      }, 500);
    },
  });

  useEffect(() => {
    setIsReady(editor ? true : false);
  }, [editor])

  const updateContent = useCallback((snapshot: DocumentSnapshot) => {
    if(editor === null) return;
    
    const data = snapshot.data();
    if (
      data &&
      data.content &&
      JSON.stringify(data.content) !== JSON.stringify(editor.getJSON())
    ) {
      isUpdating.current = true;
      editor.commands.setContent(data.content, false)
      setTimeout(() => {
        editor.commands.setTextSelection(userPosition.current);
        isUpdating.current = false;
        setProcessing(false)
      }, 0);
    }else{
      setProcessing(false);
    }
    
  }, [processing, isUpdating, editor, docId]);

  useEffect(() => {
    if (!editor) return;
    const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
    
    const unsubscribe = onSnapshot(docRef, updateContent);

    return () => {
      unsubscribe();
    };
  }, [editor, docId]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <Fragment>
      {isReady ? (
        <Fragment>
          <div className="flex w-full justify-between bg-white rounded-lg">
            <TextMenu editor={editor} />
            <LoaderCircle className={`animate-spin transition self-center mr-2 ${processing ? "opacity-100" : 'opacity-0'}`} />
          </div>
          <div className="grow overflow-y-auto bg-white  border border-gray-200 rounded-md shadow-md">
            <EditorContent
              editor={editor}
              className="h-full relative prose prose-sm max-w-none p-2 [&>div]:h-full"
            />
          </div>
          <LinkMenu editor={editor} />
        </Fragment>
      ) : (
        <Fragment>Loading editor...</Fragment>
      )}
    </Fragment>
  );
};

export default CollaborativeEditor;
