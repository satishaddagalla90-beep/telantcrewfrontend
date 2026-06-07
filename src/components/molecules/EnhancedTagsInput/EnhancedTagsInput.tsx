import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSkillsDropdown } from '../../../hooks/useDropdowns';
import debounce from 'lodash/debounce';
import TagsInput, { TagsInputRef } from '../TagsInput/TagsInput';
import Icon from '../../atoms/Icon/Icon';

export interface EnhancedTagsInputProps {
  /** Current tags as comma-separated string */
  inputTags?: string;
  /** Callback when tags change */
  onTagsChange: (tags: string[]) => void;
  /** Input ID */
  id?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Label text */
  label?: string;
  /** Number of suggestions to show (default: 3) */
  maxSuggestions?: number;
  /** Whether to show API suggestions */
  showSuggestions?: boolean;
  /** Disable paste functionality */
  disablePaste?: boolean;
}

const EnhancedTagsInput: React.FC<EnhancedTagsInputProps> = ({
  inputTags = '',
  onTagsChange,
  id = 'enhanced-tags-input',
  disabled = false,
  required = false,
  error = '',
  placeholder = 'Type a skill and press Enter, comma, or space to add',
  label,
  maxSuggestions = 3,
  showSuggestions = true,
  disablePaste = false,
}) => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSuggestionsPills, setShowSuggestionsPills] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [lastTypedValue, setLastTypedValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const tagsInputRef = useRef<TagsInputRef>(null);

  // Use the skills dropdown hook for API suggestions
  const {
    options: skillOptions,
    loading: skillsLoading,
    search: searchSkills,
  } = useSkillsDropdown();

  // Debounce the search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (showSuggestions && value && value.trim().length >= 2) {
        searchSkills(value.trim());
        setShowSuggestionsPills(true);
      } else {
        setShowSuggestionsPills(false);
      }
    }, 300),
    [searchSkills, showSuggestions]
  );

  // Filter suggestions based on current input and existing tags
  const filteredSuggestions = React.useMemo(() => {
    if (
      !showSuggestions ||
      !lastTypedValue ||
      !lastTypedValue.trim() ||
      lastTypedValue.trim().length < 2
    ) {
      return [];
    }

    const existingTags = inputTags
      ? inputTags.split(',').map(tag => tag.trim().toLowerCase())
      : [];
    const inputLower = lastTypedValue.trim().toLowerCase();

    return skillOptions
      .filter(
        option =>
          option.label.toLowerCase().includes(inputLower) &&
          !existingTags.includes(option.label.toLowerCase())
      )
      .slice(0, maxSuggestions);
  }, [
    skillOptions,
    lastTypedValue,
    inputTags,
    maxSuggestions,
    showSuggestions,
  ]);

  // Handle clicking on a suggestion pill
  const handleSuggestionClick = (suggestionLabel: string) => {
    // FIRST: Prevent any potential blur from adding tags
    if (tagsInputRef.current) {
      tagsInputRef.current.setPreventBlurAdd(true);
    }

    const currentTags = inputTags
      ? inputTags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean)
      : [];
    const newTags = [...currentTags, suggestionLabel];

    onTagsChange(newTags);
    setLastTypedValue('');
    setShowSuggestionsPills(false);
    setFocusedSuggestionIndex(-1);

    // Clear the input and reset preventBlurAdd after a short delay
    if (tagsInputRef.current) {
      tagsInputRef.current.clearInput();

      // Reset preventBlurAdd after clearing
      setTimeout(() => {
        if (tagsInputRef.current) {
          tagsInputRef.current.setPreventBlurAdd(false);
        }
      }, 100); // Longer delay to ensure blur events are handled
    }
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!showSuggestionsPills || filteredSuggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedSuggestionIndex(prev =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedSuggestionIndex(prev =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;
        case 'Enter':
          if (
            focusedSuggestionIndex >= 0 &&
            focusedSuggestionIndex < filteredSuggestions.length
          ) {
            e.preventDefault();
            handleSuggestionClick(
              filteredSuggestions[focusedSuggestionIndex].label
            );
          }
          break;
        case 'Escape':
          setShowSuggestionsPills(false);
          setFocusedSuggestionIndex(-1);
          break;
      }
    },
    [showSuggestionsPills, filteredSuggestions, focusedSuggestionIndex]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsPills(false);
        setFocusedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Track changes in the TagsInput to capture what user is typing
  const handleTagsInputChange = (tags: string[]) => {
    onTagsChange(tags);
  };

  // Handle input changes to capture typing for suggestions
  const handleInputChange = (value: string) => {
    setLastTypedValue(value);
    if (value && value.trim().length >= 2) {
      setShowSuggestionsPills(true);
      debouncedSearch(value);
    } else {
      setShowSuggestionsPills(false);
    }
  };

  // Handle focus events
  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  // Handle blur events
  const handleInputBlur = () => {
    setIsInputFocused(false);
    // Don't hide suggestions immediately to allow clicking
    setTimeout(() => setShowSuggestionsPills(false), 200);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Standard TagsInput component */}
      <TagsInput
        ref={tagsInputRef}
        label={label}
        inputTags={inputTags}
        onTagsChange={handleTagsInputChange}
        onInputChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        id={id}
        disabled={disabled}
        required={required}
        error={error}
        placeholder={placeholder}
        disablePaste={disablePaste}
      />

      {/* API Suggestions Pills */}
      {showSuggestions &&
        showSuggestionsPills &&
        filteredSuggestions.length > 0 && (
          <div
            className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg"
            onMouseDown={e => {
              e.preventDefault(); // Prevent blur from happening when clicking anywhere in suggestions
              e.stopPropagation(); // Stop event bubbling
            }}
            onClick={e => {
              e.preventDefault(); // Extra prevention for click
              e.stopPropagation();
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon name="star" className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Suggested skills:
              </span>
              {skillsLoading && (
                <Icon
                  name="loading"
                  className="w-4 h-4 animate-spin text-blue-500"
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion.value}
                  type="button"
                  onClick={() => {
                    handleSuggestionClick(suggestion.label);
                  }}
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full border transition-colors
                  ${
                    focusedSuggestionIndex === index
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }
                `}
                  onMouseEnter={() => setFocusedSuggestionIndex(index)}
                  disabled={disabled}
                >
                  <Icon name="plus" className="w-3 h-3 mr-1" />
                  {suggestion.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click to add, or use arrow keys and Enter to navigate
            </p>
          </div>
        )}
    </div>
  );
};

export default EnhancedTagsInput;
