import type { Meta, StoryObj } from "@storybook/react";
import { Heading } from "./Heading";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta: Meta<typeof Heading> = {
  title: "Example/Heading",
  component: Heading,
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
type Story = StoryObj<typeof Heading>;

// More on writing stories with  args: https://storybook.js.org/docs/react/writing-stories/args
export const DefaultHeading: Story = {
  args: {
    label: "I am Heading",
  },
};
export const Heading1: Story = {
  args: {
    type: "heading1",
    label: "I am Heading1",
  },
};
export const Heading2: Story = {
  args: {
    type: "heading2",
    label: "I am Heading2",
  },
};
export const Heading3: Story = {
  args: {
    type: "heading3",
    label: "I am Heading3",
  },
};
export const H1: Story = {
  args: {
    type: "h1",
    label: "I am H1",
  },
};
export const H2: Story = {
  args: {
    type: "h2",
    label: "I am H2",
  },
};
export const H3: Story = {
  args: {
    type: "h3",
    label: "I am H3",
  },
};
export const H4: Story = {
  args: {
    type: "h4",
    label: "I am H4",
  },
};
export const H5: Story = {
  args: {
    type: "h5",
    label: "I am H5",
  },
};
export const H6: Story = {
  args: {
    type: "h6",
    label: "I am H6",
  },
};
