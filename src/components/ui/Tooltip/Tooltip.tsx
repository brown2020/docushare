import * as React from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useMergeRefs,
  FloatingPortal,
} from "@floating-ui/react";
import type { Placement } from "@floating-ui/react";
import { ShortcutKey } from ".";

interface TooltipOptions {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useTooltip({
  initialOpen = false,
  placement = "top",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: TooltipOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        crossAxis: placement.includes("-"),
        fallbackAxisSideDirection: "start",
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    enabled: controlledOpen == null,
  });
  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data]
  );
}

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = React.createContext<ContextType>(null);

export const useTooltipContext = () => {
  const context = React.useContext(TooltipContext);

  if (context == null) {
    throw new Error("Tooltip components must be wrapped in <Tooltip />");
  }

  return context;
};

export function Tooltip({
  children,
  ...options
}: { children: React.ReactNode } & TooltipOptions) {
  const tooltip = useTooltip(options);
  return (
    <TooltipContext.Provider value={tooltip}>
      {children}
    </TooltipContext.Provider>
  );
}

export const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & { asChild?: boolean }
>(function TooltipTrigger({ children, asChild = false, ...props }, propRef) {
  const context = useTooltipContext();

  if (!React.isValidElement(children)) {
    throw new Error(
      "TooltipTrigger must have a valid React element as a child."
    );
  }

  // ✅ Do not access children.ref directly in React 19
  const mergedRef = useMergeRefs([context.refs.setReference, propRef]);

  if (asChild) {
    return React.cloneElement(
      children as React.ReactElement,
      {
        ref: mergedRef,
        ...(typeof children.props === "object" ? children.props : {}), // Safe spreading
        ...props,
        "data-state": context.open ? "open" : "closed",
      } as React.HTMLProps<HTMLElement>
    ); // ✅ TypeScript-safe
  }

  return (
    <div
      ref={mergedRef}
      data-state={context.open ? "open" : "closed"}
      {...context.getReferenceProps(props)}
    >
      {children}
    </div>
  );
});

export const TooltipContentTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement> & { title?: string; shortcut?: string[] }
>(function TooltipContent({ style, title, shortcut }, propRef) {
  const context = useTooltipContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  if (!context.open) return null;

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={{
          ...context.floatingStyles,
          ...style,
        }}
        className="z-99999"
      >
        <span className="flex items-center gap-2 px-2.5 py-1 bg-white border border-neutral-100 rounded-sm shadow-xs z-999">
          {title && (
            <span className="text-xs font-medium text-neutral-500">
              {title}
            </span>
          )}
          {shortcut && (
            <span className="flex items-center gap-0.5">
              {shortcut.map((shortcutKey) => (
                <ShortcutKey key={shortcutKey}>{shortcutKey}</ShortcutKey>
              ))}
            </span>
          )}
        </span>
      </div>
    </FloatingPortal>
  );
});
