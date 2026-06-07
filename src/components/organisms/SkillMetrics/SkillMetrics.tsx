// src/organisms/SkillMetrics.tsx
import React from 'react';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Text from '../../atoms/Text';
import Badge from '../../atoms/Badge';

interface Skill {
    name: string;
    level: string;
    years: number;
}

interface SkillMetricsProps {
  skills: Skill[];
  primarySkills?: string | string[];
  additionalSkills?: string | string[];
  skillCategory?: string;
  onEdit?: () => void;
  canEdit?: boolean;
}

const SkillMetrics: React.FC<SkillMetricsProps> = ({ 
  skills, 
  primarySkills, 
  additionalSkills, 
  skillCategory,
  onEdit, 
  canEdit = true 
}) => {
    const getLevelColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return 'bg-red-500';
            case 'intermediate': return 'bg-yellow-500';
            case 'advanced': return 'bg-blue-500';
            case 'expert': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getLevelBadgeVariant = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'beginner': return 'danger' as const;
            case 'intermediate': return 'warning' as const;
            case 'advanced': return 'info' as const;
            case 'expert': return 'success' as const;
            default: return 'secondary' as const;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4 relative">
                <div className="flex items-center gap-2">
                    <Icon name="chart" size={20} className="text-blue-600" />
                    <Text weight="semibold" className="text-lg font-medium text-gray-900">
                        Skill Metrics
                    </Text>
                </div>
                {onEdit && (
                    <Button
                        variant="ghost"
                        iconOnly
                        onClick={onEdit}
                        disabled={!canEdit}
                    >
                        <Icon name="edit" size={16} className="h-4 w-4" />
                    </Button>
                )}
            </div>
            {skills.length > 0 ? (
                <div className="space-y-3">
                    {skills.map((skill, index) => (
                        <div key={index} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <Text weight="medium" className="font-medium text-gray-900">
                                    {skill.name}
                                </Text>
                                <span className="text-sm text-gray-500">
                                    {skill.level} • {skill.years} years
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`${getLevelColor(skill.level)} h-2 rounded-full transition-all duration-300`}
                                        style={{ width: `${Math.min(100, (skill.years / 10) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Text className="text-gray-500">No skills added.</Text>
            )}

            {/* Skill Category Section */}
            {skillCategory && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <Text weight="medium" className="text-sm font-medium text-gray-700 mb-2">
                        Skill Category
                    </Text>
                    <div className="flex flex-wrap gap-2">
                        {skillCategory.split(',').map((cat, index) => {
                            const trimmedCat = cat.trim();
                            return trimmedCat ? (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200 uppercase font-semibold tracking-wider"
                                >
                                    {trimmedCat}
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>
            )}

            {/* Primary Skills Section */}
            {(() => {
                const normalized = Array.isArray(primarySkills) 
                    ? primarySkills.flat(Infinity).filter(Boolean).join(', ') 
                    : primarySkills;
                
                if (!normalized || typeof normalized !== 'string' || !normalized.trim()) return null;

                return (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <Text weight="medium" className="text-sm font-medium text-gray-700 mb-3">
                            Primary Skills
                        </Text>
                        <div className="flex flex-wrap gap-2">
                            {normalized.split(',').map((skill, index) => {
                                const trimmedSkill = skill.trim();
                                return trimmedSkill ? (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200"
                                    >
                                        {trimmedSkill}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* Secondary Skills Section */}
            {(() => {
                const normalized = Array.isArray(additionalSkills) 
                    ? additionalSkills.flat(Infinity).filter(Boolean).join(', ') 
                    : additionalSkills;
                
                if (!normalized || typeof normalized !== 'string' || !normalized.trim()) return null;

                return (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <Text weight="medium" className="text-sm font-medium text-gray-700 mb-3">
                            Secondary Skills
                        </Text>
                        <div className="flex flex-wrap gap-2">
                            {normalized.split(',').map((skill, index) => {
                                const trimmedSkill = skill.trim();
                                return trimmedSkill ? (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cyan-50 text-cyan-700 border border-cyan-200"
                                    >
                                        {trimmedSkill}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default SkillMetrics;