import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { id, name, label, hint, error, className = '', children, required = false, ...props },
  ref,
) {
  const selectId = id || name;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full space-y-1">
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-slate-700">{label}{required && <span className="ml-1 text-red-500">*</span>}</label>}
      {hint && <p id={hintId} className="text-xs text-slate-500">{hint}</p>}
      <select
        ref={ref}
        id={selectId}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:outline-2 focus:outline-offset-1 focus:outline-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 ${error ? 'border-red-500 focus:outline-red-600' : 'border-slate-300 hover:border-slate-400'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p id={errorId} role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
});

export default Select;
