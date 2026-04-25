import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, helpText, className = '', ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="form-label">{label}</label>}
    <input
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
        error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
      } ${className}`}
      {...props}
    />
    {error && <p className="form-error">{error}</p>}
    {helpText && !error && <p className="text-xs text-gray-500">{helpText}</p>}
  </div>
));
Input.displayName = 'Input';
export default Input;