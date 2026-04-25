import { forwardRef } from 'react';

const Select = forwardRef(({ label, error, options = [], className = '', placeholder, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="form-label">{label}</label>}
    <select
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
        error ? 'border-red-400' : 'border-gray-300'
      } ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="form-error">{error}</p>}
  </div>
));
Select.displayName = 'Select';
export default Select;