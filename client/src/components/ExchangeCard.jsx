import { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card.jsx';
import Badge from './Badge.jsx';
import Button from './Button.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { formatDate } from '../utils/date.js';

const ACTIONS = {
  ACCEPTED: { label: 'Accept', confirm: false },
  REJECTED: { label: 'Reject', confirm: true },
  CANCELLED: { label: 'Cancel', confirm: true },
  COMPLETED: { label: 'Mark completed', confirm: false },
};

export default function ExchangeCard({ exchange, currentUserId, onStatusChange, saving = false }) {
  const [pendingStatus, setPendingStatus] = useState('');
  const person = String(exchange.sender.id) === String(currentUserId) ? exchange.recipient : exchange.sender;
  const action = ACTIONS[pendingStatus];

  function chooseStatus(status) {
    if (ACTIONS[status].confirm) setPendingStatus(status);
    else onStatusChange(exchange.id, status);
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
      <p className="text-xs text-slate-500">{formatDate(exchange.createdAt)}</p>
      {exchange.allowedTransitions?.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {exchange.allowedTransitions.filter((status) => ACTIONS[status]).map((status) => (
            <Button key={status} size="sm" variant={status === 'REJECTED' || status === 'CANCELLED' ? 'danger' : 'secondary'} disabled={saving} loading={saving && pendingStatus === status} onClick={() => chooseStatus(status)}>
              {ACTIONS[status].label}
            </Button>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus === 'REJECTED' ? 'Reject this request?' : 'Cancel this exchange?'}
        message={pendingStatus === 'REJECTED' ? 'The sender will be told you declined this request.' : 'This exchange request will be cancelled.'}
        confirmLabel={action?.label ?? 'Confirm'}
        danger
        loading={saving}
        onCancel={() => setPendingStatus('')}
        onConfirm={() => onStatusChange(exchange.id, pendingStatus).then(() => setPendingStatus('')).catch(() => {})}
      />
    </Card>
  );
}
