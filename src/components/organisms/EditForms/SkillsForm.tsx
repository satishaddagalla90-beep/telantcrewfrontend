import React, { useState, useEffect } from 'react';
import Input from '../../atoms/Input';
import Label from '../../atoms/Label';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Badge from '../../atoms/Badge';

interface Skill {
    name: string;
    level: string;
    years: number;
}

interface SkillsFormProps {
    initialData: {
        skills: Skill[];
    };
    onDataChange: (data: { skills: Skill[]; }) => void;
}

const SkillsForm: React.FC<SkillsFormProps> = ({
    initialData,
    onDataChange
}) => {
    const [formData, setFormData] = useState({
        skills: initialData.skills || []
    });

    const [newSkill, setNewSkill] = useState({
        name: '',
        level: 'beginner',
        years: 1
    });

    useEffect(() => {
        onDataChange(formData);
    }, [formData, onDataChange]);

    const levelOptions = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
        { value: 'expert', label: 'Expert' }
    ];

    const getLevelBadgeVariant = (level: string) => {
        switch (level.toLowerCase()) {
            case 'beginner': return 'danger' as const;
            case 'intermediate': return 'warning' as const;
            case 'advanced': return 'info' as const;
            case 'expert': return 'success' as const;
            default: return 'secondary' as const;
        }
    };

    const addSkill = () => {
        if (newSkill.name.trim()) {
            setFormData(prev => ({
                skills: [...prev.skills, { ...newSkill }]
            }));
            setNewSkill({
                name: '',
                level: 'beginner',
                years: 1
            });
        }
    };

    const removeSkill = (index: number) => {
        setFormData(prev => ({
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    const updateSkill = (index: number, field: keyof Skill, value: string | number) => {
        setFormData(prev => ({
            skills: prev.skills.map((skill, i) =>
                i === index ? { ...skill, [field]: value } : skill
            )
        }));
    };

    return (
        <div className="space-y-6">
            {/* Existing Skills */}
            <div>
                <Label>Current Skills</Label>
                <div className="mt-2 space-y-3">
                    {formData.skills.map((skill, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                                <Input
                                    value={skill.name}
                                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                                    placeholder="Skill name"
                                    className="mb-2"
                                />
                                <div className="flex gap-2">
                                    <select
                                        value={skill.level}
                                        onChange={(e) => updateSkill(index, 'level', e.target.value)}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    >
                                        {levelOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={skill.years}
                                        onChange={(e) => updateSkill(index, 'years', parseInt(e.target.value) || 1)}
                                        min="1"
                                        max="50"
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Years"
                                    />
                                    <span className="text-sm text-gray-500 self-center">years</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={getLevelBadgeVariant(skill.level)}>
                                    {skill.level}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    iconOnly
                                    onClick={() => removeSkill(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Icon name="trash" size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {formData.skills.length === 0 && (
                        <p className="text-gray-500 py-4">No skills added yet</p>
                    )}
                </div>
            </div>

            {/* Add New Skill */}
            <div className="border-t pt-4">
                <Label>Add New Skill</Label>
                <div className="mt-2 space-y-3">
                    <Input
                        value={newSkill.name}
                        onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter skill name (e.g., React, Python, etc.)"
                    />
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Label htmlFor="level">Level</Label>
                            <select
                                id="level"
                                value={newSkill.level}
                                onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {levelOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-32">
                            <Label htmlFor="years">Years</Label>
                            <input
                                id="years"
                                type="number"
                                value={newSkill.years}
                                onChange={(e) => setNewSkill(prev => ({ ...prev, years: parseInt(e.target.value) || 1 }))}
                                min="1"
                                max="50"
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={addSkill}
                        disabled={!newSkill.name.trim()}
                        className="w-full"
                    >
                        <Icon name="plus" size={16} className="mr-2" />
                        Add Skill
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SkillsForm;
