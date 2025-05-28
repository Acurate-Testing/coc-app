import React, { Fragment, ReactNode, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { FaTimes } from "react-icons/fa";

import "./Modal.scss";
import { Heading } from "../Heading/Heading";
import _ from "lodash";

interface ModalProps {
  /**
   * Optional modal title
   */
  title?: string | ReactNode;
  /**
   * Modal Content
   */
  children: ReactNode;
  /**
   * Modal open
   */
  open: boolean;
  /**
   * Modal close function
   */
  close: VoidFunction;
  /**
   * Optional enable if you don't want to close modal directly
   */
  staticModal?: boolean;
  /**
   * Optional if hide modal close button
   */
  hideCloseButton?: boolean;
  /**
   * Optional modal classes
   */
  className?: string;
  /**
   * Optional modal panel classes
   */
  panelClassName?: string;
  /**
   * Optional modal width classes
   */
  widthClassName?: string;
  /**
   * Optional hide modal overlay
   */
  hideOverlay?: boolean;
  /**
   * Optional modal position
   */
  position?: { top?: string; left?: string; bottom?: string; right?: string };
  /**
   * Optional modal description
   */
  description?: string;
  /**
   * Optional initial focus element
   */
  initialFocus?: React.RefObject<HTMLElement>;
}

/**
 * Primary UI component for user interaction
 */
export const Modal = ({
  title,
  children,
  open,
  close,
  staticModal,
  hideCloseButton,
  className,
  panelClassName,
  hideOverlay,
  position,
  widthClassName,
  description,
  initialFocus,
}: ModalProps) => {
  const { top, left, bottom, right } = position || {};
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle focus trap and restoration
  useEffect(() => {
    if (open) {
      // Store the element that had focus before the modal opened
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Get all focusable elements
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const focusableArray = Array.from(focusableElements || []) as HTMLElement[];
      
      if (focusableArray.length === 0) return;

      const firstFocusableElement = focusableArray[0];
      const lastFocusableElement = focusableArray[focusableArray.length - 1];

      // Set initial focus
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else {
        firstFocusableElement?.focus();
      }

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
              e.preventDefault();
              lastFocusableElement?.focus();
            }
          } else {
            if (document.activeElement === lastFocusableElement) {
              e.preventDefault();
              firstFocusableElement?.focus();
            }
          }
        } else if (e.key === 'Escape' && !staticModal) {
          close();
        }
      };

      document.addEventListener('keydown', handleTabKey);

      return () => {
        document.removeEventListener('keydown', handleTabKey);
        // Restore focus when modal closes
        previousFocusRef.current?.focus();
      };
    }
  }, [open, close, staticModal, initialFocus]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        onClose={() => {
          !staticModal && close();
        }}
        className={["relative z-50", className].join(" ")}
        aria-labelledby={typeof title === "string" ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
      >
        {!hideOverlay && (
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 modal-opacity" aria-hidden="true" />
          </Transition.Child>
        )}
        <div
          className={[
            "fixed inset-0 overflow-y-auto w-full",
            widthClassName,
          ].join(" ")}
          style={{ top, bottom, left, right }}
        >
          <div
            className={[
              "min-h-screen p-4",
              _.isEmpty(position) ? "flex items-center justify-center" : "",
            ].join(" ")}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                ref={modalRef}
                className={[
                  "w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all flex flex-col gap-5",
                  panelClassName,
                ].join(" ")}
                role="dialog"
                aria-modal="true"
              >
                {!(!title && hideCloseButton) && (
                  <Dialog.Title id="modal-title">
                    <div
                      className={`w-full h-9 ${
                        title
                          ? "flex items-center justify-between"
                          : "flex items-center justify-end"
                      }`}
                    >
                      {title &&
                        (typeof title === "string" ? (
                          <Heading label={title} type="h3" />
                        ) : (
                          title
                        ))}
                      {!hideCloseButton && (
                        <button
                          ref={closeButtonRef}
                          onClick={close}
                          className="cursor-pointer p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Close modal"
                        >
                          <FaTimes size={"25px"} />
                        </button>
                      )}
                    </div>
                  </Dialog.Title>
                )}
                {description && (
                  <div id="modal-description" className="sr-only">
                    {description}
                  </div>
                )}
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
