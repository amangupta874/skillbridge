import Button from './Button.jsx';

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  heading: Heading = 'h2',
}) {
  return (
    <div
      className={`rounded-lg border border-dashed border-slate-300 p-8 text-center bg-slate-50/50 ${className}`}
    >
      <Heading className="text-base font-semibold text-slate-800">{title}</Heading>
      {description && (
        <p className="mt-1 text-sm text-slate-700 max-w-md mx-auto">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

