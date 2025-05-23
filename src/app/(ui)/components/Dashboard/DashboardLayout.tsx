"use client";
import React, { useEffect, useState } from "react";
import ProfileHeader from "./ProfileHeader";
import { useMediaQuery } from "react-responsive";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SideBar from "./SideBar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { status } = useSession();
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const storedSidebarExpanded =
    typeof window !== "undefined"
      ? localStorage.getItem("sidebar-expanded")
      : null;

  const [sidebarOpen, setSidebarOpen] = useState(
    storedSidebarExpanded === null
      ? !isMobile
      : storedSidebarExpanded === "true"
  );

  // const [sidebarOpen, setSidebarOpen] = useState(() => {
  //   if (typeof window === "undefined") return false;

  //   const stored = localStorage.getItem("sidebar-expanded");
  //   if (stored !== null) return stored === "true";

  //   return false; // force initial value to be false, even on desktop
  // });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  });

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 ">
      <SideBar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          !isMobile && sidebarOpen ? "ml-1" : ""
        }`}
      >
        <ProfileHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 bg-bgGray  shadow-lg overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
