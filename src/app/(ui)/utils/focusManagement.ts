/**
 * Focus management utilities for accessibility
 */

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(focusableElements) as HTMLElement[];
};

/**
 * Trap focus within a container
 */
export const trapFocus = (container: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return () => {};

  const firstFocusableElement = focusableElements[0];
  const lastFocusableElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }
  };

  document.addEventListener('keydown', handleTabKey);
  return () => document.removeEventListener('keydown', handleTabKey);
};

/**
 * Store and restore focus
 */
export const createFocusManager = () => {
  let previousFocus: HTMLElement | null = null;

  return {
    storeFocus: () => {
      previousFocus = document.activeElement as HTMLElement;
    },
    restoreFocus: () => {
      if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }
    },
  };
};

/**
 * Focus first focusable element in a container
 */
export const focusFirstElement = (container: HTMLElement): void => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }
};

/**
 * Focus last focusable element in a container
 */
export const focusLastElement = (container: HTMLElement): void => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1].focus();
  }
};

/**
 * Check if an element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  const focusableElements = getFocusableElements(document.body);
  return focusableElements.includes(element);
};

/**
 * Focus an element if it's focusable
 */
export const focusElement = (element: HTMLElement | null): void => {
  if (element && isFocusable(element)) {
    element.focus();
  }
}; 