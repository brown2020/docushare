import { Attributes, Extension } from '@tiptap/core'
import '@tiptap/extension-text-style'
import { isAllowedFontSize } from '@/lib/fontSize'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          class: {},
        },
      },
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            parseHTML: element => {
              const size = element.style.fontSize.replace(/['"]+/g, '')
              return isAllowedFontSize(size) && size ? size : null
            },
            renderHTML: attributes => {
              if (!isAllowedFontSize(attributes.fontSize) || !attributes.fontSize) {
                return {}
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        } as Attributes,
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          if (!isAllowedFontSize(fontSize) || !fontSize) return false
          return chain().setMark('textStyle', { fontSize }).run()
        },
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

export default FontSize
