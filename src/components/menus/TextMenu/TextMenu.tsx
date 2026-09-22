import { Icon } from '@/components/ui/Icon'
import { Toolbar } from '@/components/ui/toolbar'
import { useTextmenuCommands } from './hooks/useTextmenuCommands'
import { useTextmenuStates } from './hooks/useTextmenuStates'
import { Editor } from '@tiptap/react'
import { FontFamilyPicker } from './components/FontFamilyPicker'
import { useTextmenuContentTypes } from './hooks/useTextmenuContentTypes'
import { ContentTypePicker } from './components/ContentTypePicker'
import { EditLinkPopover } from './components/EditLinkPopover'
import { AIDropdown } from './components/AIDropdown'

const SHORTCUT_BOLD = ['Mod', 'B']
const SHORTCUT_ITALIC = ['Mod', 'I']
const SHORTCUT_UNDERLINE = ['Mod', 'U']
const SHORTCUT_STRIKE = ['Mod', 'Shift', 'S']
const SHORTCUT_CODE = ['Mod', 'E']
const SHORTCUT_SUB = ['Mod', '.']
const SHORTCUT_SUPER = ['Mod', ',']
const SHORTCUT_ALIGN_LEFT = ['Shift', 'Mod', 'L']
const SHORTCUT_ALIGN_CENTER = ['Shift', 'Mod', 'E']
const SHORTCUT_ALIGN_RIGHT = ['Shift', 'Mod', 'R']
const SHORTCUT_JUSTIFY = ['Shift', 'Mod', 'J']

export type TextMenuProps = {
  editor: Editor
}

export const TextMenu = ({ editor }: TextMenuProps) => {
  const commands = useTextmenuCommands(editor)
  const states = useTextmenuStates(editor)
  const blockOptions = useTextmenuContentTypes(editor)

  return (
    <Toolbar.Wrapper className='relative z-2 border-none! outline-hidden! py-3!'>
      <AIDropdown
       onFixSpelling={commands.onFixSpelling}
       onMakeLonger={commands.onMakeLonger}
       onMakeShorter={commands.onMakeShorter}
       aiProcessing={commands.aiProcessing}
       aiContent={commands.aiContent}
       onAppendAiContent={commands.onAppendAiContent}
       onDiscardAiContent={commands.onDiscardAiContent}
       onReplaceAiContent={commands.onReplaceAiContent}  
       onImprove={commands.onImprove}
       onContinue={commands.onContinue}
       onCustomAiInput={commands.onCustomAiInput}
      />
      <Toolbar.Divider />
      <ContentTypePicker options={blockOptions} />
      <FontFamilyPicker onChange={commands.onSetFont} value={states.currentFont || ''} />
      <Toolbar.Divider />
      <Toolbar.Button tooltip="Image" onClick={commands.onImageUpload} active={states.isBold}>
        <Icon name="Image" />
      </Toolbar.Button>
      <Toolbar.Divider />
      <Toolbar.Button tooltip="Bold" tooltipShortcut={SHORTCUT_BOLD} onClick={commands.onBold} active={states.isBold}>
        <Icon name="Bold" />
      </Toolbar.Button>
      <Toolbar.Button
        tooltip="Italic"
        tooltipShortcut={SHORTCUT_ITALIC}
        onClick={commands.onItalic}
        active={states.isItalic}
      >
        <Icon name="Italic" />
      </Toolbar.Button>
      <Toolbar.Button
        tooltip="Underline"
        tooltipShortcut={SHORTCUT_UNDERLINE}
        onClick={commands.onUnderline}
        active={states.isUnderline}
      >
        <Icon name="Underline" />
      </Toolbar.Button>
      <Toolbar.Button
        tooltip="Strikehrough"
        tooltipShortcut={SHORTCUT_STRIKE}
        onClick={commands.onStrike}
        active={states.isStrike}
      >
        <Icon name="Strikethrough" />
      </Toolbar.Button>
      <Toolbar.Button tooltip="Code" tooltipShortcut={SHORTCUT_CODE} onClick={commands.onCode} active={states.isCode}>
        <Icon name="Code" />
      </Toolbar.Button>
      <EditLinkPopover onSetLink={commands.onLink} />
      <Toolbar.Button
        tooltip="Subscript"
        tooltipShortcut={SHORTCUT_SUB}
        onClick={commands.onSubscript}
        active={states.isSubscript}
      >
        <Icon name="Subscript" />
      </Toolbar.Button>
      <Toolbar.Button
        tooltip="Superscript"
        tooltipShortcut={SHORTCUT_SUPER}
        onClick={commands.onSuperscript}
        active={states.isSuperscript}
      >
        <Icon name="Superscript" />
      </Toolbar.Button>
      <Toolbar.Divider />
      <Toolbar.Button
        tooltip="Align left"
        tooltipShortcut={SHORTCUT_ALIGN_LEFT}
        onClick={commands.onAlignLeft}
        active={states.isAlignLeft}
      >
        <Icon name="TextAlignStart" />
      </Toolbar.Button>
      <Toolbar.Button
        tooltip="Align center"
        tooltipShortcut={SHORTCUT_ALIGN_CENTER}
        onClick={commands.onAlignCenter}
        active={states.isAlignCenter}
      >
        <Icon name="TextAlignCenter" />
      </Toolbar.Button>
      <Toolbar.Button
        tooltip="Align right"
        tooltipShortcut={SHORTCUT_ALIGN_RIGHT}
        onClick={commands.onAlignRight}
        active={states.isAlignRight}
      >
        <Icon name="TextAlignEnd" />
      </Toolbar.Button>
      <Toolbar.Button
        tooltip="Justify"
        tooltipShortcut={SHORTCUT_JUSTIFY}
        onClick={commands.onAlignJustify}
        active={states.isAlignJustify}
      >
        <Icon name="TextAlignJustify" />
      </Toolbar.Button>

    </Toolbar.Wrapper>
  )
}
