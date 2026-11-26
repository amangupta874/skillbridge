import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card.jsx';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import ErrorBanner from './ErrorBanner.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { formatDate } from '../utils/date.js';

const ACTIONS = {
  ACCEPTED: { label: 'Accept' },
  REJECTED: { label: 'Reject', title: 'Reject this request?', message: 'The sender will be told you declined this request.', danger: true },
  CANCELLED: { label: 'Cancel', title: 'Cancel this exchange?', message: 'This exchange request will be cancelled.', danger: true },
  COMPLETED: { label: 'Mark completed', title: 'Mark this exchange completed?', message: 'The other student will be notified.' },
};

export default function ExchangeCard({ exchange, currentUserId, onStatusChange, saving = false, error, failedStatus, onCancelError }) {
  const [pendingStatus, setPendingStatus] = useState('');
  const person = String(exchange.sender.id) === String(currentUserId) ? exchange.recipient : exchange.sender;
  const action = ACTIONS[pendingStatus];

  async function changeStatus(status) {
    try {
      await onStatusChange(exchange.id, status);
      setPendingStatus('');
    } catch {
      // Keep the action available for retry.
    }
  }

  function chooseStatus(status) {
    if (ACTIONS[status].title) setPendingStatus(status);
    else changeStatus(status);
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={`/users/${person.id}`} className="font-semibold text-indigo-700 hover:underline">{person.fullName}</Link>
          <p className="mt-1 text-sm text-slate-700">Offers <span className="font-medium">{exchange.offeredSkill.name}</span> for <span className="font-medium">{exchange.requestedSkill.name}</span></p>
        </div>
        <Badge variant={exchange.status}>{exchange.status.charAt(0) + exchange.status.slice(1).toLowerCase()}</Badge>
      </div>
      <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{exchange.message}</p>
      <p className="text-xs text-slate-700">{formatDate(exchange.createdAt)}</p>
      {!pendingStatus && failedStatus === 'ACCEPTED' && (
        <ErrorBanner error={error} onRetry={exchange.allowedTransitions?.includes(failedStatus) ? () => changeStatus(failedStatus) : undefined} />
      )}
      {exchange.allowedTransitions?.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {exchange.allowedTransitions.filter((status) => ACTIONS[status]).map((status) => (
            <Button key={status} size="sm" variant={status === 'REJECTED' || status === 'CANCELLED' ? 'danger' : 'secondary'} disabled={saving} loading={saving && pendingStatus === status} aria-haspopup={ACTIONS[status].title ? 'dialog' : undefined} onClick={() => chooseStatus(status)}>
              {ACTIONS[status].label}
            </Button>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={action?.title}
        message={action?.message}
        confirmLabel={action?.label ?? 'Confirm'}
        danger={action?.danger}
        error={pendingStatus === failedStatus ? error : null}
        loading={saving}
        onCancel={() => { setPendingStatus(''); onCancelError?.(); }}
        onConfirm={() => changeStatus(pendingStatus)}
      />
    </Card>
  );
}
