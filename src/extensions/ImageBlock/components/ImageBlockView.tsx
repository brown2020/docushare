import { cn } from '@/lib/utils'
import { Node } from '@tiptap/pm/model'
import { Editor, NodeViewWrapper } from '@tiptap/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image';

interface ImageBlockViewProps {
  editor: Editor,
  selected: boolean,
  getPos: () => number
  node: Node & {
    attrs: {
      src: string
    }
  }
  updateAttributes: (attrs: Record<string, string>) => void
}

export const ImageBlockView = (props: ImageBlockViewProps) => {
  const { editor, getPos, node } = props
  const imageWrapperRef = useRef<HTMLDivElement>(null)

  const wrapperClassName = cn(
    node.attrs.align === 'left' ? 'ml-0' : 'ml-auto',
    node.attrs.align === 'right' ? 'mr-0' : 'mr-auto',
    node.attrs.align === 'center' && 'mx-auto',
  )

  const onClick = useCallback(() => {
    editor.commands.setNodeSelection(getPos())
  }, [getPos, editor.commands])
  
  const [imageUrl, setImageUrl] = useState(node.attrs.src);
  const isUploading = useState(false);

  useEffect(() => {
    
    try {
        const _imgUrl = new URL(node.attrs.src);
        const imageBlockExt = editor.extensionManager.extensions.find(ext => ext.name == 'imageBlock');
        
        if(_imgUrl.searchParams.has('image_key') && imageBlockExt !== undefined && imageBlockExt.options.imageBaseUrl){
            setImageUrl(encodeURI(`${imageBlockExt.options.imageBaseUrl}?image_key=${_imgUrl.searchParams.get('image_key')}`))
        }else if(!_imgUrl.searchParams.has('image_key') && imageBlockExt !== undefined){
            // checkNeedToUpload()
        }
        
    } catch (error) {
        console.log(error);
    }
  }, [node.attrs.src, editor])

  return (
    <NodeViewWrapper>
      <div className={wrapperClassName} style={{ width: node.attrs.width }}>
        <div contentEditable={false} ref={imageWrapperRef} style={{position: "relative"}} className={`${props.selected ? "selected is-active" : ''}`}>
            <Image className="block" src={imageUrl} alt="" onClick={onClick} />
            <div style={{"position":"absolute", 'display': 'flex', flexDirection: 'column', 'justifyContent': 'center',"top":"0px","left":"0px","height":"100%","width":"100%","background":"white","opacity": isUploading ?"0.7" :"0" ,"transition":"all","transitionDuration":"300ms"}}>
                <h1 style={{textAlign: 'center'}}>Processing...</h1> 
            </div> 
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default ImageBlockView
