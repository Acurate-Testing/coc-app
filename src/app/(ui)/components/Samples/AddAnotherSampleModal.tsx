"use client";
import React, { FC } from "react";
import { Modal } from "@/stories/Modal/Modal";
import { Button } from "@/stories/Button/Button";

interface AddAnotherSampleModalProps {
  open: boolean;
  close: () => void;
  onChooseOption: (retainPrevious: boolean) => void;
}

const AddAnotherSampleModal: FC<AddAnotherSampleModalProps> = ({
  open,
  close,
  onChooseOption,
}) => {
  return (
    <Modal
      open={open}
      close={close}
      title="Add Another Sample"
      staticModal
      panelClassName="!max-w-md"
    >
      <div className="text-center my-4 px-2">
        Would you like to add a new sample using the same details as the
        previous one or start fresh?
      </div>

      <div className="flex flex-col gap-3 px-2">
        <Button
          label="Retain Previous Details"
          size="large"
          className="w-full h-[50px]"
          onClick={() => onChooseOption(true)}
        />
        <Button
          label="Start Fresh"
          variant="outline-primary"
          size="large"
          className="w-full h-[50px]"
          onClick={() => onChooseOption(false)}
        />
      </div>

      <div>
        <Button
          label="Cancel"
          variant="outline-gray"
          size="large"
          className="w-full h-[50px]"
          onClick={() => close()}
        />
      </div>
    </Modal>
  );
};

export default AddAnotherSampleModal;
