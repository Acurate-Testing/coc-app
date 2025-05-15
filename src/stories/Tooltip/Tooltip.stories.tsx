import type { Meta, StoryObj } from "@storybook/react";
import { SBTooltip } from "./Tooltip";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof SBTooltip> = {
  title: "Example/SBTooltip",
  component: SBTooltip,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SBTooltip>;

// More on writing stories with  args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  args: {
    variant: "primary",
    message: "Tooltip",
  },
};

export const White: Story = {
  args: {
    variant: "white",
    message: "Tooltip",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    message: "Tooltip",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    message: "Tooltip",
  },
};
