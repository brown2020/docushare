import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit"; // StarterKit provides the necessary schema
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCursor } from "@tiptap/extension-collaboration-cursor";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase/firebaseClient";

interface CollaborativeEditorProps {
  docId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ docId }) => {
  const [user] = useAuthState(auth);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (ydocRef.current) {
      return;
    }

    ydocRef.current = new Y.Doc();
    providerRef.current = new WebrtcProvider(docId, ydocRef.current);

    new IndexeddbPersistence(docId, ydocRef.current);

    setIsReady(true);

    return () => {
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, [docId]);

  const editor = useEditor(
    isReady
      ? {
          extensions: [
            StarterKit, // Ensure StarterKit is included first for the base schema
            Collaboration.configure({
              document: ydocRef.current!,
              field: "content", // Correctly sync the content field
            }),
            CollaborationCursor.configure({
              provider: providerRef.current!,
              user: {
                name: user?.displayName || "Anonymous",
                color: "#f783ac",
              },
            }),
          ],
          content: "",
          onUpdate: ({ editor }) => {
            const docRef = doc(collection(db, "docs"), docId);
            const content = editor.getJSON();
            setDoc(docRef, { content }, { merge: true });
          },
        }
      : undefined, // Pass undefined if not ready
    [isReady, docId, user?.displayName]
  );

  useEffect(() => {
    if (!editor) return;

    const docRef = doc(collection(db, "docs"), docId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const data = snapshot.data();
      if (
        data &&
        data.content &&
        JSON.stringify(data.content) !== JSON.stringify(editor.getJSON())
      ) {
        editor.commands.setContent(data.content);
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
    <EditorContent
      editor={editor}
      className="prose prose-sm max-w-none p-4 border border-gray-200 rounded-md shadow-md"
    />
  );
};

export default CollaborativeEditor;
