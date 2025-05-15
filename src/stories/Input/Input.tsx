/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React from "react";
import "./input.scss";
import { Label } from "../Label/Label";
// import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface InputProps {
  id: string;
  name: string;
  label: string;
  value: string | number;
  disabled?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
  minTime?: string;
  minDate?: string;
  error?: boolean;
  showTimeSelectOnly?: boolean;
  showTimeSelect?: boolean;
  touched?: boolean;
  errorMessage?: string;
  inputType?: string;
  requiredField?: boolean;
  allowDecimal?: boolean;
  autoComplete?: HTMLInputElement["autocomplete"];
  autoFocus?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const SBInput: React.FC<InputProps> = ({
  id,
  name,
  label,
  value,
  error,
  disabled,
  wrapperClassName,
  inputClassName,
  touched,
  minDate,
  minTime,
  showTimeSelectOnly,
  showTimeSelect,
  errorMessage = "",
  inputType = "text",
  requiredField,
  autoComplete = "off",
  autoFocus,
  onChange,
  onClick,
  onFocus,
  onKeyDown,
  onBlur,
  allowDecimal = false,
}) => {
  const inputClasses = [
    "block",
    "w-full",
    "text-sm",
    "bg-transparent",
    "rounded-lg",
    "border-1",
    "appearance-none",
    "focus:outline-none",
    "focus:ring-0",
    "peer",
    "h-12",
    "disabled:cursor-not-allowed",
    "disabled:opacity-70",
    touched && error && "form-error",
    inputClassName ?? "",
  ].join(" ");

  const wrapperClasses = ["storybook-input", wrapperClassName].join(" ");

  const labelClasses = [
    "absolute",
    "text-sm",
    "duration-300",
    "transform",
    "-translate-y-[1.15rem]",
    "scale-75",
    "top-2",
    "z-10",
    "origin-[0]",
    "bg-white",
    "px-2",
    "peer-focus:px-2",
    "peer-placeholder-shown:scale-100",
    "peer-placeholder-shown:-translate-y-1/2",
    "peer-placeholder-shown:top-1/2",
    "peer-focus:top-2",
    "peer-focus:scale-75",
    "peer-focus:-translate-y-[1.15rem]",
    "rtl:peer-focus:translate-x-1/4",
    "rtl:peer-focus:left-auto",
    "start-2",
    touched && error && "error-text",
  ].join(" ");

  const handleDateChange = (date: any) => {
    if (date) {
      onChange({
        target: {
          value: date, // Pass the Date object directly
        },
      } as any);
    } else {
      // Handle null case if needed
      onChange({
        target: {
          value: null,
        },
      } as any);
    }
  };
  let dateFormat = "MM-dd-yyyy";
  if (showTimeSelectOnly) {
    dateFormat = "HH:mm";
  } else if (showTimeSelect) {
    dateFormat = "MM-dd-yyyy HH:mm";
  }
  return (
    <div className={wrapperClasses}>
      <div className="relative">
        {inputType !== "date" && (
          <input
            type={inputType}
            id={id}
            // min={1}
            name={name}
            className={inputClasses}
            placeholder=""
            disabled={disabled}
            value={value}
            // value={inputType == "number" ? value || 0 : value || ""}
            onChange={onChange}
            onClick={onClick}
            onFocus={onFocus}
            autoComplete={autoComplete}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            autoFocus={autoFocus}
            onKeyPress={(e) => {
              if (inputType === "number" && !allowDecimal) {
                if (
                  e.key.toLowerCase() === "e" ||
                  e.key === "." ||
                  e.key === "-"
                ) {
                  e.preventDefault();
                }
              } else if (inputType === "number" && allowDecimal) {
                const isValidKey = /^\d$/.test(e.key) || e.key === ".";

                if (!isValidKey) {
                  e.preventDefault();
                }
              }
            }}
          />
        )}

        <Label
          requiredLabel={requiredField}
          htmlFor={id}
          label={label}
          className={labelClasses}
          size="small"
        />
      </div>

      {/* {inputType === "date" && (
        <>
          {React.createElement(ReactDatePicker, {
            placeholderText: `${showTimeSelectOnly ? "HH:MM" : `${showTimeSelect ? "MM-DD-YYYY HH:MM" : "MM-DD-YYYY"}`}`,
            selected: value ? new Date(value) : null,
            chooseDayAriaLabelPrefix: "",
            onChange: (data) => handleDateChange(data),
            showTimeSelect: showTimeSelect,
            showTimeSelectOnly: showTimeSelectOnly,
            disabled: disabled,
            timeFormat: "HH:mm",
            ...(() =>
              minTime
                ? {
                    minTime: new Date(+minTime) as any,
                    maxTime: new Date().setHours(23, 59, 59, 999) as any,
                  }
                : {})(), // Set max time to 23:00
            ...(() =>
              minDate
                ? {
                    minDate: new Date(+minDate) as any,
                  }
                : {})(),
            timeIntervals: 30,
            dateFormat: dateFormat,
            className: `p-[10px] min-w-[100px] !w-full ${disabled ? "disabled:cursor-not-allowed disabled:opacity-70" : ""}`,
          })}
        </>
      )} */}

      {touched && error && errorMessage && (
        <Label
          label={errorMessage}
          className="mt-1 px-1 error-text"
          size="extra-small"
        />
      )}
    </div>
  );
};

export default SBInput;
