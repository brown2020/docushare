import { Icon } from '@/components/ui/Icon'
import { Toolbar } from '@/components/ui/Toolbar'
import { useTextmenuCommands } from './hooks/useTextmenuCommands'
import { useTextmenuStates } from './hooks/useTextmenuStates'
import { Editor } from '@tiptap/react'
import { memo } from 'react'
// import * as Popover from '@radix-ui/react-popover'
import { FontFamilyPicker } from './components/FontFamilyPicker'
// import { FontSizePicker } from './components/FontSizePicker'
import { useTextmenuContentTypes } from './hooks/useTextmenuContentTypes'
import { ContentTypePicker } from './components/ContentTypePicker'
import { EditLinkPopover } from './components/EditLinkPopover'
import { AIDropdown } from './components/AIDropdown'

// We memorize the button so each button is not rerendered
// on every editor state change
const MemoButton = memo(Toolbar.Button)
// const MemoColorPicker = memo(ColorPicker)
const MemoFontFamilyPicker = memo(FontFamilyPicker)
// const MemoFontSizePicker = memo(FontSizePicker)
const MemoContentTypePicker = memo(ContentTypePicker)

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
      <MemoContentTypePicker options={blockOptions} />
      <MemoFontFamilyPicker onChange={commands.onSetFont} value={states.currentFont || ''} />
      {/* <MemoFontSizePicker onChange={commands.onSetFontSize} value={states.currentSize || ''} /> */}
      <Toolbar.Divider />
      <MemoButton tooltip="Image" onClick={commands.onImageUpload} active={states.isBold}>
        <Icon name="Image" />
      </MemoButton>
      <Toolbar.Divider />
      <MemoButton tooltip="Bold" tooltipShortcut={['Mod', 'B']} onClick={commands.onBold} active={states.isBold}>
        <Icon name="Bold" />
      </MemoButton>
      <MemoButton
        tooltip="Italic"
        tooltipShortcut={['Mod', 'I']}
        onClick={commands.onItalic}
        active={states.isItalic}
      >
        <Icon name="Italic" />
      </MemoButton>
      <MemoButton
        tooltip="Underline"
        tooltipShortcut={['Mod', 'U']}
        onClick={commands.onUnderline}
        active={states.isUnderline}
      >
        <Icon name="Underline" />
      </MemoButton>
      <MemoButton
        tooltip="Strikehrough"
        tooltipShortcut={['Mod', 'Shift', 'S']}
        onClick={commands.onStrike}
        active={states.isStrike}
      >
        <Icon name="Strikethrough" />
      </MemoButton>
      <MemoButton tooltip="Code" tooltipShortcut={['Mod', 'E']} onClick={commands.onCode} active={states.isCode}>
        <Icon name="Code" />
      </MemoButton>
      <EditLinkPopover onSetLink={commands.onLink} />
      {/* <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton active={!!states.currentHighlight} tooltip="Highlight text">
              <Icon name="Highlighter" />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side="top" sideOffset={8} asChild>
            <Surface className="p-1">
              <MemoColorPicker
                color={states.currentHighlight}
                onChange={commands.onChangeHighlight}
                onClear={commands.onClearHighlight}
              />
            </Surface>
          </Popover.Content>
        </Popover.Root> */}
      {/* <Popover.Root>
          <Popover.Trigger asChild>
            <MemoButton active={!!states.currentColor} tooltip="Text color">
              <Icon name="Palette" />
            </MemoButton>
          </Popover.Trigger>
          <Popover.Content side="top" sideOffset={8} asChild>
            <Surface className="p-1">
              <MemoColorPicker
                color={states.currentColor}
                onChange={commands.onChangeColor}
                onClear={commands.onClearColor}
              />
            </Surface>
          </Popover.Content>
        </Popover.Root> */}

      <MemoButton
        tooltip="Subscript"
        tooltipShortcut={['Mod', '.']}
        onClick={commands.onSubscript}
        active={states.isSubscript}
      >
        <Icon name="Subscript" />
      </MemoButton>
      <MemoButton
        tooltip="Superscript"
        tooltipShortcut={['Mod', ',']}
        onClick={commands.onSuperscript}
        active={states.isSuperscript}
      >
        <Icon name="Superscript" />
      </MemoButton>
      <Toolbar.Divider />
      <MemoButton
        tooltip="Align left"
        tooltipShortcut={['Shift', 'Mod', 'L']}
        onClick={commands.onAlignLeft}
        active={states.isAlignLeft}
      >
        <Icon name="TextAlignStart" />
      </MemoButton>
      <MemoButton
        tooltip="Align center"
        tooltipShortcut={['Shift', 'Mod', 'E']}
        onClick={commands.onAlignCenter}
        active={states.isAlignCenter}
      >
        <Icon name="TextAlignCenter" />
      </MemoButton>
      <MemoButton
        tooltip="Align right"
        tooltipShortcut={['Shift', 'Mod', 'R']}
        onClick={commands.onAlignRight}
        active={states.isAlignRight}
      >
        <Icon name="TextAlignEnd" />
      </MemoButton>
      <MemoButton
        tooltip="Justify"
        tooltipShortcut={['Shift', 'Mod', 'J']}
        onClick={commands.onAlignJustify}
        active={states.isAlignJustify}
      >
        <Icon name="TextAlignJustify" />
      </MemoButton>

    </Toolbar.Wrapper>
  )
}
