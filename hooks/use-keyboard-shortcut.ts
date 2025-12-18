'use client'

import { useEffect, useCallback, useRef } from 'react'

type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta' | 'mod'

interface ShortcutOptions {
  enabled?: boolean
  preventDefault?: boolean
  stopPropagation?: boolean
  ignoreInputs?: boolean
}

interface ShortcutHandler {
  key: string
  modifiers?: ModifierKey[]
  callback: (event: KeyboardEvent) => void
  options?: ShortcutOptions
}

// Parse shortcut string like "mod+k" or "g h" into components
function parseShortcut(shortcut: string): {
  keys: string[]
  modifiers: ModifierKey[]
  isSequence: boolean
} {
  const parts = shortcut.toLowerCase().split('+').map((p) => p.trim())
  const modifiers: ModifierKey[] = []
  const keys: string[] = []

  for (const part of parts) {
    if (['ctrl', 'alt', 'shift', 'meta', 'mod'].includes(part)) {
      modifiers.push(part as ModifierKey)
    } else if (part.includes(' ')) {
      // Sequence like "g h"
      keys.push(...part.split(' ').map((k) => k.trim()))
    } else {
      keys.push(part)
    }
  }

  return {
    keys,
    modifiers,
    isSequence: keys.length > 1,
  }
}

// Check if modifier keys match
function matchModifiers(event: KeyboardEvent, modifiers: ModifierKey[]): boolean {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  for (const mod of modifiers) {
    if (mod === 'mod') {
      // 'mod' = Cmd on Mac, Ctrl on Windows/Linux
      if (isMac && !event.metaKey) return false
      if (!isMac && !event.ctrlKey) return false
    } else if (mod === 'ctrl' && !event.ctrlKey) return false
    else if (mod === 'alt' && !event.altKey) return false
    else if (mod === 'shift' && !event.shiftKey) return false
    else if (mod === 'meta' && !event.metaKey) return false
  }

  // Also check no extra modifiers are pressed (except for mod which handles both)
  const expectedCtrl = modifiers.includes('ctrl') || (!isMac && modifiers.includes('mod'))
  const expectedMeta = modifiers.includes('meta') || (isMac && modifiers.includes('mod'))
  const expectedAlt = modifiers.includes('alt')
  const expectedShift = modifiers.includes('shift')

  if (event.ctrlKey !== expectedCtrl) return false
  if (event.metaKey !== expectedMeta) return false
  if (event.altKey !== expectedAlt) return false
  // Shift is more flexible - don't fail if shift is pressed but not expected
  if (event.shiftKey && !expectedShift && modifiers.length > 0) return false

  return true
}

// Check if event target is an input element
function isInputElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false
  const tagName = element.tagName.toLowerCase()
  if (['input', 'textarea', 'select'].includes(tagName)) return true
  if (element.isContentEditable) return true
  return false
}

/**
 * Hook for handling keyboard shortcuts
 *
 * Supports:
 * - Single key shortcuts: "escape", "enter"
 * - Modifier shortcuts: "mod+k", "ctrl+shift+p"
 * - Key sequences: "g h" (press g, then h)
 *
 * @example
 * useKeyboardShortcut('mod+k', () => openCommandPalette())
 * useKeyboardShortcut('g h', () => router.push('/dashboard'))
 * useKeyboardShortcut('escape', () => closeModal(), { enabled: isOpen })
 */
