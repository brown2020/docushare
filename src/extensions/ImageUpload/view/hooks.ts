import API from '@/lib/api'
import { clientUploadRejection } from '@/lib/uploads'
import { DragEvent, useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

export type UploadedFile = {
  url: string
  kind: 'image' | 'document'
  name: string
  text: string
}

export const useUploader = ({ onUpload }: { onUpload: (file: UploadedFile) => void }) => {
  const [loading, setLoading] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    const rejected = clientUploadRejection(file)
    if (rejected) {
      toast.error(rejected)
      return
    }

    setLoading(true)
    try {
        const resp = await API.uploadImage({ file: file })
        if (resp.status === true) {
            onUpload({
              url: resp.url,
              kind: resp.kind,
              name: resp.name,
              text: resp.text,
            })
        } else {
            toast.error(resp.message ?? 'Upload failed.')
        }
    } catch {
      toast.error('Upload failed.')
    }
    setLoading(false)
  }, [onUpload])

  return { loading, uploadFile }
}

export const useFileUpload = () => {
  const fileInput = useRef<HTMLInputElement>(null)

  const handleUploadClick = useCallback(() => {
    fileInput.current?.click()
  }, [])

  return { ref: fileInput, handleUploadClick }
}

export const useDropZone = ({ uploader }: { uploader: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [draggedInside, setDraggedInside] = useState<boolean>(false)

  useEffect(() => {
    const dragStartHandler = () => {
      setIsDragging(true)
    }

    const dragEndHandler = () => {
      setIsDragging(false)
    }

    document.body.addEventListener('dragstart', dragStartHandler)
    document.body.addEventListener('dragend', dragEndHandler)

    return () => {
      document.body.removeEventListener('dragstart', dragStartHandler)
      document.body.removeEventListener('dragend', dragEndHandler)
    }
  }, [])

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      setDraggedInside(false)
      if (e.dataTransfer.files.length === 0) {
        return
      }

      const fileList = e.dataTransfer.files

      const files: File[] = []

      for (let i = 0; i < fileList.length; i += 1) {
        const item = fileList.item(i)
        if (item) {
          files.push(item)
        }
      }

      e.preventDefault()
      const file = files[0]
      if (file) uploader(file)
    },
    [uploader],
  )

  const onDragEnter = () => {
    setDraggedInside(true)
  }

  const onDragLeave = () => {
    setDraggedInside(false)
  }

  return { isDragging, draggedInside, onDragEnter, onDragLeave, onDrop }
}
