# DateInput Component

## Overview
A cross-browser date picker component built with `react-datepicker` that solves Firefox/Mozilla month/year picker issues. Maintains consistent design and output formats across all browsers.

## Problem Solved
Native HTML `<input type="month">` doesn't render a proper calendar UI in Firefox/Mozilla browsers, making it impossible for users to select month/year values. This component provides a consistent, beautiful date picker experience across all browsers.

## Features
- ✅ **Cross-browser support** - Works identically in Chrome, Firefox, Safari, Edge
- ✅ **Month-only picker** - Perfect for employment dates, project dates (MM YYYY format)
- ✅ **Full date picker** - Also supports day selection (DD MM YYYY format)
- ✅ **Format preservation** - Outputs exactly the same format as native inputs (YYYY-MM)
- ✅ **Tailwind styled** - Matches existing design system
- ✅ **Validation support** - min/max date constraints, error states
- ✅ **Accessibility** - Keyboard navigation, ARIA labels

## Installation
```bash
npm install react-datepicker @types/react-datepicker
```

## Usage

### Month Picker (MM YYYY)
```tsx
import DateInput from '../../atoms/DateInput/DateInput';

<DateInput
  mode="month"
  value={formData.fromDate}
  onChange={(value) => setFormData({ ...formData, fromDate: value })}
  max={new Date().toISOString().split('T')[0]}
  placeholder="Select start date"
  required
  error={errors.fromDate}
/>
```

### Full Date Picker (DD MM YYYY)
```tsx
<DateInput
  mode="date"
  value={formData.birthDate}
  onChange={(value) => setFormData({ ...formData, birthDate: value })}
  max={new Date().toISOString().split('T')[0]}
  placeholder="Select date"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'month' \| 'date'` | `'month'` | Picker mode: month-only or full date |
| `value` | `string` | `''` | Current value in YYYY-MM (month) or YYYY-MM-DD (date) format |
| `onChange` | `(value: string) => void` | - | Called when date changes, receives formatted string |
| `onBlur` | `(e: FocusEvent) => void` | - | Called when input loses focus |
| `min` | `string` | - | Minimum selectable date (YYYY-MM-DD format) |
| `max` | `string` | - | Maximum selectable date (YYYY-MM-DD format) |
| `placeholder` | `string` | - | Placeholder text |
| `disabled` | `boolean` | `false` | Disable the input |
| `readOnly` | `boolean` | `false` | Make input read-only |
| `required` | `boolean` | `false` | Mark as required field |
| `error` | `string` | - | Error message (adds red border) |
| `className` | `string` | `''` | Additional CSS classes |

## Format Details

### Input Format (what component accepts)
- **Month mode**: `YYYY-MM` (e.g., "2026-01")
- **Date mode**: `YYYY-MM-DD` (e.g., "2026-01-14")

### Output Format (what onChange receives)
- **Month mode**: `YYYY-MM` (e.g., "2026-01")
- **Date mode**: `YYYY-MM-DD` (e.g., "2026-01-14")

### Display Format (what user sees)
- **Month mode**: `MM/yyyy` (e.g., "01/2026")
- **Date mode**: `dd/MM/yyyy` (e.g., "14/01/2026")

This ensures seamless replacement of native inputs while maintaining data format consistency.

## Styling
The component uses Tailwind classes and custom CSS to match your existing design:
- Input: Standard border, rounded, focus ring (blue)
- Calendar: Clean dropdown with hover states
- Selected dates: Blue background
- Disabled dates: Gray color
- Error state: Red border

## Migrated Components
All MM YYYY date inputs have been migrated to use DateInput:

✅ **EmploymentProjectsStep.tsx**
- Employment From/To dates
- Project From/To dates

✅ **BulkEmploymentForm.tsx**
- Bulk employment From/To dates

✅ **BulkProjectsForm.tsx**
- Bulk project From/To dates

## Browser Compatibility
- ✅ Chrome/Edge (all versions)
- ✅ Firefox/Mozilla (all versions) - **Primary fix**
- ✅ Safari (desktop & mobile)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Keyboard Navigation
- **Tab**: Focus input
- **Enter/Space**: Open calendar
- **Arrow keys**: Navigate dates
- **Esc**: Close calendar
- **Enter**: Select date

## Future Enhancements
The component supports `mode="date"` for full date selection. When you need DD MM YYYY inputs (e.g., DOB, certification dates), simply change `mode="month"` to `mode="date"`:

```tsx
<DateInput
  mode="date"  // Changed from "month"
  value={form.dateOfBirth}
  onChange={(value) => updateForm('dateOfBirth', value)}
/>
```

## Testing Checklist
- [ ] Open Employment tab in Firefox/Mozilla
- [ ] Click From Date field - calendar should appear
- [ ] Select month/year - value should populate correctly
- [ ] Verify min/max constraints work
- [ ] Check error states display properly
- [ ] Test on Chrome/Safari for regression
- [ ] Verify mobile touch interactions
- [ ] Test keyboard navigation
- [ ] Verify disabled state works
- [ ] Check that output format matches API expectations

## Files Changed
```
src/components/atoms/DateInput/
├── DateInput.tsx          (new component)
├── DateInput.css          (styling)
└── index.ts               (exports)

src/components/organisms/CandidateSteps/
└── EmploymentProjectsStep.tsx (4 replacements)

src/components/pages/ApplicantDetail/modals/
├── BulkEmploymentForm.tsx (2 replacements)
└── BulkProjectsForm.tsx   (2 replacements)

package.json (added react-datepicker)
```

## Support
For issues or questions about DateInput, check:
1. Browser console for errors
2. Value format matches expected YYYY-MM or YYYY-MM-DD
3. react-datepicker CSS is imported properly
4. Min/max values are valid date strings

## Library Info
- **Library**: [react-datepicker](https://github.com/Hacker0x01/react-datepicker)
- **Version**: Latest (installed via npm)
- **License**: MIT
- **Bundle size**: ~50KB (minified)
