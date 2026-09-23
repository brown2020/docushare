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
import {
  formatFirebaseErrorForLog,
  formatFirebaseErrorForToast,
} from "@/lib/firebaseErrorCode";
import {
  EMPTY_DOC_JSON,
  needsContentRepair,
  normalizeEditorContent,
} from "@/lib/editorContent";
import toast from "react-hot-toast";

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
        scheduleProcessing(true);
        try {
          const content = normalizeEditorContent(editor.getJSON());
          await setDoc(
            docRef,
            { content, updatedAt: new Date() },
            { merge: true }
          );
        } catch (error) {
          console.warn("[docs] save_failed", formatFirebaseErrorForLog(error));
          toast.error(
            formatFirebaseErrorForToast(error, "Failed to save document.")
          );
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

  const applyEditorContent = useCallback(
    (raw: unknown, opts?: { emitUpdate?: boolean }) => {
      if (!editor) return;
      const normalized = normalizeEditorContent(raw);
      try {
        editor.commands.setContent(normalized, {
          emitUpdate: opts?.emitUpdate ?? false,
        });
      } catch (error) {
        console.warn(
          "[editor] setContent_failed",
          formatFirebaseErrorForLog(error)
        );
        try {
          editor.commands.setContent(EMPTY_DOC_JSON, { emitUpdate: false });
        } catch (fallbackError) {
          console.warn(
            "[editor] setContent_empty_failed",
            formatFirebaseErrorForLog(fallbackError)
          );
        }
      }
    },
    [editor]
  );

  const updateContent = useCallback(
    (snapshot: DocumentSnapshot) => {
      if (!editor || !isInitialized) return;

      const data = snapshot.data();
      const raw = data?.content;
      const normalized = normalizeEditorContent(raw);
      if (JSON.stringify(normalized) === JSON.stringify(editor.getJSON())) {
        scheduleProcessing(false);
        return;
      }
      isUpdating.current = true;
      applyEditorContent(raw, { emitUpdate: false });
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
    },
    [editor, isInitialized, scheduleProcessing, applyEditorContent]
  );

  // FIXED: Wait for initialization before subscribing to snapshots
  useEffect(() => {
    if (!editor || !userId) return;

    const docRef = doc(collection(db, DOCUMENT_COLLECTION), docId);
    let unsubscribe: (() => void) | null = null;

    let ignore = false;
    const initializeAndSubscribe = async () => {
      try {
        // First, check and initialize the document
        const docSnap = await getDoc(docRef);
        if (ignore) return;

        const existing = docSnap.exists() ? docSnap.data()?.content : undefined;
        if (!docSnap.exists() || needsContentRepair(existing)) {
          // Prefer empty doc when repairing invalid stored shapes (e.g. `{}`).
          const content = needsContentRepair(existing)
            ? EMPTY_DOC_JSON
            : normalizeEditorContent(editor.getJSON());
          await setDoc(
            docRef,
            {
              content,
              updatedAt: new Date(),
              ...(!docSnap.exists() && {
                owner: userId,
                share: [],
                createdAt: new Date(),
              }),
            },
            { merge: true }
          );
          isUpdating.current = true;
          applyEditorContent(content, { emitUpdate: false });
          isUpdating.current = false;
        } else {
          isUpdating.current = true;
          applyEditorContent(existing, { emitUpdate: false });
          isUpdating.current = false;
        }

        if (ignore) return;
        // Mark as initialized before subscribing
        setIsInitialized(true);
        scheduleProcessing(false);

        // Now subscribe to changes
        unsubscribe = onSnapshot(docRef, updateContent);
      } catch (error) {
        console.warn("[editor] init_failed", formatFirebaseErrorForLog(error));
        scheduleProcessing(false);
      }
    };

    initializeAndSubscribe();

    return () => {
      ignore = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [editor, docId, userId, updateContent, scheduleProcessing, applyEditorContent]);

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
