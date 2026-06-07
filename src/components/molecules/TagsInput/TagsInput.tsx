import {
  useState,
  KeyboardEvent,
  ChangeEvent,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import Icon from '../../atoms/Icon/Icon';

export interface TagsInputProps {
  label?: string;
  inputTags?: string | null;
  onTagsChange: (tags: string[]) => void;
  onInputChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  placeholder?: string;
  preventBlurAdd?: boolean;
  disablePaste?: boolean;
}

export interface TagsInputRef {
  clearInput: () => void;
  setPreventBlurAdd: (prevent: boolean) => void;
}

const TagsInput = forwardRef<TagsInputRef, TagsInputProps>(
  (
    {
      label,
      inputTags = '',
      onTagsChange,
      onInputChange,
      onFocus,
      onBlur,
      id = 'tags-input',
      disabled = false,
      required = false,
      error = '',
      placeholder = '',
      preventBlurAdd = false,
      disablePaste = false,
    },
    ref
  ) => {
    const [tags, setTags] = useState<string[]>(
      inputTags !== null && inputTags !== ''
        ? inputTags.split(',').filter(tag => tag.trim() !== '')
        : []
    );
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [internalPreventBlurAdd, setInternalPreventBlurAdd] =
      useState(preventBlurAdd);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update internal tags when inputTags prop changes
    useEffect(() => {
      const newTags =
        inputTags !== null && inputTags !== ''
          ? inputTags.split(',').filter(tag => tag.trim() !== '')
          : [];
      const currentTagsStr = tags.join(',');
      const newTagsStr = newTags.join(',');

      if (currentTagsStr !== newTagsStr) {
        setTags(newTags);
      }
    }, [inputTags]);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        clearInput: () => {
          setInput('');
          if (onInputChange) {
            onInputChange('');
          }
        },
        setPreventBlurAdd: (prevent: boolean) => {
          setInternalPreventBlurAdd(prevent);
        },
      }),
      [onInputChange, input]
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInput(value);
      if (onInputChange) {
        onInputChange(value);
      }
    };

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag();
      } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
        e.preventDefault();
        editLastTag();
      }
    };

    const handleInputFocus = () => {
      if (!disabled) {
        setIsFocused(true);
        if (onFocus) {
          onFocus();
        }
      }
    };

    const handleInputBlur = () => {
      if (!disabled) {
        setIsFocused(false);
        if (!internalPreventBlurAdd) {
          addTag();
        }
        if (onBlur) {
          onBlur();
        }
      }
    };

    const addTag = () => {
      if (disabled) return;

      const newTag = input.trim();

      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        onTagsChange(newTags);
        setInput('');
        if (onInputChange) {
          onInputChange('');
        }
      }
    };

    const editLastTag = () => {
      if (disabled) return;

      const lastTag = tags[tags.length - 1];
      setInput(lastTag);
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      onTagsChange(newTags);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    const removeTag = (tagToRemove: string) => {
      if (disabled) return;

      const newTags = tags.filter(tag => tag !== tagToRemove);
      setTags(newTags);
      onTagsChange(newTags);
    };

    const hasContent = tags.length > 0 || input.length > 0 || isFocused;

    return (
      <div
        className={`relative w-full ${error ? 'mb-1' : ''}`}
        id={`${id}-wrapper`}
      >
        {label && (
          <label
            htmlFor={`${id}-input`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div
          className={`flex flex-wrap items-start break-words rounded-lg border px-1.5 transition focus-within:outline-none supports-[overflow-wrap:anywhere]:[overflow-wrap:anywhere] ${
            error
              ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500'
              : disabled
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
          } p-0.5 min-h-[2.5rem]`}
        >
          {tags.map((tag: string) => (
            <span
              key={tag}
              className={`z-10 m-1 flex items-center text-wrap rounded border px-2 py-0.5 text-sm ${
                disabled
                  ? 'border-gray-200 bg-gray-100 text-gray-500'
                  : 'border-gray-300 bg-gray-100 text-gray-700'
              }`}
              id={`${id}-tag-name-${tag}`}
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 focus:outline-none hover:text-red-600 transition-colors"
                  id={`${id}-remove-${tag}`}
                  aria-label={`Remove ${tag}`}
                >
                  <Icon name="close" size={14} />
                </button>
              )}
            </span>
          ))}
          <input
            id={`${id}-input`}
            type="text"
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onPaste={(e) => {
              if (disablePaste) {
                e.preventDefault();
              }
            }}
            ref={inputRef}
            disabled={disabled}
            placeholder={tags.length === 0 ? placeholder : ''}
            className={`h-8 w-5 min-w-4 flex-grow p-1 focus:outline-none bg-transparent ${
              disabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-900'
            }`}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600" id={`${id}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

TagsInput.displayName = 'TagsInput';

export default TagsInput;
