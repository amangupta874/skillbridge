import Button from './Button.jsx';

export default function Pagination({ page, totalPages, onPageChange, label = 'Pages' }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={label} className="flex items-center justify-center gap-4">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </Button>
      <p className="text-sm text-slate-600" aria-live="polite">Page {page} of {totalPages}</p>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </Button>
    </nav>
  );
}
