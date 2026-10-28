import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";
import { JSONContent } from "@tiptap/core";

import { ImageUploader } from "./ImageUploader";
import { UploadedFile } from "./hooks";

const NO_EXTRACTED_TEXT =
  "No extractable text was found in this file. Open the link to view it. AI can read text that appears in the document.";

function documentContent(file: UploadedFile): JSONContent[] {
  const body = file.text.trim() || NO_EXTRACTED_TEXT;
  const paragraphs = body
    .split(/\n+/)
    .slice(0, 200)
    .map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line.slice(0, 4000) }],
    }));
  return [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: file.name,
          marks: [{ type: "link", attrs: { href: file.url } }],
        },
      ],
    },
    ...paragraphs,
  ];
}

export const ImageUpload: React.FC<NodeViewProps> = ({ getPos, editor }) => {
  const onUpload = useCallback(
    (file: UploadedFile) => {
      const pos = getPos();
      if (!file.url || typeof pos !== "number") return;
      const content =
        file.kind === "image"
          ? { type: "imageBlock", attrs: { src: file.url } }
          : documentContent(file);
      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + 1 })
        .insertContent(content)
        .run();
    },
    [getPos, editor]
  );

  return (
    <NodeViewWrapper>
      <div className="p-0" data-drag-handle>
        <ImageUploader onUpload={onUpload} />
      </div>
    </NodeViewWrapper>
  );
};

export default ImageUpload;
