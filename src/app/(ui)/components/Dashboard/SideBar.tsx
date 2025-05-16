"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TiHome } from "react-icons/ti";
import { FaChartLine, FaUsers, FaAngleDown } from "react-icons/fa6";
import { FaFileAlt, FaProjectDiagram, FaTasks } from "react-icons/fa";
import { GrTrigger } from "react-icons/gr";
import { useMediaQuery } from "react-responsive";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface SideBarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}
interface SidebarLinkProps {
  name: string;
  icon?: React.ReactNode;
  to: string;
  hide?: boolean;
  isActive: boolean;
  isNested?: boolean;
  nestedItems?: SidebarLinkProps[];
}

const SideBar = ({ sidebarOpen, setSidebarOpen }: SideBarProps) => {
  const pathname = usePathname();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Close the sidebar when clicking outside (only on mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen && isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen, setSidebarOpen, isMobile]);

  // For desktop: when collapsed, use a narrow width (w-20) that shows only icons.
  const desktopSidebarWidth = sidebarOpen ? "w-64" : "w-20";

  // Adjust sidebar classes based on device type and sidebar state
  const sidebarClasses = isMobile
    ? `fixed inset-y-0 left-0 z-50 bg-gray-900 text-white w-64 transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : `relative bg-gray-900 text-white transition-all duration-300 ${desktopSidebarWidth}`;

  let sideBarMenuItems: SidebarLinkProps[];
  if (userRole === "lab_admin") {
    sideBarMenuItems = [
      {
        name: "Dashboard",
        icon: <TiHome size={24} />,
        to: "/admin-dashboard",
        isActive: pathname === "/admin-dashboard",
      },
      {
        name: "Samples",
        icon: <FaFileAlt size={22} />,
        to: "/admin-dashboard/samples",
        isActive: pathname === "/admin-dashboard/samples",
      },
      {
        name: "Tests",
        icon: <FaTasks size={22} />,
        to: "/admin-dashboard/tests",
        isActive: pathname === "/admin-dashboard/tests",
      },
      {
        name: "Users",
        icon: <FaUsers size={22} />,
        to: "/admin-dashboard/users",
        isActive: pathname === "/admin-dashboard/users",
      },
      {
        name: "Settings",
        icon: <FaChartLine size={22} />,
        to: "/admin-dashboard/settings",
        isActive: pathname === "/admin-dashboard/settings",
      },
    ];
  } else {
    sideBarMenuItems = [
     {
      name: "Dashboard",
      icon: <TiHome size={24} />,
      to: "/dashboard",
      isActive: pathname.includes("dashboard"),
    },
    {
      name: "Members",
      icon: <FaUsers size={22} />,
      to: "/members",
      isActive:
        pathname.includes("members") || pathname.includes("member/invite"),
    },
    {
      name: "Samples",
      icon: <FaFileAlt size={22} />,
      to: "/samples",
      isActive: pathname.includes("samples") || pathname.includes("sample"),
    },
    ];
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-30 z-40" />
      )}

      <aside ref={sidebarRef} className={sidebarClasses}>
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo-at.png"
              alt="Accurate Testing Labs Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10"
            />
            <div className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <h1 className="text-lg font-semibold text-white">Accurate Testing Labs</h1>
            </div>
          </div>
        </div>
        <nav className="mt-4">
          <ul className="space-y-2 px-4">
            {sideBarMenuItems
              .filter((item) => !item.hide)
              .map((items) => (
                <li key={items.name}>
                  <button
                    onClick={() => {
                      if (items.isNested) {
                        setReportsExpanded(!reportsExpanded);
                      } else {
                        router.push(items.to);
                      }
                      if (isMobile) {
                        setSidebarOpen(false);
                      }
                    }}
                    title={items.name}
                    className={`w-full flex ${
                      sidebarOpen ? "justify-start" : "justify-center"
                    } items-center space-x-4 p-2 rounded-lg cursor-pointer 
                  ${items.isActive && sidebarOpen ? "bg-gray-700" : ""}
                  `}
                  >
                    {items.icon}
                    <span
                      className={`text-xl flex items-center justify-between ${
                        sidebarOpen ? "block" : "hidden"
                      }`}
                    >
                      {items.name}
                    </span>
                    {items?.isNested && sidebarOpen && (
                      <FaAngleDown
                        className={reportsExpanded ? "rotate-180" : "rotate-0"}
                      />
                    )}
                  </button>
                  {/* Handle nested items */}
                  {sidebarOpen &&
                    reportsExpanded &&
                    items?.nestedItems &&
                    items?.nestedItems?.map((data) => (
                      <ul key={data.name} className="ml-6 mt-2 space-y-2">
                        <li key={data.name}>
                          <button
                            onClick={() => {
                              router.push(data.to);
                              if (isMobile) setSidebarOpen(false);
                            }}
                            title={data.name}
                            className={`w-full flex items-center space-x-2 p-2 rounded-lg cursor-pointer 
                  ${data.isActive ? "bg-gray-700" : ""}
                  `}
                          >
                            <FaAngleDown className={"-rotate-90"} />{" "}
                            <span className="text-lg">{data?.name}</span>
                          </button>
                        </li>
                      </ul>
                    ))}
                </li>
              ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default SideBar;
