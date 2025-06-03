import { Button } from "@/stories/Button/Button";
import { Label } from "@/stories/Label/Label";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { Modal } from "@/stories/Modal/Modal";
import React, { ReactNode } from "react";
import { RiErrorWarningLine } from "react-icons/ri";

export interface ConformationDialogProps {
  open: boolean;
  setOpenModal: (val: boolean) => void;
  onConfirm: any;
  processing: boolean;
  message?: ReactNode | string;
  buttonText?: string;
  loadingText?: string;
  buttonClass?: string;
  whiteButtonText?: string;
  iconColor?: string;
  variant?: string;
  dataToDelete?: string;
}
const ConfirmationModal = ({
  open,
  setOpenModal,
  onConfirm,
  processing,
  message,
  buttonText,
  dataToDelete,
  buttonClass,
  variant,
  iconColor,
  loadingText,
  whiteButtonText,
}: ConformationDialogProps) => {
  return (
    <Modal
      open={open}
      close={() => setOpenModal(false)}
      hideCloseButton
      className="z-[100] !rounded-lg"
    >
      <div className="flex flex-col items-center justify-center w-full gap-4">
        <RiErrorWarningLine className="text-red-600 text-5xl" color={iconColor || ""} />
        <div className="text-lg font-semibold text-colorBlack text-center">
          <Label label={message ?? "Are you sure you want to delete?"} />
          {dataToDelete && (
            <>
              <br />
              <Label color="#16a34a" label={dataToDelete} />
            </>
          )}
        </div>
        <div
          className={`grid mt-5 ${
            processing ? "grid-cols-1" : "sm:grid-cols-2 grid-cols-1"
          } gap-2 w-full`}
        >
          {processing ? (
            <LoadingButton variant="danger" label={loadingText ?? "Deleting"} />
          ) : (
            <>
              <Button
                variant="white"
                label={whiteButtonText ?? "Cancel"}
                onClick={() => {
                  setOpenModal(false);
                }}
                disabled={processing}
                className="hover:bg-gray-100"
              />
              <Button
                variant={(variant as any) ?? "danger"}
                label={buttonText ?? "Delete"}
                onClick={onConfirm}
                className="hover:opacity-90"
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
