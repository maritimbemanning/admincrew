'use client'

import * as React from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface FileUploadProps {
  value?: File[]
  onChange: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  maxFiles?: number
  disabled?: boolean
  className?: string
}

interface UploadedFile {
  file: File
  progress: number
  error?: string
}

export function FileUpload({
  value = [],
  onChange,
  accept = '*',
  multiple = false,
  maxSize = 10, // 10 MB default
  maxFiles = 5,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setUploadedFiles(value.map((file) => ({ file, progress: 100 })))
  }, [value])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image
    if (file.type === 'application/pdf') return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Filen er for stor. Maks størrelse er ${maxSize} MB.`
    }
    return null
  }

  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    if (!multiple && fileArray.length > 1) {
      fileArray.splice(1)
    }

    if (uploadedFiles.length + fileArray.length > maxFiles) {
      const remaining = maxFiles - uploadedFiles.length
      fileArray.splice(remaining)
    }

    const newUploadedFiles: UploadedFile[] = fileArray.map((file) => {
      const error = validateFile(file)
      return { file, progress: error ? 0 : 100, error: error ?? undefined }
    })

    const allFiles = [...uploadedFiles, ...newUploadedFiles]
    
    setUploadedFiles(allFiles)
    onChange(allFiles.filter((f) => !f.error).map((f) => f.file))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleRemove = (index: number) => {
    const newFiles = [...uploadedFiles]
    newFiles.splice(index, 1)
    setUploadedFiles(newFiles)
    onChange(newFiles.filter((f) => !f.error).map((f) => f.file))
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragging && 'border-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer hover:border-primary/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          aria-label="Last opp fil"
          title="Last opp fil"
        />
        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">Klikk for å laste opp</span>
          {' '}eller dra og slipp
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Maks {maxSize} MB per fil{multiple && `, opptil ${maxFiles} filer`}
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <ul className="space-y-2">
          {uploadedFiles.map((uploadedFile, index) => {
            const FileIcon = getFileIcon(uploadedFile.file)
            return (
              <li
                key={index}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3',
                  uploadedFile.error && 'border-destructive bg-destructive/10'
                )}
              >
                <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                  {uploadedFile.error && (
                    <p className="text-xs text-destructive">{uploadedFile.error}</p>
                  )}
                  {uploadedFile.progress < 100 && !uploadedFile.error && (
                    <Progress value={uploadedFile.progress} className="h-1 mt-1" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(index)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
