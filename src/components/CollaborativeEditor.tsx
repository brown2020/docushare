import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";

import {
  collection,
  doc,
  DocumentSnapshot,
  onSnapshot,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { DOCUMENT_COLLECTION } from "@/lib/constants";
import ExtensionKit from "@/extensions/extension-kit";
import { TextMenu } from "./menus/TextMenu";
// import '@/styles/index.css'
import { LinkMenu } from "./menus/LinkMenu";
import { LoaderCircle } from "lucide-react";
import ImageBlockMenu from "@/extensions/ImageBlock/components/ImageBlockMenu";
import { useActiveDoc } from "./ActiveDocContext";
import { auth } from "@/firebase/firebaseClient";

interface CollaborativeEditorProps {
  docId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ docId }) => {
  const [isReady, setIsReady] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const userPosition = useRef({ from: 0, to: 0 });
  const isUpdating = useRef(false);
  const [processing, setProcessing] = useState(true);
  const menuContainerRef = useRef(null);
  const scheduleProcessing = useCallback(
    (value: boolean) => {
      Promise.resolve().then(() => setProcessing(value));
    },
    [setProcessing]
  );

  const { documentName } = useActiveDoc();

  const editor = useEditor({
    extensions: [...ExtensionKit({})],
    autofocus: true,
    immediatelyRender: false,
    onSelectionUpdate: ({ editor }) => {
      if (isUpdating.current) return;
      const { from, to } = editor.state.selection;
      userPosition.current = { from, to };
    },
    onUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      userPosition.current = { from, to };
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(async () => {
        const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
        const content = editor.getJSON();
        scheduleProcessing(true);
        await setDoc(docRef, { content }, { merge: true });
        scheduleProcessing(false);
      }, 500);
    },
  });

  useEffect(() => {
    setIsReady(editor ? true : false);
  }, [editor]);

  const updateContent = useCallback(
    (snapshot: DocumentSnapshot) => {
      if (editor === null) return;

      const data = snapshot.data();
      if (
        data &&
        data.content &&
        JSON.stringify(data.content) !== JSON.stringify(editor.getJSON())
      ) {
        isUpdating.current = true;
        editor.commands.setContent(data.content, { emitUpdate: false });
        setTimeout(() => {
          editor.commands.setTextSelection(userPosition.current);
          isUpdating.current = false;
          scheduleProcessing(false);
        }, 0);
      } else {
        scheduleProcessing(false);
      }
    },
    [isUpdating, editor, scheduleProcessing]
  );

  useEffect(() => {
    if (!editor) return;
    const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);

    // First, check if the document exists and has the necessary fields
    const checkAndInitializeDoc = async () => {
      try {
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !docSnap.data().content) {
          // Initialize the document with required fields if it doesn't exist or is missing content
          await setDoc(
            docRef,
            {
              content: editor.getJSON(),
              updatedAt: new Date(),
              // Only set these fields if the document doesn't exist
              ...(!docSnap.exists() && {
                owner: auth.currentUser?.uid,
                share: [],
                createdAt: new Date(),
              }),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.error("Error checking/initializing document:", error);
        scheduleProcessing(false);
      }
    };

    checkAndInitializeDoc();

    const unsubscribe = onSnapshot(docRef, updateContent);

    return () => {
      unsubscribe();
    };
  }, [editor, docId, updateContent]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <Fragment>
      {isReady ? (
        <Fragment>
          <div className=" sm:hidden w-full px-[15px] mt-[30px]">
            <h2 className="text-lg font-semibold truncate">{documentName}</h2>
          </div>
          <div className="m-10 max-sm:mb-[30px] max-sm:mt-0 max-sm:mx-[15px] border border-gray-300 h-screen overflow-hidden rounded-[10px] flex flex-col">
            <div className="flex w-full justify-between border-b border-gray-300">
              <div className="grow overflow-y-hidden scroll-bar-design">
                <TextMenu editor={editor} />
              </div>
              <LoaderCircle
                className={`animate-spin transition self-center mr-2 ${
                  processing ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
            <div
              ref={menuContainerRef}
              className="overflow-auto grow overflow-y-auto scroll-bar-design bg-white shadow-md"
            >
              <EditorContent
                editor={editor}
                className="h-full relative prose prose-sm max-w-none p-2 [&>div]:h-full"
              />
            </div>
            <LinkMenu editor={editor} />
            <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
          </div>
        </Fragment>
      ) : (
        <Fragment>
          <div className="h-full w-full flex justify-center items-center">
            <LoaderCircle className={`animate-spin transition`} />
          </div>
        </Fragment>
      )}
    </Fragment>
  );
};

export default CollaborativeEditor;
