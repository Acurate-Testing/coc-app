"use client";
import React, { useState } from "react";
import { Accordion, AccordionItem } from "@/stories/Accordion/Accordion";
import { Button } from "@/stories/Button/Button";

interface AccordionItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  buttonText?: string;
  variant?: string;
  buttonIcon?: React.ReactNode;
  buttonAction?: () => void;
  initiallyOpen?: boolean;
}

interface AccordionGroupProps {
  items: AccordionItem[];
}

export default function AccordionGroup({ items }: AccordionGroupProps) {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    items.forEach((item) => {
      initialState[item.id] = item.initiallyOpen ?? true;
    });
    return initialState;
  });

  const toggleOpen = (id: string) => {
    setOpenStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <Accordion>
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          title={
            <div className="w-full flex items-center justify-between gap-2 text-lg">
              <div className="flex items-center gap-2">
                {item.icon || ""} {item.title}
              </div>
              {item?.buttonText && (
                <div>
                  <Button
                    variant={
                      item?.variant ? (item?.variant as "danger") : "primary"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      item.buttonAction?.();
                    }}
                    icon={item?.buttonIcon}
                    label={item?.buttonText}
                    size="large"
                  />
                </div>
              )}
            </div>
          }
          defaultOpen={openStates[item.id]}
          className="bg-white rounded-xl"
        >
          {item.content}
        </AccordionItem>
      ))}
    </Accordion>
  );
}
