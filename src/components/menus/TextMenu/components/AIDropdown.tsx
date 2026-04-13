import { Button } from "@/components/ui/Button";
import { DropdownButton } from "@/components/ui/Dropdown";
import { Icon } from "@/components/ui/Icon";
import { Surface } from "@/components/ui/Surface";
import * as Popover from "@radix-ui/react-popover";
import { icons } from "lucide-react";
import { useCallback, useState, Fragment } from "react";
import Markdown from "react-markdown";

interface AIDropdownProps {
  onFixSpelling: () => void;
  onMakeLonger: () => void;
  onMakeShorter: () => void;
  onContinue: () => void;
  onImprove: () => void;
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
  onFixSpelling,
  onMakeLonger,
  onMakeShorter,
  onContinue,
  onImprove,
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
                className="outline-hidden"
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
                  className="outline-hidden px-2 py-1 max-h-[60vh] overflow-y-auto"
                  onClick={(event) => event.preventDefault()}
                >
                  <div className="max-w-[70vw] prose prose-sm prose-neutral">
                    <Markdown>{aiContent}</Markdown>
                  </div>
                </div>
                <hr className="my-2" />
                <DropdownButton onClick={onReplaceAiContent}>
                  <Icon name="Check" />
                  Replace selection
                </DropdownButton>
                <DropdownButton onClick={onAppendAiContent}>
                  <Icon name="ListPlus" />
                  Insert below
                </DropdownButton>
                <hr className="my-2" />
                <DropdownButton onClick={onDiscardAiContent}>
                  <Icon name="Trash" />
                  Discard
                </DropdownButton>
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
                    className="p-0 outline-hidden border-0 focus:ring-0"
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
              </Fragment>
            )}
          </Surface>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
