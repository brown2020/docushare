import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useCallback } from "react";

import { ImageUploader } from "./ImageUploader";

export const ImageUpload: React.FC<NodeViewProps> = ({ getPos, editor }) => {
  const onUpload = useCallback(
    (url: string) => {
      const pos = getPos();
      if (url && typeof pos === 'number') {
        editor
          .chain()
          .setImageBlockAt({
            src: url,
            pos: { from: pos, to: pos + 1 },
          })
          .focus()
          .run();
      }
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
