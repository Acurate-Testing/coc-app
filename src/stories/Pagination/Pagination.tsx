import React, { useEffect, useState } from "react";
import {
  FaAngleLeft,
  FaAngleRight,
  FaAnglesLeft,
  FaAnglesRight,
} from "react-icons/fa6";
import "./Pagination.scss";
import { Label } from "../Label/Label";
import { useMediaQuery } from "react-responsive";

export interface PaginationProps {
  /**
   * Optional card classes
   */
  className?: string;
  /**
   * Active page
   */
  activePage: number;
  /**
   * Active page
   */
  setActivePage: (page: number) => void;
  /**
   * Number of pages
   */
  numberOfPage: number;
  /**
   * Number of records
   */
  numberOfRecords?: number;
  /**
   * Items per page
   */
  itemsPerPage: number | undefined;
  /**
   * Set number of items per page
   */
  setItemsPerPage?: (itemsPerPage: number) => void;
  /**
   * Hide pagination
   */
  hidePagination?: boolean;
}

/**
 * Primary UI component for user interaction
 */
export const Pagination = ({
  className = "",
  numberOfPage,
  activePage,
  setActivePage,
  numberOfRecords,
  setItemsPerPage,
  itemsPerPage,
}: PaginationProps) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [inputValue, setInputValue] = useState(activePage + 1);
  const startRecord = activePage * (itemsPerPage || 10) + 1;
  const endRecord = Math.min(
    (activePage + 1) * (itemsPerPage || 10),
    numberOfRecords || 0
  );

  const next = () => {
    if (activePage === numberOfPage - 1) return;
    setActivePage(activePage + 1);
  };

  const prev = () => {
    if (activePage === 0) return;
    setActivePage(activePage - 1);
  };

  const goToPage = () => {
    if (!isNaN(inputValue)) {
      const newPage = Math.max(0, Math.min(inputValue - 1, numberOfPage - 1));
      setActivePage(newPage);
      setInputValue(newPage + 1);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      goToPage();
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  useEffect(() => {
    setInputValue(activePage + 1);
  }, [activePage]);

  // Mobile UI
  if (isMobile) {
    return (
      <div
        className={`storybook-pagination flex flex-col justify-center items-center gap-6 w-full text-themePrimary ${className}`}
      >
        <div className="flex gap-4 items-center justify-between">
          <Label
            label={`${startRecord} - ${endRecord} of ${numberOfRecords}`}
          />
          <div className="flex items-center gap-2">
            <button
              // variant="text"
              className="flex items-center gap-2 rounded-full hover:bg-gray-200 text-black py-2 px-0 justify-center"
              onClick={prev}
              disabled={activePage === 0}
            >
              <FaAngleLeft className="h-5 w-8" />
            </button>

            <div className="flex items-center gap-2 py-1">
              <input
                type="number"
                min="1"
                max={numberOfPage}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(parseInt(e.target.value, 10));
                }}
                className="w-fit px-0 form-input text-center"
              />
              <span>of {numberOfPage}</span>
            </div>
            <button
              // variant="text"
              className="flex items-center gap-2 rounded-full hover:bg-gray-200 py-2 px-0"
              onClick={next}
              disabled={activePage === numberOfPage - 1}
            >
              <FaAngleRight className="h-5 w-8" />
            </button>
          </div>
        </div>
        {/* <div className="flex items-center justify-center w-full gap-2">
          <Label label="Items per page" />
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const newItemsPerPage = parseInt(e.target.value, 10);
              setItemsPerPage && setItemsPerPage(newItemsPerPage);
              setActivePage(0);
            }}
            className="form-select text-center rounded-none !border-b border-0 border-themePrimary text-themePrimary hover:border-themePrimary focus:border-themePrimary"
          >
            {[5, 10, 20, 50, 100].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div> */}
      </div>
    );
  }

  // Desktop UI
  return (
    <div
      className={`storybook-pagination flex justify-between items-center gap-4 w-full text-themePrimary px-4 ${className}`}
    >
      <Label label={`${startRecord} - ${endRecord} of ${numberOfRecords}`} />
      <div className="flex items-center gap-4">
        <button
          // variant="text"
          className="flex items-center gap-2 rounded-full hover:bg-gray-200 py-2 px-0"
          onClick={() => setActivePage(0)}
          disabled={activePage === 0}
        >
          <FaAnglesLeft className="h-5 w-8" />
        </button>
        <button
          // variant="text"
          className="flex items-center gap-2 rounded-full hover:bg-gray-200 py-2 px-0"
          onClick={prev}
          disabled={activePage === 0}
        >
          <FaAngleLeft className="h-5 w-8" />
        </button>
        <div className="flex items-center gap-2 py-1">
          <input
            type="number"
            min="1"
            max={numberOfPage}
            value={inputValue}
            onChange={(e) => {
              setInputValue(parseInt(e.target.value, 10));
            }}
            className="w-fit px-0 form-input text-center"
          />
          <Label label="of" />
          <Label label={numberOfPage} />
        </div>
        <button
          // variant="text"
          className="flex items-center gap-2 rounded-full hover:bg-gray-200 py-2 px-0"
          onClick={next}
          disabled={activePage === numberOfPage - 1}
        >
          <FaAngleRight className="h-5 w-8" />
        </button>
        <button
          // variant="text"
          className="flex items-center gap-2 rounded-full hover:bg-gray-200 py-2 px-0"
          onClick={() => setActivePage(numberOfPage - 1)}
          disabled={activePage === numberOfPage - 1}
        >
          {/* <ChevronDoubleRightIcon className="h-5 w-8" /> */}
          <FaAnglesRight className="h-5 w-8" />
        </button>
      </div>
      <div className="flex items-center gap-2 min-w-14"></div>
      {/* <div className="flex items-center gap-2">
        <Label label="Items per page" />
        <select
          value={itemsPerPage}
          onChange={(e) => {
            const newItemsPerPage = parseInt(e.target.value, 10);
            setItemsPerPage && setItemsPerPage(newItemsPerPage);
            setActivePage(0);
          }}
          className="form-select text-center rounded-none !border-b border-0 border-themePrimary text-themePrimary hover:border-themePrimary focus:border-themePrimary"
        >
          {[5, 10, 20, 50, 100].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div> */}
    </div>
  );
};
