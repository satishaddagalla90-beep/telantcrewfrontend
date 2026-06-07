import { useEffect, useCallback } from 'react';

export interface TabFormConfig {
    forms: any[];
    saveFunction: (formId: string) => void;
    validateFunction: (form: any) => boolean;
    tabName: string;
}

export const useTabBasedAutoSave = (
    activeTab: string,
    configs: Record<string, TabFormConfig>
) => {
    // Helper function to extract value from dropdown objects
    const extractValue = useCallback((value: any): string => {
        if (typeof value === 'string') return value;
        if (value && typeof value === 'object' && value.value) return value.value;
        return '';
    }, []);

    // Auto-save function for tab switching
    const autoSaveTabForms = useCallback((fromTab: string) => {
        const config = configs[fromTab];
        if (!config) return;

        console.log(`=== Auto-save ${config.tabName} forms before tab switch ===`);
        config.forms.forEach(form => {
            if (config.validateFunction(form)) {
                console.log(`Auto-saving ${config.tabName} form on tab switch:`, form.id);
                config.saveFunction(form.id);
            }
        });
    }, []);

    // Auto-save function for step navigation
    const autoSaveAllForms = useCallback(() => {
        console.log('=== Auto-save all forms before step navigation ===');
        Object.values(configs).forEach(config => {
            config.forms.forEach(form => {
                if (config.validateFunction(form)) {
                    console.log(`Auto-saving ${config.tabName} form on step navigation:`, form.id);
                    config.saveFunction(form.id);
                }
            });
        });
    }, []);

    // Auto-save on component unmount (when moving to next step)
    useEffect(() => {
        return () => {
            autoSaveAllForms();
        };
    }, []); // No dependencies - only run on mount/unmount

    return {
        extractValue,
        autoSaveTabForms,
        autoSaveAllForms,
    };
};
