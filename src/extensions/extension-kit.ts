'use client'

import {
  Document,
  Heading,
  StarterKit,
  Underline,
  HighLightSelection,
  FontFamily,
  Typography,
  TextStyle,
  Link,
  Subscript,
  Superscript,
  TextAlign,
  FontSize,
  Markdown,
  ImageUpload,
  ImageBlock
} from '.'
import { AnyExtension } from '@tiptap/core'

interface ExtensionKitProps {
  userId?: string
  userName?: string
  userColor?: string
}

export const ExtensionKit = ({ }: ExtensionKitProps): AnyExtension[] => [
  Document,
  StarterKit.configure({
    document: false,
    dropcursor: false,
    heading: false,
    horizontalRule: false,
    blockquote: false,
    // history: false,
    codeBlock: false,
  }),
  Underline,
  Heading,
  HighLightSelection,
  FontFamily,
  Typography,
  Markdown,
  TextStyle,
  Link.configure({
    openOnClick: false,
  }),
  Subscript,
  Superscript,
  TextAlign.extend({
    addKeyboardShortcuts() {
      return {}
    },
  }).configure({
    types: ['heading', 'paragraph'],
  }),
  FontSize,
  ImageUpload.configure(),
  ImageBlock.configure({
    imageBaseUrl: `${process.env.NEXT_PUBLIC_BASE_PATH}api/image`,
  }),

]

export default ExtensionKit
