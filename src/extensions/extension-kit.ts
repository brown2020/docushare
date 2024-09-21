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
  FontSize
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
  FontSize
]

export default ExtensionKit
