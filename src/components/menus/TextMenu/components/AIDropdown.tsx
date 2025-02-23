import { Button } from "@/components/ui/Button";
import { DropdownButton } from "@/components/ui/Dropdown";
import { Icon } from "@/components/ui/Icon";
import { Surface } from "@/components/ui/Surface";
import * as Popover from "@radix-ui/react-popover";
import { icons } from "lucide-react";
import { useCallback, useState, Fragment } from "react";
import Markdown from "react-markdown";

interface AIDropdownProps {
  // onCompleteSentence: () => void
  // onEmojify: () => void
  onFixSpelling: () => void;
  onMakeLonger: () => void;
  onMakeShorter: () => void;
  onContinue: () => void;
  // onSimplify: boolean
  onImprove: () => void;
  // onTldr: () => void
  // onTone: (tone: string) => void
  // onTranslate: () => void
  onCustomAiInput: () => void;
  aiProcessing: boolean;
  aiContent: string;
  onReplaceAiContent: () => void;
  onAppendAiContent: () => void;
  onDiscardAiContent: () => void;
}

interface AiCommandsType {
  label: string;
  command: () => void;
  icon: keyof typeof icons;
}

export const AIDropdown = ({
  // onCompleteSentence,
  // onEmojify,
  onFixSpelling,
  onMakeLonger,
  onMakeShorter,
  onContinue,
  // onSimplify,
  onImprove,
  // onTldr,
  // onTone,
  // onTranslate,
  onCustomAiInput,
  aiProcessing,
  aiContent,
  onReplaceAiContent,
  onAppendAiContent,
  onDiscardAiContent,
}: AIDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [aiContinue, setAiContinue] = useState("");

  const handleCustomAiCommand = useCallback(
    () => () => {
      onCustomAiInput();
      setAiContinue("");
    },
    [onCustomAiInput]
  );

  const performAiCommand =
    (action: () => void) => (event: React.MouseEvent) => {
      event.preventDefault();
      action();
    };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key == "Enter" && aiContinue.trim().length) {
      handleCustomAiCommand()();
    }
  };

  const aiCommands: AiCommandsType[] = [
    {
      label: "Improve writing",
      command: onImprove,
      icon: "RefreshCcw",
    },
    {
      label: "Fix spelling & grammar",
      command: onFixSpelling,
      icon: "Eraser",
    },
    {
      label: "Make shorter",
      command: onMakeShorter,
      icon: "ArrowLeftToLine",
    },
    {
      label: "Make longer",
      command: onMakeLonger,
      icon: "ArrowRightToLine",
    },
    {
      label: "Continue",
      command: onContinue,
      icon: "Play",
    },
  ];

  return (
    <Popover.Root
      open={open}
      onOpenChange={(_open) => {
        if (_open) {
          onDiscardAiContent();
          setAiContinue("");
        }
        setOpen(_open);
      }}
    >
      <Popover.Trigger asChild>
        <Button
          className="text-purple-500 hover:text-purple-600 active:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 dark:active:text-purple-400"
          activeClassname="text-purple-600 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-200"
          variant="ghost"
        >
          <Icon name="Sparkles" className="mr-1" />
          AI Tools
          <Icon name="ChevronDown" className="w-2 h-2 ml-1" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="PopoverContent" sideOffset={5}>
          <Surface className="p-2 min-w-[10rem]">
            {aiProcessing ? (
              <div
                className="outline-none"
                onClick={(event) => event.preventDefault()}
              >
                <DropdownButton>
                  <Icon name="Sparkles" className="text-purple-500" />
                  <span className="text-purple-500">AI Processing</span>
                  <div className="flex space-x-1 dark:invert self-end mb-1">
                    <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
                    <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.30s]"></div>
                    <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce"></div>
                  </div>
                </DropdownButton>
              </div>
            ) : aiContent ? (
              <Fragment>
                <div
                  className="outline-none px-2 py-1 max-h-[60vh] overflow-y-auto"
                  onClick={(event) => event.preventDefault()}
                >
                  <div className="max-w-[70vw] prose prose-sm prose-neutral">
                    <Markdown>{aiContent}</Markdown>
                  </div>
                </div>
                <hr className="my-2" />
                <div onClick={onReplaceAiContent}>
                  <DropdownButton>
                    <Icon name="Check" />
                    Replace selection
                  </DropdownButton>
                </div>
                <div onClick={onAppendAiContent}>
                  <DropdownButton>
                    <Icon name="ListPlus" />
                    Insert below
                  </DropdownButton>
                </div>
                <hr className="my-2" />
                <div onClick={onDiscardAiContent}>
                  <DropdownButton>
                    <Icon name="Trash" />
                    Discard
                  </DropdownButton>
                </div>
              </Fragment>
            ) : (
              <Fragment>
                <div
                  onKeyDown={(e) => e.stopPropagation()}
                  className="flex items-center gap-2"
                >
                  <Icon name="Sparkles" />
                  <input
                    onKeyDown={handleKeyDown}
                    onChange={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      setAiContinue(event.target.value);
                    }}
                    value={aiContinue}
                    className="p-0 outline-none border-0 focus:ring-0"
                    placeholder="Ask AI to edit or generate..."
                  />
                  <Button
                    onClick={() => performAiCommand(handleCustomAiCommand())}
                    variant="icon"
                    className="ml-2"
                  >
                    <Icon name="CircleChevronUp" />
                  </Button>
                </div>
                {aiCommands
                  .filter((command) =>
                    aiContinue
                      ? command.label
                          .toLowerCase()
                          .includes(aiContinue.toLowerCase())
                      : true
                  )
                  .map((command, index) => (
                    <div
                      key={index}
                      onClick={performAiCommand(command.command)}
                    >
                      <DropdownButton>
                        <Icon name={command.icon} />
                        {command.label}
                      </DropdownButton>
                    </div>
                  ))}
                {/* <div onClick={handleCitation({
      title: 'This project can be a good starting point for your own implementation of a block editor. This project can be a good starting point for your own implementation of a block editor.This project can be a good starting point for your own implementation of a block editor.',
      year: '2024',
      venue: 'Heading',
      link: 'https://www.google.com',
    })}>
                <DropdownButton>
                  <Icon name='Continue' />
                  Test
                </DropdownButton>
              </div> */}
                {/* <Item onClick={performAiCommand(onImprove)}>
                <DropdownButton>
                  <Icon name="RefreshCcw" />
                  Improve writing
                </DropdownButton>
              </Item> */}
                {/* <Item onClick={onSimplify}>
                <DropdownButton>
                  <Icon name="CircleSlash" />
                  Simplify
                </DropdownButton>
              </Item> */}
                {/* <Item onClick={performAiCommand(onFixSpelling)}>
                <DropdownButton>
                  <Icon name="Eraser" />
                  Fix spelling & grammar
                </DropdownButton>
              </Item>
              <Item onClick={performAiCommand(onMakeShorter)}>
                <DropdownButton>
                  <Icon name="ArrowLeftToLine" />
                  Make shorter
                </DropdownButton>
              </Item>
              <Item onClick={performAiCommand(onMakeLonger)}>
                <DropdownButton>
                  <Icon name="ArrowRightToLine" />
                  Make longer
                </DropdownButton>
              </Item> */}
                {/* <Sub>
                <SubTrigger>
                  <DropdownButton>
                    <Icon name="Mic" />
                    Change tone
                    <Icon name="ChevronRight" className="w-4 h-4 ml-auto" />
                  </DropdownButton>
                </SubTrigger>
                <SubContent>
                  <Surface className="flex flex-col min-w-[15rem] p-2 max-h-[20rem] overflow-auto">
                    {tones.map(tone => (
                      <Item onClick={handleTone(tone.value)} key={tone.value}>
                        <DropdownButton>{tone.label}</DropdownButton>
                      </Item>
                    ))}
                  </Surface>
                </SubContent>
              </Sub> */}
                {/* <Item onClick={onTldr}>
                <DropdownButton>
                  <Icon name="MoreHorizontal" />
                  Tl;dr:
                </DropdownButton>
              </Item> */}
                {/* <Item onClick={onEmojify}>
                <DropdownButton>
                  <Icon name="SmilePlus" />
                  Emojify
                </DropdownButton>
              </Item> */}
                {/* <Sub>
                <SubTrigger>
                  <DropdownButton>
                    <Icon name="Languages" />
                    Translate
                    <Icon name="ChevronRight" className="w-4 h-4 ml-auto" />
                  </DropdownButton>
                </SubTrigger>
                <SubContent>
                  <Surface className="flex flex-col min-w-[15rem] p-2 max-h-[20rem] overflow-auto">
                    {languages.map(lang => (
                      <Item onClick={performAiCommand(handleTranslate(lang.value))} key={lang.value}>
                        <DropdownButton>{lang.label}</DropdownButton>
                      </Item>
                    ))}
                  </Surface>
                </SubContent>
              </Sub> */}
                {/* <Item onClick={onCompleteSentence}>
                <DropdownButton>
                  <Icon name="PenLine" />
                  Complete sentence
                </DropdownButton>
              </Item> */}
                {/* <Item onClick={performAiCommand(onContinue)}>
                <DropdownButton>
                  <Icon name="Play" />
                  Continue
                </DropdownButton>
              </Item> */}
              </Fragment>
            )}
          </Surface>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
