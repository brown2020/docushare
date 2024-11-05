import { HTMLProps } from "react";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { Surface } from "../Surface";

export type PanelProps = {
  spacing?: "medium" | "small";
  noShadow?: boolean;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement> &
  HTMLProps<HTMLDivElement>;

export const Panel = ({
  asChild,
  className,
  children,
  spacing,
  ref,
  noShadow,
  ...rest
}: PanelProps) => {
  const panelClass = cn("p-2", spacing === "small" && "p-[0.2rem]", className);

  const Comp = asChild ? Slot : "div";

  return (
    <Comp ref={ref} {...rest}>
      <Surface className={panelClass} withShadow={!noShadow}>
        {children}
      </Surface>
    </Comp>
  );
};

Panel.displayName = "Panel";

export const PanelDivider = ({
  asChild,
  className,
  children,
  ref,
  ...rest
}: {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }) => {
  const dividerClass = cn("border-b border-b-black/10 mb-2 pb-2", className);

  const Comp = asChild ? Slot : "div";

  return (
    <Comp className={dividerClass} {...rest} ref={ref}>
      {children}
    </Comp>
  );
};

PanelDivider.displayName = "PanelDivider";

export const PanelHeader = ({
  asChild,
  className,
  children,
  ref, // Accept ref as a prop
  ...rest
}: {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }) => {
  const headerClass = cn(
    "border-b border-b-black/10 text-sm mb-2 pb-2",
    className
  );

  const Comp = asChild ? Slot : "div";

  return (
    <Comp className={headerClass} {...rest} ref={ref}>
      {children}
    </Comp>
  );
};

PanelHeader.displayName = "PanelHeader";

export const PanelSection = ({
  asChild,
  className,
  children,
  ref,
  ...rest
}: {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }) => {
  const sectionClass = cn("mt-4 first:mt-1", className);

  const Comp = asChild ? Slot : "div";

  return (
    <Comp className={sectionClass} {...rest} ref={ref}>
      {children}
    </Comp>
  );
};

PanelSection.displayName = "PanelSection";

export const PanelHeadline = ({
  asChild,
  className,
  children,
  ref,
  ...rest
}: {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }) => {
  const headlineClass = cn(
    "text-black/80 dark:text-white/80 text-xs font-medium mb-2 ml-1.5",
    className
  );

  const Comp = asChild ? Slot : "div";

  return (
    <Comp className={headlineClass} {...rest} ref={ref}>
      {children}
    </Comp>
  );
};

PanelHeadline.displayName = "PanelHeadline";

export const PanelFooter = ({
  asChild,
  className,
  children,
  ref,
  ...rest
}: {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
  }) => {
  const footerClass = cn(
    "border-t border-black/10 text-sm mt-2 pt-2",
    className
  );

  const Comp = asChild ? Slot : "div";

  return (
    <Comp className={footerClass} {...rest} ref={ref}>
      {children}
    </Comp>
  );
};

PanelFooter.displayName = "PanelFooter";
