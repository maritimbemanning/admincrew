'use client'

import { useState, useEffect } from 'react'

/**
 * Hook for persisting state in localStorage
 * 
 * @param key - The key to store the value under in localStorage
 * @param initialValue - The initial value if nothing is stored
 * @returns [value, setValue] - Similar to useState
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with localStorage value or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage when value changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Listen for changes from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  const setValue = (value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value
      return newValue
    })
  }

  return [storedValue, setValue]
}

/**
 * Hook for removing a value from localStorage
 */
export function useLocalStorageRemove(key: string): () => void {
  return () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(key)
      } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error)
      }
    }
  }
}

/**
 * Hook for clearing all localStorage
 */
export function useLocalStorageClear(): () => void {
  return () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear()
      } catch (error) {
        console.warn('Error clearing localStorage:', error)
      }
    }
  }
}
