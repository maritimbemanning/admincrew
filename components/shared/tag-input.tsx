'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  disabled?: boolean
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Legg til tag...',
  maxTags,
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const addTag = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !value.includes(trimmedValue)) {
      if (!maxTags || value.length < maxTags) {
        onChange([...value, trimmedValue])
        setInputValue('')
      }
    }
  }

  const removeTag = (index: number) => {
    const newTags = [...value]
    newTags.splice(index, 1)
    onChange(newTags)
  }

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag()
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 min-h-10',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <Badge key={index} variant="secondary" className="gap-1">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(index)
              }}
              title={`Fjern ${tag}`}
              aria-label={`Fjern ${tag}`}
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
        className="flex-1 min-w-[120px] border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  )
}
