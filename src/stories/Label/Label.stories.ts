import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "./Label";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Label> = {
  title: "Example/Label",
  component: Label,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/react/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    color: { control: "color" },
  },
};

export default meta;
type Story = StoryObj<typeof Label>;

// More on writing stories with  args: https://storybook.js.org/docs/react/writing-stories/args
export const DefaultLabel: Story = {
  args: {
    label: "I am Label",
  },
};
export const Large: Story = {
  args: {
    size: "large",
    label: "I am Large",
  },
};
export const Medium: Story = {
  args: {
    size: "medium",
    label: "I am Medium",
  },
};
export const Small: Story = {
  args: {
    size: "small",
    label: "I am small",
  },
};
