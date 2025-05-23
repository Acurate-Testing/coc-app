import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./Button";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Button> = {
  title: "Example/Button",
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    backgroundColor: { control: "color" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Primary: Story = {
  args: {
    variant: "primary",
    label: "Button",
  },
};

export const White: Story = {
  args: {
    variant: "white",
    label: "Button",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    label: "Button",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    label: "Button",
  },
};

export const OutlinePrimary: Story = {
  args: {
    variant: "outline-primary",
    label: "Button",
  },
};

export const OutlineGray: Story = {
  args: {
    variant: "outline-gray",
    label: "Button",
  },
};

export const OutlineDanger: Story = {
  args: {
    variant: "outline-danger",
    label: "Button",
  },
};

export const OutlineWarning: Story = {
  args: {
    variant: "outline-warning",
    label: "Button",
  },
};

export const Large: Story = {
  args: {
    size: "large",
    label: "Button",
  },
};

export const Medium: Story = {
  args: {
    size: "medium",
    label: "Button",
  },
};

export const Small: Story = {
  args: {
    size: "small",
    label: "Button",
  },
};
