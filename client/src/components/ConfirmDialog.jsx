import Button from './Button.jsx';
import ErrorBanner from './ErrorBanner.jsx';
import Modal from './Modal.jsx';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  error,
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal open={open} role="alertdialog" title={title} description={message} onClose={onCancel} closeDisabled={loading}>
      <ErrorBanner error={error} className="mb-4" />
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="secondary" disabled={loading} onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{error ? 'Retry' : confirmLabel}</Button>
      </div>
    </Modal>
  );
}
