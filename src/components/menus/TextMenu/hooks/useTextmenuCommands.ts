import { Editor } from '@tiptap/react'
import { useCallback, useState } from 'react'
import API from '../../../../lib/api'
import toast from 'react-hot-toast';
import { Slice } from '@tiptap/pm/model';

export const useTextmenuCommands = (editor: Editor) => {
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiContent, setAiContent] = useState("");

  const aiCommand = useCallback( async (option: string, command = '') => {
    setAiContent("");
    console.info("response.status 1", aiContent);

    const slice: Slice = editor.state.selection.content();
    const text:string = editor.storage.markdown.serializer.serialize(slice.content);

    setAiProcessing(true);
    const response = await API.aiGenerate(option, text, command)
    setAiProcessing(false);
    if (response.status) {
      setAiContent(response.data!);
      console.log("response.status 2", response.status);
    } else {
      toast.error(`Something went wrong. Please try again later.`);
    }
  }, [editor, aiContent])

  const onBold = useCallback(() => editor.chain().focus().toggleBold().run(), [editor])
  const onItalic = useCallback(() => editor.chain().focus().toggleItalic().run(), [editor])
  const onStrike = useCallback(() => editor.chain().focus().toggleStrike().run(), [editor])
  const onUnderline = useCallback(() => editor.chain().focus().toggleUnderline().run(), [editor])
  const onCode = useCallback(() => editor.chain().focus().toggleCode().run(), [editor])
  const onCodeBlock = useCallback(() => editor.chain().focus().toggleCodeBlock().run(), [editor])

  const onSubscript = useCallback(() => editor.chain().focus().toggleSubscript().run(), [editor])
  const onSuperscript = useCallback(() => editor.chain().focus().toggleSuperscript().run(), [editor])
  const onAlignLeft = useCallback(() => editor.chain().focus().setTextAlign('left').run(), [editor])
  const onAlignCenter = useCallback(() => editor.chain().focus().setTextAlign('center').run(), [editor])
  const onAlignRight = useCallback(() => editor.chain().focus().setTextAlign('right').run(), [editor])
  const onAlignJustify = useCallback(() => editor.chain().focus().setTextAlign('justify').run(), [editor])

  const onChangeColor = useCallback(() => editor.chain().run(), [editor])
  const onClearColor = useCallback(() => editor.chain().focus().run(), [editor])

  const onChangeHighlight = useCallback(() => editor.chain().run(), [editor])
  const onClearHighlight = useCallback(() => editor.chain().focus().run(), [editor])

  const onSimplify = useCallback(() => editor.chain().focus().run(), [editor])
  const onEmojify = useCallback(() => editor.chain().focus().run(), [editor])
  const onCompleteSentence = useCallback(() => editor.chain().focus().run(), [editor])
  const onFixSpelling = useCallback(() => aiCommand('fix'), [aiCommand])
  const onMakeLonger = useCallback(async () => aiCommand('longer'), [aiCommand])
  const onMakeShorter = useCallback(() => aiCommand('shorter'), [aiCommand])
  const onTldr = useCallback(() => editor.chain().focus().run(), [editor])
  const onTone = useCallback(() => editor.chain().focus().run(), [editor])
  const onTranslate = useCallback(() => editor.chain().focus().run(), [editor])
  // const onCitation = useCallback((details:string) => editor.chain().focus().setCitation(details).run(), [editor])
  const onImprove = useCallback(() => aiCommand('improve'), [aiCommand])
  const onContinue = useCallback(() => aiCommand('continue'), [aiCommand])
  // const onChangeColor = useCallback((color: string) => editor.chain().setColor(color).run(), [editor])
  // const onClearColor = useCallback(() => editor.chain().focus().unsetColor().run(), [editor])

  // const onChangeHighlight = useCallback((color: string) => editor.chain().setHighlight({ color }).run(), [editor])
  // const onClearHighlight = useCallback(() => editor.chain().focus().unsetHighlight().run(), [editor])

  // const onSimplify = useCallback(() => editor.chain().focus().aiSimplify().run(), [editor])
  // const onEmojify = useCallback(() => editor.chain().focus().aiEmojify().run(), [editor])
  // const onCompleteSentence = useCallback(() => editor.chain().focus().aiComplete().run(), [editor])
  // const onFixSpelling = useCallback(() => editor.chain().focus().aiFixSpellingAndGrammar().run(), [editor])
  // const onMakeLonger = useCallback(() => editor.chain().focus().aiExtend().run(), [editor])
  // const onMakeShorter = useCallback(() => editor.chain().focus().aiShorten().run(), [editor])
  // const onTldr = useCallback(() => editor.chain().focus().aiTldr().run(), [editor])
  // const onTone = useCallback((tone: string) => editor.chain().focus().aiAdjustTone(tone).run(), [editor])
  // const onTranslate = useCallback((language: Language) => editor.chain().focus().aiTranslate(language).run(), [editor])
  
  const onCustomAiInput = useCallback((input?: string) => {
    // editor.chain().focus().aiTranslate(language).run()
    aiCommand('zap', input)
  }, [aiCommand])

  const onLink = useCallback(
    (url: string, inNewTab?: boolean) =>
      editor
        .chain()
        .focus()
        .setLink({ href: url, target: inNewTab ? '_blank' : '' })
        .run(),
    [editor],
  )

  const onSetFont = useCallback(
    (font: string) => {
      if (!font || font.length === 0) {
        return editor.chain().focus().unsetFontFamily().run()
      }
      return editor.chain().focus().setFontFamily(font).run()
    },
    [editor],
  )

  const onSetFontSize = useCallback(
    (fontSize: string) => {
      if (!fontSize || fontSize.length === 0) {
        return editor.chain().focus().unsetFontSize().run()
      }
      return editor.chain().focus().setFontSize(fontSize).run()
    },
    [editor],
  )

  const onReplaceAiContent = useCallback(() => {
    const selection = editor.view.state.selection;
    editor
      .chain()
      .focus()
      .insertContentAt(
        {
          from: selection.from,
          to: selection.to,
        },
        aiContent,
      )
      .run();
    setAiContent('');
  }, [editor, aiContent])

  const onAppendAiContent = useCallback(() => {
    const selection = editor.view.state.selection;
    editor
      .chain()
      .focus()
      .insertContentAt(selection.to + 1, aiContent)
      .run();
    setAiContent('');
  }, [editor, aiContent]);

  const onDiscardAiContent = useCallback(() => {
    setAiContent('');
  }, []);


  return {
    onBold,
    onItalic,
    onStrike,
    onUnderline,
    onCode,
    onCodeBlock,
    onSubscript,
    onSuperscript,
    onAlignLeft,
    onAlignCenter,
    onAlignRight,
    onAlignJustify,
    onChangeColor,
    onClearColor,
    onChangeHighlight,
    onClearHighlight,
    onSetFont,
    onSetFontSize,
    onSimplify,
    onEmojify,
    onCompleteSentence,
    onFixSpelling,
    onMakeLonger,
    onMakeShorter,
    onTldr,
    onTone,
    onTranslate,
    onLink,
    aiProcessing,
    aiCommand,
    aiContent,
    onAppendAiContent,
    onDiscardAiContent,
    onReplaceAiContent,
    onImprove,
    onContinue,
    onCustomAiInput
  }
}
