import { memo, useCallback } from "react";

export type ImageBlockWidthProps = {
  onChange: (value: number) => void;
  value: number;
};

export const ImageBlockWidth = memo(
  ({ onChange, value }: ImageBlockWidthProps) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(parseInt(e.target.value, 10));
      },
      [onChange]
    );

    return (
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="image-block-width">
          Image width
        </label>
        <input
          id="image-block-width"
          className="h-2 bg-neutral-200 border-0 rounded-sm appearance-none fill-neutral-300"
          type="range"
          min="25"
          max="100"
          step="25"
          onChange={handleChange}
          value={value}
          aria-label="Image width"
        />
        <span className="text-xs font-semibold text-neutral-500 select-none">
          {value}%
        </span>
      </div>
    );
  }
);

ImageBlockWidth.displayName = "ImageBlockWidth";
