import React, { useState, useRef, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { showErrorToast } from '../../../utils/toast';
import Toggle from '../../atoms/Toggle/Toggle';
import Dropdown from '../../atoms/Dropdown/Dropdown';
import Icon from '../../atoms/Icon/Icon';
import Text from '../../atoms/Text/Text';

interface BooleanSearchInputProps {
  /** API function to fetch skill suggestions */
  skillsApi?: (query: string) => Promise<string[]>;
  /** Callback when search is triggered */
  onSearch: (
    query: string,
    options: { boolean: boolean; scope: string }
  ) => void;
  /** Callback when query, boolean, or scope changes */
  onChange?: (
    query: string,
    options: { boolean: boolean; scope: string }
  ) => void;
  /** Initial query value */
  initialQuery?: string;
  /** Initial boolean toggle state */
  initialBooleanOn?: boolean;
  /** Initial scope value */
  initialScope?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show scope dropdown */
  showScopeDropdown?: boolean;
  /** Custom scope options */
  scopeOptions?: Array<{ value: string; label: string }>;
  /** Show search button */
  showSearchButton?: boolean;
}

export const BooleanSearchInput: React.FC<BooleanSearchInputProps> = ({
  skillsApi,
  onSearch,
  onChange,
  initialQuery = '',
  initialBooleanOn = true,
  initialScope = 'entire',
  placeholder = 'Enter query like (Java OR "React JS") AND Hyderabad',
  className = '',
  showScopeDropdown = true,
  scopeOptions = [
    { value: 'title', label: 'Resume title' },
    { value: 'title_skills', label: 'Resume title and key skills' },
    { value: 'synopsis', label: 'Resume synopsis' },
    { value: 'entire', label: 'Entire resume' },
  ],
  showSearchButton = true,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [booleanOn, setBooleanOn] = useState(initialBooleanOn);
  const [scope, setScope] = useState(initialScope);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync state when initial props change (e.g., modal reopens with different values)
  useEffect(() => {
    setQuery(initialQuery);
    setBooleanOn(initialBooleanOn);
    setScope(initialScope);
  }, [initialQuery, initialBooleanOn, initialScope]);

  // Enhanced validation with detailed error messages
  const validateBooleanQuery = (q: string): { valid: boolean; error?: string } => {
    if (!q.trim()) {
      return { valid: true };
    }

    // Check parentheses balance
    const openParens = (q.match(/\(/g) || []).length;
    const closeParens = (q.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return { 
        valid: false, 
        error: `Unbalanced parentheses (${openParens} open, ${closeParens} close)` 
      };
    }

    // Check quotes balance
    const quotes = (q.match(/"/g) || []).length;
    if (quotes % 2 !== 0) {
      return { valid: false, error: 'Unbalanced quotes' };
    }

    // Check for empty parentheses
    if (q.includes('()')) {
      return { valid: false, error: 'Empty parentheses not allowed' };
    }

    // Check for invalid operator usage
    const invalidPatterns = [
      { pattern: /AND\s+AND/i, message: 'Consecutive AND operators' },
      { pattern: /OR\s+OR/i, message: 'Consecutive OR operators' },
      { pattern: /NOT\s+NOT/i, message: 'Consecutive NOT operators' },
      { pattern: /^\s*(AND|OR)/i, message: 'Query cannot start with AND/OR' },
      { pattern: /(AND|OR)\s*$/i, message: 'Query cannot end with AND/OR' },
      { pattern: /\(\s*(AND|OR|NOT)\s*\)/i, message: 'Operator inside empty parentheses' },
    ];

    for (const { pattern, message } of invalidPatterns) {
      if (pattern.test(q)) {
        return { valid: false, error: message };
      }
    }

    return { valid: true };
  };

  const validation = !booleanOn ? { valid: true } : validateBooleanQuery(query);
  const isValid = validation.valid;
  const errorMessage = validation.error;

  const handleSearch = () => {
    if (booleanOn && !isValid) {
      showErrorToast(errorMessage || 'Invalid Boolean query. Check parentheses or quotes.');
      return;
    }
    if (!query.trim()) {
      showErrorToast('Please enter a search query');
      return;
    }
    onSearch(query.trim(), { boolean: booleanOn, scope });
  };

  // Handle Enter key to search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSearch();
    }
  };

  const handleChange = (code: string) => {
    setQuery(code);
    if (onChange) {
      onChange(code, { boolean: booleanOn, scope });
    }

    if (!skillsApi) return;

    const lastToken = code.split(/\s+/).pop()?.replace(/["',]/g, '') || '';

    if (lastToken.length >= 2) {
      skillsApi(lastToken)
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    } else {
      setSuggestions([]);
    }
  };

  // Replace unfinished token with chosen skill
  const handleSkillSelect = (skill: string) => {
    setQuery(prev => {
      const parts = prev.split(/\s+/);
      parts.pop(); // remove last unfinished token
      const newQuery = parts.join(' ').trim() + (parts.length > 0 ? ' ' : '') + `"${skill}" `;
      // Notify parent of the new query value
      if (onChange) {
        onChange(newQuery, { boolean: booleanOn, scope });
      }
      return newQuery;
    });
    setSuggestions([]);
  };

  // Syntax highlighting for Boolean operators
  const highlightSyntax = (code: string) => {
    if (!booleanOn) return code;
    
    // Store quoted strings and parentheses temporarily to avoid them being matched by operator regex
    const placeholders: Record<string, string> = {};
    let placeholderIndex = 0;
    let highlighted = code;
    
    // Replace quoted phrases with placeholders
    highlighted = highlighted.replace(/"([^"]*)"/g, (match) => {
      const placeholder = `__QUOTE_${placeholderIndex}__`;
      placeholders[placeholder] = `<span style="color:#059669;">${match}</span>`;
      placeholderIndex++;
      return placeholder;
    });
    
    // Replace parentheses with placeholders
    highlighted = highlighted.replace(/[()]/g, (match) => {
      const placeholder = `__PAREN_${placeholderIndex}__`;
      placeholders[placeholder] = `<span style="color:#7c3aed;">${match}</span>`;
      placeholderIndex++;
      return placeholder;
    });
    
    // Replace boolean operators (now safe from quote interference)
    highlighted = highlighted.replace(
      /\b(AND|OR|NOT)\b/g, 
      '<span style="color:#2563eb;font-weight:600;">$1</span>'
    );
    
    // Restore all placeholders
    Object.entries(placeholders).forEach(([placeholder, replacement]) => {
      highlighted = highlighted.split(placeholder).join(replacement);
    });
    
    return highlighted;
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative border-2 rounded-lg transition-colors ${
          isValid ? 'border-gray-300 focus-within:border-blue-500' : 'border-red-500'
        }`}
      >
        {/* Header with Boolean toggle */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <Icon name="search" size={16} className="text-gray-500" />
            <Text size="xs" className="text-gray-600 font-medium">
              {booleanOn ? 'Boolean Search' : 'Simple Search'}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Text size="xs" className="text-gray-600">Boolean</Text>
            <Toggle checked={booleanOn} onCheckedChange={(value) => {
              setBooleanOn(value);
              if (onChange) {
                onChange(query, { boolean: value, scope });
              }
            }} />
          </div>
        </div>

        {/* Editor with syntax highlighting */}
        <div className="relative" onKeyDown={handleKeyDown}>
          <Editor
            value={query}
            onValueChange={handleChange}
            highlight={highlightSyntax}
            padding={12}
            textareaClassName="w-full min-h-[80px] font-mono text-sm focus:outline-none"
            className="w-full min-h-[80px] font-mono text-sm"
            placeholder={booleanOn ? placeholder : 'Enter keywords separated by commas (e.g., Java, React, AWS)'}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            }}
          />

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1 mx-3"
            >
              <div className="px-3 py-1.5 bg-gray-50 border-b text-xs text-gray-600 font-medium">
                <Icon name="info" size={12} className="inline mr-1" />
                Click to insert
              </div>
              {suggestions.map((skill, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm transition-colors flex items-center justify-between"
                  onClick={() => handleSkillSelect(skill)}
                >
                  <span>{skill}</span>
                  <Icon name="plus" size={14} className="text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with validation, scope and search button */}
        <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-2 flex-1">
            {!isValid && errorMessage && (
              <div className="flex items-center gap-1 text-red-600">
                <Icon name="alert" size={14} />
                <Text size="xs">{errorMessage}</Text>
              </div>
            )}
            {isValid && query.trim() && (
              <div className="flex items-center gap-1 text-green-600">
                <Icon name="check" size={14} />
                <Text size="xs">Valid query</Text>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showScopeDropdown && (
              <Dropdown
                value={scope}
                onChange={(value) => {
                  const newScope = value as string;
                  setScope(newScope);
                  if (onChange) {
                    onChange(query, { boolean: booleanOn, scope: newScope });
                  }
                }}
                options={scopeOptions}
                placeholder="Search in"
                size="sm"
              />
            )}

            {showSearchButton && (
              <button
                onClick={handleSearch}
                disabled={!isValid || !query.trim()}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  !isValid || !query.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Icon name="search" size={14} />
                Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Help text for Boolean syntax */}
      {booleanOn && (
        <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <Text size="xs" className="text-blue-800">
            <strong>Boolean operators:</strong> Use <span className="font-mono font-semibold">AND</span>, <span className="font-mono font-semibold">OR</span>, <span className="font-mono font-semibold">NOT</span> with parentheses for grouping. 
            Use quotes for exact phrases. 
            {/* Press <span className="font-mono font-semibold">Ctrl+Enter</span> to search. */}
          </Text>
        </div>
      )}
    </div>
  );
};
