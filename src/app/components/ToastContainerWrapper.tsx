"use client";

import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastContainerWrapper() {
  return (
    <ToastContainer
      position="top-center"
      newestOnTop
      transition={Slide}
      limit={3}
    />
  );
} 