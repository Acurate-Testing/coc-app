'use client';

import { Button } from "@/stories/Button/Button";
import { FC } from "react";

const OfflinePage: FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          You're Offline
        </h1>
        <p className="text-gray-600 mb-6">
          Please check your internet connection and try again.
        </p>
        <Button
          label="Try Again"
          onClick={() => window.location.reload()}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default OfflinePage; 