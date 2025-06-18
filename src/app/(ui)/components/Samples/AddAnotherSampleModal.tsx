"use client";
import React, { FC } from "react";
import { Modal } from "@/stories/Modal/Modal";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";

interface AddAnotherSampleModalProps {
  open: boolean;
  close: () => void;
  onChooseOption: (retainPrevious: boolean) => void;
  isSubmitting?: boolean;
}

const AddAnotherSampleModal: FC<AddAnotherSampleModalProps> = ({
  open,
  close,
  onChooseOption,
  isSubmitting = false,
}) => {
  return (
    <Modal
      open={open}
      close={close}
      title="Submit & Add Another Sample"
      staticModal
      panelClassName="!max-w-md"
    >
      <div className="text-center my-4 px-2">
        This sample will be submitted first. Would you like to add a new sample
        using the same details or start fresh?
      </div>

      <div className="flex flex-col gap-3 px-2">
        {isSubmitting ? (
          <LoadingButton label="Submitting..." className="w-full h-[50px]" />
        ) : (
          <>
            <Button
              label="Submit & Retain Previous Details"
              size="large"
              className="w-full h-[50px]"
              onClick={() => onChooseOption(true)}
            />
            <Button
              label="Submit & Start Fresh"
              variant="outline-primary"
              size="large"
              className="w-full h-[50px]"
              onClick={() => onChooseOption(false)}
            />
          </>
        )}
      </div>

      <div>
        <Button
          label="Cancel"
          variant="outline-gray"
          size="large"
          className="w-full h-[50px]"
          onClick={() => close()}
          disabled={isSubmitting}
        />
      </div>
    </Modal>
  );
};

export default AddAnotherSampleModal;
