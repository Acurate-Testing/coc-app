import React from "react";
import "./sidebar-link.scss";
import { Label } from "../Label/Label";
import Link from "next/link";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  isActive?: boolean;
  activeClassName?: string;
}

export const SidebarLink = ({
  to,
  icon,
  text,
  isActive,
  activeClassName,
}: SidebarLinkProps) => (
  <li
    className={[
      "storybook-sidebar-link cursor-pointer px-4 py-3.5 mx-3 rounded-normal mb-0.5 last:mb-0 list-none",
      isActive ? `bg-colorLightest text-colorLight ${activeClassName}` : "",
    ].join(" ")}
  >
    <Link
      href={to}
      className={`block truncate transition duration-150 font-medium ${
        isActive ? "text-themePrimary" : "text-colorLight"
      }`}
    >
      <div className={`flex items-center ${text ? "" : "justify-center"}`}>
        {icon}
        {text && (
          <Label
            className="ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200 cursor-pointer"
            label={text}
            size="small"
          />
        )}
      </div>
    </Link>
  </li>
);
