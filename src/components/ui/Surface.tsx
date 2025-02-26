import { cn } from "@/lib/utils";
import { HTMLProps } from "react";

export type SurfaceProps = HTMLProps<HTMLDivElement> & {
  withShadow?: boolean;
  withBorder?: boolean;
};

export const Surface = ({
  children,
  className,
  withShadow = true,
  ref,
  withBorder = true,
  ...props
}: SurfaceProps) => {
  const surfaceClass = cn(
    className,
    "bg-white rounded-sm dark:bg-black",
    withShadow ? "shadow-xs" : "",
    withBorder ? "border border-neutral-200 dark:border-neutral-800" : ""
  );

  return (
    <div className={surfaceClass} {...props} ref={ref}>
      {children}
    </div>
  );
};

Surface.displayName = "Surface";
