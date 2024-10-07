import { Editor, NodeViewWrapper } from '@tiptap/react'
import { useCallback } from 'react'

import { ImageUploader } from './ImageUploader'

export const ImageUpload = ({ getPos, editor, node }: { getPos: () => number; editor: Editor, node: any }) => {
  const onUpload = useCallback(
    (url: string) => {
      if (url) {
        editor.chain().setImageBlockAt({ src: url, pos: { from: getPos(), to: getPos() + 1 } }).focus().run()
      }
    },
    [getPos, editor],
  )

  return (
    <NodeViewWrapper>
      <div className="p-0 m-0" data-drag-handle>
        <ImageUploader onUpload={onUpload} />
      </div>
    </NodeViewWrapper>
  )
}

export default ImageUpload
