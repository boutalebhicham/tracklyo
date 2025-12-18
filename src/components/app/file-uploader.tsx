"use client"

import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Paperclip, FileText, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type FileUploaderProps = {
  files: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
  accept?: string
  maxSize?: number // in MB
}

const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onChange,
  maxFiles = 3,
  accept = "image/*,.pdf",
  maxSize = 5
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setError(null)

    // Check max files
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} fichier(s) autorisé(s)`)
      return
    }

    // Check file size
    const oversizedFiles = selectedFiles.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError(`Fichier(s) trop volumineux. Taille max: ${maxSize}MB`)
      return
    }

    onChange([...files, ...selectedFiles])

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index))
    setError(null)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon size={16} className="text-blue-500" />
    }
    if (file.type === 'application/pdf') {
      return <FileText size={16} className="text-red-500" />
    }
    return <Paperclip size={16} className="text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-3">
      {files.length < maxFiles && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            multiple
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => inputRef.current?.click()}
            >
              <Paperclip size={16} className="mr-2" />
              Ajouter un justificatif (optionnel)
            </Button>
          </label>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg border",
                "bg-muted/50 hover:bg-muted transition-colors"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Formats acceptés: Images et PDF • Max {maxSize}MB par fichier • Max {maxFiles} fichier(s)
      </p>
    </div>
  )
}

export default FileUploader
