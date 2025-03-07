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
    editor.commands.setNodeSelection(getPos());
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
    try {
      const _imgUrl = new URL(node.attrs.src);
      const imageBlockExt = editor.extensionManager.extensions.find(
        (ext) => ext.name == "imageBlock"
      );

      if (
        _imgUrl.searchParams.has("image_key") &&
        imageBlockExt !== undefined &&
        imageBlockExt.options.imageBaseUrl
      ) {
        setImageUrl(
          encodeURI(
            `${
              imageBlockExt.options.imageBaseUrl
            }?image_key=${_imgUrl.searchParams.get("image_key")}`
          )
        );
      } else if (
        !_imgUrl.searchParams.has("image_key") &&
        imageBlockExt !== undefined
      ) {
        // checkNeedToUpload()
      }
    } catch (error) {
      console.log(error);
    }
  }, [node.attrs.src, editor]);

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
          <Image
            className="block"
            src={imageUrl}
            alt=""
            onClick={onClick}
            width={imageWidth}
            height={imageHeight}
            style={{ width: "100%", height: "auto" }}
          />
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
              transition: "all",
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
