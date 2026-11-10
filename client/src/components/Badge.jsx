export default function Badge({
  children,
  variant,
  size = 'md',
  className = '',
}) {
  // Normalize string for case-insensitive lookup
  const normalized = (variant || children || '').toString().toUpperCase();

  const colorStyles = {
    // Status colours
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-red-50 text-red-700 border-red-200',
    WITHDRAWN: 'bg-slate-100 text-slate-700 border-slate-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    ARCHIVED: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_PROGRESS: 'bg-sky-50 text-sky-700 border-sky-200',
    COMPLETED: 'bg-indigo-50 text-indigo-700 border-indigo-200',

    // Skill level colours
    BEGINNER: 'bg-slate-100 text-slate-700 border-slate-200',
    INTERMEDIATE: 'bg-sky-50 text-sky-700 border-sky-200',
    ADVANCED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    EXPERT: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',

    // Generic defaults
    INFO: 'bg-sky-50 text-sky-700 border-sky-200',
    DEFAULT: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const style = colorStyles[normalized] || colorStyles.DEFAULT;
  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${style} ${sizeStyle} ${className}`}
    >
      {children}
    </span>
  );
}
