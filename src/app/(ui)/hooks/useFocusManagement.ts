import { useEffect, useRef } from 'react';
import { createFocusManager, trapFocus } from '../utils/focusManagement';

interface UseFocusManagementOptions {
  /**
   * Whether to trap focus within the container
   */
  trapFocus?: boolean;
  /**
   * Whether to restore focus when unmounting
   */
  restoreFocus?: boolean;
  /**
   * Whether to focus the first element on mount
   */
  focusFirstOnMount?: boolean;
  /**
   * Whether to focus the last element on mount
   */
  focusLastOnMount?: boolean;
  /**
   * Whether the component is currently active
   */
  isActive?: boolean;
}

export const useFocusManagement = <T extends HTMLElement = HTMLElement>(
  options: UseFocusManagementOptions = {}
) => {
  const {
    trapFocus: shouldTrapFocus = false,
    restoreFocus: shouldRestoreFocus = true,
    focusFirstOnMount = false,
    focusLastOnMount = false,
    isActive = true,
  } = options;

  const containerRef = useRef<T>(null);
  const focusManager = useRef(createFocusManager());

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store current focus
    if (shouldRestoreFocus) {
      focusManager.current.storeFocus();
    }

    // Set initial focus
    if (focusFirstOnMount || focusLastOnMount) {
      const container = containerRef.current;
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const elements = Array.from(focusableElements) as HTMLElement[];

      if (elements.length > 0) {
        if (focusFirstOnMount) {
          elements[0].focus();
        } else {
          elements[elements.length - 1].focus();
        }
      }
    }

    // Set up focus trap
    let cleanup: (() => void) | undefined;
    if (shouldTrapFocus && containerRef.current) {
      cleanup = trapFocus(containerRef.current);
    }

    return () => {
      cleanup?.();
      if (shouldRestoreFocus) {
        focusManager.current.restoreFocus();
      }
    };
  }, [isActive, shouldTrapFocus, shouldRestoreFocus, focusFirstOnMount, focusLastOnMount]);

  return containerRef;
}; 