import { forwardRef, useId } from 'react';

const Textarea = forwardRef(function Textarea(
  { id, name, label, hint, error, className = '', required = false, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full min-w-0 space-y-1">
      {label && <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">{label}{required && <span aria-hidden="true" className="ml-1 text-red-700">*</span>}</label>}
      {hint && <p id={hintId} className="text-xs text-slate-700">{hint}</p>}
      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`block w-full min-w-0 rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-700 focus:outline-2 focus:outline-offset-1 focus:outline-indigo-600 disabled:bg-slate-50 disabled:text-slate-700 ${error ? 'border-red-500 focus:outline-red-600' : 'border-slate-300 hover:border-slate-400'} ${className}`}
        {...props}
      />
      {error && <p id={errorId} role="alert" className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
});

export default Textarea;
