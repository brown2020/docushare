import { UploadedFile } from "./hooks";
import { Spinner } from "@/components/ui/Spinner";
import { useDropZone, useFileUpload, useUploader } from "./hooks";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { UPLOAD_ACCEPT } from "@/lib/uploads";
import { ChangeEvent, useCallback } from "react";

export const ImageUploader = ({
  onUpload,
}: {
  onUpload: (file: UploadedFile) => void;
}) => {
  const { loading, uploadFile } = useUploader({ onUpload });
  const { handleUploadClick, ref } = useFileUpload();
  const { draggedInside, onDrop, onDragEnter, onDragLeave } = useDropZone({
    uploader: uploadFile,
  });

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      e.target.files ? uploadFile(e.target.files[0]) : null,
    [uploadFile]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 rounded-sm min-h-[10rem] bg-opacity-80">
        <Spinner className="text-neutral-500" size={1.5} />
      </div>
    );
  }

  const wrapperClass = cn(
    "flex flex-col items-center justify-center px-8 py-10 rounded-sm bg-opacity-80",
    draggedInside && "bg-neutral-100"
  );

  return (
    <div
      className={wrapperClass}
      onDrop={onDrop}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      contentEditable={false}
    >
      <Icon
        name="Image"
        className="w-12 h-12 mb-4 text-black dark:text-white opacity-20"
      />
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-sm font-medium text-center text-neutral-400 dark:text-neutral-500">
          {draggedInside ? "Drop file here" : "Drag and drop or"}
        </div>
        <p className="text-xs text-center text-neutral-400">
          JPG, PNG, GIF, WEBP, PDF, TXT, MD, CSV, or DOCX
        </p>
        <div>
          <Button
            disabled={draggedInside}
            onClick={handleUploadClick}
            variant="primary"
            buttonSize="small"
          >
            <Icon name="Upload" />
            Upload a file
          </Button>
        </div>
      </div>
      <input
        className="w-0 h-0 overflow-hidden opacity-0"
        ref={ref}
        type="file"
        aria-label="Upload a file"
        accept={UPLOAD_ACCEPT}
        onChange={onFileChange}
      />
    </div>
  );
};

export default ImageUploader;
