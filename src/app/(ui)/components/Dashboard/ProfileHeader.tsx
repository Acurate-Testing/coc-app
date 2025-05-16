"use client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa6";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FiLogOut } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { signOut, useSession } from "next-auth/react";
import { useMediaQuery } from "react-responsive";

interface ProfileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

const ProfileHeader = ({ sidebarOpen, setSidebarOpen }: ProfileHeaderProps) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isMobile = useMediaQuery({ maxWidth: 535 });

  const showTitleBasedonPath: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/profile": "My Profile",
    "/samples": "Sample List",
    "/sample/add": "New Sample",
    "/members": "Members",
    "/member/invite": "Invite Member",
  };

  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith("/sample/") && pathname !== "/sample/add") {
      return "Sample Details";
    }

    // Fallback to static mapping
    return showTitleBasedonPath[pathname] || "";
  };
  const pageTitle = getPageTitle(pathname);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <header className="flex items-center justify-between bg-white shadow p-4 relative">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:ml-4 md:mr-2"
        >
          <FaBars size={24} />
        </button>
        <p className="text-xl font-semibold">{pageTitle}</p>
      </div>

      <div className="relative ml-auto px-3">
        <Menu>
          <MenuButton className="inline-flex items-center gap-3 bg-white text-themeColor font-semibold focus:outline-none  data-[focus]:outline-1 data-[focus]:outline-white">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-semibold uppercase bg-themeColor">
              {session?.user?.name &&
                (session?.user?.name.includes(" ")
                  ? session?.user?.name
                      .split(" ")
                      .map((n: string) => n.charAt(0).toUpperCase())
                      .join("")
                  : session?.user?.name.slice(0, 2).toUpperCase())}
            </div>{" "}
            {!isMobile ? session?.user?.name : ""}
            <svg
              className={`w-5 h-5 text-gray-500 transform rotate-0`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </MenuButton>

          <MenuItems
            transition
            anchor="bottom end"
            className="w-48 mt-2 origin-top-right rounded-xl border border-borderGray bg-white p-1 text-base/6 text-gray-700 transition duration-200 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <MenuItem>
              <button
                className="flex w-full items-center gap-2 rounded-lg py-3 px-4 data-[focus]:bg-hoverGray"
                onClick={() => router.push("/profile")}
              >
                <FaUserCircle size={18} /> My Profile
              </button>
            </MenuItem>
            <div className="my-1 h-px bg-black/5" />
            <MenuItem>
              <button
                className="flex w-full items-center gap-2 rounded-lg py-3 px-4 data-[focus]:bg-hoverGray"
                onClick={handleLogout}
              >
                <FiLogOut size={18} /> Log Out
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </header>
  );
};

export default ProfileHeader;
