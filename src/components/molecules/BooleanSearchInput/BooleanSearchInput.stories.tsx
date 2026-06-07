import type { Meta, StoryObj } from "@storybook/react";
import { BooleanSearchInput } from "./BooleanSearchInput";

const mockSkillsApi = async (query: string) => {
    const allSkills = ["Java", "Javascript", "React JS", "React Native", "Flutter", "Angular", "Node.js"];
    return allSkills.filter(skill =>
        skill.toLowerCase().includes(query.toLowerCase())
    );
};

const meta: Meta<typeof BooleanSearchInput> = {
    title: "molecules/BooleanSearchInput",
    component: BooleanSearchInput,
};
export default meta;

type Story = StoryObj<typeof BooleanSearchInput>;

export const Default: Story = {
    args: {
        skillsApi: mockSkillsApi,
        onSearch: (query, options) => {
            console.log("Searching:", query, options);
        },
    },
};
