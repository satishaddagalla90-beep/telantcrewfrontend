import clsx from 'clsx';
import React from 'react';
import Label from '../Label';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  className = '',
}) => {
  return (
      <Label required={false} size="sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange && onChange(!checked)}
        className={clsx('mr-2', className)}
      />
      {label}
      </Label>
  );
};

export default Checkbox;
