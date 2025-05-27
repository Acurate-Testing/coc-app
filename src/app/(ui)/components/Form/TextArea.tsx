import React from "react";

interface TextAreaProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  error?: string;
  required?: boolean;
  name?: string;
  id?: string;
  ariaDescribedBy?: string;
  maxLength?: number;
  disabled?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
  error,
  required = false,
  name,
  id,
  ariaDescribedBy,
  maxLength,
  disabled = false,
}) => {
  const textareaId = id || name || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = error ? `${textareaId}-error` : undefined;
  const descriptionId = ariaDescribedBy || (maxLength ? `${textareaId}-description` : undefined);

  return (
    <div className="w-full">
      <label 
        htmlFor={textareaId}
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      <textarea
        id={textareaId}
        name={name}
        rows={rows}
        className={`w-full px-3 py-2 text-sm border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={error ? "true" : "false"}
        aria-required={required}
        aria-describedby={`${errorId ? errorId : ""} ${descriptionId ? descriptionId : ""}`.trim() || undefined}
      />
      {error && (
        <p 
          id={errorId}
          className="mt-1 text-xs text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
      {maxLength && (
        <p 
          id={descriptionId}
          className="mt-1 text-xs text-gray-500"
        >
          {value.length}/{maxLength} characters
        </p>
      )}
    </div>
  );
};

export default TextArea;
