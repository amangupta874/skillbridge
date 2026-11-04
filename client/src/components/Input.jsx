import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    id,
    name,
    label,
    type = 'text',
    hint,
    error,
    className = '',
    required = false,
    ...props
  },
  ref,
) {
  const inputId = id || name;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {hint && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}

      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-xs transition-colors placeholder:text-slate-400 focus:outline-2 focus:outline-offset-1 focus:outline-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 ${
          error
            ? 'border-red-500 focus:outline-red-600'
            : 'border-slate-300 hover:border-slate-400'
        } ${className}`}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;

