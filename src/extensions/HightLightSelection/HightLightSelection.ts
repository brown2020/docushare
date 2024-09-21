import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

/**
 * Custom Extension used to highlight the selection when user has not focused in editor
 **/
export const HighLightSelection = Extension.create({
    name: 'HighLightSelection',

    addOptions() {
        return {};
    },

    onFocus() {
        const editorNode = document.querySelector('.ProseMirror');

        if (editorNode !== null && editorNode.hasAttribute('spellcheck') && editorNode.getAttribute('spellcheck') === 'true') {
            editorNode.setAttribute('spellcheck', 'false');

            setTimeout(() => {
                editorNode.setAttribute('spellcheck', 'true');
            }, 0);
        }
    },
    onBlur() {
        const editorNode = document.querySelector('.ProseMirror');

        if (editorNode !== null && editorNode.hasAttribute('spellcheck') && editorNode.getAttribute('spellcheck') === 'true') {
            editorNode.setAttribute('spellcheck', 'false');

            setTimeout(() => {
                editorNode.setAttribute('spellcheck', 'true');
            }, 0);
        }
    },
    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    decorations: ({ doc, selection }) => {
                        /**
                         * It will check the editor is editable.
                         */

                        const active = this.editor.isEditable;
                        if (!active || (active && this.editor.isFocused)) {
                            return null;
                        }

                        // decorations is used to store the list of Decoration object
                        const decorations = [];

                        if (selection && selection.ranges && Array.isArray(selection.ranges) && selection.ranges.length > 0) {
                            const selectionRange = selection.ranges[0];

                            const fromPosition = selectionRange.$from.pos;
                            const toPosition = selectionRange.$to.pos;

                            if (fromPosition !== toPosition) {
                                // Create Decoration inline
                                const decoration = Decoration.inline(fromPosition, toPosition, {
                                    class: 'editor-selection selection',
                                });

                                // Add Decoration Inline to decorations list
                                decorations.push(decoration);
                            }
                        }

                        // Add decoration to document using DecorationSet
                        return DecorationSet.create(doc, decorations);
                    }
                },
            }),
        ];
    },
});
