import React, { Fragment, ReactNode } from "react";
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
}: ModalProps) => {
  const { top, left, bottom, right } = position || {};
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        onClose={() => {
          !staticModal && close();
        }}
        className={["relative z-50", className].join(" ")}
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
            <div className="fixed inset-0 modal-opacity" />
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
                className={[
                  "w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all flex flex-col gap-5",
                  panelClassName,
                ].join(" ")}
              >
                {!(!title && hideCloseButton) && (
                  <Dialog.Title>
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
                        <FaTimes
                          size={"25px"}
                          onClick={close}
                          className="cursor-pointer"
                        />
                      )}
                    </div>
                  </Dialog.Title>
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
