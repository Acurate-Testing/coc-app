import type { Meta, StoryObj } from "@storybook/react";
import { SidebarLink } from "./SidebarLink";
import { AiOutlineDashboard } from "react-icons/ai";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof SidebarLink> = {
  title: "Example/SideBarLink",
  component: SidebarLink,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
};

export default meta;
type Story = StoryObj<typeof SidebarLink>;

export const DefaultSidebar: Story = {
  args: {
    text: "Dashboard",
    to: "#",
    icon: <AiOutlineDashboard className="text-lg" />,
  },
};
