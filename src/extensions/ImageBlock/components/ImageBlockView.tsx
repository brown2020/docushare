import { cn } from "@/lib/utils";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const ImageBlockView: React.FC<NodeViewProps> = (props) => {
  const { editor, getPos, node } = props;
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  const wrapperClassName = cn(
    node.attrs.align === "left" ? "ml-0" : "ml-auto",
    node.attrs.align === "right" ? "mr-0" : "mr-auto",
    node.attrs.align === "center" && "mx-auto"
  );

  const onClick = useCallback(() => {
    const pos = getPos();
    if (typeof pos === 'number') {
      editor.commands.setNodeSelection(pos);
    }
  }, [getPos, editor.commands]);

  const [imageUrl, setImageUrl] = useState(node.attrs.src);
  const isUploading = useState(false);

  // Convert width to numeric value for Next.js Image component
  const getNumericWidth = () => {
    if (!node.attrs.width) return 500;

    // If width is already a number, return it
    if (typeof node.attrs.width === "number") return node.attrs.width;

    // If width is a string with px, remove px and convert to number
    if (
      typeof node.attrs.width === "string" &&
      node.attrs.width.endsWith("px")
    ) {
      return parseInt(node.attrs.width, 10) || 500;
    }

    // If width is a percentage or other non-numeric format, use a default value
    return 500;
  };

  // Get numeric height (maintain aspect ratio if possible)
  const getNumericHeight = () => {
    if (!node.attrs.height) return 300;

    if (typeof node.attrs.height === "number") return node.attrs.height;

    if (
      typeof node.attrs.height === "string" &&
      node.attrs.height.endsWith("px")
    ) {
      return parseInt(node.attrs.height, 10) || 300;
    }

    return 300;
  };

  useEffect(() => {
    let cancelled = false;
    const resolve = () => {
      if (cancelled) return;
      const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
      if (!src) {
        setImageUrl("");
        return;
      }

      const documentId = editor.view?.dom
        ?.closest("[data-document-id]")
        ?.getAttribute("data-document-id");

      try {
        const parsed = new URL(src, "http://local");
        const isAppImage =
          src.startsWith("/api/image") || parsed.pathname.endsWith("/api/image");
        const imageKey = parsed.searchParams.get("image_key");
        if (isAppImage && imageKey) {
          const params = new URLSearchParams({ image_key: imageKey });
          if (documentId) params.set("documentId", documentId);
          setImageUrl(`/api/image?${params.toString()}`);
          return;
        }
      } catch {
        // Keep the stored src when it is not a URL.
      }
      setImageUrl(src);
    };

    resolve();
    const frame = requestAnimationFrame(resolve);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [node.attrs.src, editor]);

  const usePlainImage =
    imageUrl.startsWith("/api/image") || imageUrl.startsWith("blob:");

  // Get numeric width and height values
  const imageWidth = getNumericWidth();
  const imageHeight = getNumericHeight();

  return (
    <NodeViewWrapper>
      <div className={wrapperClassName} style={{ width: node.attrs.width }}>
        <div
          contentEditable={false}
          ref={imageWrapperRef}
          style={{ position: "relative" }}
          className={`${props.selected ? "selected is-active" : ""}`}
        >
          {usePlainImage ? (
            <img
              className="block"
              src={imageUrl}
              alt=""
              onClick={onClick}
              style={{ width: "100%", height: "auto" }}
            />
          ) : (
            <Image
              className="block"
              src={imageUrl}
              alt=""
              onClick={onClick}
              width={imageWidth}
              height={imageHeight}
              style={{ width: "100%", height: "auto" }}
            />
          )}
          <div
            style={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              top: "0px",
              left: "0px",
              height: "100%",
              width: "100%",
              background: "white",
              opacity: isUploading[0] ? "0.7" : "0",
              transitionProperty: "opacity",
              transitionDuration: "300ms",
            }}
          >
            <h1 style={{ textAlign: "center" }}>Processing...</h1>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default ImageBlockView;
