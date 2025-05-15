"use client";
import React from "react";
import { ImSpinner8 } from "react-icons/im";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-80px)] gap-3 text-xl">
      <ImSpinner8 className="animate-spin" /> Loading...
    </div>
  );
};

export default LoadingSpinner;
