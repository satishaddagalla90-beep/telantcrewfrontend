import React from 'react';
import { Country, State, City } from 'country-state-city';
import Select from 'react-select';
import Label from '../../atoms/Label/Label';
import ErrorMessage from '../../atoms/ErrorMessage/ErrorMessage';

export interface CountryStateCityProps {
  type: 'country' | 'state' | 'city';
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  country?: string; // Required for state and city
  state?: string; // Required for city
  placeholder?: string;
}

const CountryStateCity: React.FC<CountryStateCityProps> = ({
  type,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  country,
  state,
  placeholder,
}) => {
  const getOptions = () => {
    switch (type) {
      case 'country':
        return Country.getAllCountries().map(country => ({
          value: country.isoCode,
          label: country.name,
        }));

      case 'state':
        if (!country) return [];
        return State.getStatesOfCountry(country).map(state => ({
          value: state.isoCode,
          label: state.name,
        }));

      case 'city':
        if (!country || !state) return [];
        return City.getCitiesOfState(country, state).map(city => ({
          value: city.name,
          label: city.name,
        }));

      default:
        return [];
    }
  };

  const options = getOptions();
  const selectedValue = options.find(option => option.value === value) || (value ? { value, label: value } : null);

  const handleChange = (selectedOption: any) => {
    onChange(selectedOption ? selectedOption.value : '');
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label required={required} size="sm">
        {label}
      </Label>
      <Select
        value={selectedValue}
        onChange={handleChange}
        options={options}
        placeholder={placeholder || `Select ${label.toLowerCase()}`}
        isDisabled={disabled}
        isClearable
        isSearchable
          className="react-select-container"
          classNamePrefix="react-select"
          styles={{
            control: (provided, state) => ({
              ...provided,
              borderColor: state.isFocused ? 'rgb(37 99 235)' : '#d1d5db',
              boxShadow: state.isFocused ? '0 0 0 2px rgb(37 99 235)' : 'none',
              borderRadius: '0.375rem',
              minHeight: '2.5rem',
              paddingTop: '0.125rem',
              paddingBottom: '0.125rem',
              '&:hover': {
                borderColor: '#9ca3af',
              },
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected
                ? 'rgb(37 99 235)'
                : state.isFocused
                  ? 'rgb(239 246 255)'
                  : 'white',
              color: state.isSelected ? 'white' : '#374151',
              '&:hover': {
                backgroundColor: state.isSelected
                  ? 'rgb(37 99 235)'
                  : 'rgb(239 246 255)',
              },
            }),
            placeholder: provided => ({
              ...provided,
              color: '#9ca3af',
            }),
            singleValue: provided => ({
              ...provided,
              color: '#374151',
            }),
          }}
      />
        {error && (
          <ErrorMessage message={error} variant="error" size="sm" />
        )}
    </div>
  );
};

export default CountryStateCity;
