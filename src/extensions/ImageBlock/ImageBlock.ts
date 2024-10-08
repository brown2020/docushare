import { ReactNodeViewRenderer } from '@tiptap/react'
import { mergeAttributes, Range } from '@tiptap/core'

import ImageBlockView from './components/ImageBlockView'
import { Image } from '../Image'

export interface ImageOptions {
    /**
     * Controls if the image node should be inline or not.
     * @default false
     * @example true
     */
    inline: boolean;
    imageBaseUrl?: string;
    /**
     * Controls if base64 images are allowed. Enable this if you want to allow
     * base64 image urls in the `src` attribute.
     * @default false
     * @example true
     */
    allowBase64: boolean;
    /**
     * HTML attributes to add to the image element.
     * @default {}
     * @example { class: 'foo' }
     */
    HTMLAttributes: Record<string | number | symbol, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (attributes: { src: string }) => ReturnType
      setImageBlockAt: (attributes: { src: string; pos: number | Range }) => ReturnType
      setImageBlockAlign: (align: 'left' | 'center' | 'right') => ReturnType
      setImageBlockWidth: (width: number) => ReturnType
    }
  }
}

export const ImageBlock = Image.extend<ImageOptions>({
  name: 'imageBlock',

  group: 'block',

  defining: true,

  isolating: true,

  addOptions() {
    return {
        ...this.parent?.(),
        imageBaseUrl: undefined, // default value
    }
  },

  addAttributes() {
    return {
      src: {
        default: '',
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => ({
          src: attributes.src,
        }),
      },
      width: {
        default: '100%',
        parseHTML: (element) => element.getAttribute('data-width'),
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align'),
        renderHTML: (attributes) => ({
          'data-align': attributes.align,
        }),
      },
      alt: {
        default: '',
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: (attributes) => ({
          alt: attributes.alt,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="imageBlock"]',
        // tag: 'img[src*="tiptap.dev"]:not([src^="data:"]), img[src*="windows.net"]:not([src^="data:"])',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addCommands() {
    return {
        
      setImageBlock:
        attrs =>
         ({ commands }) => {
          return commands.insertContent({ type: 'imageBlock', attrs: { src: attrs.src } })
        },

      setImageBlockAt:
        attrs =>
        ({ commands }) => {
          return commands.insertContentAt(attrs.pos, { type: 'imageBlock', attrs: { src: attrs.src } })
        },

      setImageBlockAlign:
        (align: string) =>
        ({ commands }) =>
          commands.updateAttributes('imageBlock', { align }),

      setImageBlockWidth:
        width =>
        ({ commands }) =>
          commands.updateAttributes('imageBlock', { width: `${Math.max(0, Math.min(100, width))}%` }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView)
  },
})

export default ImageBlock
