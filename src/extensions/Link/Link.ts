import { mergeAttributes } from '@tiptap/core'
import TiptapLink from '@tiptap/extension-link'
import { Plugin } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import { isSafeLinkHref } from '@/lib/links'

export const Link = TiptapLink.extend({
  inclusive: false,

  parseHTML() {
    return [
      {
        tag: 'a[href]:not([data-type="button"])',
        getAttrs: (element: HTMLElement) => {
          const href = element.getAttribute('href')
          if (!isSafeLinkHref(href)) return false
          return { href }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const href = HTMLAttributes.href
    if (!isSafeLinkHref(href)) {
      return ['span', mergeAttributes(this.options.HTMLAttributes, { class: 'link' }), 0]
    }
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'link',
        href,
        rel: 'noopener noreferrer nofollow',
      }),
      0,
    ]
  },

  addProseMirrorPlugins() {
    const { editor } = this

    return [
      ...(this.parent?.() || []),
      new Plugin({
        props: {
          handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
            const { selection } = editor.state

            if (event.key === 'Escape' && selection.empty !== true) {
              editor.commands.focus(selection.to, { scrollIntoView: false })
            }

            return false
          },
        },
      }),
    ]
  },
})

export default Link
