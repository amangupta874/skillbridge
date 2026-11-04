export default function ErrorBanner({ error, onRetry, className = '' }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred.';

  return (
    <div
      role="alert"
      className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold" aria-hidden="true">✕</span>
          <p>{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 font-medium underline hover:text-red-900 focus-visible:outline-2 focus-visible:outline-red-600 rounded-sm"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