export function useKeyboardShortcut(
  shortcut: string,
  callback: (event: KeyboardEvent) => void,
  options: ShortcutOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    ignoreInputs = true,
  } = options

  const sequenceRef = useRef<string[]>([])
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Ignore if focused on input and ignoreInputs is true
      if (ignoreInputs && isInputElement(event.target)) return

      const { keys, modifiers, isSequence } = parseShortcut(shortcut)

      if (isSequence) {
        // Handle key sequences like "g h"
        const key = event.key.toLowerCase()

        // Clear sequence after timeout
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current)
        }
        sequenceTimeoutRef.current = setTimeout(() => {
          sequenceRef.current = []
        }, 1000) // 1 second to complete sequence

        // Don't add modifier keys to sequence
        if (['control', 'alt', 'shift', 'meta'].includes(key)) return

        sequenceRef.current.push(key)

        // Check if sequence matches
        const matches = keys.every((k, i) => sequenceRef.current[i] === k)
        const complete = sequenceRef.current.length >= keys.length

        if (matches && complete) {
          if (preventDefault) event.preventDefault()
          if (stopPropagation) event.stopPropagation()
          sequenceRef.current = []
          callbackRef.current(event)
        }
      } else {
        // Handle single key or modifier+key
        const key = keys[0]
        const pressedKey = event.key.toLowerCase()

        // Match the key
        const keyMatches = pressedKey === key || event.code.toLowerCase() === `key${key}`

        if (keyMatches && matchModifiers(event, modifiers)) {
          if (preventDefault) event.preventDefault()
          if (stopPropagation) event.stopPropagation()
          callbackRef.current(event)
        }
      }
    },
    [shortcut, enabled, preventDefault, stopPropagation, ignoreInputs]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current)
      }
    }
  }, [handleKeyDown, enabled])
}

/**
 * Hook for handling multiple keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 'mod+k', callback: openCommandPalette },
 *   { key: 'g h', callback: () => router.push('/dashboard') },
 *   { key: 'escape', callback: closeModal, options: { enabled: isOpen } },
 * ])
 */
export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const sequenceRef = useRef<string[]>([])
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      for (const shortcut of shortcutsRef.current) {
        const options = shortcut.options || {}
        const {
          enabled = true,
          preventDefault = true,
          stopPropagation = false,
          ignoreInputs = true,
        } = options

        if (!enabled) continue
        if (ignoreInputs && isInputElement(event.target)) continue

        const { keys, modifiers, isSequence } = parseShortcut(shortcut.key)

        if (isSequence) {
          // Handle sequences
          if (sequenceTimeoutRef.current) {
            clearTimeout(sequenceTimeoutRef.current)
          }
          sequenceTimeoutRef.current = setTimeout(() => {
            sequenceRef.current = []
          }, 1000)

          if (['control', 'alt', 'shift', 'meta'].includes(key)) continue

          // Only add to sequence once per keydown
          if (sequenceRef.current.length === 0 || sequenceRef.current[sequenceRef.current.length - 1] !== key) {
            sequenceRef.current.push(key)
          }

          const matches = keys.every((k, i) => sequenceRef.current[i] === k)
          const complete = sequenceRef.current.length >= keys.length

          if (matches && complete) {
            if (preventDefault) event.preventDefault()
            if (stopPropagation) event.stopPropagation()
            sequenceRef.current = []
            shortcut.callback(event)
            return
          }
        } else {
          const targetKey = keys[0]
          const pressedKey = event.key.toLowerCase()
          const keyMatches = pressedKey === targetKey || event.code.toLowerCase() === `key${targetKey}`

          if (keyMatches && matchModifiers(event, modifiers)) {
            if (preventDefault) event.preventDefault()
            if (stopPropagation) event.stopPropagation()
            shortcut.callback(event)
            return
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current)
      }
    }
  }, [])
}

// Predefined shortcuts from CLAUDE.md spec
export const SHORTCUTS = {
  // Global
  COMMAND_PALETTE: 'mod+k',
  TOGGLE_SIDEBAR: 'mod+b',

  // Navigation
  GO_DASHBOARD: 'g h',
  GO_CANDIDATES: 'g c',
  GO_CRM: 'g o',
  GO_REQUESTS: 'g r',
  GO_ASSIGNMENTS: 'g a',

  // Actions
  NEW: 'n',
  MATCH: 'm',
  EDIT: 'e',
  SAVE: 's',
  CANCEL: 'escape',

  // Search
  FOCUS_SEARCH: '/',
  OPEN_FILTERS: 'f',

  // Lists
  MOVE_DOWN: 'j',
  MOVE_UP: 'k',
  OPEN: 'enter',
  TOGGLE_SELECT: 'space',
} as const
