import { useEffect, useRef } from 'react'

interface FocusableElement {
  element: HTMLElement
  focusable: boolean
}

export function useWebOSFocus() {
  const focusableRefs = useRef<FocusableElement[]>([])
  const currentFocusIndex = useRef(0)

  useEffect(() => {
    const focusableElements = document.querySelectorAll(
      'button, a, [tabindex]:not([tabindex="-1"]), input:not([type="hidden"])'
    )

    focusableRefs.current = Array.from(focusableElements).map(el => ({
      element: el as HTMLElement,
      focusable: true
    }))

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e

      if (key === 'ArrowDown' || key === 'Enter') {
        e.preventDefault()
        moveFocus(1)
      }

      if (key === 'ArrowUp') {
        e.preventDefault()
        moveFocus(-1)
      }

      if (key === 'ArrowRight') {
        e.preventDefault()
        moveFocus(3)
      }

      if (key === 'ArrowLeft') {
        e.preventDefault()
        moveFocus(-3)
      }

      if (key === 'Enter') {
        e.preventDefault()
        const current = focusableRefs.current[currentFocusIndex.current]
        if (current) {
          current.element.click()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    if (focusableRefs.current.length > 0) {
      focusableRefs.current[0].element.focus()
      focusableRefs.current[0].element.classList.add('focused')
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function moveFocus(direction: number) {
    const current = focusableRefs.current[currentFocusIndex.current]
    if (current) {
      current.element.blur()
      current.element.classList.remove('focused')
    }

    let newIndex = currentFocusIndex.current + direction
    
    if (newIndex < 0) {
      newIndex = focusableRefs.current.length - 1
    } else if (newIndex >= focusableRefs.current.length) {
      newIndex = 0
    }

    currentFocusIndex.current = newIndex

    const next = focusableRefs.current[newIndex]
    if (next) {
      next.element.focus()
      next.element.classList.add('focused')
      next.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  return {
    moveFocus,
    currentFocusIndex: currentFocusIndex.current
  }
}