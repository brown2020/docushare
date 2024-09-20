import { Fragment, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit"; // StarterKit provides the necessary schema

import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { DOCUMENT_COLLECTION } from "@/lib/constants";

interface CollaborativeEditorProps {
  docId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ docId }) => {
  const [isReady, setIsReady] = useState(false);
  // const [userPosition, setUserPosition] = useState({ from: 0, to: 0 });
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit, // Ensure StarterKit is included first for the base schema
    ],
    content: "",
    onUpdate: ({ editor }) => {
      // const { from, to } = editor.state.selection;
      // setUserPosition({ from, to });
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
        const content = editor.getJSON();
        setDoc(docRef, { content }, { merge: true });
      }, 500);
    },
  });

  useEffect(() => {
    setIsReady(editor ? true : false);
  }, [editor])

  useEffect(() => {
    if (!editor) return;

    const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      if (
        data &&
        data.content &&
        JSON.stringify(data.content) !== JSON.stringify(editor.getJSON())
      ) {
        editor.chain().setContent(data.content).run();
        // editor.chain().setContent(data.content).focus(userPosition.from).run();
        
      }
    });

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
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none border border-gray-200 rounded-md shadow-md p-2"
        />
      ) : (
        <Fragment>Loading editor...</Fragment>
      )}
    </Fragment>
  );
};

export default CollaborativeEditor;
