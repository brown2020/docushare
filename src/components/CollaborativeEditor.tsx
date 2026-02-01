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
import { LinkMenu } from "./menus/LinkMenu";
import { LoaderCircle, Save } from "lucide-react";
import ImageBlockMenu from "@/extensions/ImageBlock/components/ImageBlockMenu";
import { useActiveDoc } from "./ActiveDocContext";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface CollaborativeEditorProps {
  docId: string;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ docId }) => {
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const userPosition = useRef({ from: 0, to: 0 });
  const isUpdating = useRef(false);
  const [processing, setProcessing] = useState(true);
  const menuContainerRef = useRef(null);
  const { userId } = useFirebaseAuth();

  const scheduleProcessing = useCallback((value: boolean) => {
    Promise.resolve().then(() => setProcessing(value));
  }, []);

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

      // Clear existing timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Debounced save
      debounceTimeout.current = setTimeout(async () => {
        const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
        const content = editor.getJSON();
        scheduleProcessing(true);
        try {
          await setDoc(docRef, { content, updatedAt: new Date() }, { merge: true });
        } catch (error) {
          console.error("Error saving document:", error);
        }
        scheduleProcessing(false);
      }, 500);
    },
  });

  useEffect(() => {
    setIsReady(!!editor);
  }, [editor]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  const updateContent = useCallback(
    (snapshot: DocumentSnapshot) => {
      if (!editor || !isInitialized) return;

      const data = snapshot.data();
      if (
        data &&
        data.content &&
        JSON.stringify(data.content) !== JSON.stringify(editor.getJSON())
      ) {
        isUpdating.current = true;
        editor.commands.setContent(data.content, { emitUpdate: false });
        // Restore cursor position after content update
        requestAnimationFrame(() => {
          try {
            editor.commands.setTextSelection(userPosition.current);
          } catch {
            // Selection might be out of bounds, ignore
          }
          isUpdating.current = false;
          scheduleProcessing(false);
        });
      } else {
        scheduleProcessing(false);
      }
    },
    [editor, isInitialized, scheduleProcessing]
  );

  // FIXED: Wait for initialization before subscribing to snapshots
  useEffect(() => {
    if (!editor || !userId) return;

    const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
    let unsubscribe: (() => void) | null = null;

    const initializeAndSubscribe = async () => {
      try {
        // First, check and initialize the document
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !docSnap.data()?.content) {
          await setDoc(
            docRef,
            {
              content: editor.getJSON(),
              updatedAt: new Date(),
              ...(!docSnap.exists() && {
                owner: userId,
                share: [],
                createdAt: new Date(),
              }),
            },
            { merge: true }
          );
        } else {
          // Load existing content into editor
          const content = docSnap.data()?.content;
          if (content) {
            isUpdating.current = true;
            editor.commands.setContent(content, { emitUpdate: false });
            isUpdating.current = false;
          }
        }

        // Mark as initialized before subscribing
        setIsInitialized(true);
        scheduleProcessing(false);

        // Now subscribe to changes
        unsubscribe = onSnapshot(docRef, updateContent);
      } catch (error) {
        console.error("Error initializing document:", error);
        scheduleProcessing(false);
      }
    };

    initializeAndSubscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [editor, docId, userId, updateContent, scheduleProcessing]);

  if (!editor) {
    return (
      <div className="h-full w-full flex justify-center items-center">
        <LoaderCircle className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Fragment>
      {isReady ? (
        <Fragment>
          <div className="sm:hidden w-full px-4 mt-6">
            <h2 className="text-lg font-semibold truncate text-neutral-900 dark:text-white">
              {documentName}
            </h2>
          </div>
          <div className="m-6 max-sm:mb-6 max-sm:mt-0 max-sm:mx-4 border border-neutral-200 dark:border-neutral-700 h-[calc(100vh-120px)] overflow-hidden rounded-xl flex flex-col bg-white dark:bg-neutral-900 shadow-sm">
            {/* Toolbar */}
            <div className="flex w-full justify-between items-center border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
              <div className="grow overflow-x-auto scroll-bar-design">
                <TextMenu editor={editor} />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400">
                {processing ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Saved</span>
                  </>
                )}
              </div>
            </div>
            {/* Editor Content */}
            <div
              ref={menuContainerRef}
              className="overflow-auto grow scroll-bar-design bg-white dark:bg-neutral-900"
            >
              <EditorContent
                editor={editor}
                className="h-full relative prose prose-sm dark:prose-invert max-w-none p-4 [&>div]:h-full"
              />
            </div>
            <LinkMenu editor={editor} />
            <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
          </div>
        </Fragment>
      ) : (
        <div className="h-full w-full flex justify-center items-center">
          <LoaderCircle className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      )}
    </Fragment>
  );
};

export default CollaborativeEditor;
